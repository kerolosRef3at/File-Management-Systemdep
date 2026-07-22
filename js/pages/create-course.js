// js/pages/create-course.js
import { protectPage, getCurrentUser } from '../shared/auth.js';
import { courseService, logService, folderService, fileService } from '../shared/services.js';
import { showAlert } from '../shared/components.js';
import { mockDepartments, hydrateDepartments } from '../shared/mockData.js';
import { translations, getCurrentLang } from '../shared/jssharedi18n.js';

let isUploadingGlobal = false;

// Handle refresh/unload warning when uploading
window.addEventListener('beforeunload', (e) => {
    if (isUploadingGlobal) {
        e.preventDefault();
        e.returnValue = 'هناك عمليات رفع جارية، هل أنت تأكد من رغبتك في المغادرة؟';
        return e.returnValue;
    }
});

function canManageContent(role) {
    const r = String(role || '').trim();
    if (r === 'Supervisor') return true;
    return /\s+Manager$/i.test(r);
}

/**
 * Initialize Course Builder inside a container (Modal or Page)
 */
export async function initCourseBuilder(containerElement, onSuccessCallback, editCourseId = null, draftCourseId = null) {
    if (!containerElement) return;

    try {
        hydrateDepartments(await folderService.getFolders());
    } catch (e) {
        console.warn('Could not load folders:', e);
    }

    const user = getCurrentUser();
    const lang = getCurrentLang();
    const isAr = lang === 'ar';
    const t = (key) => (translations[lang] || translations.en)[key] || translations.en[key] || key;

    // STATE
    let uploadMode = 'bulk'; // 'bulk' | 'lesson'
    let bulkFiles = [];      // { id, file, name, fileName, size }
    let lessons = [];        // { id, title, files: [{ id, file, name, fileName, size }] }
    let thumbnailDataUrl = '';
    let dragSrcIdx = null;

    renderDOM();

    function renderDOM() {
        containerElement.innerHTML = `
            <div class="cc-container">
                <!-- Header -->
                <div class="cc-header">
                    <div>
                        <h1>${t('cc_header_title')}</h1>
                        <p>${t('cc_header_subtitle')}</p>
                    </div>
                    <div class="cc-header-actions">
                        <button type="button" class="cc-btn cc-btn-secondary" id="ccCancelBtn">${t('cc_btn_cancel')}</button>
                        <button type="button" class="cc-btn cc-btn-outline" id="ccDraftBtn">${t('cc_btn_save_draft')}</button>
                        <button type="button" class="cc-btn cc-btn-primary" id="ccPublishBtn">${t('cc_btn_publish')}</button>
                    </div>
                </div>

                <div id="ccAlerts"></div>

                <!-- Main Grid -->
                <div class="cc-grid">
                    <!-- Left Column: Settings -->
                    <div class="cc-card">
                        <div class="cc-form-group">
                            <label class="cc-label">${t('cc_course_title_label')} <span style="color:#ef4444;">*</span></label>
                            <input type="text" id="ccTitle" class="cc-input" placeholder="${t('cc_course_title_ph')}" required>
                        </div>

                        <div class="cc-form-row">
                            <div class="cc-form-group">
                                <label class="cc-label">${t('cc_dept_label')} <span style="color:#ef4444;">*</span></label>
                                <select id="ccDept" class="cc-select" required>
                                    <option value="">${t('cc_dept_select')}</option>
                                    ${mockDepartments.map(d => `<option value="${d.id}">${d.shortName} - ${d.name}</option>`).join('')}
                                </select>
                            </div>
                            <div class="cc-form-group">
                                <label class="cc-label">${t('cc_program_label')}</label>
                                <select id="ccCategory" class="cc-select">
                                    <option value="">${t('cc_program_select')}</option>
                                    <option value="UNDERGRAD">Undergraduate</option>
                                    <option value="POSTGRAD">Postgraduate</option>
                                    <option value="DIPLOMA">Diploma</option>
                                    <option value="PROFESSIONAL">Professional</option>
                                </select>
                            </div>
                        </div>

                        <div class="cc-form-group">
                            <label class="cc-label">${t('cc_desc_label')}</label>
                            <textarea id="ccDescription" class="cc-textarea" placeholder="${t('cc_desc_ph')}"></textarea>
                        </div>

                        <div class="cc-form-group">
                            <label class="cc-label">${t('cc_thumb_label')}</label>
                            <div class="cc-file-drop" id="ccThumbDrop">
                                <input type="file" id="ccThumbInput" accept="image/*" style="display:none;">
                                <div id="ccThumbContent">
                                    <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" style="margin:0 auto 8px;color:#94a3b8;display:block;"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                                    <p>${t('cc_thumb_drop')}</p>
                                </div>
                            </div>
                        </div>

                        <div class="cc-form-row">
                            <div class="cc-form-group">
                                <label class="cc-label">${t('cc_visibility_label')}</label>
                                <select id="ccVisibility" class="cc-select">
                                    <option value="public">${t('cc_vis_public')}</option>
                                    <option value="students">${t('cc_vis_students')}</option>
                                    <option value="admin">${t('cc_vis_admin')}</option>
                                </select>
                            </div>
                            <div class="cc-form-group" style="display:flex;align-items:flex-end;padding-bottom:8px;">
                                <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:0.88rem;font-weight:500;">
                                    <input type="checkbox" id="ccGuestDownloads" checked style="accent-color:var(--primary-blue);width:16px;height:16px;">
                                    ${t('cc_allow_guest_downloads')}
                                </label>
                            </div>
                        </div>
                    </div>

                    <!-- Right Column: Content Upload -->
                    <div class="cc-card">
                        <label class="cc-label">${t('cc_mode_title')}</label>
                        <div class="cc-mode-tabs">
                            <div class="cc-mode-tab active" data-mode="bulk" id="tabBulk">
                                <h4>⚡ ${t('cc_mode_bulk_title')}</h4>
                                <p>${t('cc_mode_bulk_desc')}</p>
                            </div>
                            <div class="cc-mode-tab" data-mode="lesson" id="tabLesson">
                                <h4>📚 ${t('cc_mode_lesson_title')}</h4>
                                <p>${t('cc_mode_lesson_desc')}</p>
                            </div>
                        </div>

                        <!-- BULK MODE CONTAINER -->
                        <div id="ccBulkContainer">
                            <div class="cc-file-drop" id="ccBulkDrop" style="margin-bottom:16px;">
                                <input type="file" id="ccBulkInput" multiple accept="video/*,.mp4,.mkv,.avi,.mov,.pdf,.zip" style="display:none;">
                                <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="2" style="margin:0 auto 8px;color:#3b82f6;display:block;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                <p style="font-weight:600;color:var(--text-dark);">${t('cc_bulk_drop_title')}</p>
                                <p style="font-size:0.8rem;color:#94a3b8;margin-top:4px;">${t('cc_bulk_drop_sub')}</p>
                            </div>
                            <div id="ccBulkList"></div>
                        </div>

                        <!-- LESSON MODE CONTAINER -->
                        <div id="ccLessonContainer" style="display:none;">
                            <div id="ccLessonList"></div>
                            <button type="button" class="cc-add-lesson-btn" id="ccAddLessonBtn">
                                + ${t('cc_add_lesson')}
                            </button>
                        </div>

                        <!-- Package Summary Bar -->
                        <div class="cc-package-bar">
                            <span id="ccTotalLessonsText">0 ${t('cc_pkg_lessons')}</span>
                            <span id="ccTotalSizeText">0 MB ${t('cc_pkg_total')}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        bindEvents();
        if (editCourseId) loadCourseForEdit(editCourseId);
    }

    function bindEvents() {
        const alertsEl = document.getElementById('ccAlerts');

        // Cancel Button
        document.getElementById('ccCancelBtn')?.addEventListener('click', () => {
            if (isUploadingGlobal) {
                if (!confirm('هناك ملفات قيد الرفع، هل أنت تأكد من الإلغاء؟')) return;
            }
            if (onSuccessCallback) onSuccessCallback(false);
        });

        // Mode Switching
        document.getElementById('tabBulk')?.addEventListener('click', () => switchMode('bulk'));
        document.getElementById('tabLesson')?.addEventListener('click', () => switchMode('lesson'));

        // Thumbnail Upload
        const thumbDrop = document.getElementById('ccThumbDrop');
        const thumbInput = document.getElementById('ccThumbInput');
        thumbDrop?.addEventListener('click', () => thumbInput.click());
        thumbInput?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                thumbnailDataUrl = ev.target.result;
                document.getElementById('ccThumbContent').innerHTML = `
                    <img src="${thumbnailDataUrl}" style="max-height:120px;border-radius:8px;object-fit:cover;margin:0 auto;display:block;">
                    <p style="font-size:0.8rem;color:var(--primary-blue);margin-top:6px;">${t('cc_thumb_change')}</p>
                `;
            };
            reader.readAsDataURL(file);
        });

        // Bulk Files Upload Input & Drag-Drop
        const bulkDrop = document.getElementById('ccBulkDrop');
        const bulkInput = document.getElementById('ccBulkInput');
        bulkDrop?.addEventListener('click', () => bulkInput.click());
        bulkInput?.addEventListener('change', (e) => addBulkFiles(Array.from(e.target.files)));

        bulkDrop?.addEventListener('dragover', (e) => { e.preventDefault(); bulkDrop.style.borderColor = 'var(--primary-blue)'; });
        bulkDrop?.addEventListener('dragleave', () => { bulkDrop.style.borderColor = '#cbd5e1'; });
        bulkDrop?.addEventListener('drop', (e) => {
            e.preventDefault();
            bulkDrop.style.borderColor = '#cbd5e1';
            if (e.dataTransfer.files?.length) addBulkFiles(Array.from(e.dataTransfer.files));
        });

        // Add Lesson Button
        document.getElementById('ccAddLessonBtn')?.addEventListener('click', () => addLesson());

        // Publish & Draft
        document.getElementById('ccPublishBtn')?.addEventListener('click', () => submitCourse('published'));
        document.getElementById('ccDraftBtn')?.addEventListener('click', () => submitCourse('draft'));
    }

    function switchMode(mode) {
        uploadMode = mode;
        const tabBulk = document.getElementById('tabBulk');
        const tabLesson = document.getElementById('tabLesson');
        const bulkCont = document.getElementById('ccBulkContainer');
        const lessonCont = document.getElementById('ccLessonContainer');

        if (mode === 'bulk') {
            tabBulk.classList.add('active');
            tabLesson.classList.remove('active');
            bulkCont.style.display = 'block';
            lessonCont.style.display = 'none';
        } else {
            tabLesson.classList.add('active');
            tabBulk.classList.remove('active');
            lessonCont.style.display = 'block';
            bulkCont.style.display = 'none';
            if (lessons.length === 0) addLesson();
        }
        updatePackageBar();
    }

    // BULK FILES LOGIC
    function addBulkFiles(filesList) {
        filesList.forEach(f => {
            const cleanName = f.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
            bulkFiles.push({
                id: Math.random().toString(36).substr(2, 9),
                file: f,
                name: cleanName,
                fileName: f.name,
                size: formatFileSize(f.size)
            });
        });
        renderBulkList();
        updatePackageBar();
    }

    function renderBulkList() {
        const container = document.getElementById('ccBulkList');
        if (!container) return;
        if (bulkFiles.length === 0) { container.innerHTML = ''; return; }

        container.innerHTML = bulkFiles.map((item, idx) => `
            <div class="cc-bulk-item" draggable="true" data-idx="${idx}">
                <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0;">
                    <span style="cursor:grab;color:#94a3b8;font-size:1.1rem;">⋮⋮</span>
                    <span class="cc-bulk-num">${idx + 1}</span>
                    <div style="flex:1;min-width:0;">
                        <input type="text" class="cc-input cc-bulk-name-input" data-idx="${idx}" value="${escapeHtml(item.name)}" placeholder="اسم الدرس" style="padding:4px 8px;font-size:0.88rem;">
                        <div class="cc-bulk-info">
                            <span>${escapeHtml(item.fileName)}</span>
                            <span>${item.size}</span>
                        </div>
                    </div>
                </div>
                <button type="button" class="cc-btn-icon remove-bulk-btn" data-idx="${idx}" title="حذف">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
            </div>
        `).join('');

        // Item Events
        container.querySelectorAll('.cc-bulk-name-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const i = parseInt(e.target.dataset.idx);
                bulkFiles[i].name = e.target.value.trim() || bulkFiles[i].fileName;
            });
        });

        container.querySelectorAll('.remove-bulk-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const i = parseInt(e.currentTarget.dataset.idx);
                bulkFiles.splice(i, 1);
                renderBulkList();
                updatePackageBar();
            });
        });

        // Drag and drop reordering
        container.querySelectorAll('.cc-bulk-item').forEach(item => {
            item.addEventListener('dragstart', (e) => { dragSrcIdx = parseInt(e.currentTarget.dataset.idx); });
            item.addEventListener('dragover', (e) => e.preventDefault());
            item.addEventListener('drop', (e) => {
                e.preventDefault();
                const targetIdx = parseInt(e.currentTarget.dataset.idx);
                if (dragSrcIdx !== null && dragSrcIdx !== targetIdx) {
                    const moved = bulkFiles.splice(dragSrcIdx, 1)[0];
                    bulkFiles.splice(targetIdx, 0, moved);
                    renderBulkList();
                }
            });
        });
    }

    // LESSON MODE LOGIC
    function addLesson() {
        lessons.push({
            id: Math.random().toString(36).substr(2, 9),
            title: `${t('cc_lesson_title_def')} ${lessons.length + 1}`,
            files: []
        });
        renderLessonList();
        updatePackageBar();
    }

    function renderLessonList() {
        const container = document.getElementById('ccLessonList');
        if (!container) return;

        container.innerHTML = lessons.map((les, lIdx) => `
            <div class="cc-lesson-card" data-lidx="${lIdx}">
                <div class="cc-lesson-header">
                    <div style="display:flex;align-items:center;gap:10px;flex:1;">
                        <span class="cc-bulk-num">${lIdx + 1}</span>
                        <input type="text" class="cc-input lesson-title-input" data-lidx="${lIdx}" value="${escapeHtml(les.title)}" placeholder="${t('cc_lesson_ph')}" style="font-weight:600;">
                    </div>
                    <button type="button" class="cc-btn-icon remove-lesson-btn" data-lidx="${lIdx}" title="حذف الدرس">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                </div>

                <div class="cc-lesson-files-list">
                    ${les.files.map((f, fIdx) => `
                        <div class="cc-lesson-file">
                            <span class="cc-file-badge ${f.file.type.includes('pdf') ? 'pdf' : f.file.type.includes('zip') ? 'zip' : 'video'}">
                                ${f.file.type.includes('pdf') ? 'PDF' : f.file.type.includes('zip') ? 'ZIP' : 'MP4'}
                            </span>
                            <div style="flex:1;min-width:0;">
                                <input type="text" class="cc-input lesson-file-name-input" data-lidx="${lIdx}" data-fidx="${fIdx}" value="${escapeHtml(f.name)}" style="padding:2px 6px;font-size:0.85rem;">
                                <div class="cc-bulk-info">
                                    <span>${escapeHtml(f.fileName)}</span>
                                    <span>${f.size}</span>
                                </div>
                            </div>
                            <button type="button" class="cc-btn-icon remove-lesson-file-btn" data-lidx="${lIdx}" data-fidx="${fIdx}">
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                        </div>
                    `).join('')}
                </div>

                <div class="cc-file-drop lesson-file-drop" data-lidx="${lIdx}" style="padding:12px;margin-top:10px;">
                    <input type="file" class="lesson-file-input" data-lidx="${lIdx}" multiple accept="video/*,.mp4,.pdf,.zip" style="display:none;">
                    <p style="font-size:0.85rem;color:#64748b;font-weight:500;">+ ${t('cc_lesson_add_files')}</p>
                </div>
            </div>
        `).join('');

        // Event Listeners for Lesson Cards
        container.querySelectorAll('.lesson-title-input').forEach(inp => {
            inp.addEventListener('change', (e) => {
                const lIdx = parseInt(e.target.dataset.lidx);
                lessons[lIdx].title = e.target.value.trim() || `Lesson ${lIdx + 1}`;
            });
        });

        container.querySelectorAll('.remove-lesson-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const lIdx = parseInt(e.currentTarget.dataset.lidx);
                lessons.splice(lIdx, 1);
                renderLessonList();
                updatePackageBar();
            });
        });

        container.querySelectorAll('.lesson-file-drop').forEach(drop => {
            const lIdx = parseInt(drop.dataset.lidx);
            const inp = drop.querySelector('.lesson-file-input');
            drop.addEventListener('click', () => inp.click());
            inp.addEventListener('change', (e) => {
                Array.from(e.target.files).forEach(f => {
                    const cleanName = f.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
                    lessons[lIdx].files.push({
                        id: Math.random().toString(36).substr(2, 9),
                        file: f,
                        name: cleanName,
                        fileName: f.name,
                        size: formatFileSize(f.size)
                    });
                });
                renderLessonList();
                updatePackageBar();
            });
        });

        container.querySelectorAll('.lesson-file-name-input').forEach(inp => {
            inp.addEventListener('change', (e) => {
                const lIdx = parseInt(e.target.dataset.lidx);
                const fIdx = parseInt(e.target.dataset.fidx);
                lessons[lIdx].files[fIdx].name = e.target.value.trim();
            });
        });

        container.querySelectorAll('.remove-lesson-file-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const lIdx = parseInt(e.currentTarget.dataset.lidx);
                const fIdx = parseInt(e.currentTarget.dataset.fidx);
                lessons[lIdx].files.splice(fIdx, 1);
                renderLessonList();
                updatePackageBar();
            });
        });
    }

    function updatePackageBar() {
        let totalCount = 0;
        let totalBytes = 0;

        if (uploadMode === 'bulk') {
            totalCount = bulkFiles.length;
            totalBytes = bulkFiles.reduce((acc, item) => acc + item.file.size, 0);
        } else {
            totalCount = lessons.length;
            lessons.forEach(l => {
                l.files.forEach(f => { totalBytes += f.file.size; });
            });
        }

        const countEl = document.getElementById('ccTotalLessonsText');
        const sizeEl = document.getElementById('ccTotalSizeText');
        if (countEl) countEl.textContent = `${totalCount} ${uploadMode === 'bulk' ? t('cc_pkg_lessons') : t('cc_pkg_modules')}`;
        if (sizeEl) sizeEl.textContent = `${formatFileSize(totalBytes)} ${t('cc_pkg_total')}`;
    }

    // SUBMIT & UPLOAD FLOW
    async function submitCourse(targetStatus) {
        const alertsEl = document.getElementById('ccAlerts');
        const title = document.getElementById('ccTitle')?.value.trim();
        const dept = document.getElementById('ccDept')?.value;
        const category = document.getElementById('ccCategory')?.value || '';
        const description = document.getElementById('ccDescription')?.value.trim() || '';
        const visibility = document.getElementById('ccVisibility')?.value || 'public';
        const guestDownloads = document.getElementById('ccGuestDownloads')?.checked ?? true;

        if (!title) {
            showAlert(alertsEl, isAr ? 'يرجى إدخال عنوان الكورس.' : 'Please enter a course title.', 'error');
            return;
        }
        if (!dept) {
            showAlert(alertsEl, isAr ? 'يرجى اختيار القسم الأكاديمي.' : 'Please select a department.', 'error');
            return;
        }

        // Collect Files to Upload
        let filesToUpload = []; // { file, customName, type, moduleIdx, lessonIdx }

        if (uploadMode === 'bulk') {
            if (bulkFiles.length === 0 && targetStatus === 'published') {
                showAlert(alertsEl, isAr ? 'يرجى إضافة دروس أو فيديوهات للكورس قبل النشر.' : 'Please add at least one file or lesson before publishing.', 'error');
                return;
            }
            bulkFiles.forEach((item, idx) => {
                filesToUpload.push({
                    fileItem: item,
                    customName: item.name,
                    moduleName: `الوحدة الأولى: المحتوى الأساسي`,
                    lessonTitle: item.name
                });
            });
        } else {
            if (lessons.length === 0 && targetStatus === 'published') {
                showAlert(alertsEl, isAr ? 'يرجى إضافة دروس للكورس.' : 'Please add lessons.', 'error');
                return;
            }
            lessons.forEach(l => {
                l.files.forEach(f => {
                    filesToUpload.push({
                        fileItem: f,
                        customName: f.name,
                        moduleName: l.title,
                        lessonTitle: f.name
                    });
                });
            });
        }

        // Lock UI & Start Uploading
        isUploadingGlobal = true;
        setSubmittingState(true, targetStatus);
        createFloatingProgressBar();

        let uploadedModules = []; // Structure for CreateCourseDTO
        let totalFiles = filesToUpload.length;
        let uploadedCount = 0;

        try {
            // Upload Each File with Real-Time Progress!
            for (let i = 0; i < totalFiles; i++) {
                const item = filesToUpload[i];
                updateFloatingProgressBar(i + 1, totalFiles, item.customName, 0);

                const formData = new FormData();
                formData.append('file', item.fileItem.file);

                // Call upload with Progress
                let uploadRes = {};
                try {
                    uploadRes = await fileService.uploadFileWithProgress(
                        formData,
                        { dept: dept, customName: item.customName, type: 'course_resource' },
                        (percent) => {
                            updateFloatingProgressBar(i + 1, totalFiles, item.customName, percent);
                        }
                    );
                } catch (uploadErr) {
                    console.warn(`File upload failed for ${item.customName}:`, uploadErr);
                    uploadRes = { filePath: `assets/uploads/${item.fileItem.fileName}` };
                }

                // Add to Module DTO structure
                let mod = uploadedModules.find(m => m.name === item.moduleName);
                if (!mod) {
                    mod = { name: item.moduleName, lessons: [] };
                    uploadedModules.push(mod);
                }
                mod.lessons.push({
                    id: item.fileItem.id,
                    title: item.lessonTitle,
                    file: uploadRes.filePath || uploadRes.url || `assets/uploads/${item.fileItem.fileName}`,
                    type: item.fileItem.file.type.includes('pdf') ? 'document' : 'video',
                    size: item.fileItem.size
                });

                uploadedCount++;
            }

            // Calculate package size
            let totalBytes = 0;
            if (uploadMode === 'bulk') bulkFiles.forEach(f => totalBytes += f.file.size);
            else lessons.forEach(l => l.files.forEach(f => totalBytes += f.file.size));

            // Create Payload matching CreateCourseDTO
            const coursePayload = {
                title,
                dept,
                category,
                description,
                img: thumbnailDataUrl || 'assets/images/default-course.png',
                visibility,
                guestDownloads,
                status: targetStatus,
                size: formatFileSize(totalBytes),
                author: {
                    name: user?.name || user?.username || 'Instructor',
                    role: user?.role || 'Manager'
                },
                modules: uploadedModules
            };

            // Call API
            const result = await courseService.createCourse(coursePayload);

            // Log activity
            try {
                await logService.addLog(
                    targetStatus === 'published' ? 'Create Course' : 'Save Course Draft',
                    `Course "${title}" (${dept}) ${targetStatus}`
                );
            } catch (e) {}

            removeFloatingProgressBar();
            isUploadingGlobal = false;

            showAlert(alertsEl, isAr ? 'تم حفظ الكورس بنجاح!' : 'Course saved successfully!', 'success');

            setTimeout(() => {
                if (onSuccessCallback) onSuccessCallback(true);
            }, 1000);

        } catch (err) {
            removeFloatingProgressBar();
            isUploadingGlobal = false;
            setSubmittingState(false);
            showAlert(alertsEl, err.message || 'حدث خطأ أثناء نقل البيانات للسيرفر.', 'error');
        }
    }

    function setSubmittingState(isSubmitting, status = '') {
        const pubBtn = document.getElementById('ccPublishBtn');
        const draftBtn = document.getElementById('ccDraftBtn');
        const cancelBtn = document.getElementById('ccCancelBtn');

        if (isSubmitting) {
            if (pubBtn) pubBtn.disabled = true;
            if (draftBtn) draftBtn.disabled = true;
            if (cancelBtn) cancelBtn.disabled = true;

            if (status === 'published' && pubBtn) pubBtn.textContent = 'جاري النشر والرفع...';
            if (status === 'draft' && draftBtn) draftBtn.textContent = 'جاري الحفظ...';
        } else {
            if (pubBtn) { pubBtn.disabled = false; pubBtn.textContent = t('cc_btn_publish'); }
            if (draftBtn) { draftBtn.disabled = false; draftBtn.textContent = t('cc_btn_save_draft'); }
            if (cancelBtn) cancelBtn.disabled = false;
        }
    }

    // FLOATING PROGRESS BAR OVERLAY
    function createFloatingProgressBar() {
        removeFloatingProgressBar();
        const div = document.createElement('div');
        div.id = 'ccUploadProgressBanner';
        div.className = 'cc-upload-progress-banner';
        div.innerHTML = `
            <div class="cc-upb-header">
                <span id="ccUpbStatus">جاري رفع الملفات (0/0)</span>
                <span id="ccUpbPercent">0%</span>
            </div>
            <div class="cc-upb-filename" id="ccUpbFilename">جاري التحضير...</div>
            <div class="cc-upb-bar-bg">
                <div class="cc-upb-bar-fill" id="ccUpbFill"></div>
            </div>
        `;
        document.body.appendChild(div);
    }

    function updateFloatingProgressBar(currentFileIndex, totalFiles, filename, filePercent) {
        const statusEl = document.getElementById('ccUpbStatus');
        const percentEl = document.getElementById('ccUpbPercent');
        const filenameEl = document.getElementById('ccUpbFilename');
        const fillEl = document.getElementById('ccUpbFill');

        if (statusEl) statusEl.textContent = `جاري رفع الملفات (${currentFileIndex}/${totalFiles})`;
        if (filenameEl) filenameEl.textContent = filename;
        if (percentEl) percentEl.textContent = `${filePercent}%`;
        if (fillEl) fillEl.style.width = `${filePercent}%`;
    }

    function removeFloatingProgressBar() {
        const el = document.getElementById('ccUploadProgressBanner');
        if (el) el.remove();
    }
}

// Helpers
function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1024) return (mb / 1024).toFixed(1) + ' GB';
    return mb.toFixed(1) + ' MB';
}

function escapeHtml(str) {
    return String(str == null ? '' : str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
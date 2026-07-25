// js/pages/create-course.js
import { protectPage, getCurrentUser } from '../shared/auth.js';
import { BASE_URL } from '../shared/api.js';
import { courseService, logService, folderService, fileService } from '../shared/services.js';
import { showAlert } from '../shared/components.js';
import { mockDepartments, hydrateDepartments } from '../shared/mockData.js';
import { translations, getCurrentLang } from '../shared/jssharedi18n.js';

let isUploadingGlobal = false;

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
                            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                                <label class="cc-label" style="margin-bottom:0;">${t('cc_course_title_label')} <span style="color:#ef4444;">*</span></label>
                                <span id="ccTitleCounter" style="font-size:0.78rem;color:#64748b;font-weight:600;">0 / 50</span>
                            </div>
                            <input type="text" id="ccTitle" class="cc-input" maxlength="50" placeholder="${t('cc_course_title_ph')}" required>
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
                                    <option value="UNDERGRAD">${isAr ? 'البكالوريوس' : 'Undergraduate'}</option>
                                    <option value="POSTGRAD">${isAr ? 'الدراسات العليا' : 'Postgraduate'}</option>
                                    <option value="DIPLOMA">${isAr ? 'الدبلوم' : 'Diploma'}</option>
                                    <option value="PROFESSIONAL">${isAr ? 'المستوى المهني' : 'Professional'}</option>
                                </select>
                            </div>
                        </div>

                        <div class="cc-form-group">
                            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                                <label class="cc-label" style="margin-bottom:0;">${t('cc_desc_label')}</label>
                                <span id="ccDescCounter" style="font-size:0.78rem;color:#64748b;font-weight:600;">0 / 500</span>
                            </div>
                            <textarea id="ccDescription" class="cc-textarea" maxlength="500" placeholder="${t('cc_desc_ph')}"></textarea>
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
        else if (draftCourseId) loadCourseForEdit(draftCourseId, true);
    }

    function bindEvents() {
        const alertsEl = document.getElementById('ccAlerts');

        // Cancel Button
        document.getElementById('ccCancelBtn')?.addEventListener('click', () => {
            if (isUploadingGlobal) {
                if (!confirm('هناك ملفات قيد الرفع، هل أنت تأكد من الإلغاء؟')) return;
            }
            if (onSuccessCallback) onSuccessCallback(false);
            window.location.href = 'courses.html';
        });

        // Live Character Counters for Title & Description
        const titleInput = document.getElementById('ccTitle');
        const titleCounter = document.getElementById('ccTitleCounter');
        if (titleInput && titleCounter) {
            const updateTitleCounter = () => {
                const count = titleInput.value.length;
                titleCounter.textContent = `${count} / 50`;
                titleCounter.style.color = count >= 45 ? '#ef4444' : '#64748b';
            };
            titleInput.addEventListener('input', updateTitleCounter);
            updateTitleCounter();
        }

        const descInput = document.getElementById('ccDescription');
        const descCounter = document.getElementById('ccDescCounter');
        if (descInput && descCounter) {
            const updateDescCounter = () => {
                const count = descInput.value.length;
                descCounter.textContent = `${count} / 500`;
                descCounter.style.color = count >= 450 ? '#ef4444' : '#64748b';
            };
            descInput.addEventListener('input', updateDescCounter);
            updateDescCounter();
        }

        // Mode Switching
        document.getElementById('tabBulk')?.addEventListener('click', () => {
            const hasLessonFiles = lessons.some(l => l.files.length > 0);
            if (uploadMode === 'lesson' && hasLessonFiles) {
                showAlert(alertsEl, isAr ? 'تمت إضافة ملفات في وضع "إنشاء درس بدرس". يرجى حذف جميع الملفات أولاً للتغيير إلى وضع الرفع الدفعي.' : 'You have added files in Lesson mode. Delete all files first to switch to Bulk mode.', 'warning');
                return;
            }
            switchMode('bulk');
        });

        document.getElementById('tabLesson')?.addEventListener('click', () => {
            const hasBulkFiles = bulkFiles.length > 0;
            if (uploadMode === 'bulk' && hasBulkFiles) {
                showAlert(alertsEl, isAr ? 'تمت إضافة ملفات في وضع "الرفع الدفعي". يرجى حذف جميع الملفات أولاً للتغيير إلى وضع إنشاء درس بدرس.' : 'You have added files in Bulk mode. Delete all files first to switch to Lesson mode.', 'warning');
                return;
            }
            switchMode('lesson');
        });

        // Thumbnail Upload
        const thumbDrop = document.getElementById('ccThumbDrop');
        const thumbInput = document.getElementById('ccThumbInput');
        thumbDrop?.addEventListener('click', () => thumbInput.click());
        thumbInput?.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Show an instant local preview (base64, in-memory only)...
            const reader = new FileReader();
            reader.onload = (ev) => {
                document.getElementById('ccThumbContent').innerHTML = `
                    <img src="${ev.target.result}" style="max-height:120px;border-radius:8px;object-fit:cover;margin:0 auto;display:block;">
                    <p style="font-size:0.8rem;color:var(--primary-blue);margin-top:6px;">Uploading...</p>
                `;
            };
            reader.readAsDataURL(file);

            // ...but upload the actual FILE and keep only its short URL. The
            // base64 string is never sent to the server or stored in the course,
            // so the course JSON stays small.
            try {
                const res = await fileService.uploadThumbnail(file);
                thumbnailDataUrl = res.url;   // e.g. /api/Files/thumbnail/xxxx.jpg
                const content = document.getElementById('ccThumbContent');
                if (content) {
                    const note = content.querySelector('p');
                    if (note) { note.textContent = t('cc_thumb_change'); note.style.color = 'var(--primary-blue)'; }
                }
            } catch (err) {
                showAlert(alertsContainer, 'Could not upload the thumbnail. Try a smaller image.', 'error');
                thumbnailDataUrl = '';
                document.getElementById('ccThumbContent').innerHTML =
                    `<p style="font-size:0.85rem;color:#dc2626;">Upload failed. Click to try again.</p>`;
            }
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

    function updateModeTabsState() {
        const tabBulk = document.getElementById('tabBulk');
        const tabLesson = document.getElementById('tabLesson');
        if (!tabBulk || !tabLesson) return;

        const hasBulkFiles = bulkFiles.length > 0;
        const hasLessonFiles = lessons.some(l => l.files.length > 0);

        if (hasBulkFiles && uploadMode === 'bulk') {
            tabLesson.classList.add('disabled-mode-tab');
        } else {
            tabLesson.classList.remove('disabled-mode-tab');
        }

        if (hasLessonFiles && uploadMode === 'lesson') {
            tabBulk.classList.add('disabled-mode-tab');
        } else {
            tabBulk.classList.remove('disabled-mode-tab');
        }
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
                        <div class="cc-bulk-info" style="display:flex;gap:10px;font-size:0.78rem;color:#64748b;margin-top:2px;">
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

    let draggedLessonIdx = null;
    let draggedFileState = null;

    function renderLessonList() {
        const container = document.getElementById('ccLessonList');
        if (!container) return;

        container.innerHTML = lessons.map((les, lIdx) => `
            <div class="cc-lesson-card" draggable="true" data-lidx="${lIdx}">
                <div class="cc-lesson-header">
                    <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0;">
                        <span class="cc-drag-handle lesson-drag-handle" title="${isAr ? 'سحب لإعادة الترتيب' : 'Drag to reorder'}">⋮⋮</span>
                        <span class="cc-lesson-index-badge">${lIdx + 1}</span>
                        <input type="text" class="lesson-title-input" data-lidx="${lIdx}" value="${escapeHtml(les.title)}" placeholder="${t('cc_lesson_ph')}">
                    </div>
                    <div style="display:flex;align-items:center;gap:6px;">
                        ${lIdx > 0 ? `<button type="button" class="cc-reorder-btn move-lesson-up-btn" data-lidx="${lIdx}" title="${isAr ? 'تحريك للأعلى' : 'Move Up'}">▲</button>` : ''}
                        ${lIdx < lessons.length - 1 ? `<button type="button" class="cc-reorder-btn move-lesson-down-btn" data-lidx="${lIdx}" title="${isAr ? 'تحريك للأسفل' : 'Move Down'}">▼</button>` : ''}
                        <button type="button" class="remove-lesson-btn" data-lidx="${lIdx}" title="${isAr ? 'حذف الدرس' : 'Delete Lesson'}">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                    </div>
                </div>

                <div class="cc-lesson-files-list" style="padding: 4px 12px;">
                    ${les.files.map((f, fIdx) => {
            const fileTypeStr = String(f.file ? f.file.type : (f.type || f.fileName || 'pdf')).toLowerCase();
            const isPdf = fileTypeStr.includes('pdf') || fileTypeStr.includes('document');
            const isZip = fileTypeStr.includes('zip');
            const badgeClass = isPdf ? 'pdf' : isZip ? 'zip' : 'video';
            const badgeText = isPdf ? 'PDF' : isZip ? 'ZIP' : 'MP4';

            return `
                        <div class="cc-lesson-file" draggable="true" data-lidx="${lIdx}" data-fidx="${fIdx}">
                            <span class="cc-drag-handle file-drag-handle" title="${isAr ? 'سحب لإعادة الترتيب' : 'Drag to reorder'}">⋮⋮</span>
                            <span class="cc-file-badge ${badgeClass}">${badgeText}</span>
                            <div style="flex:1;min-width:0;">
                                <input type="text" class="lesson-file-name-input" data-lidx="${lIdx}" data-fidx="${fIdx}" value="${escapeHtml(f.name)}">
                                <div class="cc-bulk-info" style="display:flex;gap:10px;font-size:0.78rem;color:#64748b;margin-top:2px;">
                                    <span>${f.size}</span>
                                </div>
                            </div>
                            <div style="display:flex;align-items:center;gap:4px;">
                                ${fIdx > 0 ? `<button type="button" class="cc-reorder-btn move-file-up-btn" data-lidx="${lIdx}" data-fidx="${fIdx}" title="${isAr ? 'تحريك للأعلى' : 'Move Up'}">▲</button>` : ''}
                                ${fIdx < les.files.length - 1 ? `<button type="button" class="cc-reorder-btn move-file-down-btn" data-lidx="${lIdx}" data-fidx="${fIdx}" title="${isAr ? 'تحريك للأسفل' : 'Move Down'}">▼</button>` : ''}
                                <button type="button" class="remove-lesson-file-btn" data-lidx="${lIdx}" data-fidx="${fIdx}" title="${isAr ? 'حذف الملف' : 'Remove File'}">
                                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                </button>
                            </div>
                        </div>
                    `}).join('')}
                </div>

                <div class="lesson-file-drop" data-lidx="${lIdx}">
                    <input type="file" class="lesson-file-input" data-lidx="${lIdx}" multiple accept="video/*,.mp4,.pdf,.zip" style="display:none;">
                    <div style="display:flex;align-items:center;justify-content:center;gap:8px;color:#2563eb;font-weight:600;font-size:0.86rem;">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                        <span>+ ${t('cc_lesson_add_files')}</span>
                    </div>
                </div>
            </div>
        `).join('');

        // Event Listeners for Lesson Titles
        container.querySelectorAll('.lesson-title-input').forEach(inp => {
            inp.addEventListener('change', (e) => {
                const lIdx = parseInt(e.target.dataset.lidx);
                lessons[lIdx].title = e.target.value.trim() || `Lesson ${lIdx + 1}`;
            });
        });

        // Quick Move Lessons
        container.querySelectorAll('.move-lesson-up-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const lIdx = parseInt(e.currentTarget.dataset.lidx);
                if (lIdx > 0) {
                    const temp = lessons[lIdx];
                    lessons[lIdx] = lessons[lIdx - 1];
                    lessons[lIdx - 1] = temp;
                    renderLessonList();
                }
            });
        });

        container.querySelectorAll('.move-lesson-down-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const lIdx = parseInt(e.currentTarget.dataset.lidx);
                if (lIdx < lessons.length - 1) {
                    const temp = lessons[lIdx];
                    lessons[lIdx] = lessons[lIdx + 1];
                    lessons[lIdx + 1] = temp;
                    renderLessonList();
                }
            });
        });

        // Delete Lesson
        container.querySelectorAll('.remove-lesson-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const lIdx = parseInt(e.currentTarget.dataset.lidx);
                lessons.splice(lIdx, 1);
                renderLessonList();
                updatePackageBar();
            });
        });

        // File Dropzones inside Lessons
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

        // File Name Editing
        container.querySelectorAll('.lesson-file-name-input').forEach(inp => {
            inp.addEventListener('change', (e) => {
                const lIdx = parseInt(e.target.dataset.lidx);
                const fIdx = parseInt(e.target.dataset.fidx);
                lessons[lIdx].files[fIdx].name = e.target.value.trim();
            });
        });

        // Quick Move Files
        container.querySelectorAll('.move-file-up-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const lIdx = parseInt(e.currentTarget.dataset.lidx);
                const fIdx = parseInt(e.currentTarget.dataset.fidx);
                if (fIdx > 0) {
                    const temp = lessons[lIdx].files[fIdx];
                    lessons[lIdx].files[fIdx] = lessons[lIdx].files[fIdx - 1];
                    lessons[lIdx].files[fIdx - 1] = temp;
                    renderLessonList();
                }
            });
        });

        container.querySelectorAll('.move-file-down-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const lIdx = parseInt(e.currentTarget.dataset.lidx);
                const fIdx = parseInt(e.currentTarget.dataset.fidx);
                if (fIdx < lessons[lIdx].files.length - 1) {
                    const temp = lessons[lIdx].files[fIdx];
                    lessons[lIdx].files[fIdx] = lessons[lIdx].files[fIdx + 1];
                    lessons[lIdx].files[fIdx + 1] = temp;
                    renderLessonList();
                }
            });
        });

        // Delete File
        container.querySelectorAll('.remove-lesson-file-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const lIdx = parseInt(e.currentTarget.dataset.lidx);
                const fIdx = parseInt(e.currentTarget.dataset.fidx);
                lessons[lIdx].files.splice(fIdx, 1);
                renderLessonList();
                updatePackageBar();
            });
        });

        // Drag & Drop for Lesson Cards
        container.querySelectorAll('.cc-lesson-card').forEach(card => {
            card.addEventListener('dragstart', (e) => {
                if (e.target.closest('.cc-lesson-file')) return;
                draggedLessonIdx = parseInt(card.dataset.lidx);
                card.style.opacity = '0.5';
            });
            card.addEventListener('dragend', () => { card.style.opacity = '1'; });
            card.addEventListener('dragover', (e) => {
                if (draggedLessonIdx !== null) e.preventDefault();
            });
            card.addEventListener('drop', (e) => {
                if (draggedLessonIdx !== null && !e.target.closest('.cc-lesson-file')) {
                    e.preventDefault();
                    const targetIdx = parseInt(card.dataset.lidx);
                    if (targetIdx !== draggedLessonIdx) {
                        const moved = lessons.splice(draggedLessonIdx, 1)[0];
                        lessons.splice(targetIdx, 0, moved);
                        draggedLessonIdx = null;
                        renderLessonList();
                    }
                }
            });
        });

        // Drag & Drop for Lesson Files
        container.querySelectorAll('.cc-lesson-file').forEach(fileEl => {
            fileEl.addEventListener('dragstart', (e) => {
                e.stopPropagation();
                const lIdx = parseInt(fileEl.dataset.lidx);
                const fIdx = parseInt(fileEl.dataset.fidx);
                draggedFileState = { lIdx, fIdx };
                fileEl.style.opacity = '0.5';
            });
            fileEl.addEventListener('dragend', () => { fileEl.style.opacity = '1'; });
            fileEl.addEventListener('dragover', (e) => {
                if (draggedFileState !== null) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            });
            fileEl.addEventListener('drop', (e) => {
                if (draggedFileState !== null) {
                    e.preventDefault();
                    e.stopPropagation();
                    const targetLIdx = parseInt(fileEl.dataset.lidx);
                    const targetFIdx = parseInt(fileEl.dataset.fidx);

                    if (draggedFileState.lIdx === targetLIdx && draggedFileState.fIdx !== targetFIdx) {
                        const movedFile = lessons[targetLIdx].files.splice(draggedFileState.fIdx, 1)[0];
                        lessons[targetLIdx].files.splice(targetFIdx, 0, movedFile);
                        draggedFileState = null;
                        renderLessonList();
                    }
                }
            });
        });
    }

    function updatePackageBar() {
        let totalCount = 0;
        let totalBytes = 0;

        if (uploadMode === 'bulk') {
            totalCount = bulkFiles.length;
            totalBytes = bulkFiles.reduce((acc, item) => acc + (item.file ? item.file.size : (parseFloat(item.size) * 1024 * 1024 || 10485760)), 0);
        } else {
            totalCount = lessons.length;
            lessons.forEach(l => {
                l.files.forEach(f => {
                    totalBytes += (f.file ? f.file.size : (parseFloat(f.size) * 1024 * 1024 || 10485760));
                });
            });
        }

        const countEl = document.getElementById('ccTotalLessonsText');
        const sizeEl = document.getElementById('ccTotalSizeText');
        if (countEl) countEl.textContent = `${totalCount} ${uploadMode === 'bulk' ? t('cc_pkg_lessons') : t('cc_pkg_modules')}`;
        if (sizeEl) sizeEl.textContent = `${formatFileSize(totalBytes)} ${t('cc_pkg_total')}`;

        updateModeTabsState();
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
        if (title.length > 50) {
            showAlert(alertsEl, isAr ? 'عنوان الكورس يجب ألا يتجاوز 50 حرف.' : 'Course title must not exceed 50 characters.', 'error');
            return;
        }

        // Validate allowed academic course title characters (Letters, numbers, spaces, and basic symbols: - _ : ( ) & / + .)
        const titleRegex = /^[a-zA-Z0-9\u0600-\u06FF\u0660-\u0669\s\-_\.:()&\/\+]+$/;
        if (!titleRegex.test(title)) {
            showAlert(
                alertsEl,
                isAr
                    ? 'عنوان الكورس يحتوي على رموز غير مسموح بها. المسموح فقط الحروف والأرقام والرموز الأكاديمية (مثل: - _ : ( ) & / + .).'
                    : 'Course title contains invalid characters. Only letters, numbers, and basic academic symbols (- _ : ( ) & / + .) are allowed.',
                'error'
            );
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

        // Immediately close the modal overlay so user can freely navigate & browse while uploading in background
        const modal = document.getElementById('createCourseModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }

        let uploadedModules = []; // Structure for CreateCourseDTO
        let totalFiles = filesToUpload.length;
        let uploadedCount = 0;

        // Store background upload job in localStorage so it persists across page reloads & navigation
        const bgJob = {
            id: 'job_' + Date.now(),
            totalFiles: totalFiles,
            currentFileIndex: 1,
            currentFileName: filesToUpload[0]?.customName || 'Course Content',
            progressPercent: 5,
            isUploading: true,
            isCompleted: false
        };
        try { localStorage.setItem('aitu_background_upload_job', JSON.stringify(bgJob)); } catch (e) { }

        try {
            // Upload Each File with Real-Time Progress!
            for (let i = 0; i < totalFiles; i++) {
                const item = filesToUpload[i];
                updateFloatingProgressBar(i + 1, totalFiles, item.customName, 0);

                try {
                    localStorage.setItem('aitu_background_upload_job', JSON.stringify({
                        totalFiles,
                        currentFileIndex: i + 1,
                        currentFileName: item.customName,
                        progressPercent: Math.max(5, Math.round((i / totalFiles) * 100)),
                        isUploading: true,
                        isCompleted: false
                    }));
                } catch (e) { }

                let fileUrl = item.fileItem.existingFileUrl || `assets/uploads/${item.fileItem.fileName}`;

                if (item.fileItem.file) {
                    const formData = new FormData();
                    formData.append('file', item.fileItem.file);

                    try {
                        const uploadRes = await fileService.uploadFileWithProgress(
                            formData,
                            { dept: dept, customName: item.customName, type: 'course_resource' },
                            (percent) => {
                                updateFloatingProgressBar(i + 1, totalFiles, item.customName, percent);
                            }
                        );
                        fileUrl = uploadRes.filePath || uploadRes.url || fileUrl;
                    } catch (uploadErr) {
                        console.warn(`File upload failed for ${item.customName}:`, uploadErr);
                    }
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
                    file: fileUrl,
                    type: (item.fileItem.file ? item.fileItem.file.type.includes('pdf') : (item.fileItem.type || '').includes('pdf')) ? 'document' : 'video',
                    size: item.fileItem.size
                });

                uploadedCount++;
            }

            // Calculate package size
            let totalBytes = 0;
            if (uploadMode === 'bulk') bulkFiles.forEach(f => totalBytes += (f.file ? f.file.size : 10 * 1024 * 1024));
            else lessons.forEach(l => l.files.forEach(f => totalBytes += (f.file ? f.file.size : 10 * 1024 * 1024)));

            // Create Payload matching CreateCourseDTO
            const coursePayload = {
                title,
                dept,
                category,
                description,
                img: thumbnailDataUrl || '',
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

            // Call API (Create or Update)
            const result = editCourseId
                ? await courseService.updateCourse(editCourseId, coursePayload)
                : await courseService.createCourse(coursePayload);

            // Log activity
            try {
                await logService.addLog(
                    targetStatus === 'published' ? (editCourseId ? 'Update Course' : 'Create Course') : 'Save Course Draft',
                    `Course "${title}" (${dept}) ${targetStatus}`
                );
            } catch (e) { }

            try {
                localStorage.setItem('aitu_background_upload_job', JSON.stringify({
                    totalFiles,
                    currentFileIndex: totalFiles,
                    currentFileName: isAr ? 'تمت العمليات بنجاح' : 'Completed',
                    progressPercent: 100,
                    isUploading: false,
                    isCompleted: true
                }));
            } catch (e) { }

            updateFloatingProgressBar(totalFiles, totalFiles, isAr ? 'تمت العمليات بنجاح' : 'Completed', 100, true);

            setTimeout(() => {
                removeFloatingProgressBar();
                isUploadingGlobal = false;
                setSubmittingState(false);
            }, 2500);

            if (onSuccessCallback) onSuccessCallback(true);

        } catch (err) {
            removeFloatingProgressBar();
            isUploadingGlobal = false;
            setSubmittingState(false);
            const alertTarget = document.getElementById('ccAlerts') || document.body;
            showAlert(alertTarget, err.message || (isAr ? 'حدث خطأ أثناء نقل البيانات للسيرفر.' : 'Upload failed.'), 'error');
        }
    }

    // ============================
    // LOAD COURSE FOR EDIT MODE
    // ============================
    async function loadCourseForEdit(courseId) {
        const alertsEl = document.getElementById('ccAlerts');
        try {
            const course = await courseService.getCourseDetails(courseId);
            if (!course) return;

            // Fill text fields
            const titleInput = document.getElementById('ccTitle');
            if (titleInput) {
                titleInput.value = course.title || '';
                titleInput.dispatchEvent(new Event('input'));
            }

            const deptSelect = document.getElementById('ccDept');
            if (deptSelect) deptSelect.value = course.dept || '';

            const catSelect = document.getElementById('ccCategory');
            if (catSelect) catSelect.value = course.category || '';

            const descInput = document.getElementById('ccDescription');
            if (descInput) {
                descInput.value = course.description || '';
                descInput.dispatchEvent(new Event('input'));
            }

            const visSelect = document.getElementById('ccVisibility');
            if (visSelect) visSelect.value = course.visibility || 'public';

            const guestCheckbox = document.getElementById('ccGuestDownloads');
            if (guestCheckbox) guestCheckbox.checked = course.guestDownloads !== false;

            // Image Preview
            if (course.img) {
                thumbnailDataUrl = course.img;
                let imgSrc = course.img;
                if (!imgSrc.startsWith('data:') && !imgSrc.startsWith('http')) {
                    imgSrc = imgSrc.startsWith('/') ? `${BASE_URL}${imgSrc}` : `${BASE_URL}/${imgSrc}`;
                }
                const thumbDrop = document.getElementById('ccThumbDrop');
                if (thumbDrop) {
                    thumbDrop.innerHTML = `
                        <div style="position:relative;width:100%;height:140px;border-radius:8px;overflow:hidden;">
                            <img src="${imgSrc}" onerror="this.onerror=null; this.src='assets/images/default-course.png';" style="width:100%;height:100%;object-fit:cover;">
                            <button type="button" id="ccRemoveThumbBtn" style="position:absolute;top:6px;right:6px;background:rgba(239,68,68,0.9);color:white;border:none;border-radius:50%;width:26px;height:26px;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;">&times;</button>
                        </div>
                    `;
                    document.getElementById('ccRemoveThumbBtn')?.addEventListener('click', (e) => {
                        e.stopPropagation();
                        thumbnailDataUrl = '';
                        thumbDrop.innerHTML = `
                            <input type="file" id="ccThumbInput" accept="image/*" style="display:none;">
                            <div id="ccThumbContent">
                                <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" style="margin:0 auto 8px;color:#94a3b8;display:block;"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                                <p>${t('cc_thumb_drop')}</p>
                            </div>
                        `;
                    });
                }
            }

            // Populate Modules / Lessons / Resources
            let loadedModules = Array.isArray(course.modules) && course.modules.length > 0 ? course.modules : null;
            let loadedResources = Array.isArray(course.resources) && course.resources.length > 0 ? course.resources : (Array.isArray(course.lessons) && course.lessons.length > 0 ? course.lessons : null);

            if (loadedModules) {
                switchMode('lesson');
                lessons = loadedModules.map((m, mIdx) => ({
                    id: m.id || ('m_' + Date.now() + '_' + mIdx),
                    title: m.name || m.title || `الوحدة ${mIdx + 1}`,
                    files: Array.isArray(m.lessons) ? m.lessons.map((l, lIdx) => ({
                        id: l.id || ('f_' + Date.now() + '_' + lIdx),
                        file: null,
                        name: l.title || l.name || 'درس أو ملف أكاديمي',
                        fileName: l.fileName || l.title || l.name || 'درس أو ملف أكاديمي',
                        size: l.size || '10 MB',
                        existingFileUrl: l.file,
                        type: l.type || 'PDF'
                    })) : (Array.isArray(m.resources) ? m.resources.map((r, rIdx) => ({
                        id: r.id || ('r_' + Date.now() + '_' + rIdx),
                        file: null,
                        name: r.title || r.name || 'درس أو ملف أكاديمي',
                        fileName: r.fileName || r.title || r.name || 'درس أو ملف أكاديمي',
                        size: r.size || '10 MB',
                        existingFileUrl: r.file,
                        type: r.type || 'PDF'
                    })) : [])
                }));
                renderLessonList();
            } else if (loadedResources) {
                switchMode('bulk');
                bulkFiles = loadedResources.map((r, rIdx) => ({
                    id: r.id || ('b_' + Date.now() + '_' + rIdx),
                    file: null,
                    name: r.name || r.title || 'درس أو ملف أكاديمي',
                    fileName: r.fileName || r.name || r.title || 'درس أو ملف أكاديمي',
                    size: r.size || '10 MB',
                    existingFileUrl: r.file,
                    type: r.type || 'PDF'
                }));
                renderBulkList();
            } else {
                // If course content is empty, start with 1 lesson card so user can add content
                switchMode('lesson');
                lessons = [{
                    id: 'm_' + Date.now(),
                    title: isAr ? 'الوحدة الأولى: المحتوى الأساسي' : 'Module 1: Main Content',
                    files: []
                }];
                renderLessonList();
            }

            // Hide Mode Tabs in Edit Mode (since mode was chosen during creation)
            const modeTabs = containerElement.querySelector('.cc-mode-tabs');
            if (modeTabs) modeTabs.style.display = 'none';

            containerElement.querySelectorAll('.cc-card > label.cc-label').forEach(lbl => {
                if (lbl.textContent.includes('طريقة رفع') || lbl.textContent.includes('Content Upload Mode')) {
                    lbl.style.display = 'none';
                }
            });

            updatePackageBar();

            // Header Title and Buttons for Edit Mode
            const headerTitle = containerElement.querySelector('.cc-header h1');
            if (headerTitle) {
                headerTitle.textContent = isAr ? `تعديل الكورس: ${course.title}` : `Edit Course: ${course.title}`;
            }

            const draftBtn = document.getElementById('ccDraftBtn');
            if (draftBtn) draftBtn.style.display = 'none';

            const pubBtn = document.getElementById('ccPublishBtn');
            if (pubBtn) pubBtn.textContent = isAr ? 'حفظ التعديلات' : 'Save Changes';

        } catch (err) {
            console.warn('Failed to load course for edit:', err);
            showAlert(alertsEl, isAr ? 'تعذر تحميل بيانات الكورس للتعديل.' : 'Failed to load course data for editing.', 'error');
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

            if (pubBtn) pubBtn.textContent = editCourseId
                ? (isAr ? 'جاري حفظ التعديلات...' : 'Saving Changes...')
                : (status === 'published' ? (isAr ? 'جاري النشر والرفع...' : 'Publishing...') : (isAr ? 'جاري الحفظ...' : 'Saving...'));
        } else {
            if (pubBtn) {
                pubBtn.disabled = false;
                pubBtn.textContent = editCourseId
                    ? (isAr ? 'حفظ التعديلات' : 'Save Changes')
                    : t('cc_btn_publish');
            }
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

    function updateFloatingProgressBar(currentFileIndex, totalFiles, filename, filePercent, isCompleted = false) {
        const statusEl = document.getElementById('ccUpbStatus');
        const percentEl = document.getElementById('ccUpbPercent');
        const filenameEl = document.getElementById('ccUpbFilename');
        const fillEl = document.getElementById('ccUpbFill');

        if (isCompleted || (filePercent >= 100 && currentFileIndex >= totalFiles)) {
            if (statusEl) statusEl.textContent = isAr ? `اكتمل الرفع بنجاح (${totalFiles}/${totalFiles})` : `Upload Complete (${totalFiles}/${totalFiles})`;
            if (filenameEl) filenameEl.textContent = isAr ? 'تم حفظ الكورس وجميع محتوياته بنجاح' : 'All course files uploaded & saved';
            if (percentEl) percentEl.innerHTML = '<span style="color:#22c55e;font-weight:bold;font-size:1.1rem;">✓</span>';
            if (fillEl) {
                fillEl.style.width = '100%';
                fillEl.style.background = '#22c55e';
            }
        } else {
            if (statusEl) statusEl.textContent = `جاري رفع الملفات (${currentFileIndex}/${totalFiles})`;
            if (filenameEl) filenameEl.textContent = filename;
            if (percentEl) percentEl.textContent = `${filePercent}%`;
            if (fillEl) {
                fillEl.style.width = `${filePercent}%`;
                fillEl.style.background = '';
            }
        }
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


// ---------------------------------------------------------------------------
// Standalone page bootstrap (create-course.html)
//
// This module only EXPORTED initCourseBuilder; nothing called it. That is fine
// when courses.html imports it and opens the builder in a modal, but opening
// create-course.html directly (the Edit button links there) loaded the script,
// defined the function, and stopped -- so the page rendered blank forever.
//
// courses.html imports this same module, so the bootstrap must not run there:
// the pathname check keeps it to the standalone page only.
// ---------------------------------------------------------------------------
if (window.location.pathname.includes('create-course')) {
    document.addEventListener('DOMContentLoaded', async () => {
        const user = getCurrentUser();
        if (!user || !canManageContent(user.role)) {
            window.location.href = 'login.html';
            return;
        }

        // Import and render the admin sidebar layout
        try {
            const { renderLayout } = await import('../shared/layout.js');
            renderLayout('courses');
        } catch (e) {
            console.warn('Could not render layout:', e);
        }

        // Hide global loader
        const loader = document.getElementById('global-page-loader');
        if (loader) {
            loader.classList.add('hide-loader');
            setTimeout(() => loader.remove(), 300);
        }

        const contentArea = document.getElementById('page-content') || document.getElementById('app');
        if (!contentArea) return;

        // Check for draft or edit query params
        const params = new URLSearchParams(window.location.search);
        const draftId = params.get('draft') || null;
        const editId = params.get('edit') || null;

        initCourseBuilder(contentArea, (saved) => {
            if (saved) {
                window.location.href = 'courses.html';
            }
        }, editId, draftId);
    });
}
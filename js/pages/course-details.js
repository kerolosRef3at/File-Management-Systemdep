// js/pages/course-details.js
import {
    courseService,
    fileService,
    logService,
    showProgressWidget,
    applyCachedImage
} from '../shared/services.js';
import { BASE_URL } from '../shared/api.js';
import { resolveCourseImg } from '../shared/assets.js';
import { getCurrentUser } from '../shared/auth.js';
import { renderLayout } from '../shared/layout.js';
import { getCurrentLang } from '../shared/jssharedi18n.js';
import { showConfirmModal } from '../shared/components.js';

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

let courseData = null;

function downloadResource(path, name) {
    if (!path) { alert('This resource has no file attached.'); return; }
    let url;
    if (/^https?:\/\//i.test(path)) url = path;
    else if (path.startsWith('/api/')) url = BASE_URL + path;
    else url = BASE_URL + (path.startsWith('/') ? path : '/' + path);
    const a = document.createElement('a');
    a.href = url;
    a.download = name || 'resource';
    document.body.appendChild(a);
    a.click();
    a.remove();
}

document.addEventListener('DOMContentLoaded', async () => {
    const user = getCurrentUser();
    const isAdmin = user && !['Public User'].includes(user.role);

    let body = document.getElementById('courseDetailBody');
    if (!body) return;

    // If admin, switch to admin layout and sidebar
    if (isAdmin) {
        const publicShell = document.getElementById('publicShell');
        const app = document.getElementById('app');
        if (publicShell) publicShell.style.display = 'none';
        if (app) app.style.display = 'block';
        renderLayout('courses');
        body = document.getElementById('page-content');
        if (body) body.className = 'course-detail-body';
    }

    // Get Course ID
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('id') || '1';

    // Show Shimmer Loading Skeleton immediately
    if (body) {
        body.innerHTML = `
            <div style="padding: 20px;">
                <div class="global-skeleton" style="height: 24px; width: 220px; margin-bottom: 20px; border-radius: 6px;"></div>
                <div class="global-skeleton" style="height: 40px; width: 55%; margin-bottom: 24px; border-radius: 8px;"></div>
                <div class="global-skeleton" style="height: 260px; width: 100%; margin-bottom: 30px; border-radius: 16px;"></div>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px;">
                    <div class="global-skeleton skeleton-card" style="height: 140px;"></div>
                    <div class="global-skeleton skeleton-card" style="height: 140px;"></div>
                    <div class="global-skeleton skeleton-card" style="height: 140px;"></div>
                </div>
            </div>
        `;
    }

    try {
        let allCourses = [];
        let course = null;
        try { allCourses = await courseService.getCourses(); } catch(e) {}
        try { course = await courseService.getCourseDetails(courseId); } catch(e) {}
        courseData = course;

        if (!course && Array.isArray(allCourses)) {
            course = allCourses.find(c => String(c.id) === String(courseId) || String(c.courseId) === String(courseId));
        }
        if (!course && Array.isArray(allCourses) && allCourses.length > 0) {
            course = allCourses[0];
        }
        if (!course) throw new Error('Course not found on the server.');

        if (!Array.isArray(course.modules) || course.modules.length === 0) {
            course.modules = [
                {
                    name: course.title || 'Course Modules',
                    desc: course.description || 'Main course content and lessons.',
                    lessons: [
                        { id: '1', title: 'Introduction & Overview', duration: '15 mins', size: '12 MB', type: 'PDF' },
                        { id: '2', title: 'Core Lecture Materials', duration: '45 mins', size: '48 MB', type: 'PPTX' }
                    ]
                }
            ];
        }
        if (!Array.isArray(course.resources)) {
            course.resources = [
                { name: 'Course Syllabus', type: 'PDF', size: '2.1 MB' },
                { name: 'Lecture Notes', type: 'PPTX', size: '15.4 MB' }
            ];
        }

        const totalLessons = course.modules.reduce((sum, m) => sum + (Array.isArray(m.lessons) ? m.lessons.length : 0), 0);
        const totalCategories = course.modules.length;

        const lang = getCurrentLang();
        const isAr = lang === 'ar';

        // Calculate dynamic Content Types based on actual files/lessons
        const typesSet = new Set();
        if (Array.isArray(course.modules)) {
            course.modules.forEach(m => {
                if (Array.isArray(m.lessons)) {
                    m.lessons.forEach(l => {
                        if (l.type) typesSet.add(String(l.type).toUpperCase());
                        else if (l.file) {
                            const ext = l.file.split('.').pop()?.toUpperCase();
                            if (ext && ext.length <= 5) typesSet.add(ext);
                        }
                    });
                }
            });
        }
        if (Array.isArray(course.resources)) {
            course.resources.forEach(r => {
                if (r.type) typesSet.add(String(r.type).toUpperCase());
            });
        }
        if (typesSet.size === 0) {
            typesSet.add('PDF');
        }

        const formatTypeLabel = (t) => {
            switch (t) {
                case 'PDF': return isAr ? 'أدلة PDF' : 'PDF Guides';
                case 'PPTX':
                case 'PPT': return isAr ? 'عروض تقديمية PPTX' : 'PPTX Presentations';
                case 'DOC':
                case 'DOCX': return isAr ? 'مستندات Word' : 'Word Documents';
                case 'XLS':
                case 'XLSX': return isAr ? 'جداول Excel' : 'Excel Spreadsheets';
                case 'ZIP':
                case 'RAR': return isAr ? 'ملفات مضغوطة ZIP' : 'ZIP Archives';
                case 'MP4':
                case 'VIDEO': return isAr ? 'محاضرات فيديو' : 'Video Lectures';
                case 'PY':
                case 'IPYNB': return isAr ? 'أكواد Jupyter Notebooks' : 'Jupyter Notebooks';
                default: return t;
            }
        };

        const dynamicTypesString = Array.from(typesSet).map(formatTypeLabel).join(isAr ? '، ' : ', ');

        body.innerHTML = `
            <!-- Breadcrumb -->
            <div class="course-detail-breadcrumb">
                <a href="index.html">${isAr ? 'الرئيسية' : 'Home'}</a>
                <span class="bc-separator">&rsaquo;</span>
                <a href="courses.html">${isAr ? 'الكورسات' : 'Courses'}</a>
                <span class="bc-separator">&rsaquo;</span>
                <span class="bc-current">${escapeHtml(course.title)}</span>
            </div>

            <!-- Title -->
            <div class="course-detail-title" style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
                <div>
                    <h1>${escapeHtml(course.title)}</h1>
                    <div class="course-detail-badges">
                        <span class="cd-badge-certified">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                            ${isAr ? 'مناهج AITU المعتمدة' : 'AITU Certified Materials'}
                        </span>
                        <span class="cd-meta-text">${isAr ? 'مصدر مؤرشف' : 'Archived Resource'}</span>
                        <span class="cd-meta-dot"></span>
                        <span class="cd-meta-text">${isAr ? 'آخر تحديث' : 'Last updated'} ${course.lastUpdated || 'N/A'}</span>
                    </div>
                </div>
                ${isAdmin ? `
                <div class="admin-course-actions" style="display: flex; gap: 10px;">
                    <button id="btnAdminEditCourse" class="btn-upload" style="background: white; color: var(--primary-dark); border: 1px solid var(--border-color); padding: 8px 16px; border-radius: 6px; font-weight: 600; font-size: 0.9rem; display: flex; align-items: center; gap: 6px; cursor: pointer;">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        ${isAr ? 'تعديل الكورس' : 'Edit Course'}
                    </button>
                    <button id="btnAdminDeleteCourse" class="btn-upload" style="background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; padding: 8px 16px; border-radius: 6px; font-weight: 600; font-size: 0.9rem; display: flex; align-items: center; gap: 6px; cursor: pointer;">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        ${isAr ? 'حذف' : 'Delete'}
                    </button>
                </div>
                ` : ''}
            </div>

            <!-- Hero Banner -->
            <div class="course-detail-hero">
<img
    id="courseDetailHeroImg"
    src="${resolveCourseImg(course.img)}"
    alt="${escapeHtml(course.title)}"
    loading="lazy"
    onerror="this.onerror=null; this.src='assets/images/default-course.png';">
                <div class="course-detail-hero-overlay">
                    <div class="hero-package-info">
                        <div class="hero-package-label">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                            ${isAr ? 'حزمة الموارد الأكاديمية الكاملة' : 'Complete Resource Package'}
                        </div>
                        <div class="hero-package-title">${escapeHtml(course.title)}</div>
                        <div class="hero-package-desc">${isAr ? 'جميع مواد المنهج، البيانات والدلائل الفنية متوفرة للتنزيل.' : 'All syllabus materials, datasets, and technical documentation included in one download.'}</div>
                    </div>
                    <div class="hero-size-badge">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                        <span dir="ltr">${course.size}</span> ${isAr ? 'الحجم الإجمالي' : 'Total Size'}
                    </div>
                </div>
            </div>

            <!-- Two Column Layout -->
            <div class="course-detail-layout">
                <div>
                    <!-- Package Overview -->
                    <div class="package-overview">
                        <h2>${isAr ? 'نظرة عامة على الكورس' : 'Package Overview'}</h2>
                        <p>${course.description || (isAr ? 'لا يوجد وصف متاح لهذا الكورس.' : 'No description available.')}</p>
                        <div class="package-overview-stats">
                            <div class="po-stat">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                <strong>${isAr ? 'نوع المحتوى' : 'Content Type'}</strong> ${dynamicTypesString}.
                            </div>
                            <div class="po-stat">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                <strong>${isAr ? 'المحتوى المؤرشف' : 'Archived Content'}</strong> ${totalCategories} ${isAr ? 'وحدات دراسية' : 'Modules'} • ${totalLessons} ${isAr ? 'موارد فنية' : 'Technical Resources'}.
                            </div>
                        </div>
                    </div>

                    <!-- Resource List -->
                    <div class="resource-list-section">
                        <div class="resource-list-header">
                            <h2>${isAr ? 'قائمة الموارد والدروس' : 'Resource List'}</h2>
                            <span class="resource-list-count">${totalCategories} ${isAr ? 'أقسام' : 'Categories'} • ${totalLessons} ${isAr ? 'ملفات' : 'Files'}</span>
                        </div>
                        <div id="moduleAccordion"></div>
                    </div>
                </div>

                <!-- Right Sidebar -->
                <div class="course-detail-sidebar">
                    <!-- Download Bundle -->
                    <div class="download-bundle-card">
                        <h3>${isAr ? 'تحميل حزمة الكورس' : 'Download Bundle'}</h3>
                        <div class="db-size-badge">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                            <span dir="ltr">${course.size}</span> ${isAr ? 'الأرشيف المتاح' : 'Archive Available'}
                        </div>
                        <div class="db-feature">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                            ${isAr ? 'أدلة الدراسة الرسمية بجامعة AITU' : 'Official AITU Study Guides'}
                        </div>
                        <div class="db-feature">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                            ${isAr ? 'المقررات الأكاديمية الشاملة' : 'Complete historical syllabus'}
                        </div>
                        <button class="db-download-all-btn" id="downloadAllBtn">
                            ${isAr ? 'تحميل جميع الموارد' : 'Download All Resources'}
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                        </button>
                    </div>

                    <!-- Author Card -->
                    ${course.author ? `
                    <div class="author-card">
                        <div class="author-card-label">${isAr ? 'معد المنهج' : 'Curriculum Author'}</div>
                        <div class="author-info">
                            <div class="author-avatar">${course.author.name ? course.author.name.split(' ').map(n => n[0]).join('').slice(0, 2) : 'A'}</div>
                            <div>
                                <div class="author-name">${course.author.name || (isAr ? 'محاضر بـ AITU' : 'AITU Instructor')}</div>
                                <div class="author-title">${course.author.title || (isAr ? 'عضو هيئة التدريس' : 'Faculty Member')}</div>
                            </div>
                        </div>
                        <p class="author-bio">${course.author.bio || ''}</p>
                        <a href="#" class="author-profile-link">${isAr ? 'عرض الملف الشخصي للمحاضر' : 'View Faculty Profile'}</a>
                    </div>
                    ` : ''}

                    <!-- Related Bundles -->
                    ${course.relatedCourses && course.relatedCourses.length > 0 ? `
                    <div class="related-bundles-card">
                        <h4>${isAr ? 'حزم ذات صلة' : 'Related Resource Bundles'}</h4>
                        ${course.relatedCourses.map(relId => {
                            const rel = allCourses.find(c => c.id === relId);
                            if (!rel) return '';
                            return `
                                <div class="related-bundle-item" data-id="${rel.id}">
                                    <div class="related-bundle-thumb">
                                        ${resolveCourseImg(rel.img) ? `<img src="${resolveCourseImg(rel.img)}" alt="${escapeHtml(rel.title)}" onerror="this.style.display='none'">` : ''}
                                    </div>
                                    <div>
                                        <div class="related-bundle-name">${rel.title}</div>
                                        <div class="related-bundle-meta">${isAr ? 'أرشيف الموارد' : 'Resource Archive'} • <span dir="ltr">${rel.size}</span></div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                    ` : ''}
                </div>
            </div>
        `;

        // Apply cached image for instant zero-latency loading & smooth fallback
        const heroImg = document.getElementById('courseDetailHeroImg');
        if (heroImg && course.img) {
            applyCachedImage(heroImg, course.img);
        }

        // Render Module Accordion
        const accordion = document.getElementById('moduleAccordion');
        course.modules.forEach((mod, idx) => {
            const isFirst = idx === 0;
            const moduleEl = document.createElement('div');
            moduleEl.className = 'rl-module';
            moduleEl.innerHTML = `
                <div class="rl-module-header ${isFirst ? 'open' : ''}">
                    <div style="display:flex;align-items:center;">
                        <span class="rl-module-num">${String(idx + 1).padStart(2, '0')}</span>
                        <span class="rl-module-name">${mod.name}</span>
                    </div>
                    <svg class="rl-module-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
                <div class="rl-module-content ${isFirst ? 'open' : ''}">
                    ${mod.lessons.map(lesson => `
                        <div class="rl-file-row">
                            <div class="rl-file-name">
                                <svg viewBox="0 0 24 24" fill="none" stroke="${lesson.type === 'video' ? '#9333ea' : '#2563eb'}" stroke-width="2">
                                    ${lesson.type === 'video' ? '<polygon points="5 3 19 12 5 21 5 3"/>' : '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>'}
                                </svg>
                                ${lesson.title || lesson.name || 'Lesson Resource'}
                            </div>
                            <div class="rl-file-actions">
                                <span class="rl-file-size" dir="ltr">${lesson.size || ''}</span>
                                ${isAdmin ? `
                                <button class="rl-file-admin-edit-btn" title="Edit File" style="background:transparent; border:none; cursor:pointer; color: var(--primary-blue);">
                                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                </button>
                                <button class="rl-file-admin-delete-btn" title="Delete File" style="background:transparent; border:none; cursor:pointer; color: #dc2626;">
                                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                </button>
                                ` : ''}
                                <button class="rl-file-download-btn" data-id="${lesson.fileId != null ? lesson.fileId : (lesson.id || '')}" data-file="${lesson.file || ''}" data-title="${lesson.title || lesson.name || ''}" title="Download">
                                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
            accordion.appendChild(moduleEl);

            // Toggle
            const header = moduleEl.querySelector('.rl-module-header');
            const content = moduleEl.querySelector('.rl-module-content');
            header.addEventListener('click', () => {
                header.classList.toggle('open');
                content.classList.toggle('open');
            });
        });

        // Download individual file buttons
        document.querySelectorAll('.rl-file-download-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const fileId = btn.dataset.id;
                const fileUrl = btn.dataset.file || btn.getAttribute('data-file');
                const fileName = btn.dataset.title || btn.getAttribute('data-name') || 'course_file';

                // Pass BOTH the id and the stored path. downloadFile uses the
                // numeric-id endpoint for repository files and the by-path
                // endpoint for course lessons (whose id is a non-numeric string
                // and whose real locator is the file path).
                try {
                    const r = await fileService.downloadFile(fileId, fileName, { file: fileUrl });
                    if (r && r.success) return;
                } catch (err) {
                    console.warn("downloadFile failed:", err);
                }

                if (false && fileUrl) {
                    const downloadUrl = fileUrl.startsWith('http') || fileUrl.startsWith('data:') ? fileUrl : `${BASE_URL}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
                    const a = document.createElement('a');
                    a.href = downloadUrl;
                    a.download = fileName;
                    a.target = '_blank';
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                } else {
// No id and no url -> nothing real to download. The old code
// wrote a fake "<name>.txt" placeholder here.
// Just tell the user.
const isAr = getCurrentLang() === 'ar';
alert(
    isAr
        ? 'هذا الملف غير متاح للتحميل حاليًا.'
        : 'This file is not available for download.'
);
                }
            });
        });

        // Admin Edit individual file buttons
        document.querySelectorAll('.rl-file-admin-edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const promptMsg = isAr ? 'أدخل اسم الملف الجديد:' : 'Enter new filename:';
                const newName = prompt(promptMsg);
                if (newName && newName.trim() !== '') {
                    const nameContainer = e.target.closest('.rl-file-row').querySelector('.rl-file-name');
                    nameContainer.innerHTML = nameContainer.innerHTML.replace(/<\/svg>[\s\S]*$/, '</svg> ' + newName.trim());
                }
            });
        });

        // Admin Delete individual file buttons
        document.querySelectorAll('.rl-file-admin-delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const confirmMsg = isAr ? 'هل أنت متأكد من رغبتك في حذف هذا المورد؟' : 'Are you sure you want to delete this resource?';
                if (confirm(confirmMsg)) {
                    const row = e.target.closest('.rl-file-row');
                    row.style.opacity = '0.5';
                    setTimeout(() => row.remove(), 200);
                }
            });
        });

        // Admin course level actions
        if (isAdmin) {
            const editCourseBtn = document.getElementById('btnAdminEditCourse');
            const deleteCourseBtn = document.getElementById('btnAdminDeleteCourse');
            
            if (editCourseBtn) {
                editCourseBtn.addEventListener('click', () => {
                    window.location.href = `create-course.html?edit=${course.id}`;
                });
            }
            if (deleteCourseBtn) {
deleteCourseBtn.addEventListener('click', () => {
    const title = isAr ? 'تأكيد حذف الكورس' : 'Confirm Course Deletion';
    const message = isAr
        ? `هل أنت متأكد من رغبتك في حذف كورس "${course.title}" نهائياً؟ هذا الإجراء لا يمكن التراجع عنه وسيحذف جميع المحاضرات والملفات المتعلقة به.`
        : `Are you sure you want to permanently delete course "${course.title}"? This action cannot be undone.`;

    showConfirmModal({
        title,
        message,
        confirmText: isAr ? 'تأكيد الحذف' : 'Confirm Delete',
        cancelText: isAr ? 'إلغاء' : 'Cancel',
        type: 'danger',
        onConfirm: async () => {
            deleteCourseBtn.disabled = true;
            deleteCourseBtn.innerText = isAr ? 'جاري الحذف...' : 'Deleting...';

            try {
                await courseService.deleteCourse(course.id);
                alert(isAr ? 'تم حذف الكورس بنجاح.' : 'Course deleted successfully.');
                window.location.href = 'courses.html';
            } catch (err) {
                alert(isAr ? 'تعذر حذف الكورس.' : 'Failed to delete course.');
                deleteCourseBtn.disabled = false;
                deleteCourseBtn.innerText = isAr ? 'حذف' : 'Delete';
            }
        }
    });
});
        
            }}
        // Download All → Show Confirmation Modal FIRST
        document.getElementById('downloadAllBtn')?.addEventListener('click', () => {
            showDownloadModal(course);
        });

        // Related bundles click
        document.querySelectorAll('.related-bundle-item').forEach(item => {
            item.addEventListener('click', () => {
                window.location.href = `course-details.html?id=${item.dataset.id}`;
            });
        });

    } catch (error) {
        const lang = getCurrentLang();
        const isAr = lang === 'ar';
        body.innerHTML = `<div style="text-align:center;padding:80px 20px;color:var(--text-gray);"><h2 style="color:var(--primary-dark);">${isAr ? 'الكورس غير موجود' : 'Course Not Found'}</h2><p>${error.message}</p><a href="courses.html" style="color:var(--primary-blue);margin-top:15px;display:inline-block;">${isAr ? 'العودة لصفحة الكورسات' : 'Back to Courses'}</a></div>`;
    } finally {
        // Hide Global Loader
        const loader = document.getElementById('global-page-loader');
        if (loader) {
            loader.classList.add('hide-loader');
            setTimeout(() => loader.remove(), 400);
        }
    }

    // ============================
    // DOWNLOAD BUNDLE HELPER FUNCTION
    // ============================
    async function executeBundleDownload(currentCourse) {
        if (!currentCourse) return;
        const lang = getCurrentLang();
        const isAr = lang === 'ar';

        try {
            const filesToDownload = [];
            if (Array.isArray(currentCourse.modules)) {
                currentCourse.modules.forEach(m => {
                    if (Array.isArray(m.lessons)) {
                        m.lessons.forEach(l => {
                            filesToDownload.push({
                                id: (l.fileId != null ? l.fileId : l.id),
                                name: l.title || l.name || 'Lesson Resource',
                                file: l.file,
                                type: l.type || 'PDF'
                            });
                        });
                    }
                });
            }
            if (filesToDownload.length === 0 && Array.isArray(currentCourse.resources)) {
                currentCourse.resources.forEach(r => {
                    filesToDownload.push({
                        id: r.id,
                        name: r.name || 'Lesson Resource',
                        file: r.file,
                        type: r.type || 'PDF'
                    });
                });
            }

            const widgetItems = filesToDownload.length > 0 
                ? filesToDownload.map(f => f.name)
                : [`${currentCourse.title || 'Course'}_Bundle`];

            showProgressWidget(widgetItems, 'download');

// Try server zip download first
const numericIds = filesToDownload
    .map(f => parseInt(f.id))
    .filter(id => !isNaN(id) && id > 0);

const allNumeric = numericIds.length === filesToDownload.length;

if (allNumeric && numericIds.length > 0) {
    try {
        const res = await fileService.downloadZip(numericIds);
        if (res && res.success) return;
    } catch (err) {
        console.warn('Server ZIP unavailable, downloading individually:', err);
    }
}

const isAr = getCurrentLang() === 'ar';

if (filesToDownload.length === 0) {
    alert(
        isAr
            ? 'لا توجد ملفات لتحميلها في هذا الكورس.'
            : 'This course has no files to download.'
    );
    return;
}

let ok = 0,
    failed = 0;

for (const f of filesToDownload) {
    try {
        const r = await fileService.downloadFile(f.id, f.name, { file: f.file });
        if (r && r.success) ok++;
        else failed++;
    } catch (e) {
        failed++;
    }

    await new Promise(res => setTimeout(res, 400));
}

if (ok === 0) {
    alert(
        isAr
            ? 'تعذّر تحميل ملفات هذا الكورس. قد تكون غير متاحة على الخادم.'
            : "Could not download this course's files. They may be unavailable on the server."
    );
} else if (failed > 0) {
    alert(
        isAr
            ? `تم تحميل ${ok} ملف، وتعذّر تحميل ${failed}.`
            : `Downloaded ${ok} file(s); ${failed} could not be downloaded.`
    );

            }
        } catch (err) {
            console.warn('Error in executeBundleDownload:', err);
        }
    }

    // ============================
    // DOWNLOAD MODAL LOGIC
    // ============================
    function showDownloadModal(currentCourse) {
        const modal = document.getElementById('courseDownloadModal');
        if (!modal) {
            executeBundleDownload(currentCourse);
            return;
        }

        const lang = getCurrentLang();
        const isAr = lang === 'ar';

        const nameEl = document.getElementById('modalCourseName');
        const descEl = document.getElementById('modalCourseDesc');
        const sizeEl = document.getElementById('modalTotalSize');

        if (nameEl) nameEl.textContent = currentCourse.title;
        if (descEl) {
            descEl.textContent = isAr 
                ? 'حزمة الموارد الأكاديمية الكاملة للتنزيل المباشر.' 
                : 'Full course resource bundle for guest access.';
        }
        if (sizeEl) {
            sizeEl.innerHTML = `<span dir="ltr">${currentCourse.size || '0 MB'}</span>`;
        }

        // Gather resources from modules or course resources
        let resourcesList = [];
        if (Array.isArray(currentCourse.modules)) {
            currentCourse.modules.forEach(m => {
                if (Array.isArray(m.lessons)) {
                    m.lessons.forEach(l => {
                        resourcesList.push({
                            id: (l.fileId != null ? l.fileId : l.id),
                            name: l.title || l.name || 'Lesson Resource',
                            type: (l.type || 'PDF').toUpperCase(),
                            size: l.size || '10 MB',
                            file: l.file
                        });
                    });
                }
            });
        }
        if (resourcesList.length === 0 && Array.isArray(currentCourse.resources)) {
            resourcesList = currentCourse.resources;
        }

        const grid = document.getElementById('modalContentGrid');
        if (grid) {
            const iconMap = {
                'PDF': { cls: 'pdf', svg: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>' },
                'PPTX': { cls: 'pptx', svg: '<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>' },
                'ZIP': { cls: 'zip', svg: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>' },
                'MULTI': { cls: 'multi', svg: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>' },
                'XLSX': { cls: 'xlsx', svg: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>' },
                'VIDEO': { cls: 'multi', svg: '<polygon points="5 3 19 12 5 21 5 3"/>' }
            };

            grid.innerHTML = resourcesList.map(res => {
                const typeKey = (res.type || 'PDF').toUpperCase();
                const icon = iconMap[typeKey] || iconMap['PDF'];
                return `
                    <div class="cdm-content-card">
                        <div class="cdm-content-icon ${icon.cls}">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${icon.svg}</svg>
                        </div>
                        <div style="flex:1; min-width:0; overflow:hidden;">
                            <div class="cdm-content-name" style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${res.name}</div>
                            <div class="cdm-content-meta" dir="ltr" style="text-align:${isAr ? 'right' : 'left'};">${res.type} • ${res.size}</div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        modal.classList.add('active');
    }

    function hideModal() {
        const modal = document.getElementById('courseDownloadModal');
        if (modal) modal.classList.remove('active');
    }

    document.getElementById('closeModal')?.addEventListener('click', hideModal);
    document.getElementById('cancelModal')?.addEventListener('click', hideModal);

    const confirmModalBtn = document.getElementById('confirmModal');
    if (confirmModalBtn) {
        confirmModalBtn.addEventListener('click', async () => {
            const lang = getCurrentLang();
            const isAr = lang === 'ar';

            confirmModalBtn.disabled = true;
            const originalHTML = confirmModalBtn.innerHTML;
            confirmModalBtn.innerHTML = `
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>
                <span>${isAr ? 'جاري تجهيز التحميل...' : 'Preparing Download...'}</span>
            `;

            try {
                // Use courseData (the module-scoped variable set at load), NOT
                // `course` -- that local only exists inside the render function,
                // so referencing it here threw "course is not defined" and the
                // bundle download never ran.
                // The server logs the download itself (guest or authenticated)
                // inside /api/Files/zip and /api/Files/download, so no client log.
                await executeBundleDownload(courseData);
            } catch (err) {
                console.warn('Confirm modal download notice:', err);
            } finally {
                confirmModalBtn.disabled = false;
                confirmModalBtn.innerHTML = originalHTML;
                hideModal();
            }
        });
    }
});
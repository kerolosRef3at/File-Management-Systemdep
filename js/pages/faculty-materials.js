// js/pages/faculty-materials.js
// بوابة تصفح وإدارة المناهج الأكاديمية والمقررات - جامعة أسيوط التكنولوجية الدولية (AITU)
// هيكل تصفح شجري: العام الدراسي -> القسم العلمي -> الفرقة الدراسية -> المجلدات والملفات

import { getCurrentUser } from '../shared/auth.js';
import { fileService, courseService, folderService } from '../shared/services.js';
import { BASE_URL } from '../shared/api.js';
import { escapeHTML } from '../shared/utils.js';

// Predefined accredited departments
const UNIVERSITY_DEPARTMENTS = [
    {
        code: 'IT',
        nameAr: 'قسم تكنولوجيا المعلومات',
        nameEn: 'Information Technology Dept',
        icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
        subAr: 'تكنولوجيا البرمجيات، الشبكات والسيبراني، الذكاء الاصطناعي'
    },
    {
        code: 'EL',
        nameAr: 'قسم تكنولوجيا الكهرباء والإلكترونيات',
        nameEn: 'Electrical & Electronics Dept',
        icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
        subAr: 'الأنظمة المدمجة والإلكترونية، تكنولوجيا الطاقة والقوى'
    },
    {
        code: 'ME',
        nameAr: 'قسم تكنولوجيا الميكانيكا والميكاترونكس',
        nameEn: 'Mechanical & Mechatronics Dept',
        icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
        subAr: 'تكنولوجيا الأوتوترونكس والسيارات، التصنيع، الميكاترونكس'
    },
    {
        code: 'DESIGN',
        nameAr: 'قسم تكنولوجيا الأطراف الصناعية والتصميم',
        nameEn: 'Prosthetics & Design Dept',
        icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`,
        subAr: 'تكنولوجيا الأجهزة التعويضية والأطراف، التصميم الصناعي'
    }
];

// Study levels
const STUDY_LEVELS = [
    { level: 1, titleAr: 'الفرقة الأولى', titleEn: 'Level 1 (Freshman)', subAr: 'السنة الدراسية الأولى' },
    { level: 2, titleAr: 'الفرقة الثانية', titleEn: 'Level 2 (Sophomore)', subAr: 'السنة الدراسية الثانية' },
    { level: 3, titleAr: 'الفرقة الثالثة', titleEn: 'Level 3 (Junior)', subAr: 'السنة الدراسية الثالثة' },
    { level: 4, titleAr: 'الفرقة الرابعة', titleEn: 'Level 4 (Senior)', subAr: 'السنة الدراسية الرابعة' }
];

// Academic Years
const ACADEMIC_YEARS = ['2025/2026', '2024/2025', '2023/2024'];

// Global State
let activeAcademicYear = '2025/2026';
let activeDept = 'IT';
let activeLevel = 1;
let currentFolderId = null;
let folderNavigationStack = []; // [{ id, name }]
let currentCategoryFilter = 'ALL';
let searchQuery = '';

let allFolders = [];
let allFiles = [];
let coursesList = [];
let selectedUploadFile = null;

/**
 * Resolve department assigned to current logged-in user
 */
function resolveUserDept(user) {
    if (!user) return null;
    const role = (user.role || '').toLowerCase();
    if (role.includes('student') || role.includes('public')) return null;
    if (role.includes('admin') || role.includes('supervisor')) return 'ALL';
    if (user.dept) return user.dept.toUpperCase();
    if (user.departmentId) return String(user.departmentId).toUpperCase();
    if (role.includes('it')) return 'IT';
    if (role.includes('el') || role.includes('elect')) return 'EL';
    if (role.includes('me') || role.includes('mech')) return 'ME';
    if (role.includes('design')) return 'DESIGN';
    return 'ALL';
}

/**
 * Format bytes to readable size
 */
function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 KB';
    if (typeof bytes === 'string' && (bytes.includes('KB') || bytes.includes('MB') || bytes.includes('GB'))) return bytes;
    const num = Number(bytes);
    if (isNaN(num)) return bytes;
    if (num < 1024) return num + ' B';
    if (num < 1024 * 1024) return (num / 1024).toFixed(1) + ' KB';
    if (num < 1024 * 1024 * 1024) return (num / (1024 * 1024)).toFixed(1) + ' MB';
    return (num / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
}

/**
 * Main Initialization Entry Point
 */
export async function initFacultyMaterials(container) {
    if (!container) return;

    const user = getCurrentUser();
    const role = (user?.role || '').toLowerCase();
    const isStudentOrGuest = !user || role.includes('student') || role.includes('public');
    const isGuest = isStudentOrGuest;
    const userDept = resolveUserDept(user);

    // If faculty is bound to a single department, lock and default activeDept to it
    if (userDept && userDept !== 'ALL') {
        activeDept = userDept;
    }

    renderPortalStructure(container, user, isGuest, userDept);
    bindGlobalEvents();
    ensurePreseededFolders();
    ensurePreseededFiles();
    renderExplorer();
    loadInitialData();
}

/**
 * Render the entire portal layout
 */
function renderPortalStructure(container, user, isGuest, userDept) {
    const isAr = (localStorage.getItem('aitu_lang') || 'ar') === 'ar';

    const currentYearTitle = `${activeAcademicYear} (${isAr ? 'العام الحالي' : 'Current'})`;

    let userStatusHtml = '';
    if (isGuest) {
        userStatusHtml = `
            <div class="fm-hero-user-status guest">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span>${isAr ? 'وضع الطالب / الزائر (استعراض وتحميل مباشر)' : 'Student / Guest Mode (Read-only)'}</span>
            </div>
        `;
    } else {
        const deptText = userDept === 'ALL' ? (isAr ? 'كافة الأقسام' : 'All Departments') : userDept;
        userStatusHtml = `
            <div class="fm-hero-user-status faculty">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                    <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                </svg>
                <span>${isAr ? `الكادر التدريسي: ${escapeHTML(user.name || user.username)} (${deptText})` : `Faculty: ${escapeHTML(user.name || user.username)} (${deptText})`}</span>
            </div>
        `;
    }

    container.innerHTML = `
        <div class="faculty-portal-root">
            <!-- 1. Hero Banner with Academic Year Selector -->
            <header class="fm-hero">
                <div class="fm-hero-badge-row">
                    <div class="fm-hero-badge">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                            <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                            <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                        </svg>
                        <span>${isAr ? 'جامعة أسيوط التكنولوجية الدولية — منصة المناهج والمقررات الأكاديمية' : 'AITU - Academic Coursework & Materials Portal'}</span>
                    </div>
                    ${userStatusHtml}
                </div>

                <h1 class="fm-hero-title">${isAr ? 'مركز رفع وتصفح المناهج والمقررات الأكاديمية' : 'Academic Coursework & Curricula Hub'}</h1>
                <div class="fm-hero-desc">
                    ${isAr 
                        ? 'تصفح هرمي منظم للمناهج والماتريال والتكليفات والسكاشن حسب العام الأكاديمي، الأقسام التكنولوجية، والفرق الدراسية. متاح للطلاب للتحميل والمطالعة وللكادر التدريسي للإدارة والرفع.' 
                        : 'Organized hierarchy for university lecture slides, assignments, lab manuals, and textbooks sorted by academic year, department, and study level.'
                    }
                </div>

                <!-- Academic Year Selector Bar -->
                <div class="fm-academic-year-bar">
                    <div class="fm-year-label">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        <span>${isAr ? 'العام الأكاديمي المختار:' : 'Academic Year:'}</span>
                    </div>
                    <div class="fm-year-pills" id="fmYearPills">
                        ${ACADEMIC_YEARS.map(year => `
                            <button type="button" class="fm-year-pill ${year === activeAcademicYear ? 'active' : ''}" data-year="${year}">
                                ${year} ${year === '2025/2026' ? (isAr ? '(العام الحالي)' : '(Current)') : ''}
                            </button>
                        `).join('')}
                    </div>
                </div>
            </header>

            <!-- 2. Department Selector Cards -->
            <section class="fm-section-title-box">
                <h2 class="fm-section-title">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.2">
                        <rect x="3" y="3" width="7" height="7"></rect>
                        <rect x="14" y="3" width="7" height="7"></rect>
                        <rect x="14" y="14" width="7" height="7"></rect>
                        <rect x="3" y="14" width="7" height="7"></rect>
                    </svg>
                    <span>${isAr ? 'القسم العلمي والأكاديمي' : 'Academic Department'}</span>
                </h2>
                <p class="fm-section-subtitle">${isAr ? 'اختر القسم التكنولوجي لاستعراض المناهج والفرق الدراسية التابعة له' : 'Select department to view assigned curriculum and levels'}</p>
            </section>

            <div class="fm-dept-grid" id="fmDeptGrid">
                ${UNIVERSITY_DEPARTMENTS.map(d => {
                    const isAssigned = !isGuest && (userDept === 'ALL' || userDept === d.code);
                    const isActive = activeDept === d.code;
                    let badgeText = '';
                    if (!isGuest) {
                        if (userDept === d.code) badgeText = isAr ? 'قسمك المعتمد' : 'Your Dept';
                        else if (userDept === 'ALL') badgeText = isAr ? 'صلاحية شاملة' : 'Admin Access';
                        else badgeText = isAr ? 'للاطلاع فقط' : 'Read-only';
                    }
                    return `
                        <div class="fm-dept-card ${isActive ? 'active' : ''} ${!isAssigned ? 'readonly-dept' : ''}" data-dept="${d.code}">
                            ${badgeText ? `<span class="fm-dept-badge ${isAssigned ? 'assigned' : 'readonly'}">${badgeText}</span>` : ''}
                            <div class="fm-dept-icon">${d.icon}</div>
                            <div class="fm-dept-info">
                                <div class="fm-dept-name">${isAr ? d.nameAr : d.nameEn}</div>
                                <div class="fm-dept-sub">${isAr ? d.subAr : d.nameEn}</div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>

            <!-- 3. Study Levels (الفرق الدراسية) -->
            <div class="fm-levels-wrapper">
                <div class="fm-levels-row" id="fmLevelsRow">
                    ${STUDY_LEVELS.map(sl => `
                        <button type="button" class="fm-level-btn ${sl.level === activeLevel ? 'active' : ''}" data-level="${sl.level}">
                            <span class="fm-level-title">${isAr ? sl.titleAr : sl.titleEn}</span>
                            <span class="fm-level-sub">${isAr ? sl.subAr : `Academic Year ${sl.level}`}</span>
                        </button>
                    `).join('')}
                </div>
            </div>

            <!-- 4. Hierarchical File & Folder Explorer -->
            <main class="fm-explorer-box">
                <!-- Breadcrumbs Path -->
                <div class="fm-breadcrumb-bar" id="fmBreadcrumbBar">
                    <!-- Dynamic breadcrumbs rendered here -->
                </div>

                <!-- Explorer Toolbar -->
                <div class="fm-explorer-toolbar">
                    <div class="fm-toolbar-left">
                        <div class="fm-search-wrapper">
                            <input type="text" id="fmSearchInput" class="fm-search-input" 
                                placeholder="${isAr ? 'ابحث عن ملف، محاضرة، شيت، أو مجلد في هذا المسار...' : 'Search files, folders or courses in this path...'}">
                            <svg class="fm-search-icon-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                        </div>

                        <!-- Category Filter Pills -->
                        <div class="fm-category-filter-pills" id="fmCategoryPills">
                            <button type="button" class="fm-cat-pill active" data-cat="ALL">${isAr ? 'الكل' : 'All'}</button>
                            <button type="button" class="fm-cat-pill" data-cat="LECTURE">${isAr ? 'محاضرات' : 'Lectures'}</button>
                            <button type="button" class="fm-cat-pill" data-cat="ASSIGNMENT">${isAr ? 'شيتات وتكليفات' : 'Assignments'}</button>
                            <button type="button" class="fm-cat-pill" data-cat="BOOK">${isAr ? 'كتب ومراجع' : 'Books'}</button>
                            <button type="button" class="fm-cat-pill" data-cat="LAB">${isAr ? 'سكاشن' : 'Labs'}</button>
                        </div>
                    </div>

                    <div class="fm-toolbar-actions" id="fmToolbarActions">
                        <!-- Rendered dynamically based on permissions -->
                    </div>
                </div>

                <!-- Section: Folders (المجلدات) -->
                <div class="fm-folders-section" id="fmFoldersSection">
                    <h3 class="fm-subheading">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.2">
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                        </svg>
                        <span>${isAr ? 'المجلدات الأكاديمية' : 'Folders'}</span>
                    </h3>
                    <div class="fm-folders-grid" id="fmFoldersGrid">
                        <!-- Folders rendered here -->
                    </div>
                </div>

                <!-- Section: Files (الملفات) -->
                <div class="fm-files-section">
                    <h3 class="fm-subheading">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                        </svg>
                        <span>${isAr ? 'الملفات والماتريال المتاحة' : 'Course Files & Materials'}</span>
                    </h3>
                    <div class="fm-files-grid" id="fmFilesGrid">
                        <!-- Files rendered here -->
                    </div>
                </div>
            </main>
        </div>

        <!-- ══════════════════════════════════════════════════
             MODAL 1: Create New Folder Modal
             ══════════════════════════════════════════════════ -->
        <div class="fm-modal-overlay" id="fmFolderModal">
            <div class="fm-modal-card" style="max-width: 500px;">
                <button type="button" class="fm-modal-close-btn" id="fmCloseFolderModalBtn">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                <div class="fm-modal-header">
                    <div style="display:flex; align-items:center; gap:10px; margin-bottom:6px;">
                        <div style="width:40px; height:40px; border-radius:12px; background:#eff6ff; color:#2563eb; display:flex; align-items:center; justify-content:center;">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                                <line x1="12" y1="11" x2="12" y2="17"></line>
                                <line x1="9" y1="14" x2="15" y2="14"></line>
                            </svg>
                        </div>
                        <h3 style="margin:0 !important; font-size:1.25rem !important;">${isAr ? 'إنشاء مجلد أكاديمي جديد' : 'Create New Folder'}</h3>
                    </div>
                    <p style="margin:0 !important; color:#64748b;">${isAr ? 'سيتم إنشاء المجلد في المسار الأكاديمي المفتوح حالياً' : 'Folder will be created in current academic location'}</p>
                </div>

                <div class="fm-modal-path-badge" id="fmFolderModalPath"></div>

                <form id="fmFolderForm">
                    <div class="fm-form-group">
                        <label for="fmFolderNameInput">${isAr ? 'اسم المجلد' : 'Folder Name'} <span class="req">*</span></label>
                        <input type="text" id="fmFolderNameInput" class="fm-input" required 
                            placeholder="${isAr ? 'مثال: محاضرات البرمجة الكائنية OOP' : 'e.g. OOP Lecture Slides'}">
                    </div>

                    <div class="fm-form-group">
                        <label for="fmFolderCategorySelect">${isAr ? 'تصنيف محتويات المجلد (اختياري)' : 'Folder Category'}</label>
                        <select id="fmFolderCategorySelect" class="fm-select">
                            <option value="GENERAL">${isAr ? '📁 مجلد عام (محتويات متنوعة)' : 'General Folder'}</option>
                            <option value="LECTURE">${isAr ? '📘 محاضرات وسلايدات' : 'Lectures & Slides'}</option>
                            <option value="ASSIGNMENT">${isAr ? '📝 شيتات وتكليفات للطلاب' : 'Assignments & Homework'}</option>
                            <option value="BOOK">${isAr ? '📚 كتب ومراجع معتمدة' : 'Textbooks & References'}</option>
                            <option value="LAB">${isAr ? '🔬 سكاشن وتجارب عملية' : 'Labs & Experiments'}</option>
                        </select>
                    </div>

                    <div class="fm-form-actions-row" style="margin-top:20px;">
                        <button type="button" class="fm-cancel-btn" id="fmCancelFolderBtn">${isAr ? 'إلغاء' : 'Cancel'}</button>
                        <button type="submit" class="fm-submit-btn">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                            <span>${isAr ? 'إنشاء المجلد الآن' : 'Create Folder'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- ══════════════════════════════════════════════════
             MODAL 2: Upload File Directly Modal
             ══════════════════════════════════════════════════ -->
        <div class="fm-modal-overlay" id="fmUploadModal">
            <div class="fm-modal-card fm-upload-modal-card">
                <button type="button" class="fm-modal-close-btn" id="fmCloseUploadModalBtn">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                <div class="fm-modal-header">
                    <div style="display:flex; align-items:center; gap:10px; margin-bottom:6px;">
                        <div style="width:40px; height:40px; border-radius:12px; background:#eff6ff; color:#2563eb; display:flex; align-items:center; justify-content:center;">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                            </svg>
                        </div>
                        <h3 style="margin:0 !important; font-size:1.35rem !important;">${isAr ? 'رفع ملف أكاديمي مباشر' : 'Upload Academic File'}</h3>
                    </div>
                    <p style="margin:0 !important; color:#64748b;">${isAr ? 'سيتم ربط الملف ورفعه في المسار الأكاديمي المفتوح حالياً' : 'File will be uploaded to current academic path'}</p>
                </div>

                <div class="fm-modal-path-badge" id="fmUploadModalPath"></div>

                <div class="fm-modal-scroll-body">
                    <form id="fmUploadForm">
                        <input type="hidden" id="fmUploadCategoryInput" value="LECTURE">

                        <!-- Category Selector -->
                        <div style="font-size:0.86rem; font-weight:800; color:#1e293b; margin-bottom:8px;">${isAr ? 'اختر تصنيف المورد:' : 'Category:'}</div>
                        <div class="fm-type-picker-grid">
                            <button type="button" class="fm-type-card-btn active" data-type="LECTURE">
                                <span>📘 ${isAr ? 'محاضرة / ماتريال' : 'Lecture'}</span>
                            </button>
                            <button type="button" class="fm-type-card-btn" data-type="ASSIGNMENT">
                                <span>📝 ${isAr ? 'شيت / تكليف' : 'Assignment'}</span>
                            </button>
                            <button type="button" class="fm-type-card-btn" data-type="BOOK">
                                <span>📚 ${isAr ? 'كتاب / مرجع' : 'Textbook'}</span>
                            </button>
                            <button type="button" class="fm-type-card-btn" data-type="LAB">
                                <span>🔬 ${isAr ? 'سكشن / معمل' : 'Lab Manual'}</span>
                            </button>
                        </div>

                        <!-- Row 1: Title and Target Course -->
                        <div class="fm-form-grid-2">
                            <div class="fm-form-group">
                                <label for="fmUploadTitle">${isAr ? 'عنوان الملف أو المورد' : 'File Title'} <span class="req">*</span></label>
                                <input type="text" id="fmUploadTitle" class="fm-input" required 
                                    placeholder="${isAr ? 'مثال: محاضرة 03: خوارزميات البحث' : 'e.g. Lecture 03: Search Algorithms'}">
                            </div>

                            <div class="fm-form-group">
                                <label for="fmUploadCourse">${isAr ? 'اسم المادة / المقرر الدراسي' : 'Course Name'} <span class="req">*</span></label>
                                <input type="text" id="fmUploadCourse" class="fm-input" required
                                    placeholder="${isAr ? 'مثال: هياكل البيانات والخوارزميات' : 'e.g. Data Structures'}">
                            </div>
                        </div>

                        <!-- Row 2: Instructor & Deadline -->
                        <div class="fm-form-grid-2">
                            <div class="fm-form-group">
                                <label for="fmUploadInstructor">${isAr ? 'اسم الأستاذ / المعيد' : 'Instructor Name'} <span class="req">*</span></label>
                                <input type="text" id="fmUploadInstructor" class="fm-input" required 
                                    value="${user?.name || user?.username || ''}"
                                    placeholder="${isAr ? 'دكتور أو معيد المادة' : 'Instructor name'}">
                            </div>

                            <div class="fm-form-group" id="fmUploadDeadlineContainer" style="display:none;">
                                <label for="fmUploadDeadline">${isAr ? 'آخر موعد لتسليم التكليف' : 'Deadline'}</label>
                                <input type="date" id="fmUploadDeadline" class="fm-input">
                            </div>
                        </div>

                        <!-- Notes -->
                        <div class="fm-form-group">
                            <label for="fmUploadNotes">${isAr ? 'تعليمات وإرشادات إضافية للطلاب' : 'Instructions for Students'}</label>
                            <textarea id="fmUploadNotes" class="fm-textarea" rows="2" 
                                placeholder="${isAr ? 'أي ملاحظات توجيهية للطلاب بخصوص هذا الملف...' : 'Any guidelines or notes for students...'}"></textarea>
                        </div>

                        <!-- Dropzone -->
                        <div class="fm-dropzone" id="fmUploadDropzone">
                            <input type="file" id="fmUploadFileInput" style="display:none;" 
                                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar,.mp4">
                            <div class="fm-dropzone-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                                </svg>
                            </div>
                            <div class="fm-dropzone-text">${isAr ? 'اسحب الملف وأفلته هنا، أو اضغط لاختياره' : 'Drag & drop file here or click to browse'}</div>
                            <div class="fm-dropzone-sub">${isAr ? 'يدعم ملفات PDF، العروض التقديمية PowerPoint، مستندات Word، الملفات المضغوطة ZIP، ومقاطع الفيديو' : 'PDF, Word, PPTX, ZIP, MP4'}</div>
                        </div>

                        <!-- File preview -->
                        <div class="fm-file-preview" id="fmUploadFilePreview">
                            <div style="display:flex; align-items:center; gap:10px; overflow:hidden;">
                                <span style="font-weight:900; color:#1d4ed8; background:#eff6ff; padding:4px 8px; border-radius:6px;" id="fmUploadFileExt">FILE</span>
                                <span style="font-weight:700; color:#0f172a; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" id="fmUploadFileName">document.pdf</span>
                            </div>
                            <button type="button" id="fmRemoveUploadFileBtn" style="background:#fee2e2; border:none; color:#dc2626; border-radius:6px; padding:6px; cursor:pointer;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>

                        <!-- Progress container -->
                        <div class="fm-progress-container" id="fmUploadProgress">
                            <div class="fm-progress-header">
                                <span id="fmUploadProgressLabel">${isAr ? 'جاري الرفع...' : 'Uploading...'}</span>
                                <span id="fmUploadProgressPercent">0%</span>
                            </div>
                            <div class="fm-progress-bar-bg">
                                <div class="fm-progress-bar-fill" id="fmUploadProgressFill"></div>
                            </div>
                        </div>

                        <!-- Actions -->
                        <div class="fm-form-actions-row">
                            <button type="button" class="fm-cancel-btn" id="fmCancelUploadBtn">${isAr ? 'إلغاء' : 'Cancel'}</button>
                            <button type="submit" class="fm-submit-btn" id="fmUploadSubmitBtn">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                                </svg>
                                <span>${isAr ? 'رفع وحفظ المورد الآن' : 'Upload Resource'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <!-- ══════════════════════════════════════════════════
             MODAL 3: Share Link Modal
             ══════════════════════════════════════════════════ -->
        <div class="fm-modal-overlay" id="fmShareModal">
            <div class="fm-modal-card" style="max-width: 520px;">
                <button type="button" class="fm-modal-close-btn" id="fmCloseShareModalBtn">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                <div class="fm-modal-header">
                    <h3 style="margin:0 0 6px 0 !important;">${isAr ? 'مشاركة رابط المورد مع الطلاب' : 'Share Resource with Students'}</h3>
                    <p style="margin:0 !important; color:#64748b;">${isAr ? 'انسخ الرابط المباشر وأرسله في قنوات الدفعة أو المنصات ليتسنى للطلاب التحميل المباشر' : 'Direct student download link'}</p>
                </div>

                <div style="display:flex; gap:8px; margin-bottom:16px;">
                    <input type="text" id="fmShareUrlInput" class="fm-input" readonly style="direction:ltr; text-align:left;">
                    <button type="button" id="fmCopyShareBtn" class="fm-submit-btn" style="padding:10px 18px !important; flex-shrink:0;">
                        <span>${isAr ? 'نسخ' : 'Copy'}</span>
                    </button>
                </div>

                <div id="fmSharePreviewContent"></div>
            </div>
        </div>

        <!-- Floating Toast -->
        <div class="fm-toast" id="fmToast">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2.2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <span id="fmToastMsg"></span>
        </div>
    `;
}

/**
 * Bind Interactive Global Events
 */
function bindGlobalEvents() {
    const isAr = (localStorage.getItem('aitu_lang') || 'ar') === 'ar';
    const user = getCurrentUser();
    const isGuest = !user;
    const userDept = resolveUserDept(user);

    // 1. Academic Year Switcher
    const yearPills = document.querySelectorAll('.fm-year-pill');
    yearPills.forEach(pill => {
        pill.addEventListener('click', () => {
            yearPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            activeAcademicYear = pill.getAttribute('data-year');
            currentFolderId = null;
            folderNavigationStack = [];
            renderExplorer();
            showToast(isAr ? `تم التبديل إلى العام الأكاديمي ${activeAcademicYear}` : `Switched to Academic Year ${activeAcademicYear}`);
        });
    });

    // 2. Department Selector Cards
    const deptCards = document.querySelectorAll('.fm-dept-card');
    deptCards.forEach(card => {
        card.addEventListener('click', () => {
            const deptCode = card.getAttribute('data-dept');
            deptCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            activeDept = deptCode;
            currentFolderId = null;
            folderNavigationStack = [];
            renderExplorer();

            if (userDept && userDept !== 'ALL' && userDept !== deptCode) {
                showToast(isAr ? 'وضع المطالعة والاستعراض فقط (قسم خارج اختصاصك التدريسي)' : 'Read-only mode (outside your assigned department)');
            }
        });
    });

    // 3. Study Levels Switcher (الفرق الدراسية)
    const levelBtns = document.querySelectorAll('.fm-level-btn');
    levelBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            levelBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeLevel = Number(btn.getAttribute('data-level')) || 1;
            currentFolderId = null;
            folderNavigationStack = [];
            renderExplorer();
        });
    });

    // 4. Category Filter Pills inside explorer
    const catPills = document.querySelectorAll('.fm-cat-pill');
    catPills.forEach(pill => {
        pill.addEventListener('click', () => {
            catPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            currentCategoryFilter = pill.getAttribute('data-cat') || 'ALL';
            renderFilesGrid();
        });
    });

    // 5. Search Input
    const searchInput = document.getElementById('fmSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.trim().toLowerCase();
            renderFilesGrid();
            renderFoldersGrid();
        });
    }

    // 6. New Folder Modal Handlers
    const folderModal = document.getElementById('fmFolderModal');
    const closeFolderModalBtn = document.getElementById('fmCloseFolderModalBtn');
    const cancelFolderBtn = document.getElementById('fmCancelFolderBtn');
    const folderForm = document.getElementById('fmFolderForm');

    const openFolderModal = () => {
        if (!canEditCurrentLocation()) {
            showToast(isAr ? 'عفواً، إنشاء المجلدات متاح فقط لأعضاء هيئة التدريس في قسمهم المعتمد.' : 'Only faculty can create folders.', true);
            return;
        }
        if (folderModal) {
            folderModal.classList.add('active');
            const pathBadge = document.getElementById('fmFolderModalPath');
            if (pathBadge) pathBadge.textContent = getCurrentPathString();
            document.getElementById('fmFolderNameInput')?.focus();
        }
    };

    const closeFolderModal = () => {
        if (folderModal) folderModal.classList.remove('active');
        if (folderForm) folderForm.reset();
    };

    if (closeFolderModalBtn) closeFolderModalBtn.addEventListener('click', closeFolderModal);
    if (cancelFolderBtn) cancelFolderBtn.addEventListener('click', closeFolderModal);
    if (folderModal) {
        folderModal.addEventListener('click', (e) => {
            if (e.target === folderModal) closeFolderModal();
        });
    }

    if (folderForm) {
        folderForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleCreateFolderSubmit();
            closeFolderModal();
        });
    }

    // 7. Upload File Modal Handlers
    const uploadModal = document.getElementById('fmUploadModal');
    const closeUploadModalBtn = document.getElementById('fmCloseUploadModalBtn');
    const cancelUploadBtn = document.getElementById('fmCancelUploadBtn');
    const uploadForm = document.getElementById('fmUploadForm');
    const uploadDropzone = document.getElementById('fmUploadDropzone');
    const uploadFileInput = document.getElementById('fmUploadFileInput');
    const uploadPreviewBox = document.getElementById('fmUploadFilePreview');
    const removeUploadFileBtn = document.getElementById('fmRemoveUploadFileBtn');

    window.openUploadModal = () => {
        if (!canEditCurrentLocation()) {
            showToast(isAr ? 'عفواً، رفع الملفات متاح فقط لأعضاء هيئة التدريس في قسمهم المعتمد.' : 'Only faculty can upload files.', true);
            return;
        }
        if (uploadModal) {
            uploadModal.classList.add('active');
            const pathBadge = document.getElementById('fmUploadModalPath');
            if (pathBadge) pathBadge.textContent = getCurrentPathString();
            document.getElementById('fmUploadTitle')?.focus();
        }
    };

    const closeUploadModal = () => {
        if (uploadModal) uploadModal.classList.remove('active');
        if (uploadForm) uploadForm.reset();
        selectedUploadFile = null;
        if (uploadPreviewBox) uploadPreviewBox.classList.remove('active');
        if (uploadDropzone) uploadDropzone.style.display = 'block';
    };

    if (closeUploadModalBtn) closeUploadModalBtn.addEventListener('click', closeUploadModal);
    if (cancelUploadBtn) cancelUploadBtn.addEventListener('click', closeUploadModal);
    if (uploadModal) {
        uploadModal.addEventListener('click', (e) => {
            if (e.target === uploadModal) closeUploadModal();
        });
    }

    // Category picker buttons in upload modal
    const uploadTypeBtns = document.querySelectorAll('.fm-type-card-btn');
    const uploadCategoryInput = document.getElementById('fmUploadCategoryInput');
    const uploadDeadlineContainer = document.getElementById('fmUploadDeadlineContainer');

    uploadTypeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            uploadTypeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const type = btn.getAttribute('data-type');
            if (uploadCategoryInput) uploadCategoryInput.value = type;
            if (uploadDeadlineContainer) {
                uploadDeadlineContainer.style.display = type === 'ASSIGNMENT' ? 'block' : 'none';
            }
        });
    });

    // Dropzone logic
    if (uploadDropzone && uploadFileInput) {
        uploadDropzone.addEventListener('click', () => uploadFileInput.click());
        uploadDropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadDropzone.classList.add('dragover');
        });
        uploadDropzone.addEventListener('dragleave', () => uploadDropzone.classList.remove('dragover'));
        uploadDropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadDropzone.classList.remove('dragover');
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFilePicked(e.dataTransfer.files[0]);
            }
        });
        uploadFileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                handleFilePicked(e.target.files[0]);
            }
        });
    }

    function handleFilePicked(file) {
        selectedUploadFile = file;
        const ext = file.name.split('.').pop().toUpperCase();
        const extEl = document.getElementById('fmUploadFileExt');
        const nameEl = document.getElementById('fmUploadFileName');
        if (extEl) extEl.textContent = ext.substring(0, 4);
        if (nameEl) nameEl.textContent = file.name;

        if (uploadDropzone) uploadDropzone.style.display = 'none';
        if (uploadPreviewBox) uploadPreviewBox.classList.add('active');

        const titleInput = document.getElementById('fmUploadTitle');
        if (titleInput && !titleInput.value.trim()) {
            const raw = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
            titleInput.value = raw;
        }
    }

    if (removeUploadFileBtn) {
        removeUploadFileBtn.addEventListener('click', () => {
            selectedUploadFile = null;
            if (uploadFileInput) uploadFileInput.value = '';
            if (uploadPreviewBox) uploadPreviewBox.classList.remove('active');
            if (uploadDropzone) uploadDropzone.style.display = 'block';
        });
    }

    if (uploadForm) {
        uploadForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleUploadFileSubmit();
            closeUploadModal();
        });
    }

    // 8. Share Modal Handlers
    const shareModal = document.getElementById('fmShareModal');
    const closeShareModalBtn = document.getElementById('fmCloseShareModalBtn');
    const copyShareBtn = document.getElementById('fmCopyShareBtn');

    if (closeShareModalBtn && shareModal) {
        closeShareModalBtn.addEventListener('click', () => shareModal.classList.remove('active'));
        shareModal.addEventListener('click', (e) => {
            if (e.target === shareModal) shareModal.classList.remove('active');
        });
    }

    if (copyShareBtn) {
        copyShareBtn.addEventListener('click', () => {
            const input = document.getElementById('fmShareUrlInput');
            if (input && input.value) {
                navigator.clipboard.writeText(input.value).then(() => {
                    showToast(isAr ? 'تم نسخ الرابط المباشر بنجاح!' : 'Link copied!');
                });
            }
        });
    }

    // Global Escape Key to close modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeFolderModal();
            closeUploadModal();
            if (shareModal) shareModal.classList.remove('active');
        }
    });

    window.openNewFolderModal = openFolderModal;
}

/**
 * Check if the active user has editing permissions in current location
 */
function canEditCurrentLocation() {
    const user = getCurrentUser();
    if (!user) return false; // Guest / Student has no edit rights
    const role = (user.role || '').toLowerCase();
    if (role.includes('student') || role.includes('public')) return false; // Students have read-only access
    const userDept = resolveUserDept(user);
    if (!userDept) return false;
    if (userDept === 'ALL') return true; // Supervisor / Admin
    return userDept === activeDept; // Doctor / TA in their assigned department only
}

/**
 * Return current human-readable breadcrumb path
 */
function getCurrentPathString() {
    const deptObj = UNIVERSITY_DEPARTMENTS.find(d => d.code === activeDept);
    const levelObj = STUDY_LEVELS.find(l => l.level === activeLevel);
    let str = `${activeAcademicYear} > ${deptObj?.nameAr || activeDept} > ${levelObj?.titleAr || `الفرقة ${activeLevel}`}`;
    if (folderNavigationStack.length > 0) {
        str += ' > ' + folderNavigationStack.map(f => f.name).join(' > ');
    }
    return str;
}

/**
 * Load initial data from APIs and local mirrors
 */
async function loadInitialData() {
    // 1. Load courses
    try {
        const rawCourses = await courseService.getCourses();
        coursesList = Array.isArray(rawCourses) ? rawCourses : [];
    } catch (e) {
        console.warn('Courses fetch error:', e);
        coursesList = [];
    }

    // 2. Load Folders
    try {
        const rawFolders = await folderService.getFolders();
        const folders = Array.isArray(rawFolders) ? rawFolders : [];
        const localFoldersMeta = getLocalFoldersMeta();

        const rootDeptNames = ['Information Tech', 'Information Technology', 'Electrical Eng.', 'Mechanical Eng.', 'Design', 'General'];
        const validApiFolders = folders.filter(f => !f.isDepartment && !rootDeptNames.includes(f.name));

        allFolders = validApiFolders.map(f => {
            const meta = localFoldersMeta[f.id] || {};
            return {
                id: f.id,
                name: f.name,
                dept: f.dept || meta.dept || 'IT',
                parentFolderId: f.parentFolderId || meta.parentFolderId || null,
                level: meta.level || 1,
                academicYear: meta.academicYear || '2025/2026',
                category: meta.category || 'GENERAL',
                createdAt: f.createdAt ? f.createdAt.split('T')[0] : '2026-09-25'
            };
        });

        // Ensure we seed initial academic curriculum folders
        ensurePreseededFolders();
    } catch (e) {
        console.warn('Folders fetch fallback:', e);
        ensurePreseededFolders();
    }

    // 3. Load Files
    try {
        const rawFiles = await fileService.getFiles();
        const files = Array.isArray(rawFiles) ? rawFiles : [];
        const localFilesMeta = getLocalFilesMeta();

        allFiles = files.map(f => {
            const meta = localFilesMeta[f.id] || {};
            return {
                id: f.id,
                name: meta.title || f.name,
                size: formatFileSize(f.size),
                type: f.type,
                dept: f.dept || meta.dept || 'IT',
                level: meta.level || 1,
                academicYear: meta.academicYear || '2025/2026',
                folderId: f.folderId || meta.folderId || null,
                category: meta.category || 'LECTURE',
                instructor: meta.instructor || 'د. عضو هيئة تدريس',
                course: meta.course || f.course || 'مقرر دراسي',
                deadline: meta.deadline || null,
                notes: meta.notes || '',
                uploadedAt: meta.uploadedAt || (f.uploadedAt ? f.uploadedAt.split('T')[0] : '2026-09-28'),
                downloads: f.downloadCount || f.downloads || 0
            };
        });

        // Ensure we seed demo files so curriculum is rich
        ensurePreseededFiles();
    } catch (e) {
        console.warn('Files fetch fallback:', e);
        ensurePreseededFiles();
    }

    renderExplorer();
}

/**
 * Render the entire Explorer (Breadcrumbs, Toolbar, Folders, Files)
 */
function renderExplorer() {
    renderBreadcrumbs();
    renderToolbarActions();
    renderFoldersGrid();
    renderFilesGrid();
}

/**
 * Render Breadcrumb Path Bar
 */
function renderBreadcrumbs() {
    const bar = document.getElementById('fmBreadcrumbBar');
    if (!bar) return;
    const isAr = (localStorage.getItem('aitu_lang') || 'ar') === 'ar';

    const deptObj = UNIVERSITY_DEPARTMENTS.find(d => d.code === activeDept);
    const levelObj = STUDY_LEVELS.find(l => l.level === activeLevel);

    let html = `
        <button type="button" class="fm-crumb-item" id="crumbRoot">
            <span>📅 ${activeAcademicYear}</span>
        </button>
        <span class="fm-crumb-separator">/</span>

        <button type="button" class="fm-crumb-item" id="crumbDept">
            <span>🏛️ ${isAr ? deptObj?.nameAr : deptObj?.nameEn}</span>
        </button>
        <span class="fm-crumb-separator">/</span>

        <button type="button" class="fm-crumb-item ${folderNavigationStack.length === 0 ? 'current' : ''}" id="crumbLevel">
            <span>🎓 ${isAr ? levelObj?.titleAr : levelObj?.titleEn}</span>
        </button>
    `;

    folderNavigationStack.forEach((folder, idx) => {
        const isLast = idx === folderNavigationStack.length - 1;
        html += `
            <span class="fm-crumb-separator">/</span>
            <button type="button" class="fm-crumb-item ${isLast ? 'current' : ''}" data-folder-step="${idx}">
                <span>📁 ${escapeHTML(folder.name)}</span>
            </button>
        `;
    });

    bar.innerHTML = html;

    // Bind breadcrumbs events
    document.getElementById('crumbRoot')?.addEventListener('click', () => {
        if (currentFolderId !== null || folderNavigationStack.length > 0) {
            currentFolderId = null;
            folderNavigationStack = [];
            renderExplorer();
        }
    });

    document.getElementById('crumbDept')?.addEventListener('click', () => {
        if (currentFolderId !== null || folderNavigationStack.length > 0) {
            currentFolderId = null;
            folderNavigationStack = [];
            renderExplorer();
        }
    });

    document.getElementById('crumbLevel')?.addEventListener('click', () => {
        if (currentFolderId !== null || folderNavigationStack.length > 0) {
            currentFolderId = null;
            folderNavigationStack = [];
            renderExplorer();
        }
    });

    bar.querySelectorAll('[data-folder-step]').forEach(btn => {
        btn.addEventListener('click', () => {
            const stepIdx = Number(btn.getAttribute('data-folder-step'));
            if (stepIdx < folderNavigationStack.length - 1) {
                folderNavigationStack = folderNavigationStack.slice(0, stepIdx + 1);
                currentFolderId = folderNavigationStack[stepIdx].id;
                renderExplorer();
            }
        });
    });
}

/**
 * Render Toolbar Action Buttons based on User Permissions
 */
function renderToolbarActions() {
    const container = document.getElementById('fmToolbarActions');
    if (!container) return;
    const isAr = (localStorage.getItem('aitu_lang') || 'ar') === 'ar';

    const canEdit = canEditCurrentLocation();

    if (canEdit) {
        container.innerHTML = `
            <button type="button" class="fm-btn-new-folder" id="fmBtnNewFolder">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                    <line x1="12" y1="11" x2="12" y2="17"></line>
                    <line x1="9" y1="14" x2="15" y2="14"></line>
                </svg>
                <span>${isAr ? 'مجلد جديد' : 'New Folder'}</span>
            </button>

            <button type="button" class="fm-btn-upload-direct" id="fmBtnUploadDirect">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                </svg>
                <span>${isAr ? 'رفع ملف هنا' : 'Upload File Here'}</span>
            </button>
        `;

        document.getElementById('fmBtnNewFolder')?.addEventListener('click', () => {
            if (window.openNewFolderModal) window.openNewFolderModal();
        });

        document.getElementById('fmBtnUploadDirect')?.addEventListener('click', () => {
            if (window.openUploadModal) window.openUploadModal();
        });
    } else {
        const user = getCurrentUser();
        const msg = !user 
            ? (isAr ? '🎓 وضع الاطلاع والتحميل متاح لجميع الطلاب' : 'Student View: Download & Read-only')
            : (isAr ? '🔒 متاح للاطلاع فقط (قسم آخر)' : 'Read-only (Another department)');

        container.innerHTML = `
            <span style="font-size:0.84rem; font-weight:700; color:#64748b; background:#f8fafc; padding:8px 14px; border-radius:10px; border:1px solid #e2e8f0; display:inline-flex; align-items:center; gap:6px;">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <span>${msg}</span>
            </span>
        `;
    }
}

/**
 * Render Folders Grid in current path
 */
function renderFoldersGrid() {
    const grid = document.getElementById('fmFoldersGrid');
    const section = document.getElementById('fmFoldersSection');
    if (!grid) return;
    const isAr = (localStorage.getItem('aitu_lang') || 'ar') === 'ar';
    const canEdit = canEditCurrentLocation();

    // Filter folders that belong to current Academic Year, Dept, Level, and parentFolderId
    const currentFolders = allFolders.filter(f => {
        if (f.dept !== activeDept) return false;
        if (Number(f.level) !== Number(activeLevel)) return false;
        if (f.academicYear && f.academicYear !== activeAcademicYear) return false;
        
        // Parent folder match
        if (currentFolderId === null) {
            return f.parentFolderId === null || f.parentFolderId === 0;
        } else {
            return String(f.parentFolderId) === String(currentFolderId);
        }
    });

    // Apply search filter if any
    const filtered = currentFolders.filter(f => {
        if (!searchQuery) return true;
        return (f.name || '').toLowerCase().includes(searchQuery);
    });

    if (filtered.length === 0) {
        if (currentFolderId !== null) {
            // Inside a subfolder and no more subfolders
            section.style.display = 'none';
        } else {
            section.style.display = 'block';
            grid.innerHTML = `
                <div style="grid-column: 1 / -1; padding: 18px; text-align: center; color: #64748b; font-size: 0.88rem; background: #f8fafc; border-radius: 12px; border: 1px dashed #cbd5e1;">
                    ${canEdit 
                        ? (isAr ? 'لا توجد مجلدات بعد. اضغط على «مجلد جديد» لإنشاء مجلد وتصنيف المحاضرات.' : 'No folders yet. Click "New Folder" to create one.')
                        : (isAr ? 'لا توجد مجلدات إضافية في هذا المسار.' : 'No folders available.')
                    }
                </div>
            `;
        }
        return;
    }

    section.style.display = 'block';

    grid.innerHTML = filtered.map(folder => {
        // Count files inside this folder
        const filesCount = allFiles.filter(f => String(f.folderId) === String(folder.id)).length;
        const countText = isAr ? `${filesCount} ملفات` : `${filesCount} files`;

        return `
            <div class="fm-folder-card" data-folder-id="${folder.id}">
                <div class="fm-folder-left">
                    <div class="fm-folder-icon-box">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                        </svg>
                    </div>
                    <div class="fm-folder-details">
                        <span class="fm-folder-name" title="${escapeHTML(folder.name)}">${escapeHTML(folder.name)}</span>
                        <span class="fm-folder-meta">${countText} • ${folder.createdAt || '2026-09'}</span>
                    </div>
                </div>

                ${canEdit ? `
                    <button type="button" class="fm-folder-delete-btn" data-delete-folder="${folder.id}" title="${isAr ? 'حذف المجلد' : 'Delete folder'}">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                ` : ''}
            </div>
        `;
    }).join('');

    // Clicking a folder enters inside it!
    grid.querySelectorAll('.fm-folder-card').forEach(card => {
        card.addEventListener('click', (e) => {
            // Avoid entering if delete was clicked
            if (e.target.closest('[data-delete-folder]')) return;
            const folderId = card.getAttribute('data-folder-id');
            const folderObj = allFolders.find(f => String(f.id) === String(folderId));
            if (!folderObj) return;

            currentFolderId = folderObj.id;
            folderNavigationStack.push({ id: folderObj.id, name: folderObj.name });
            renderExplorer();
        });
    });

    // Delete folder
    if (canEdit) {
        grid.querySelectorAll('[data-delete-folder]').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const folderId = btn.getAttribute('data-delete-folder');
                await handleDeleteFolder(folderId);
            });
        });
    }
}

/**
 * Render Files Grid in current path
 */
function renderFilesGrid() {
    const grid = document.getElementById('fmFilesGrid');
    if (!grid) return;
    const isAr = (localStorage.getItem('aitu_lang') || 'ar') === 'ar';
    const canEdit = canEditCurrentLocation();

    // Filter files in this location
    const currentFiles = allFiles.filter(f => {
        if (f.dept !== activeDept) return false;
        if (Number(f.level) !== Number(activeLevel)) return false;
        if (f.academicYear && f.academicYear !== activeAcademicYear) return false;

        // Folder matching
        if (currentFolderId === null) {
            return f.folderId === null || f.folderId === 0 || f.folderId === undefined;
        } else {
            return String(f.folderId) === String(currentFolderId);
        }
    });

    // Category filter
    const catFiltered = currentFiles.filter(f => {
        if (currentCategoryFilter === 'ALL') return true;
        return f.category === currentCategoryFilter;
    });

    // Search query filter
    const filtered = catFiltered.filter(f => {
        if (!searchQuery) return true;
        const matchName = (f.name || '').toLowerCase().includes(searchQuery);
        const matchCourse = (f.course || '').toLowerCase().includes(searchQuery);
        const matchInstructor = (f.instructor || '').toLowerCase().includes(searchQuery);
        return matchName || matchCourse || matchInstructor;
    });

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="fm-empty-box">
                <div class="fm-empty-box-icon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                </div>
                <h4>${isAr ? 'لا توجد ملفات في هذا المسار حالياً' : 'No files found'}</h4>
                <p>${isAr ? 'يمكن لأعضاء هيئة التدريس رفع وتوثيق المحاضرات والشيتات والكتب في هذا المسار عبر زر «رفع ملف هنا».' : 'Faculty members can upload slides and coursework here.'}</p>
                ${canEdit ? `
                    <button type="button" class="fm-btn-upload-direct" onclick="window.openUploadModal()" style="display:inline-flex;">
                        <span>+ ${isAr ? 'رفع أول ملف هنا' : 'Upload First File'}</span>
                    </button>
                ` : ''}
            </div>
        `;
        return;
    }

    const categoryLabels = {
        LECTURE: { ar: 'محاضرة وماتريال', en: 'Lecture', class: 'LECTURE' },
        ASSIGNMENT: { ar: 'شيت تكليف وواجب', en: 'Assignment', class: 'ASSIGNMENT' },
        BOOK: { ar: 'كتاب ومرجع علمي', en: 'Textbook', class: 'BOOK' },
        LAB: { ar: 'سكشن ودليل عملي', en: 'Lab Manual', class: 'LAB' }
    };

    grid.innerHTML = filtered.map(item => {
        const cat = categoryLabels[item.category] || categoryLabels.LECTURE;
        const ext = (item.name || '').split('.').pop().toUpperCase().substring(0, 4) || 'FILE';

        return `
            <div class="fm-resource-card" data-file-id="${item.id}">
                <div>
                    <div class="fm-card-top">
                        <span class="fm-card-category-pill ${cat.class}">
                            <span>${isAr ? cat.ar : cat.en}</span>
                        </span>
                        <span class="fm-card-ext-badge">${ext}</span>
                    </div>

                    <h4 class="fm-card-title">${escapeHTML(item.name)}</h4>

                    <div class="fm-card-tags">
                        <span class="fm-card-tag">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                            </svg>
                            <span>${escapeHTML(item.course || 'مقرر دراسي')}</span>
                        </span>

                        <span class="fm-card-tag">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            <span>${escapeHTML(item.instructor || 'أستاذ المادة')}</span>
                        </span>
                    </div>

                    ${item.deadline ? `
                        <div class="fm-card-deadline-box">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            <span>${isAr ? `موعد التسليم: ${item.deadline}` : `Deadline: ${item.deadline}`}</span>
                        </div>
                    ` : ''}

                    ${item.notes ? `
                        <div class="fm-card-notes-box">
                            <span>💡 ${escapeHTML(item.notes)}</span>
                        </div>
                    ` : ''}

                    <div class="fm-card-meta">
                        <span>📅 ${item.uploadedAt}</span>
                        <span>💾 ${item.size}</span>
                    </div>
                </div>

                <div class="fm-card-actions">
                    <button type="button" class="fm-btn-action download" data-action="download" data-id="${item.id}" data-name="${escapeHTML(item.name)}">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                        </svg>
                        <span>${isAr ? 'تحميل' : 'Download'}</span>
                    </button>

                    <button type="button" class="fm-btn-action share" data-action="share" data-id="${item.id}" title="${isAr ? 'مشاركة رابط مباشر' : 'Share'}">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                            <polyline points="16 6 12 2 8 6"/>
                            <line x1="12" y1="2" x2="12" y2="15"/>
                        </svg>
                        <span>${isAr ? 'مشاركة' : 'Share'}</span>
                    </button>

                    ${canEdit ? `
                        <button type="button" class="fm-btn-action delete" data-action="delete" data-id="${item.id}" title="${isAr ? 'حذف الملف' : 'Delete'}">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');

    // Bind action buttons
    grid.querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const action = btn.getAttribute('data-action');
            const fileId = btn.getAttribute('data-id');
            const item = allFiles.find(f => String(f.id) === String(fileId));
            if (!item) return;

            if (action === 'download') {
                handleDownloadFile(item);
            } else if (action === 'share') {
                handleShareModal(item);
            } else if (action === 'delete') {
                handleDeleteFile(item);
            }
        });
    });
}

/**
 * Handle Folder Creation
 */
async function handleCreateFolderSubmit() {
    const isAr = (localStorage.getItem('aitu_lang') || 'ar') === 'ar';
    const nameInput = document.getElementById('fmFolderNameInput');
    const categorySelect = document.getElementById('fmFolderCategorySelect');

    const folderName = nameInput?.value.trim();
    if (!folderName) return;

    const category = categorySelect?.value || 'GENERAL';

    try {
        const meta = {
            dept: activeDept,
            level: activeLevel,
            academicYear: activeAcademicYear,
            category: category,
            parentFolderId: currentFolderId
        };

        const res = await folderService.createFolder(folderName, currentFolderId, meta);
        const newFolderId = res?.id || Date.now();

        // Save metadata locally
        const localFoldersMeta = getLocalFoldersMeta();
        localFoldersMeta[newFolderId] = meta;
        saveLocalFoldersMeta(localFoldersMeta);

        const newFolder = {
            id: newFolderId,
            name: folderName,
            dept: activeDept,
            parentFolderId: currentFolderId,
            level: activeLevel,
            academicYear: activeAcademicYear,
            category: category,
            createdAt: new Date().toISOString().split('T')[0]
        };

        allFolders.unshift(newFolder);
        // Automatically enter into newly created folder as requested ("والفولدر لما اعمله ادخل عليه و هاكذا")
        currentFolderId = newFolder.id;
        folderNavigationStack.push({ id: newFolder.id, name: newFolder.name });
        renderExplorer();
        showToast(isAr ? `تم إنشاء المجلد «${folderName}» والدخول إليه مباشرة!` : `Folder "${folderName}" created and opened!`);
    } catch (err) {
        console.error('Create folder error:', err);
        showToast((isAr ? 'حدث خطأ أثناء إنشاء المجلد: ' : 'Error creating folder: ') + err.message, true);
    }
}

/**
 * Handle Delete Folder
 */
async function handleDeleteFolder(folderId) {
    const isAr = (localStorage.getItem('aitu_lang') || 'ar') === 'ar';
    const folder = allFolders.find(f => String(f.id) === String(folderId));
    if (!folder) return;

    if (!confirm(isAr ? `هل أنت متأكد من حذف المجلد «${folder.name}»؟` : `Delete folder "${folder.name}"?`)) return;

    try {
        await folderService.deleteFolder(folderId);
        allFolders = allFolders.filter(f => String(f.id) !== String(folderId));
        renderFoldersGrid();
        showToast(isAr ? 'تم حذف المجلد بنجاح.' : 'Folder deleted.');
    } catch (err) {
        alert(isAr ? 'تعذر حذف المجلد: ' + err.message : 'Error deleting folder');
    }
}

/**
 * Handle File Upload Submission
 */
async function handleUploadFileSubmit() {
    const isAr = (localStorage.getItem('aitu_lang') || 'ar') === 'ar';
    const titleInput = document.getElementById('fmUploadTitle');
    const courseInput = document.getElementById('fmUploadCourse');
    const instructorInput = document.getElementById('fmUploadInstructor');
    const categoryInput = document.getElementById('fmUploadCategoryInput');
    const deadlineInput = document.getElementById('fmUploadDeadline');
    const notesInput = document.getElementById('fmUploadNotes');

    if (!selectedUploadFile) {
        alert(isAr ? 'يرجى اختيار الملف المراد رفعه أولاً.' : 'Please select a file.');
        return;
    }

    const title = titleInput?.value.trim() || selectedUploadFile.name;
    const course = courseInput?.value.trim() || (isAr ? 'مقرر دراسي عام' : 'General Course');
    const instructor = instructorInput?.value.trim() || (isAr ? 'عضو هيئة تدريس' : 'Faculty');
    const category = categoryInput?.value || 'LECTURE';
    const deadline = category === 'ASSIGNMENT' ? deadlineInput?.value : null;
    const notes = notesInput?.value.trim() || '';

    // Show progress
    const progressContainer = document.getElementById('fmUploadProgress');
    const progressFill = document.getElementById('fmUploadProgressFill');
    const progressPercent = document.getElementById('fmUploadProgressPercent');
    const progressLabel = document.getElementById('fmUploadProgressLabel');
    const submitBtn = document.getElementById('fmUploadSubmitBtn');

    if (progressContainer) progressContainer.classList.add('active');
    if (submitBtn) submitBtn.disabled = true;

    try {
        const formData = new FormData();
        formData.append('file', selectedUploadFile);

        const uploadParams = {
            folderId: currentFolderId || 0,
            type: category,
            dept: activeDept,
            customName: title
        };

        const result = await fileService.uploadFileWithProgress(formData, uploadParams, (percent) => {
            if (progressFill) progressFill.style.width = `${percent}%`;
            if (progressPercent) progressPercent.textContent = `${percent}%`;
            if (progressLabel) progressLabel.textContent = isAr ? `جاري الرفع (${percent}%)...` : `Uploading (${percent}%)...`;
        });

        const newFileId = result.id || Date.now();
        const uploadDate = new Date().toISOString().split('T')[0];

        // Save rich metadata locally
        const localFilesMeta = getLocalFilesMeta();
        localFilesMeta[newFileId] = {
            title,
            course,
            instructor,
            category,
            deadline,
            notes,
            dept: activeDept,
            level: activeLevel,
            academicYear: activeAcademicYear,
            folderId: currentFolderId,
            uploadedAt: uploadDate
        };
        saveLocalFilesMeta(localFilesMeta);

        const newFile = {
            id: newFileId,
            name: title,
            size: formatFileSize(selectedUploadFile.size),
            type: selectedUploadFile.name.split('.').pop().toUpperCase(),
            dept: activeDept,
            level: activeLevel,
            academicYear: activeAcademicYear,
            folderId: currentFolderId,
            category,
            instructor,
            course,
            deadline,
            notes,
            uploadedAt: uploadDate,
            downloads: 0
        };

        allFiles.unshift(newFile);
        renderFilesGrid();
        showToast(isAr ? 'تم رفع وإتاحة الملف الأكاديمي بنجاح!' : 'File uploaded successfully!');
    } catch (err) {
        console.error('File upload error:', err);
        alert(isAr ? 'حدث خطأ أثناء رفع الملف: ' + err.message : 'Upload error: ' + err.message);
    } finally {
        if (progressContainer) progressContainer.classList.remove('active');
        if (submitBtn) submitBtn.disabled = false;
        if (progressFill) progressFill.style.width = '0%';
    }
}

/**
 * Handle Download File
 */
function handleDownloadFile(item) {
    const isAr = (localStorage.getItem('aitu_lang') || 'ar') === 'ar';
    const downloadUrl = `${BASE_URL}/api/Files/download/${item.id}`;
    showToast(isAr ? 'جاري بدء تحميل الملف الأكاديمي...' : 'Starting download...');
    window.location.href = downloadUrl;
}

/**
 * Handle Share Modal
 */
function handleShareModal(item) {
    const modal = document.getElementById('fmShareModal');
    const input = document.getElementById('fmShareUrlInput');
    const content = document.getElementById('fmSharePreviewContent');
    if (!modal || !input) return;

    const directUrl = `${window.location.origin}/faculty-materials.html?year=${encodeURIComponent(activeAcademicYear)}&dept=${item.dept}&level=${item.level}&search=${encodeURIComponent(item.name)}`;
    input.value = directUrl;

    if (content) {
        content.innerHTML = `
            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:14px; padding:16px;">
                <div style="font-weight:800; font-size:1rem; color:#0f172a; margin-bottom:4px;">${escapeHTML(item.name)}</div>
                <div style="font-size:0.82rem; color:#64748b; margin-bottom:8px;">${item.course} • القائم بالتدريس: ${item.instructor}</div>
                <div style="font-size:0.78rem; color:#1d4ed8; font-weight:700;">📂 المسار: ${getCurrentPathString()}</div>
            </div>
        `;
    }

    modal.classList.add('active');
}

/**
 * Handle Delete File
 */
async function handleDeleteFile(item) {
    const isAr = (localStorage.getItem('aitu_lang') || 'ar') === 'ar';
    if (!confirm(isAr ? `هل أنت متأكد من حذف الملف «${item.name}»؟` : `Delete file "${item.name}"?`)) return;

    try {
        await fileService.deleteFile(item.id);
        allFiles = allFiles.filter(f => String(f.id) !== String(item.id));
        renderFilesGrid();
        showToast(isAr ? 'تم حذف الملف بنجاح.' : 'File deleted.');
    } catch (err) {
        alert(isAr ? 'تعذر حذف الملف: ' + err.message : 'Error deleting file');
    }
}

/**
 * Show Toast Alert
 */
function showToast(msg, isError = false) {
    const toast = document.getElementById('fmToast');
    const msgEl = document.getElementById('fmToastMsg');
    if (!toast || !msgEl) return;

    msgEl.textContent = msg;
    toast.style.background = isError ? '#dc2626' : '#0f172a';
    toast.classList.add('active');

    setTimeout(() => {
        toast.classList.remove('active');
    }, 3500);
}

/**
 * Local Mirror Storage Helpers
 */
function getLocalFoldersMeta() {
    try { return JSON.parse(localStorage.getItem('aitu_faculty_folders_meta') || '{}'); } catch { return {}; }
}
function saveLocalFoldersMeta(d) {
    try { localStorage.setItem('aitu_faculty_folders_meta', JSON.stringify(d)); } catch (e) {}
}

function getLocalFilesMeta() {
    try { return JSON.parse(localStorage.getItem('aitu_faculty_files_meta') || '{}'); } catch { return {}; }
}
function saveLocalFilesMeta(d) {
    try { localStorage.setItem('aitu_faculty_files_meta', JSON.stringify(d)); } catch (e) {}
}

/**
 * Seed initial academic curriculum folders so the system feels complete immediately
 */
function ensurePreseededFolders() {
    const preseeded = [
        // Level 1 - IT (2025/2026)
        { id: 101, name: 'محاضرات وسلايدات البرمجة الهيكلية C++', dept: 'IT', level: 1, academicYear: '2025/2026', parentFolderId: null, category: 'LECTURE', createdAt: '2026-09-20' },
        { id: 102, name: 'شيتات وتمارين الرياضيات والفيزياء', dept: 'IT', level: 1, academicYear: '2025/2026', parentFolderId: null, category: 'ASSIGNMENT', createdAt: '2026-09-22' },
        { id: 103, name: 'أدلة وتجارب معامل الحاسب الآلي', dept: 'IT', level: 1, academicYear: '2025/2026', parentFolderId: null, category: 'LAB', createdAt: '2026-09-24' },
        { id: 104, name: 'الكتب والمراجع الأكاديمية المعتمدة', dept: 'IT', level: 1, academicYear: '2025/2026', parentFolderId: null, category: 'BOOK', createdAt: '2026-09-25' },

        // Level 2 - IT (2025/2026)
        { id: 201, name: 'محاضرات هياكل البيانات والخوارزميات', dept: 'IT', level: 2, academicYear: '2025/2026', parentFolderId: null, category: 'LECTURE', createdAt: '2026-09-21' },
        { id: 202, name: 'تكليفات ومشاريع قواعد البيانات SQL', dept: 'IT', level: 2, academicYear: '2025/2026', parentFolderId: null, category: 'ASSIGNMENT', createdAt: '2026-09-23' },
        { id: 203, name: 'تجارب معمل شبكات الحاسب والربط السحابي', dept: 'IT', level: 2, academicYear: '2025/2026', parentFolderId: null, category: 'LAB', createdAt: '2026-09-24' },

        // Level 3 - IT (2025/2026)
        { id: 211, name: 'محاضرات أمن المعلومات والأمن السيبراني', dept: 'IT', level: 3, academicYear: '2025/2026', parentFolderId: null, category: 'LECTURE', createdAt: '2026-09-22' },
        { id: 212, name: 'مشاريع تطوير تطبيقات الويب والنظم الموزعة', dept: 'IT', level: 3, academicYear: '2025/2026', parentFolderId: null, category: 'ASSIGNMENT', createdAt: '2026-09-23' },

        // Level 4 - IT (2025/2026)
        { id: 221, name: 'نماذج ووثائق مشاريع التخرج Graduation Projects', dept: 'IT', level: 4, academicYear: '2025/2026', parentFolderId: null, category: 'GENERAL', createdAt: '2026-09-20' },
        { id: 222, name: 'محاضرات الذكاء الاصطناعي وتعلم الآلة AI/ML', dept: 'IT', level: 4, academicYear: '2025/2026', parentFolderId: null, category: 'LECTURE', createdAt: '2026-09-21' },

        // Level 1 - EL (2025/2026)
        { id: 301, name: 'محاضرات الدوائر الكهربائية والإلكترونية', dept: 'EL', level: 1, academicYear: '2025/2026', parentFolderId: null, category: 'LECTURE', createdAt: '2026-09-21' },
        { id: 302, name: 'دليل التجارب المعملية وأجهزة القياس', dept: 'EL', level: 1, academicYear: '2025/2026', parentFolderId: null, category: 'LAB', createdAt: '2026-09-22' },
        { id: 303, name: 'الكتب والمراجع المعتمدة للهندسة الكهربائية', dept: 'EL', level: 1, academicYear: '2025/2026', parentFolderId: null, category: 'BOOK', createdAt: '2026-09-23' },

        // Level 2 - EL (2025/2026)
        { id: 311, name: 'محاضرات الأنظمة المدمجة والمتحكمات الدقيقة', dept: 'EL', level: 2, academicYear: '2025/2026', parentFolderId: null, category: 'LECTURE', createdAt: '2026-09-22' },
        { id: 312, name: 'شيتات وتطبيقات الطاقة والقوى الكهربائية', dept: 'EL', level: 2, academicYear: '2025/2026', parentFolderId: null, category: 'ASSIGNMENT', createdAt: '2026-09-24' },

        // Level 1 - ME (2025/2026)
        { id: 401, name: 'مبادئ الميكانيكا الهندسية والديناميكا', dept: 'ME', level: 1, academicYear: '2025/2026', parentFolderId: null, category: 'LECTURE', createdAt: '2026-09-21' },
        { id: 402, name: 'شيتات ورسومات الرسم الهندسي والـ CAD', dept: 'ME', level: 1, academicYear: '2025/2026', parentFolderId: null, category: 'ASSIGNMENT', createdAt: '2026-09-23' },
        { id: 403, name: 'دليل ورش التصنيع والتشغيل والأوتوترونكس', dept: 'ME', level: 1, academicYear: '2025/2026', parentFolderId: null, category: 'LAB', createdAt: '2026-09-24' },

        // Level 1 - DESIGN (2025/2026)
        { id: 501, name: 'محاضرات التصميم الصناعي وتكنولوجيا الخامات', dept: 'DESIGN', level: 1, academicYear: '2025/2026', parentFolderId: null, category: 'LECTURE', createdAt: '2026-09-22' },
        { id: 502, name: 'أدلة معامل تشريح وتصميم الأجهزة التعويضية', dept: 'DESIGN', level: 1, academicYear: '2025/2026', parentFolderId: null, category: 'LAB', createdAt: '2026-09-24' },

        // Past Academic Year: 2024/2025
        { id: 601, name: 'أرشيف مقررات ومحاضرات 2024/2025 كاملة', dept: 'IT', level: 1, academicYear: '2024/2025', parentFolderId: null, category: 'GENERAL', createdAt: '2025-06-15' },
        { id: 602, name: 'نماذج امتحانات وتكليفات سابقة 2024/2025', dept: 'IT', level: 1, academicYear: '2024/2025', parentFolderId: null, category: 'ASSIGNMENT', createdAt: '2025-06-20' },

        // Past Academic Year: 2023/2024
        { id: 701, name: 'أرشيف بنك الأسئلة والامتحانات المعتمدة 2023/2024', dept: 'IT', level: 1, academicYear: '2023/2024', parentFolderId: null, category: 'BOOK', createdAt: '2024-06-10' }
    ];

    preseeded.forEach(pf => {
        if (!allFolders.some(f => String(f.id) === String(pf.id))) {
            allFolders.push(pf);
        }
    });
}

/**
 * Seed initial academic curriculum files
 */
function ensurePreseededFiles() {
    const preseeded = [
        {
            id: 901,
            name: 'المحاضرة 01 - مقدمة في لغة البرمجة C++ وبيئة العمل',
            size: '3.40 MB',
            type: 'PDF',
            dept: 'IT',
            level: 1,
            academicYear: '2025/2026',
            folderId: 101,
            category: 'LECTURE',
            instructor: 'د. محمد عبد الرحمن',
            course: 'مقدمة في البرمجة',
            deadline: null,
            notes: 'يرجى تثبيت بيئة Code::Blocks أو VS Code قبل المحاضرة القادمة.',
            uploadedAt: '2026-09-26',
            downloads: 48
        },
        {
            id: 902,
            name: 'شيت التكليف العملي 01 - التعبيرات والعمليات المنطقية',
            size: '1.10 MB',
            type: 'PDF',
            dept: 'IT',
            level: 1,
            academicYear: '2025/2026',
            folderId: 102,
            category: 'ASSIGNMENT',
            instructor: 'م. أحمد خالد',
            course: 'مقدمة في البرمجة',
            deadline: '2026-10-15',
            notes: 'التسليم بصيغة ملف مضغوط يتضمن الأكواد المصدرية المصحوبة بالتقرير.',
            uploadedAt: '2026-09-27',
            downloads: 36
        },
        {
            id: 903,
            name: 'المرجع الشامل في الدوائر الكهربائية وتحليل الشبكات',
            size: '14.80 MB',
            type: 'PDF',
            dept: 'EL',
            level: 1,
            academicYear: '2025/2026',
            folderId: 301,
            category: 'BOOK',
            instructor: 'أ.د. محمود الشريف',
            course: 'دوائر كهربائية 1',
            deadline: null,
            notes: 'المرجع الرسمي المعتمد للفصل الدراسي الأول.',
            uploadedAt: '2026-09-28',
            downloads: 55
        },
        {
            id: 904,
            name: 'دليل تجارب ورشة قياسات وأجهزة تشخيص أعطال السيارات',
            size: '5.60 MB',
            type: 'PDF',
            dept: 'ME',
            level: 1,
            academicYear: '2025/2026',
            folderId: 401,
            category: 'LAB',
            instructor: 'م. حسن البدري',
            course: 'ميكانيكا السيارات',
            deadline: null,
            notes: 'إحضار البالطو ومهمات السلامة إلزامي في المعمل.',
            uploadedAt: '2026-09-29',
            downloads: 29
        },
        {
            id: 905,
            name: 'سلايدات محاضرة 02 - هياكل البيانات المتقدمة والأشجار الثنائية',
            size: '4.20 MB',
            type: 'PPTX',
            dept: 'IT',
            level: 2,
            academicYear: '2025/2026',
            folderId: 201,
            category: 'LECTURE',
            instructor: 'د. سارة عثمان',
            course: 'هياكل البيانات',
            deadline: null,
            notes: 'شرح مفصل لخوارزميات الترتيب والبحث في الـ Binary Trees.',
            uploadedAt: '2026-09-28',
            downloads: 42
        },
        {
            id: 906,
            name: 'كتاب ومواصفات خامات الأجهزة التعويضية والأطراف الصناعية',
            size: '18.10 MB',
            type: 'PDF',
            dept: 'DESIGN',
            level: 1,
            academicYear: '2025/2026',
            folderId: 501,
            category: 'BOOK',
            instructor: 'د. عماد النجار',
            course: 'تكنولوجيا الأطراف الصناعية',
            deadline: null,
            notes: 'الملف المعتمد لتوصيف خامات الكربون فايبر والسيليكون الطبي.',
            uploadedAt: '2026-09-29',
            downloads: 18
        },
        {
            id: 907,
            name: 'أرشيف امتحانات السنوات السابقة لمادة البرمجة 2024/2025',
            size: '8.50 MB',
            type: 'PDF',
            dept: 'IT',
            level: 1,
            academicYear: '2024/2025',
            folderId: 602,
            category: 'ASSIGNMENT',
            instructor: 'د. محمد عبد الرحمن',
            course: 'مقدمة في البرمجة',
            deadline: null,
            notes: 'مجموعة نماذج امتحانات الميدترم والفاينل مع الإجابات النموذجية.',
            uploadedAt: '2025-06-25',
            downloads: 112
        }
    ];

    preseeded.forEach(pf => {
        if (!allFiles.some(f => String(f.id) === String(pf.id))) {
            allFiles.push(pf);
        }
    });
}

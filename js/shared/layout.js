// js/shared/layout.js
import { getCurrentUser, logout } from './auth.js';
import { fileService } from './services.js';
import { getCurrentLang, toggleLanguage, translations } from './jssharedi18n.js';

/**
 * Ensures the app-shell.css is loaded
 */
function ensureShellStyles() {
    if (!document.querySelector('link[href*="app-shell.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'css/app-shell.css';
        document.head.appendChild(link);
    }
}

/**
 * Standard role label helper
 */
export function getRoleLabel(role, lang = 'ar') {
    const r = String(role || '').trim();
    const map = {
        Supervisor: { ar: 'مشرف النظام', en: 'System Supervisor' },
        'IT Manager': { ar: 'مدير قسم IT', en: 'IT Manager' },
        'EL Manager': { ar: 'مدير قسم الكترونيات', en: 'Electrical Manager' },
        'Mechanical Manager': { ar: 'مدير قسم ميكانيكا', en: 'Mechanical Manager' },
        'Public User': { ar: 'مستخدم عام', en: 'Public User' },
        Employee: { ar: 'موظف', en: 'Staff' },
        Student: { ar: 'طالب', en: 'Student' },
    };
    if (map[r]) return map[r][lang] || map[r].ar;
    if (/\s+Manager$/i.test(r)) {
        return lang === 'ar' ? `مدير قسم (${r.replace(/\s+Manager$/i, '')})` : r;
    }
    return r || (lang === 'ar' ? 'مستخدم' : 'User');
}

/**
 * Renders or updates the Unified App Shell layout.
 * Ensures the shell is mounted ONCE (fixed base) while pages change dynamically.
 */
export function renderLayout(activePage = 'repository') {
    ensureShellStyles();

    const appContainer = document.getElementById('app');
    if (!appContainer) return;

    const user = getCurrentUser();
    const lang = localStorage.getItem('aitu_lang') || 'ar';
    const isAr = lang === 'ar';

    // Apply language direction
    document.documentElement.dir = isAr ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;

    // Translation helper
    const t = (key) => (translations[lang] || translations.en)[key] || (translations.en)[key] || key;

    // Permissions
    const isSupervisor = user && user.role === 'Supervisor';
    const isPublicUser = !user || user.role === 'Public User';
    const isManager = user && (user.role.includes('Manager') || isSupervisor);

    // If shell is already in DOM, simply update the active button and return!
    const existingShell = document.getElementById('appShellRoot');
    if (existingShell) {
        updateActiveNavState(activePage);
        return;
    }

    const rawUserDisplayName = user ? (user.name || user.username) : (isAr ? 'زائر' : 'Guest');
    const userDisplayName = String(rawUserDisplayName || '').includes('@') ? String(rawUserDisplayName).split('@')[0] : rawUserDisplayName;
    const userRoleLabel = getRoleLabel(user?.role, lang);

    // Build sidebar navigation items based on permissions
    const navItems = [];

    if (isManager) {
        navItems.push({
            id: 'dashboard',
            href: 'dashboard.html',
            label: isAr ? 'لوحة التحكم' : 'Dashboard',
            icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
            </svg>`
        });
    }

    navItems.push({
        id: 'repository',
        href: 'repository.html',
        label: isAr ? 'المستودع الأكاديمي' : 'Academic Repository',
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>`
    });

    navItems.push({
        id: 'courses',
        href: 'courses.html',
        label: isAr ? 'المقررات الدراسية' : 'Courses',
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
        </svg>`
    });

    if (isSupervisor) {
        navItems.push({
            id: 'users',
            href: 'users.html',
            label: isAr ? 'إدارة المستخدمين' : 'Users Management',
            icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>`
        });
        navItems.push({
            id: 'logs',
            href: 'logs.html',
            label: isAr ? 'سجل العمليات' : 'Audit Logs',
            icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><polyline points="9 12 11 14 15 10"/>
            </svg>`
        });
    }

    if (!isPublicUser) {
        navItems.push({
            id: 'profile',
            href: 'profile.html',
            label: isAr ? 'الملف الشخصي' : 'My Profile',
            icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>`
        });
    }

    const navButtonsHTML = navItems.map(item => {
        const isActive = item.id === activePage;
        return `
            <button 
                class="nav-link-btn ${isActive ? 'active' : ''}" 
                data-page="${item.id}"
                data-href="${item.href}"
                title="${item.label}"
            >
                <span class="nav-icon">${item.icon}</span>
                <span class="nav-label">${item.label}</span>
            </button>
        `;
    }).join('');

    const layoutHTML = `
        <div class="app" id="appShellRoot">
            <!-- 1. Unified Sticky App Header -->
            <header class="app-header">
                <!-- Dark Navy Strip (hdr-top) -->
                <div class="hdr-top">
                    <span class="hdr-top-left">
                        <span>🏛️</span>
                        <span><span style="color:#ffffff;">KERNEL</span> <span style="color:#60a5fa;">PANIC</span></span>
                    </span>

                    <div class="hdr-top-right">
                        ${user ? `
                            <span class="hdr-top-user">
                                <span>${userDisplayName}</span>
                                <span>•</span>
                                <span class="hdr-top-role">${userRoleLabel}</span>
                            </span>
                            <div class="hdr-top-sep"></div>
                        ` : ''}

                        <button class="hdr-top-btn" id="shellLangBtn" title="${isAr ? 'Switch to English' : 'التحويل للعربية'}">
                            🌐 ${isAr ? 'English' : 'عربي'}
                        </button>

                        ${user ? `
                            <div class="hdr-top-sep"></div>
                            <button class="hdr-top-logout" id="shellLogoutBtn" title="${isAr ? 'تسجيل الخروج' : 'Logout'}">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                    <polyline points="16 17 21 12 16 7" />
                                    <line x1="21" y1="12" x2="9" y2="12" />
                                </svg>
                                <span>${isAr ? 'خروج' : 'Logout'}</span>
                            </button>
                        ` : `
                            <div class="hdr-top-sep"></div>
                            <button class="hdr-top-btn" onclick="window.location.href='login.html'">
                                <span>${isAr ? 'تسجيل الدخول' : 'Login'}</span>
                            </button>
                        `}
                    </div>
                </div>

                <!-- Main White Header Bar (hdr-main) -->
                <div class="hdr-main">
                    <!-- Brand: Hamburger + Floating Logo + University Name -->
                    <div class="hdr-brand">
                        <button class="hdr-hamburger" id="shellHamburgerBtn" title="Menu">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                                <line x1="3" y1="6" x2="21" y2="6" />
                                <line x1="3" y1="12" x2="21" y2="12" />
                                <line x1="3" y1="18" x2="21" y2="18" />
                            </svg>
                        </button>

                        <div class="hdr-logo-wrap" onclick="if(window.navigateTo){window.navigateTo('repository');}else{window.location.href='index.html';}">
                            <img src="logos/logo.png?v=20260924_1" alt="KERNEL PANIC Logo" style="height:44px !important; width:auto !important; max-width:48px !important; object-fit:contain !important; background:transparent !important; border-radius:0 !important; padding:0 !important; box-shadow:none !important;" onerror="this.src='logos/kp_icon.png'">
                        </div>

                        <div class="hdr-univ" onclick="if(window.navigateTo){window.navigateTo('repository');}else{window.location.href='index.html';}">
                            <div class="hdr-univ-name" style="font-size:20px !important; font-weight:800 !important; line-height:1.2 !important;"><span style="color:#000000; font-weight:800;">KERNEL</span> <span style="color:#0066ff; font-weight:800;">PANIC</span></div>
                            <div class="hdr-univ-en" style="color:#8899ac !important; font-weight:700 !important; letter-spacing:2px !important; font-size:11px !important; margin-top:1px !important;">IT TEAM</div>
                        </div>
                    </div>

                    <!-- Center System Title -->
                    <div class="hdr-center">
                        <div class="hdr-center-title">${isAr ? 'نظام إدارة الملفات والوثائق الأكاديمية' : 'Academic File Management System'}</div>
                        <div class="hdr-center-sub" style="color:#94a3b8; font-weight:600; letter-spacing:1px;">IT TEAM</div>
                    </div>

                    <!-- Spacer for visual symmetry -->
                    <div class="hdr-spacer"></div>
                </div>
            </header>

            <!-- 2. Main Layout Area (Sidebar + Dynamic Page Content) -->
            <div class="layout">
                <!-- Left Sidebar -->
                <aside class="sidebar" id="shellSidebar">
                    <!-- Sidebar Header with System Name and Mobile Close -->
                    <div class="sidebar-header">
                        <div class="sidebar-title">${isAr ? 'نظام الملفات الأكاديمية' : 'File Management System'}</div>
                        <button class="sidebar-close-btn" id="shellSidebarCloseBtn" title="${isAr ? 'إغلاق القائمة' : 'Close Menu'}">✕</button>
                    </div>

                    <!-- User Role Status Card with Pulsing Indicator -->
                    <div class="sidebar-badge-box">
                        <div class="sidebar-role-badge">
                            <div class="status-dot"></div>
                            <span class="sidebar-role-text">${userRoleLabel}</span>
                        </div>
                    </div>

                    <!-- Navigation Links -->
                    <nav class="sidebar-nav" id="shellSidebarNav">
                        ${navButtonsHTML}
                    </nav>

                    <!-- Sidebar Footer -->
                    <div class="sidebar-footer">
                        <div class="sidebar-footer-text">AITU File Management © ${new Date().getFullYear()}</div>
                    </div>
                </aside>

                <!-- Dynamic Main Content (Fixed shell content container) -->
                <main class="main page-pad" id="page-content"></main>
            </div>

            <!-- Mobile Backdrop Overlay -->
            <div class="sidebar-overlay" id="shellSidebarOverlay"></div>
        </div>

        <!-- Global Upload Modal -->
        <div class="modal-overlay" id="globalUploadModal">
            <div class="upload-modal" style="background:#fff; border-radius:12px; max-width:520px; width:90%; padding:24px; box-shadow:0 20px 40px rgba(0,0,0,0.15); margin:auto;">
                <div class="modal-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; border-bottom:1px solid #E2E8F0; padding-bottom:12px;">
                    <h3 id="uploadModalTitle" style="font-size:17px; font-weight:700; color:#0F172A;">${isAr ? 'رفع وثيقة جديدة' : 'Upload New Document'}</h3>
                    <span class="close-modal" id="closeUploadModalBtn" style="cursor:pointer; font-size:22px; color:#64748B;">&times;</span>
                </div>
                
                <form id="globalUploadForm">
                    <div class="form-group" style="margin-bottom:14px;">
                        <label style="display:block; font-size:13px; font-weight:600; color:#334155; margin-bottom:5px;">${isAr ? 'عنوان أو اسم الملف' : 'File Title / Name'}</label>
                        <input type="text" id="uploadFileName" class="form-control" style="width:100%; padding:9px 12px; border:1px solid #CBD5E1; border-radius:6px; font-family:'Cairo',sans-serif;" placeholder="${isAr ? 'مثال: Project_Blueprint.pdf' : 'e.g. Project_Blueprint.pdf'}" required>
                    </div>
                    
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:14px;">
                        <div class="form-group">
                            <label style="display:block; font-size:13px; font-weight:600; color:#334155; margin-bottom:5px;">${isAr ? 'القسم الأكاديمي' : 'Department'}</label>
                            <select id="uploadFileDept" class="form-control" style="width:100%; padding:9px 12px; border:1px solid #CBD5E1; border-radius:6px; font-family:'Cairo',sans-serif;" required>
                                <option value="IT">IT</option>
                                <option value="EL">EL</option>
                                <option value="ME">ME</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label style="display:block; font-size:13px; font-weight:600; color:#334155; margin-bottom:5px;">${isAr ? 'نوع الملف' : 'File Type'}</label>
                            <select id="uploadFileType" class="form-control" style="width:100%; padding:9px 12px; border:1px solid #CBD5E1; border-radius:6px; font-family:'Cairo',sans-serif;" required>
                                <option value="PDF">PDF</option>
                                <option value="XLSX">Excel (XLSX)</option>
                                <option value="DOCX">Word (DOCX)</option>
                                <option value="DWG">CAD (DWG)</option>
                                <option value="MP4">Video (MP4)</option>
                            </select>
                        </div>
                    </div>

                    <div class="drop-zone" id="uploadDropZone" style="border:2px dashed #CBD5E1; border-radius:8px; padding:24px; text-align:center; cursor:pointer; background:#F8FAFC; margin-bottom:18px;">
                        <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#64748B" stroke-width="2" style="margin:0 auto 8px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                        <div style="font-size:13.5px; font-weight:600; color:#475569;">${isAr ? 'اضغط هنا لاختيار ملف من جهازك' : 'Click to select a file for upload'}</div>
                        <input type="file" id="globalFileInput" style="display:none;">
                    </div>

                    <div style="display:flex; justify-content:flex-end; gap:10px;">
                        <button type="button" id="cancelUploadModalBtn" style="padding:8px 16px; border:1px solid #CBD5E1; background:#fff; border-radius:6px; cursor:pointer; font-family:'Cairo',sans-serif; font-weight:600;">${isAr ? 'إلغاء' : 'Cancel'}</button>
                        <button type="submit" id="submitUploadModalBtn" style="padding:8px 20px; border:none; background:#1565C0; color:#fff; border-radius:6px; cursor:pointer; font-family:'Cairo',sans-serif; font-weight:700;">${isAr ? 'تأكيد الرفع' : 'Upload File'}</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    appContainer.innerHTML = layoutHTML;

    // --- Wire Event Handlers ---
    initShellEventHandlers(activePage);
}

/**
 * Updates active indicator on the navigation buttons without reloading
 */
function updateActiveNavState(activePage) {
    const navButtons = document.querySelectorAll('.nav-link-btn');
    navButtons.forEach(btn => {
        if (btn.dataset.page === activePage) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Close mobile drawer
    closeMobileDrawer();
}

/**
 * Closes mobile sidebar drawer
 */
function closeMobileDrawer() {
    const sidebar = document.getElementById('shellSidebar');
    const overlay = document.getElementById('shellSidebarOverlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
}

/**
 * Initializes listeners for hamburger, drawer, navigation, logout, and language
 */
function initShellEventHandlers(initialPage) {
    const sidebar = document.getElementById('shellSidebar');
    const overlay = document.getElementById('shellSidebarOverlay');
    const hamburgerBtn = document.getElementById('shellHamburgerBtn');
    const closeBtn = document.getElementById('shellSidebarCloseBtn');

    // Hamburger toggle
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (sidebar) sidebar.classList.toggle('open');
            if (overlay) overlay.classList.toggle('open');
        });
    }

    // Close button
    if (closeBtn) {
        closeBtn.addEventListener('click', closeMobileDrawer);
    }

    // Overlay click closes
    if (overlay) {
        overlay.addEventListener('click', closeMobileDrawer);
    }

    // Navigation buttons intercept click to prevent full reload
    const navButtons = document.querySelectorAll('.nav-link-btn');
    navButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const targetPage = btn.dataset.page;
            if (targetPage) {
                closeMobileDrawer();
                if (window.navigateTo) {
                    window.navigateTo(targetPage);
                } else {
                    window.location.href = `${targetPage}.html`;
                }
            }
        });
    });

    // Language Toggle
    const langBtn = document.getElementById('shellLangBtn');
    if (langBtn) {
        langBtn.addEventListener('click', (e) => {
            toggleLanguage(e);
        });
    }

    // Logout Button
    const logoutBtn = document.getElementById('shellLogoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            logout();
        });
    }

    // Global Upload Modal handlers
    const uploadBtn = document.getElementById('globalUploadBtn');
    const uploadModal = document.getElementById('globalUploadModal');
    const closeUploadBtn = document.getElementById('closeUploadModalBtn');
    const cancelUploadBtn = document.getElementById('cancelUploadModalBtn');
    const globalUploadForm = document.getElementById('globalUploadForm');
    const dropZone = document.getElementById('uploadDropZone');
    const fileInput = document.getElementById('globalFileInput');

    if (uploadModal) {
        const showModal = () => uploadModal.classList.add('active');
        const hideModal = () => {
            uploadModal.classList.remove('active');
            if (globalUploadForm) globalUploadForm.reset();
        };

        if (uploadBtn) uploadBtn.addEventListener('click', showModal);
        if (closeUploadBtn) closeUploadBtn.addEventListener('click', hideModal);
        if (cancelUploadBtn) cancelUploadBtn.addEventListener('click', hideModal);

        if (dropZone && fileInput) {
            dropZone.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    const file = e.target.files[0];
                    const nameInput = document.getElementById('uploadFileName');
                    if (nameInput) nameInput.value = file.name;
                    const ext = file.name.split('.').pop().toUpperCase();
                    const typeDropdown = document.getElementById('uploadFileType');
                    if (typeDropdown && ['PDF', 'XLSX', 'DOCX', 'DWG', 'MP4'].includes(ext)) {
                        typeDropdown.value = ext;
                    }
                }
            });
        }

        if (globalUploadForm) {
            globalUploadForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const submitBtn = document.getElementById('submitUploadModalBtn');
                submitBtn.disabled = true;
                submitBtn.innerText = "Uploading...";

                const customName = document.getElementById('uploadFileName')?.value || '';
                const dept = document.getElementById('uploadFileDept')?.value || 'IT';
                const type = document.getElementById('uploadFileType')?.value || 'PDF';
                const file = fileInput?.files?.[0];

                if (!file) {
                    alert("Please select a file to upload.");
                    submitBtn.disabled = false;
                    submitBtn.innerText = "Upload File";
                    return;
                }

                const formData = new FormData();
                formData.append("file", file);

                try {
                    await fileService.uploadFile(formData, 0, type, dept, customName);
                    hideModal();
                    document.dispatchEvent(new CustomEvent('fileUploaded'));
                } catch (err) {
                    alert("Upload failed: " + err.message);
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.innerText = "Upload File";
                }
            });
        }
    }

    // Safety fallback: Ensure any old global loader is hidden
    setTimeout(() => {
        const loader = document.getElementById('global-page-loader');
        if (loader) {
            loader.classList.add('hide-loader');
            setTimeout(() => loader.remove(), 350);
        }
    }, 400);
}
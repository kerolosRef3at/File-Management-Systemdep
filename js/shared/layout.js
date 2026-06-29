// js/shared/layout.js
import { getCurrentUser, logout } from './auth.js';
import { fileService, dashboardService } from './services.js';

export function renderLayout(activePage = 'repository') {
    const appContainer = document.getElementById('app');
    if (!appContainer) return;

    const user = getCurrentUser();
    const lang = localStorage.getItem('aitu_lang') || 'en';

    // Apply language direction
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;

    // Check permissions for user/log views
    const isSupervisor = user && user.role === 'Supervisor';
    const isPublicUser = !user || user.role === 'Public User';
    const isManager = user && (user.role.includes('Manager') || isSupervisor);

    const pageTitles = {
        dashboard: 'Dashboard',
        repository: 'Repository',
        courses: 'Courses',
        users: 'User Management',
        logs: 'System Logs',
        profile: 'Profile Settings'
    };

    const pageSubtitles = {
        dashboard: 'Overview of tasks, teams & performance',
        repository: 'Academic programs and files repository',
        courses: 'Manage classes, curricula, and schedules',
        users: 'Manage system access, roles, and administrative privileges',
        logs: 'System audit trails and event records',
        profile: 'Update your personal profile and preferences'
    };

    const displayTitle = pageTitles[activePage] || 'Tech Services';
    const displaySubtitle = pageSubtitles[activePage] || 'Portal Overview';

    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = new Date().toLocaleDateString('en-US', dateOptions);

    // Build sidebar menu links based on role
    const navItems = [];
    
    if (!isPublicUser) {
        navItems.push({ href: 'dashboard.html', page: 'dashboard', label: 'Dashboard', icon: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>' });
    }

    navItems.push({ href: 'repository.html', page: 'repository', label: 'Repository', icon: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>' });

    navItems.push({ href: 'courses.html', page: 'courses', label: 'Courses', icon: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>' });

    if (isSupervisor) {
        navItems.push({ href: 'users.html', page: 'users', label: 'Users', icon: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>' });
        navItems.push({ href: 'logs.html', page: 'logs', label: 'System Logs', icon: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>' });
    }

    if (!isPublicUser) {
        navItems.push({ href: 'profile.html', page: 'profile', label: 'Profile', icon: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' });
    }

    const menuHTML = navItems.map(item => {
        const isActive = item.page === activePage;
        return '<li><a href="' + item.href + '" class="' + (isActive ? 'active' : '') + '">' + item.icon + item.label + '</a></li>';
    }).join('');

    const actionButtons = {
        repository: { label: 'Add Program', id: 'globalUploadBtn' },
        courses: { label: 'Add Course', id: 'addCourseBtn' },
        users: { label: 'Add User', id: 'addUserBtn' }
    };

    let actionBtnHTML = '';
    if (!isPublicUser && actionButtons[activePage]) {
        const ab = actionButtons[activePage];
        actionBtnHTML = '<div class="sidebar-btn-wrapper" style="display:none !important;"><button class="btn-upload" id="' + ab.id + '">' + ab.label + '</button></div>';
    }

    const userDisplayName = user ? (user.name || user.username) : 'Guest';
    const userEmail = user ? user.email : '';
    const userInitial = userDisplayName.charAt(0).toUpperCase();

    const layoutHTML = `
        <style>
            /* 1. جعل القائمة الجانبية Flexbox لحل مشكلة الزووم وتداخل العناصر */
            #adminSidebar { 
                background-color: #08305b !important; 
                border-right: 1px solid #062343 !important; 
                display: flex !important;
                flex-direction: column !important;
                height: 100vh !important;
                overflow: hidden !important; /* نمنع القائمة كلها من التمدد خارج الشاشة */
            }
            
            /* 2. اللوجو فوق (ثابت) */
            #adminSidebar .sidebar-header {
                flex-shrink: 0 !important;
            }

            /* 3. الروابط في المنتصف (تتمدد وتعمل سكرول لو الشاشة صغيرة) */
            #adminSidebar .sidebar-menu {
                flex: 1 1 auto !important;
                overflow-y: auto !important;
                overflow-x: hidden !important;
                margin-top: 15px !important;
                margin-bottom: 0 !important;
                padding-bottom: 10px !important;
            }

            /* 4. الفوتر تحت (ثابت دائماً) */
            #adminSidebar .sidebar-footer {
                flex-shrink: 0 !important;
                margin-top: auto !important;
            }

            /* تصميم السكرول بار للقائمة عشان يكون شيك ومش مزعج */
            #adminSidebar .sidebar-menu::-webkit-scrollbar {
                width: 5px;
            }
            #adminSidebar .sidebar-menu::-webkit-scrollbar-thumb {
                background: rgba(255, 255, 255, 0.15);
                border-radius: 10px;
            }
            #adminSidebar .sidebar-menu::-webkit-scrollbar-track {
                background: transparent;
            }
            
            /* ألوان وتصميم الروابط (كبسولة) */
            #adminSidebar .sidebar-menu a { 
                color: #ece3de !important; 
                font-weight: 600; 
                transition: all 0.2s ease; 
                border-radius: 12px !important; 
                margin: 4px 12px !important; 
                padding: 12px 15px !important;
            }
            #adminSidebar .sidebar-menu a svg { color: #8B9CC8 !important; transition: all 0.2s ease; }
            #adminSidebar .sidebar-menu a:hover { background-color: rgba(255, 255, 255, 0.1) !important; color: #ffffff !important; }
            #adminSidebar .sidebar-menu a:hover svg { color: #ffffff !important; }
            #adminSidebar .sidebar-menu a.active { 
                background-color: #96b6d5 !important; 
                color: #0b3b70 !important; 
                border: none !important; 
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            #adminSidebar .sidebar-menu a.active svg { color: #0b3b70 !important; }
            .sidebar-btn-wrapper { display: none !important; }
        </style>

        <div class="admin-layout">
            <div class="sidebar-overlay" id="sidebarOverlay"></div>
            
            <aside class="sidebar" id="adminSidebar">
               <div class="sidebar-header" style="cursor:pointer; display:flex; align-items:center; gap:15px; padding: 25px 16px; border-bottom: 1px solid rgba(255,255,255,0.05); min-height: 95px; box-sizing: border-box;" onclick="window.location.href='index.html'">
            <img src="logos/logo_AITU.jpg" alt="AITU Logo" width="62" height="62" onerror="this.src='logos/aitu_logo.png'" style="border-radius:50%; object-fit:cover; flex-shrink: 0; box-shadow: 0 4px 8px rgba(0,0,0,0.2);">
                <div style="display:flex; flex-direction:column; justify-content:center; overflow:hidden; text-align:left;">
                    <span style="font-size:0.85rem; font-weight:800; color:#ffffff; line-height:1.4; display:block;">Assiut International Technological University - AITU</span>
                    <span style="font-size:0.75rem; font-weight:600; color:#8B9CC8; margin-top:5px; display:block;">File Management System</span>
                </div>
            </div>
                
                <ul class="sidebar-menu">
                    ${menuHTML}
                </ul>
                
                ${actionBtnHTML}
                
                <div class="sidebar-footer" style="padding: 16px; border-top: 1px solid rgba(255,255,255,0.05);">
                    <button id="sidebarLogoutBtn" class="logout-btn" style="width:100%; display:flex; align-items:center; gap:10px; padding:10px 14px; border:none; background:transparent; color:#ef4444; font-weight:600; font-size:0.95rem; border-radius:8px; cursor:pointer; transition:0.2s;">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
                        Logout
                    </button>
                </div>
            </aside>

            <div class="main-wrapper">
                <header class="top-header">
                    <div class="header-left">
                        <button class="mobile-menu-btn" id="mobileMenuBtn">
                            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
                        </button>
                        <div class="page-title-box">
                            <h2>${displayTitle}</h2>
                            <div class="subtitle-row">
                                <span>${displaySubtitle}</span>
                                <span class="dot">•</span>
                                <span class="current-date">${formattedDate}</span>
                            </div>
                        </div>
                    </div>

                    <div class="header-right">
                        <div class="dash-user-menu">
                            <button class="dash-user-avatar-btn" id="userAvatarBtn">
                                <span class="avatar-circle">${userInitial}</span>
                                <div class="user-meta">
                                    <span class="user-name">${userDisplayName}</span>
                                    <span class="user-role">${user ? user.role : 'Guest'}</span>
                                </div>
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                            </button>

                            <div class="dash-user-dropdown" id="userDropdown">
                                <div class="dash-user-dropdown-header">
                                    <div class="avatar-lg">${userInitial}</div>
                                    <div class="user-info">
                                        <div class="name">${userDisplayName}</div>
                                        <div class="email">${userEmail}</div>
                                    </div>
                                </div>
                                <div class="dash-user-dropdown-menu">
                                    <a href="profile.html">
                                        <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                        My Profile
                                    </a>
                                    <button class="logout-item" id="dropdownLogoutBtn">
                                        <svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
                                        Logout
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>
                <style>
                    .dash-user-menu { position: relative; }
                    .dash-user-avatar-btn { background: none; border: none; cursor: pointer; display: flex; align-items: center; gap: 8px; padding: 0; }
                    .dash-user-avatar-btn .avatar-circle { width: 36px; height: 36px; border-radius: 50%; background: #1A3CAA; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; }
                    .dash-user-avatar-btn .user-meta { display: flex; flex-direction: column; text-align: left; line-height: 1.2; }
                    .dash-user-avatar-btn .user-name { font-size: 13px; font-weight: 700; color: #1A1F36; }
                    .dash-user-avatar-btn .user-role { font-size: 11px; color: #6B7A99; }
                    .dash-user-dropdown { position: absolute; top: calc(100% + 8px); right: 0; background: #ffffff; border: 1px solid #E8ECF4; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.12); z-index: 9999; width: 260px; padding: 0; display: none; overflow: hidden; }
                    .dash-user-dropdown.open { display: flex; flex-direction: column; }
                    .dash-user-dropdown-header { display: flex; align-items: center; gap: 12px; padding: 16px 20px; border-bottom: 1px solid #E8ECF4; }
                    .dash-user-dropdown-header .avatar-lg { width: 40px; height: 40px; border-radius: 50%; background: #1A3CAA; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 700; flex-shrink: 0; }
                    .dash-user-dropdown-header .user-info { flex: 1; min-width: 0; }
                    .dash-user-dropdown-header .user-info .name { font-size: 14px; font-weight: 700; color: #1A1F36; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                    .dash-user-dropdown-header .user-info .email { font-size: 12px; color: #1A3CAA; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                    .dash-user-dropdown-menu { padding: 8px 0; }
                    .dash-user-dropdown-menu a, .dash-user-dropdown-menu button { display: flex; align-items: center; gap: 10px; width: 100%; padding: 10px 20px; font-size: 14px; color: #1A1F36; background: none; border: none; text-decoration: none; cursor: pointer; transition: background 0.15s; text-align: left; }
                    .dash-user-dropdown-menu a:hover, .dash-user-dropdown-menu button:hover { background: #F4F6FB; }
                    .dash-user-dropdown-menu .logout-item { color: #E63946; border-top: 1px solid #E8ECF4; margin-top: 4px; padding-top: 12px; }
                    .dash-user-dropdown-menu svg { width: 18px; height: 18px; max-width: 18px; max-height: 18px; min-width: 18px; min-height: 18px; color: #6B7A99; flex-shrink: 0; display: block; }
                    .dash-user-dropdown-menu .logout-item svg { color: #E63946; }
                </style>
                <main class="content-area" id="page-content"></main>
            </div>
        </div>

        <div class="modal-overlay" id="globalUploadModal">
            <div class="upload-modal">
                <div class="modal-header">
                    <h3 id="uploadModalTitle">Upload New Document</h3>
                    <span class="close-modal" id="closeUploadModalBtn">&times;</span>
                </div>
                
                <form id="globalUploadForm">
                    <div class="form-group">
                        <label>File Title / Name</label>
                        <input type="text" id="uploadFileName" class="form-control" placeholder="e.g. Project_Blueprint.pdf" required>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group col-half">
                            <label>Department</label>
                            <select id="uploadFileDept" class="form-control" required>
                                <option value="IT">IT</option>
                                <option value="EL">EL</option>
                                <option value="ME">ME</option>
                            </select>
                        </div>
                        <div class="form-group col-half">
                            <label>File Type</label>
                            <select id="uploadFileType" class="form-control" required>
                                <option value="PDF">PDF</option>
                                <option value="XLSX">Excel (XLSX)</option>
                                <option value="DOCX">Word (DOCX)</option>
                                <option value="DWG">CAD (DWG)</option>
                                <option value="MP4">Video (MP4)</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>File Size (Estimated)</label>
                        <input type="text" id="uploadFileSize" class="form-control" placeholder="e.g. 2.4 MB" required>
                    </div>

                    <div class="drop-zone" id="uploadDropZone">
                        <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                        <div>Click to select a file for upload</div>
                        <input type="file" id="globalFileInput" style="display:none;">
                    </div>

                    <div class="modal-actions">
                        <button type="button" class="btn-outline" id="cancelUploadModalBtn">Cancel</button>
                        <button type="submit" class="btn-primary" id="submitUploadModalBtn">Upload File</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    appContainer.innerHTML = layoutHTML;

    // --- Event Listeners ---

    const sidebarLogoutBtn = document.getElementById('sidebarLogoutBtn');
    if (sidebarLogoutBtn) {
        sidebarLogoutBtn.addEventListener('click', () => {
            if (user) { logout(); } else { window.location.href = 'login.html'; }
        });
    }

    const dropdownLogoutBtn = document.getElementById('dropdownLogoutBtn');
    if (dropdownLogoutBtn) {
        dropdownLogoutBtn.addEventListener('click', () => {
            if (user) { logout(); } else { window.location.href = 'login.html'; }
        });
    }

    const avatarBtn = document.getElementById('userAvatarBtn');
    const userDropdown = document.getElementById('userDropdown');
    if (avatarBtn && userDropdown) {
        avatarBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle('open');
        });
        document.addEventListener('click', () => {
            userDropdown.classList.remove('open');
        });
        userDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    if (!isPublicUser) {
        dashboardService.getNotificationsCount().then(data => {
            const badge = document.getElementById('notifBadge');
            if (badge && data && data.count > 0) {
                badge.style.display = 'block';
            }
        }).catch(() => {});
    }

    const mobileBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.getElementById('adminSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (mobileBtn && sidebar && overlay) {
        mobileBtn.addEventListener('click', () => { sidebar.classList.add('open'); overlay.classList.add('active'); });
        overlay.addEventListener('click', () => { sidebar.classList.remove('open'); overlay.classList.remove('active'); });
    }

    const uploadBtn = document.getElementById('globalUploadBtn');
    const uploadModal = document.getElementById('globalUploadModal');
    const closeUploadBtn = document.getElementById('closeUploadModalBtn');
    const cancelUploadBtn = document.getElementById('cancelUploadModalBtn');
    const globalUploadForm = document.getElementById('globalUploadForm');
    const dropZone = document.getElementById('uploadDropZone');
    const fileInput = document.getElementById('globalFileInput');

    if (uploadBtn && uploadModal) {
        const showModal = () => uploadModal.classList.add('active');
        const hideModal = () => {
            uploadModal.classList.remove('active');
            globalUploadForm.reset();
        };

        uploadBtn.addEventListener('click', showModal);
        closeUploadBtn.addEventListener('click', hideModal);
        cancelUploadBtn.addEventListener('click', hideModal);

        dropZone.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                const file = e.target.files[0];
                document.getElementById('uploadFileName').value = file.name;
                document.getElementById('uploadFileSize').value = (file.size / (1024 * 1024)).toFixed(2) + " MB";
                
                const ext = file.name.split('.').pop().toUpperCase();
                const typeDropdown = document.getElementById('uploadFileType');
                if (['PDF', 'XLSX', 'DOCX', 'DWG', 'MP4'].includes(ext)) {
                    typeDropdown.value = ext;
                }
            }
        });

        globalUploadForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById('submitUploadModalBtn');
            submitBtn.disabled = true;
            submitBtn.innerText = "Uploading...";

            const name = document.getElementById('uploadFileName').value;
            const dept = document.getElementById('uploadFileDept').value;
            const type = document.getElementById('uploadFileType').value;
            const size = document.getElementById('uploadFileSize').value;

            try {
                await fileService.uploadFile(name, type, size, dept, user ? user.username : 'system');
                hideModal();
                
                const fileGrid = document.getElementById('filesGrid');
                if (fileGrid) {
                    const event = new CustomEvent('fileUploaded');
                    document.dispatchEvent(event);
                }
            } catch (err) {
                alert("Upload failed: " + err.message);
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerText = "Upload File";
            }
        });
    }
}
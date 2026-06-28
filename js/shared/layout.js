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

    // Add Courses link
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

    // Dynamic action button per page
    const actionButtons = {
        repository: { label: 'Add Program', id: 'globalUploadBtn' },
        courses: { label: 'Add Course', id: 'addCourseBtn' },
        users: { label: 'Add User', id: 'addUserBtn' }
    };

    let actionBtnHTML = '';
    if (!isPublicUser && actionButtons[activePage]) {
        const ab = actionButtons[activePage];
        actionBtnHTML = '<div class="sidebar-btn-wrapper"><button class="btn-upload" id="' + ab.id + '"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>' + ab.label + '</button></div>';
    }

    // Header user info
    const userDisplayName = user ? (user.name || user.username) : 'Guest';
    const userEmail = user ? user.email : '';
    const userInitial = userDisplayName.charAt(0).toUpperCase();

    const layoutHTML = `
        <div class="admin-layout">
            <div class="sidebar-overlay" id="sidebarOverlay"></div>
            <aside class="sidebar" id="adminSidebar">
                <div class="sidebar-header" style="cursor:pointer;" onclick="window.location.href='index.html'">
                    <img src="logos/logo_AITU.jpg" alt="AITU Logo" width="40" height="40" onerror="this.src='logos/aitu_logo.png'" style="border-radius:50%;">
                    <div>
                        <div style="font-weight:700;color:white;">Tech Services</div>
                        <div style="font-size:0.8rem;color:#8B9CC8;">Admin Portal</div>
                    </div>
                </div>
                <ul class="sidebar-menu">
                    ${menuHTML}
                </ul>
                <div style="flex-grow: 1;"></div>
                ${actionBtnHTML}
                <div class="sidebar-footer" style="padding:15px 20px;">
                    <a href="#" style="display:flex;align-items:center;gap:8px;color:#8B9CC8;font-size:0.85rem;margin-bottom:12px;text-decoration:none;">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                        Help Center
                    </a>
                    <button id="sidebarLogoutBtn" style="width:100%;text-align:left;background:none;border:none;color:#fecaca;font-size:0.85rem;cursor:pointer;display:flex;align-items:center;gap:8px;">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
                        Logout
                    </button>
                </div>
            </aside>
            <div class="main-wrapper">
                <header class="top-header" style="display:flex;align-items:center;justify-content:space-between;padding:15px 25px;background:white;border-bottom:1px solid var(--border-color);height:80px;box-sizing:border-box;">
                    <div style="display:flex;align-items:center;gap:15px;">
                        <button class="mobile-menu-btn" id="mobileMenuBtn" style="margin-right:5px;">
                            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
                        </button>
                        <div style="display:flex;flex-direction:column;line-height:1.2;">
                            <h2 style="font-size:1.35rem;font-weight:800;color:var(--primary-dark);margin:0;">${displayTitle}</h2>
                            <div style="display:flex;align-items:center;gap:8px;font-size:0.8rem;color:var(--text-gray);margin-top:4px;">
                                <span>${displaySubtitle}</span>
                                <span style="color:#cbd5e1;">•</span>
                                <span>${formattedDate}</span>
                            </div>
                        </div>
                    </div>

                    <div style="display:flex;align-items:center;gap:15px;margin-left:auto;">
                        <!-- Search input - only shown for repository and courses pages -->
                        ${(activePage === 'repository' || activePage === 'courses') ? `
                            <div class="search-bar" style="width:260px;margin-right:10px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:8px 12px;display:flex;align-items:center;gap:8px;box-sizing:border-box;">
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--text-gray);"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                                <input type="text" id="globalSearchInput" placeholder="Search tasks, teams..." style="border:none;background:transparent;outline:none;font-size:0.85rem;color:var(--text-dark);width:100%;">
                            </div>
                        ` : ''}

                        <!-- User Profile Card -->
                        <div style="position:relative;display:flex;align-items:center;box-sizing:border-box;">
                            <button class="dash-user-avatar-btn" id="userAvatarBtn" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:6px 12px;display:flex;align-items:center;gap:10px;cursor:pointer;transition:all 0.2s;text-align:left;height:40px;box-sizing:border-box;">
                                <span style="width:28px;height:28px;border-radius:50%;background:#0b3b70;color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.75rem;flex-shrink:0;">
                                    ${userInitial}
                                </span>
                                <div style="display:flex;flex-direction:column;line-height:1.15;flex-shrink:0;">
                                    <span style="font-size:0.85rem;font-weight:700;color:var(--primary-dark);">${userDisplayName}</span>
                                    <span style="font-size:0.75rem;color:var(--text-gray);font-weight:500;">${user ? user.role : 'Guest'}</span>
                                </div>
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--text-gray);margin-left:4px;"><polyline points="6 9 12 15 18 9"/></svg>
                            </button>

                            <div class="dash-user-dropdown" id="userDropdown" style="top:48px;">
                                <div class="dash-user-dropdown-header">
                                    <div class="avatar-lg">${userInitial}</div>
                                    <div class="user-info">
                                        <div class="name">${userDisplayName}</div>
                                        <div class="email">${userEmail}</div>
                                    </div>
                                </div>
                                <div class="dash-user-dropdown-menu">
                                    <a href="profile.html">
                                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                        My Profile
                                    </a>
                                    <a href="profile.html#settings">
                                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                                        Settings
                                    </a>
                                    <a href="profile.html#password">
                                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                                        Change Password
                                    </a>
                                    <button class="logout-item" id="dropdownLogoutBtn">
                                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
                                        Logout
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>    <style>
                        .dash-user-avatar-btn { background: none; border: none; cursor: pointer; display: flex; align-items: center; gap: 8px; padding: 0; position: relative; }
                        .dash-user-dropdown { position: absolute; top: calc(100% + 8px); right: 0; background: #ffffff; border: 1px solid #E8ECF4; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.18); z-index: 9999; width: 260px; padding: 0; display: none; overflow: hidden; }
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
                </header>
                <main class="content-area" id="page-content"></main>
            </div>
        </div>

        <!-- Global Upload Modal -->
        <div class="modal-overlay" id="globalUploadModal">
            <div class="upload-modal" style="max-width:500px;background:white;border-radius:12px;padding:25px;">
                <div class="modal-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
                    <h3 id="uploadModalTitle" style="color:var(--primary-dark);">Upload New Document</h3>
                    <span class="close-modal" id="closeUploadModalBtn" style="cursor:pointer;font-size:1.5rem;line-height:1;">&times;</span>
                </div>
                
                <form id="globalUploadForm">
                    <div class="form-group" style="margin-bottom:15px;">
                        <label style="display:block;margin-bottom:5px;font-weight:600;font-size:0.9rem;">File Title / Name</label>
                        <input type="text" id="uploadFileName" class="form-control" placeholder="e.g. Project_Blueprint.pdf" required>
                    </div>
                    
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-bottom:15px;">
                        <div class="form-group" style="margin-bottom:0;">
                            <label style="display:block;margin-bottom:5px;font-weight:600;font-size:0.9rem;">Department</label>
                            <select id="uploadFileDept" class="form-control" required>
                                <option value="IT">IT</option>
                                <option value="EL">EL</option>
                                <option value="ME">ME</option>
                            </select>
                        </div>
                        <div class="form-group" style="margin-bottom:0;">
                            <label style="display:block;margin-bottom:5px;font-weight:600;font-size:0.9rem;">File Type</label>
                            <select id="uploadFileType" class="form-control" required>
                                <option value="PDF">PDF</option>
                                <option value="XLSX">Excel (XLSX)</option>
                                <option value="DOCX">Word (DOCX)</option>
                                <option value="DWG">CAD (DWG)</option>
                                <option value="MP4">Video (MP4)</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-group" style="margin-bottom:15px;">
                        <label style="display:block;margin-bottom:5px;font-weight:600;font-size:0.9rem;">File Size (Estimated)</label>
                        <input type="text" id="uploadFileSize" class="form-control" placeholder="e.g. 2.4 MB" required>
                    </div>

                    <div class="drop-zone" id="uploadDropZone" style="border:2px dashed #94a3b8;border-radius:8px;padding:25px;text-align:center;background:#f8fafc;color:var(--text-gray);margin-bottom:20px;cursor:pointer;">
                        <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom:10px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                        <div>Click to select a file for upload</div>
                        <input type="file" id="globalFileInput" style="display:none;">
                    </div>

                    <div class="modal-actions" style="display:flex;gap:15px;justify-content:flex-end;">
                        <button type="button" class="btn-outline" id="cancelUploadModalBtn">Cancel</button>
                        <button type="submit" class="btn-primary" id="submitUploadModalBtn">Upload File</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    appContainer.innerHTML = layoutHTML;

    // --- Event Listeners ---

    // Sidebar Logout
    const sidebarLogoutBtn = document.getElementById('sidebarLogoutBtn');
    if (sidebarLogoutBtn) {
        sidebarLogoutBtn.addEventListener('click', () => {
            if (user) { logout(); } else { window.location.href = 'login.html'; }
        });
    }

    // Dropdown Logout
    const dropdownLogoutBtn = document.getElementById('dropdownLogoutBtn');
    if (dropdownLogoutBtn) {
        dropdownLogoutBtn.addEventListener('click', () => {
            if (user) { logout(); } else { window.location.href = 'login.html'; }
        });
    }

    // User Avatar Dropdown Toggle
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

    // Notification bell badge
    if (!isPublicUser) {
        dashboardService.getNotificationsCount().then(data => {
            const badge = document.getElementById('notifBadge');
            if (badge && data && data.count > 0) {
                badge.style.display = 'block';
            }
        }).catch(() => {});
    }

    // Mobile Menu Toggles
    const mobileBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.getElementById('adminSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (mobileBtn && sidebar && overlay) {
        mobileBtn.addEventListener('click', () => { sidebar.classList.add('open'); overlay.classList.add('active'); });
        overlay.addEventListener('click', () => { sidebar.classList.remove('open'); overlay.classList.remove('active'); });
    }

    // Modal Control: Only setup if upload button exists
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

        // File Selection handling
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

        // Submit Logic
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
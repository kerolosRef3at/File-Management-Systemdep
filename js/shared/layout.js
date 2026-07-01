// js/shared/layout.js
import { getCurrentUser, logout } from './auth.js';
import { fileService, dashboardService } from './services.js';
import { getCurrentLang, toggleLanguage } from './jssharedi18n.js';

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
                background-color: rgba(255, 255, 255, 0.12) !important; 
                color: #ffffff !important; 
                border-left: 4px solid #60A5FA !important;
                border-radius: 0 10px 10px 0 !important; 
                margin-left: 0 !important;
                padding-left: 23px !important;
                box-shadow: none;
            }
            #adminSidebar .sidebar-menu a.active svg { color: #60A5FA !important; }
            .sidebar-btn-wrapper { padding: 0 16px; margin-bottom: 20px; }
            .sidebar-btn-wrapper button { width: 100%; padding: 12px; background: #1A3CAA; color: #fff; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 4px 12px rgba(26,60,170,0.3); }
            .sidebar-btn-wrapper button:hover { background: #0b3b70; transform: translateY(-2px); box-shadow: 0 6px 16px rgba(26,60,170,0.4); }
        </style>

        <div class="admin-layout">
            <div class="sidebar-overlay" id="sidebarOverlay"></div>
            
            <aside class="sidebar" id="adminSidebar">
               <div class="sidebar-header" style="cursor:pointer; display:flex; align-items:center; gap:12px; padding: 20px 16px; border-bottom: 1px solid rgba(255,255,255,0.05); min-height: 85px; box-sizing: border-box;" onclick="window.location.href='index.html'">
            <img src="logos/logo_AITU.jpg" alt="AITU Logo" style="width: 46px; height: 46px; min-width: 46px; border-radius:50%; object-fit:cover; flex-shrink: 0; box-shadow: 0 4px 8px rgba(0,0,0,0.2);" onerror="this.src='logos/aitu_logo.png'">
                <div style="display:flex; flex-direction:column; justify-content:center; overflow:hidden; text-align:left;">
                    <span style="font-size:0.82rem; font-weight:700; color:#ffffff; line-height:1.3; display:block;">Assiut International Technological University</span>
                    <span style="font-size:0.7rem; font-weight:500; color:#8B9CC8; margin-top:3px; display:block; letter-spacing:0.3px;">File Management System</span>
                </div>
            </div>
                
                <ul class="sidebar-menu">
                    ${menuHTML}
                </ul>
                
                ${actionBtnHTML}
                
                <div class="sidebar-footer" style="padding: 16px; border-top: 1px solid rgba(255,255,255,0.05); margin-top: auto;">
                    <div class="sidebar-user-block mobile-only" style="margin-bottom: 15px;">
                        <a href="profile.html" style="display:flex; align-items:center; gap:10px; margin-bottom: 12px; padding-bottom:12px; border-bottom:1px solid rgba(255,255,255,0.05); text-decoration:none; cursor:pointer; transition:0.2s;">
                            <div style="width:36px; height:36px; border-radius:50%; background:#1A3CAA; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:14px; flex-shrink:0;">${userInitial}</div>
                            <div style="display:flex; flex-direction:column; overflow:hidden;">
                                <span style="font-size:13px; font-weight:700; color:#fff; white-space:nowrap; text-overflow:ellipsis; overflow:hidden;">${userDisplayName}</span>
                                <span style="font-size:11px; color:#8B9CC8;">${user ? user.role : 'Guest'}</span>
                            </div>
                        </a>
                    </div>
                    <button id="sidebarLangBtn" style="width:100%; display:flex; align-items:center; gap:10px; padding:10px 14px; border:none; background:rgba(255,255,255,0.06); color:#8B9CC8; font-weight:600; font-size:0.9rem; border-radius:8px; cursor:pointer; transition:0.2s; margin-bottom:8px;">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                        ${lang === 'ar' ? 'English' : 'عربي'}
                    </button>
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
                                <span class="dot hide-on-mobile">•</span>
                                <span class="current-date">${formattedDate}</span>
                            </div>
                        </div>
                    </div>

                    <div class="header-right">
                        <button class="lang-toggle-topbar" id="langToggleBtn" title="${lang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                            <span class="lang-btn-text">${lang === 'ar' ? 'English' : 'عربي'}</span>
                        </button>
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
                                        ${userEmail ? `<div class="email">${userEmail}</div>` : ''}
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
                    @media (max-width: 768px) {
                        .hide-on-mobile { display: none !important; }
                        .subtitle-row { flex-direction: column; align-items: flex-start; gap: 2px; }
                        .current-date { display: none !important; }
                        .subtitle-row span { white-space: nowrap !important; overflow: hidden; text-overflow: ellipsis; max-width: 100%; display: block; }
                        .top-header { height: auto !important; padding: 15px 20px !important; }
                        .header-right { display: none !important; }
                        .mobile-only { display: block !important; }
                    }
                    @media (min-width: 769px) {
                        .mobile-only { display: none !important; }
                    }
                    .header-left { display: flex; align-items: center; gap: 15px; min-width: 0; flex: 1; }
                    .page-title-box { min-width: 0; }
                    .page-title-box h2 { margin: 0 0 4px 0; font-size: 1.3rem; color: #1A1F36; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                    .subtitle-row { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; font-size: 0.85rem; color: #6B7A99; line-height: 1.4; }
                    .subtitle-row span { white-space: normal; word-break: break-word; }
                    .header-right { flex-shrink: 0; display: flex; align-items: center; gap: 12px; }
                    .lang-toggle-topbar { display: flex; align-items: center; gap: 8px; padding: 8px 16px; background: #F0F4FF; border: 1px solid #D1D9E6; border-radius: 50px; cursor: pointer; font-size: 13.5px; font-weight: 600; color: #1A3CAA; transition: all 0.25s ease; white-space: nowrap; }
                    .lang-toggle-topbar:hover { background: #E0E8FF; border-color: #1A3CAA; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(26,60,170,0.12); }
                    .lang-toggle-topbar svg { color: #1A3CAA; flex-shrink: 0; }
                    .dash-user-menu { position: relative; }
                    .dash-user-avatar-btn { background: #ffffff; border: 1px solid #E8ECF4; border-radius: 50px; cursor: pointer; display: flex; align-items: center; gap: 12px; padding: 6px 20px 6px 6px; transition: all 0.2s ease; box-shadow: 0 2px 8px rgba(0,0,0,0.02); height: 54px; }
                    .dash-user-avatar-btn:hover { background: #F8FAFC; border-color: #D1D9E6; box-shadow: 0 4px 12px rgba(0,0,0,0.06); transform: translateY(-1px); }
                    .dash-user-avatar-btn .avatar-circle { width: 42px; height: 42px; border-radius: 50%; background: linear-gradient(135deg, #1A3CAA, #0b3b70); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px; box-shadow: inset 0 -2px 4px rgba(0,0,0,0.1); }
                    .dash-user-avatar-btn .user-meta { display: flex; flex-direction: column; text-align: left; line-height: 1.25; }
                    .dash-user-avatar-btn .user-name { font-size: 15px; font-weight: 700; color: #0b3b70; letter-spacing: 0.2px; margin-bottom: 2px; }
                    .dash-user-avatar-btn .user-role { font-size: 11.5px; font-weight: 600; color: #6B7A99; text-transform: uppercase; letter-spacing: 0.5px; }
                    .dash-user-dropdown { position: absolute; top: calc(100% + 12px); right: 0; background: #ffffff; border: 1px solid #E8ECF4; border-radius: 16px; box-shadow: 0 16px 48px rgba(7, 34, 71, 0.1), 0 4px 16px rgba(7, 34, 71, 0.04); z-index: 9999; width: 280px; padding: 0; display: none; overflow: hidden; transform: translateY(-10px); opacity: 0; transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s ease; }
                    .dash-user-dropdown.open { display: flex; flex-direction: column; transform: translateY(0); opacity: 1; }
                    .dash-user-dropdown-header { display: flex; align-items: center; gap: 16px; padding: 20px 24px; background: linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%); border-bottom: 1px solid #E8ECF4; }
                    .dash-user-dropdown-header .avatar-lg { width: 50px; height: 50px; border-radius: 50%; background: linear-gradient(135deg, #1A3CAA, #0b3b70); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 700; flex-shrink: 0; box-shadow: 0 4px 12px rgba(11, 59, 112, 0.2); }
                    .dash-user-dropdown-header .user-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
                    .dash-user-dropdown-header .user-info .name { font-size: 16px; font-weight: 700; color: #0b3b70; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.2; margin-bottom: 3px; }
                    .dash-user-dropdown-header .user-info .email { font-size: 13px; color: #6B7A99; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 500; }
                    .dash-user-dropdown-menu { padding: 12px; }
                    .dash-user-dropdown-menu a, .dash-user-dropdown-menu button { display: flex; align-items: center; gap: 12px; width: 100%; padding: 12px 16px; font-size: 14.5px; font-weight: 500; color: #1A1F36; background: none; border: none; text-decoration: none; cursor: pointer; transition: all 0.2s ease; text-align: left; border-radius: 8px; }
                    .dash-user-dropdown-menu a:hover, .dash-user-dropdown-menu button:hover { background: #F8FAFC; color: #0b3b70; transform: translateX(4px); }
                    .dash-user-dropdown-menu .logout-item { color: #E63946; border-top: 1px solid #F0F2F5; margin-top: 6px; padding-top: 14px; border-radius: 0 0 8px 8px; }
                    .dash-user-dropdown-menu .logout-item:hover { background: #FFF5F5; color: #D62828; }
                    .dash-user-dropdown-menu svg { width: 18px; height: 18px; max-width: 18px; max-height: 18px; min-width: 18px; min-height: 18px; color: #6B7A99; flex-shrink: 0; display: block; stroke-width: 2.5; transition: color 0.2s ease; }
                    .dash-user-dropdown-menu a:hover svg, .dash-user-dropdown-menu button:hover svg { color: #0b3b70; }
                    .dash-user-dropdown-menu .logout-item svg { color: #E63946; }
                    .dash-user-dropdown-menu .logout-item:hover svg { color: #D62828; }
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

    // Language toggle button
    const langToggleBtn = document.getElementById('langToggleBtn');
    if (langToggleBtn) {
        langToggleBtn.addEventListener('click', () => {
            toggleLanguage();
            // Reload page to re-render layout with correct language
            setTimeout(() => window.location.reload(), 100);
        });
    }

    // Sidebar language toggle (mobile)
    const sidebarLangBtn = document.getElementById('sidebarLangBtn');
    if (sidebarLangBtn) {
        sidebarLangBtn.addEventListener('click', () => {
            toggleLanguage();
            setTimeout(() => window.location.reload(), 100);
        });
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

            const customName = document.getElementById('uploadFileName').value;
            const dept = document.getElementById('uploadFileDept').value;
            const type = document.getElementById('uploadFileType').value;
            const fileInput = document.getElementById('globalFileInput');
            const file = fileInput.files[0];

            if (!file) {
                alert("Please select a file to upload.");
                submitBtn.disabled = false;
                submitBtn.innerText = "Upload File";
                return;
            }

            const formData = new FormData();
            formData.append("file", file);

            try {
                const folderId = 0; // Default folder ID for global uploads
                await fileService.uploadFile(formData, folderId, type, dept, customName);
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
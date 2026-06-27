// js/shared/layout.js

export function renderLayout(activePage = 'repository') {
    const appContainer = document.getElementById('app');
    if (!appContainer) return;

    // 1. تعريف القاموس واللغة هنا مباشرة (بدون Import)
    const translations = {
        en: { dashboard: "Dashboard", repository: "Repository", courses: "Courses", users: "Users", logs: "Audit Logs", profile: "Profile", searchPlaceholder: "Search files...", uploadBtn: "Upload File" },
        ar: { dashboard: "لوحة التحكم", repository: "مستودع الملفات", courses: "المناهج والكورسات", users: "إدارة المستخدمين", logs: "سجلات النظام", profile: "الملف الشخصي", searchPlaceholder: "ابحث عن الملفات...", uploadBtn: "رفع ملف جديد" }
    };
    
    const lang = localStorage.getItem('aitu_lang') || 'en';
    const t = translations[lang];

    // تطبيق اتجاه الصفحة
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;

    // 2. كود الهيكل (نفسه بدون تغيير)
    const layoutHTML = `
        <div class="admin-layout">
            <div class="sidebar-overlay" id="sidebarOverlay"></div>
            <aside class="sidebar" id="adminSidebar">
                <div class="sidebar-header">
                    <img src="logos/aitu_logo.png" alt="AITU" width="40" height="40" onerror="this.style.display='none'">
                    <div><div style="font-weight: 700;">Tech Services</div><div style="font-size: 0.8rem; color: #cbd5e1;">Admin Portal</div></div>
                </div>
                <div class="sidebar-btn-wrapper"><button class="btn-upload" id="globalUploadBtn">${t.uploadBtn}</button></div>
                <ul class="sidebar-menu">
                    <li><a href="dashboard.html" class="${activePage === 'dashboard' ? 'active' : ''}">${t.dashboard}</a></li>
                    <li><a href="repository.html" class="${activePage === 'repository' ? 'active' : ''}">${t.repository}</a></li>
                    <li><a href="courses.html" class="${activePage === 'courses' ? 'active' : ''}">${t.courses}</a></li>
                    <li><a href="users.html" class="${activePage === 'users' ? 'active' : ''}">${t.users}</a></li>
                    <li><a href="logs.html" class="${activePage === 'logs' ? 'active' : ''}">${t.logs}</a></li>
                    <li><a href="profile.html" class="${activePage === 'profile' ? 'active' : ''}">${t.profile}</a></li>
                </ul>
            </aside>
            <div class="main-wrapper">
                <header class="top-header">
                    <button class="mobile-menu-btn" id="mobileMenuBtn">
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
                    </button>
                    <div class="search-bar"><input type="text" placeholder="${t.searchPlaceholder}"></div>
                    <div class="header-actions">
                        <button id="langToggleBtn" class="btn-outline">${lang === 'en' ? 'AR' : 'EN'}</button>
                    </div>
                </header>
                <main class="content-area" id="page-content"></main>
            </div>
        </div>
    `;

    appContainer.innerHTML = layoutHTML;

    // 3. تفعيل الأزرار
    document.getElementById('langToggleBtn').addEventListener('click', () => {
        localStorage.setItem('aitu_lang', lang === 'en' ? 'ar' : 'en');
        window.location.reload();
    });
    
    // إيفنتات الـ Sidebar والـ Modal (باقي الكود القديم...)
    const mobileBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.getElementById('adminSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (mobileBtn && sidebar && overlay) {
        mobileBtn.addEventListener('click', () => { sidebar.classList.add('open'); overlay.classList.add('active'); });
        overlay.addEventListener('click', () => { sidebar.classList.remove('open'); overlay.classList.remove('active'); });
    }
}
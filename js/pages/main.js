// js/pages/main.js
import { getCurrentUser } from '../shared/auth.js';
import { getCurrentLang } from '../shared/jssharedi18n.js';

document.addEventListener('DOMContentLoaded', () => {
    const lang = getCurrentLang();
    const isAr = lang === 'ar';
    const loginBtn = document.getElementById('loginBtn');
    const user = getCurrentUser();

    if (loginBtn) {
        if (user && user.username) {
            const isManagerOrAdmin = user.role === 'Supervisor' || /\s+Manager$/i.test(user.role || '');
            const targetUrl = isManagerOrAdmin ? 'dashboard.html' : 'repository.html';
            const labelText = isManagerOrAdmin 
                ? (isAr ? 'لوحة المؤشرات' : 'Dashboard') 
                : (isAr ? 'المستودع الأكاديمي' : 'Repository');

            loginBtn.textContent = labelText;
            loginBtn.removeAttribute('data-i18n');
            loginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = targetUrl;
            });
        } else {
            loginBtn.addEventListener('click', () => {
                window.location.href = 'login.html';
            });
        }
    }

    const browseRepoBtn = document.getElementById('browseRepoBtn');
    if (browseRepoBtn) {
        browseRepoBtn.addEventListener('click', () => {
            window.location.href = 'repository.html';
        });
    }

    // Mobile Navigation Drawer Toggle on Home Page
    const mobileMenuBtn = document.getElementById('repoMobileMenuBtn');
    const indexSidebar = document.getElementById('indexSidebar');
    const indexSidebarOverlay = document.getElementById('indexSidebarOverlay');
    const closeIndexSidebarBtn = document.getElementById('closeIndexSidebarBtn');

    function toggleIndexDrawer(open) {
        if (indexSidebar && indexSidebarOverlay) {
            if (open) {
                indexSidebar.classList.add('open');
                indexSidebarOverlay.classList.add('active');
                document.body.style.overflow = 'hidden';
            } else {
                indexSidebar.classList.remove('open');
                indexSidebarOverlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        }
    }

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleIndexDrawer(true);
        });
    }
    if (closeIndexSidebarBtn) {
        closeIndexSidebarBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleIndexDrawer(false);
        });
    }
    if (indexSidebarOverlay) {
        indexSidebarOverlay.addEventListener('click', () => toggleIndexDrawer(false));
    }
    if (indexSidebar) {
        indexSidebar.querySelectorAll('.mobile-nav-item').forEach(link => {
            link.addEventListener('click', () => toggleIndexDrawer(false));
        });
    }
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') toggleIndexDrawer(false);
    });
    window.addEventListener('resize', () => {
        if (window.innerWidth > 992) {
            toggleIndexDrawer(false);
        }
    });

    // Global Search Redirect on Home Page
    const globalSearch = document.getElementById('globalSearchInput');
    if (globalSearch) {
        globalSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const searchVal = globalSearch.value.trim();
                window.location.href = `repository.html${searchVal ? '?search=' + encodeURIComponent(searchVal) : ''}`;
            }
        });
    }
});
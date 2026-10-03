// js/shared/auth.js
import { authService } from './services.js';

/**
 * Returns the current authenticated user's profile claims.
 */
export function getCurrentUser() {
    return authService.getCurrentUser();
}

/**
 * Checks whether the user has one of the allowed roles.
 * Supports: Supervisor, IT Manager, EL Manager, Mechanical Manager, Public User.
 */
export function hasRole(allowedRoles = []) {
    const user = getCurrentUser();
    if (!user) return false;
    if (allowedRoles.length === 0) return true;
    
    const standardRoles = allowedRoles.map(r => r.toLowerCase().trim());
    const userRole = (user.role || '').toLowerCase().trim();

    return standardRoles.includes(userRole) || userRole === 'supervisor';
}

/**
 * Protects a page by checking the authentication token and allowed roles.
 * Redirects to login.html if not logged in, or 403.html if roles don't match.
 */
export function protectPage(allowedRoles = []) {
    const loader = document.getElementById('global-page-loader');

    const token = localStorage.getItem('aitu_token');
    if (!token) {
        if (loader) loader.remove();
        window.location.href = 'login.html';
        return false;
    }

    const user = getCurrentUser();
    if (!user) {
        localStorage.removeItem('aitu_token');
        if (loader) loader.remove();
        window.location.href = 'login.html';
        return false;
    }

    // Check role permissions
    if (allowedRoles && allowedRoles.length > 0 && !hasRole(allowedRoles)) {
        if (loader) loader.remove();
        window.location.href = '403.html';
        return false;
    }

    const unameLower = user.username ? String(user.username).toLowerCase() : '';
    const mustChangePw = localStorage.getItem('aitu_must_change_password') === 'true' ||
                         user.mustChangePassword === true ||
                         (unameLower && localStorage.getItem('aitu_force_change_password_' + unameLower) === 'true') ||
                         (unameLower && localStorage.getItem('aitu_must_change_password_' + unameLower) === 'true');

    const currentPage = (window.location.pathname.split('/').pop() || '').toLowerCase();
    if (mustChangePw && currentPage !== 'reset-password.html') {
        if (loader) loader.remove();
        window.location.href = `reset-password.html?firstLogin=true&username=${encodeURIComponent(user.username || '')}`;
        return false;
    }

    return true;
}

/**
 * Clears the session tokens and redirects to login.html.
 */
export function logout() {
    authService.logout();
    window.location.href = 'index.html';
}

// Automatically update public navbars if user is logged in
document.addEventListener('DOMContentLoaded', () => {
    const user = getCurrentUser();
    const repoNavRight = document.querySelector('.repo-nav-right');
    if (repoNavRight && user) {
        const isAr = (localStorage.getItem('aitu_lang') || 'ar') === 'ar';
        const isManager = user.role === 'Supervisor' || /\s+Manager$/i.test(user.role || '');
        const portalUrl = isManager ? 'dashboard.html' : 'repository.html';
        const portalLabel = isManager 
            ? (isAr ? 'لوحة المؤشرات الأكاديمية' : 'Dashboard') 
            : (isAr ? 'المستودع الرقمي' : 'Repository');
        const logoutLabel = isAr ? 'تسجيل الخروج' : 'Logout';
        
        const langToggleBtn = repoNavRight.querySelector('#langToggleBtn');
        const langHtml = langToggleBtn ? langToggleBtn.outerHTML : `
            <button class="lang-toggle-btn" id="langToggleBtn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1-4-10z" />
                </svg>
                <span class="lang-btn-text">${isAr ? 'English' : 'عربي'}</span>
            </button>
        `;

        repoNavRight.innerHTML = `
            ${langHtml}
            <button class="repo-login-btn" id="goToPortalBtn" style="background:var(--primary-blue); color:white; font-weight:700; font-family:'Cairo',sans-serif;">${portalLabel}</button>
            <button class="repo-login-btn" style="background:rgba(239, 68, 68, 0.1); color:#ef4444; border:1px solid rgba(239, 68, 68, 0.2); font-weight:700; font-family:'Cairo',sans-serif;" id="publicLogoutBtn">${logoutLabel}</button>
        `;
        const goToPortalBtn = document.getElementById('goToPortalBtn');
        if (goToPortalBtn) {
            goToPortalBtn.addEventListener('click', () => {
                window.location.href = portalUrl;
            });
        }
        const logoutBtn = document.getElementById('publicLogoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                authService.logout();
                window.location.href = 'login.html';
            });
        }
        const newLangBtn = repoNavRight.querySelector('#langToggleBtn');
        if (newLangBtn) {
            newLangBtn.addEventListener('click', () => {
                const nextLang = (localStorage.getItem('aitu_lang') || 'ar') === 'ar' ? 'en' : 'ar';
                localStorage.setItem('aitu_lang', nextLang);
                window.location.reload();
            });
        }
    }
});

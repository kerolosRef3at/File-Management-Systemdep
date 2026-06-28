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
    
    // Support casing differences
    const standardRoles = allowedRoles.map(r => r.toLowerCase().trim());
    return standardRoles.includes(user.role.toLowerCase().trim()) || 
           (user.role.toLowerCase() === 'mechanic manager' && standardRoles.includes('mechanical manager'));
}

/**
 * Protects a page by checking the authentication token and allowed roles.
 * Redirects to login.html if not logged in, or 403.html if roles don't match.
 */
export function protectPage(allowedRoles = []) {
    const token = localStorage.getItem('aitu_token');
    if (!token) {
        window.location.href = 'login.html';
        return false;
    }

    const user = getCurrentUser();
    if (!user) {
        localStorage.removeItem('aitu_token');
        window.location.href = 'login.html';
        return false;
    }

    if (allowedRoles.length > 0 && !hasRole(allowedRoles)) {
        window.location.href = '403.html';
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

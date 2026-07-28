// js/pages/login.js
import { authService, logService } from '../shared/services.js';
import { showAlert } from '../shared/components.js';

const LOGIN_ATTEMPTS_KEY = 'aitu_login_attempts';
const LOGIN_LOCKOUT_KEY = 'aitu_login_lockout';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 5 * 60 * 1000; // 5 minutes

function checkLockout() {
    const lockoutUntil = parseInt(localStorage.getItem(LOGIN_LOCKOUT_KEY) || '0', 10);
    if (lockoutUntil > Date.now()) {
        const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
        return { locked: true, remaining };
    }
    localStorage.removeItem(LOGIN_LOCKOUT_KEY);
    return { locked: false };
}

function recordFailedAttempt() {
    let attempts = parseInt(localStorage.getItem(LOGIN_ATTEMPTS_KEY) || '0', 10);
    attempts++;
    localStorage.setItem(LOGIN_ATTEMPTS_KEY, String(attempts));
    
    if (attempts >= MAX_ATTEMPTS) {
        localStorage.setItem(LOGIN_LOCKOUT_KEY, String(Date.now() + LOCKOUT_DURATION));
        localStorage.setItem(LOGIN_ATTEMPTS_KEY, '0');
        return true;
    }
    return false;
}

function clearAttempts() {
    localStorage.removeItem(LOGIN_ATTEMPTS_KEY);
    localStorage.removeItem(LOGIN_LOCKOUT_KEY);
}

document.addEventListener('DOMContentLoaded', () => {
    // Hide global loader if present
    const loader = document.getElementById('global-page-loader');
    if (loader) {
        loader.classList.add('hide-loader');
        setTimeout(() => loader.remove(), 400);
    }

    // Auto-redirect if already logged in
    try {
        const user = authService.getCurrentUser();
        if (user && user.username && user.role && user.role !== 'Public User') {
            if (user.role === 'Supervisor' || user.role.endsWith('Manager')) {
                window.location.href = 'dashboard.html';
                return;
            } else {
                window.location.href = 'repository.html';
                return;
            }
        }
    } catch (e) {
        console.warn('Login auto-redirect check failed:', e);
    }

    const loginForm = document.getElementById('loginForm');
    const togglePasswordBtn = document.getElementById('togglePasswordBtn');
    const passwordInput = document.getElementById('password');
    const usernameInput = document.getElementById('username');
    const alertContainer = document.getElementById('errorMessage');
    const submitBtn = document.getElementById('submitBtn');

    // 1. Password eye visibility toggle
    if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.addEventListener('click', () => {
            const isPassword = passwordInput.getAttribute('type') === 'password';
            passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
            togglePasswordBtn.style.color = isPassword ? 'var(--primary-blue)' : 'var(--text-gray)';
        });
    }

    // 2. Submit form and validate fields
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            
            // Hide previous alerts
            if (alertContainer) {
                alertContainer.style.display = 'none';
            }

            const lockoutStatus = checkLockout();
            if (lockoutStatus.locked) {
                showAlert(alertContainer, `Too many failed login attempts. Please wait ${lockoutStatus.remaining} seconds before trying again.`, 'error');
                return;
            }

            const usernameValue = usernameInput.value.trim();
            const passwordValue = passwordInput.value;

            // Form validations
            if (usernameValue.includes('@')) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(usernameValue)) {
                    showAlert(alertContainer, 'Please enter a valid email address.', 'error');
                    return;
                }
            } else {
                if (usernameValue.length < 3) {
                    showAlert(alertContainer, 'Username must be at least 3 characters long.', 'error');
                    return;
                }
            }

            if (passwordValue.length < 6) {
                showAlert(alertContainer, 'Password must be at least 6 characters.', 'error');
                return;
            }

            // Set loading state
            const originalBtnText = submitBtn.innerText;
            submitBtn.innerText = 'Signing In...';
            submitBtn.disabled = true;

            try {
                // POST /api/Auth/login
                const response = await authService.login(usernameValue, passwordValue);
                
                if (response && response.token) {
                    clearAttempts();
                    localStorage.setItem('aitu_token', response.token);
                    localStorage.setItem('aitu_role', response.role);
                    localStorage.setItem('aitu_username', response.username);

                    // Log login event
                    logService.addLog(response.username, response.role, 'Login', 'Admin Portal');

                    const unameLower = String(response.username || usernameValue).toLowerCase();
                    const forcePw = response.mustChangePassword === true ||
                                    response.mustChangePassword === 'true' ||
                                    localStorage.getItem('aitu_force_change_password_' + unameLower) === 'true' ||
                                    localStorage.getItem('aitu_must_change_password_' + unameLower) === 'true';

                    if (forcePw) {
                        localStorage.setItem('aitu_must_change_password', 'true');
                        localStorage.setItem('aitu_first_login_username', response.username);
                        window.location.href = `reset-password.html?firstLogin=true&username=${encodeURIComponent(response.username)}`;
                        return;
                    }

                    const isManagerOrAdmin = response.role === 'Supervisor' || /\s+Manager$/i.test(response.role || '');
                    if (isManagerOrAdmin) {
                        window.location.href = 'dashboard.html';
                    } else {
                        window.location.href = 'repository.html';
                    }
                }
            } catch (error) {
                const isNowLocked = recordFailedAttempt();
                if (isNowLocked) {
                    showAlert(alertContainer, 'Too many failed attempts. Account login locked for 5 minutes.', 'error');
                } else {
                    showAlert(alertContainer, error.message || 'Login failed. Please check credentials.', 'error');
                }
            } finally {
                submitBtn.innerText = originalBtnText;
                submitBtn.disabled = false;
            }
        });
    }
});
// js/pages/login.js
import { authService } from '../shared/services.js';
import { showAlert } from '../shared/components.js';

document.addEventListener('DOMContentLoaded', () => {
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
                // TODO: POST /api/Auth/login
                const response = await authService.login(usernameValue, passwordValue);
                
               if (response && response.token) {
    localStorage.setItem('aitu_token', response.token);
    localStorage.setItem('aitu_role', response.role);
    localStorage.setItem('aitu_username', response.username);

    if (response.role === 'Supervisor' ||
        response.role === 'IT Manager' ||
        response.role === 'EL Manager' ||
        response.role === 'Mechanic Manager') {
        window.location.href = 'dashboard.html';
    } else {
        window.location.href = 'repository.html';
    }
}
            } catch (error) {
                showAlert(alertContainer, error.message || 'Login failed. Please check credentials.', 'error');
            } finally {
                submitBtn.innerText = originalBtnText;
                submitBtn.disabled = false;
            }
        });
    }

    // 3. Stats counter animation (only for login page)
    const statsNumEls = document.querySelectorAll('.auth-stat-num');
    statsNumEls.forEach(el => {
        const originalText = el.textContent.trim();
        const hasPlus = originalText.includes('+');
        const target = parseInt(originalText, 10);
        if (isNaN(target)) return;

        // Set to 0 immediately
        el.textContent = '0' + (hasPlus ? '+' : '');

        let current = 0;
        const duration = 600; // 0.6 seconds (very fast)
        const frameRate = 1000 / 60; // 60 fps
        const totalFrames = Math.round(duration / frameRate);
        const increment = target / totalFrames;
        let frame = 0;

        const counter = setInterval(() => {
            frame++;
            current += increment;
            if (frame >= totalFrames) {
                clearInterval(counter);
                el.textContent = originalText;
            } else {
                el.textContent = Math.floor(current) + (hasPlus ? '+' : '');
            }
        }, frameRate);
    });
});
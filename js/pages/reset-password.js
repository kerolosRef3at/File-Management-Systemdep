// js/pages/reset-password.js
import { authService } from '../shared/services.js';
import { showAlert } from '../shared/components.js';

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const userEmail = urlParams.get('email');
    const resetCode = urlParams.get('code');

    const form = document.getElementById('resetPasswordForm');
    const newPwdInput = document.getElementById('newPassword');
    const confirmPwdInput = document.getElementById('confirmPassword');
    const submitBtn = document.getElementById('submitBtn');
    const alertBox = document.getElementById('resetAlert');
    const matchMessage = document.getElementById('matchMessage');

    // 1. Password eye visibility toggle
    document.querySelectorAll('.toggle-password').forEach(icon => {
        icon.addEventListener('click', (e) => {
            const input = e.currentTarget.previousElementSibling;
            if (input.type === 'password') {
                input.type = 'text';
                e.currentTarget.style.opacity = '0.5'; 
            } else {
                input.type = 'password';
                e.currentTarget.style.opacity = '1';
            }
        });
    });

    // 2. Real-time validation for password requirements
    const reqLength = document.getElementById('req-length');
    const reqUpper = document.getElementById('req-upper');
    const reqNumber = document.getElementById('req-number');
    const reqSpecial = document.getElementById('req-special');

    let isPasswordValid = false;

    if (newPwdInput) {
        newPwdInput.addEventListener('input', (e) => {
            const val = e.target.value;

            const lengthValid = val.length >= 8;
            lengthValid ? reqLength.classList.add('valid') : reqLength.classList.remove('valid');

            const upperLowerValid = /[A-Z]/.test(val) && /[a-z]/.test(val);
            upperLowerValid ? reqUpper.classList.add('valid') : reqUpper.classList.remove('valid');

            const numberValid = /[0-9]/.test(val);
            numberValid ? reqNumber.classList.add('valid') : reqNumber.classList.remove('valid');

            const specialValid = /[^A-Za-z0-9]/.test(val);
            specialValid ? reqSpecial.classList.add('valid') : reqSpecial.classList.remove('valid');

            isPasswordValid = lengthValid && upperLowerValid && numberValid && specialValid;
            checkMatch();
        });
    }

    if (confirmPwdInput) {
        confirmPwdInput.addEventListener('input', checkMatch);
    }

    function checkMatch() {
        if (!confirmPwdInput || confirmPwdInput.value === '') {
            if (matchMessage) matchMessage.style.display = 'none';
            return;
        }

        if (newPwdInput.value === confirmPwdInput.value) {
            matchMessage.innerText = 'Passwords match!';
            matchMessage.style.color = '#10b981';
            matchMessage.style.display = 'block';
        } else {
            matchMessage.innerText = 'Passwords do not match.';
            matchMessage.style.color = '#ef4444';
            matchMessage.style.display = 'block';
        }
    }

    const isFirstLogin = urlParams.get('firstLogin') === 'true' || 
                         localStorage.getItem('aitu_must_change_password') === 'true';

    if (isFirstLogin) {
        const titleEl = document.querySelector('[data-i18n="reset_title"]');
        const descEl = document.querySelector('[data-i18n="reset_desc"]');
        const isAr = localStorage.getItem('aitu_lang') === 'ar' || document.documentElement.getAttribute('dir') === 'rtl';
        if (titleEl) {
            titleEl.textContent = isAr ? 'إنشاء كلمة مرور جديدة' : 'Create New Password';
        }
        if (descEl) {
            descEl.textContent = isAr ? 'أدخل كلمة مرور جديدة لحسابك بعد أول تسجيل دخول. تأكد أنها آمنة وسهلة التذكر.' : 'Enter a new password for your account upon your first login. Make sure it is secure and easy to remember.';
        }
    }

    // 3. Form submission
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!isPasswordValid) {
                showAlert(alertBox, 'Please meet all password requirements first.', 'error');
                return;
            }

            if (newPwdInput.value !== confirmPwdInput.value) {
                showAlert(alertBox, 'Passwords do not match.', 'error');
                return;
            }

            submitBtn.disabled = true;
            submitBtn.innerText = 'Updating Password...';
            alertBox.style.display = 'none';

            try {
                if (isFirstLogin) {
                    const currentUser = authService.getCurrentUser();
                    const targetUsername = urlParams.get('username') || 
                                           localStorage.getItem('aitu_first_login_username') || 
                                           currentUser?.username || '';

                    // Clear force password flags
                    localStorage.removeItem('aitu_must_change_password');
                    localStorage.removeItem('aitu_first_login_username');
                    if (targetUsername) {
                        const unameLower = String(targetUsername).toLowerCase();
                        localStorage.removeItem('aitu_force_change_password_' + unameLower);
                        localStorage.removeItem('aitu_must_change_password_' + unameLower);

                        const created = JSON.parse(localStorage.getItem('aitu_created_users') || '[]');
                        const target = created.find(u => String(u.username || '').toLowerCase() === unameLower);
                        if (target) {
                            target.mustChangePassword = false;
                            localStorage.setItem('aitu_created_users', JSON.stringify(created));
                        }
                    }

                    const isAr = localStorage.getItem('aitu_lang') === 'ar' || document.documentElement.getAttribute('dir') === 'rtl';
                    showAlert(alertBox, isAr ? 'تم إنشاء كلمة المرور الجديدة بنجاح! جاري التوجيه...' : 'New password created successfully! Redirecting...', 'success');

                    setTimeout(() => {
                        const role = currentUser?.role || localStorage.getItem('aitu_role') || '';
                        const isManagerOrAdmin = role === 'Supervisor' || /\s+Manager$/i.test(role);
                        if (currentUser && currentUser.username) {
                            window.location.href = isManagerOrAdmin ? 'dashboard.html' : 'repository.html';
                        } else {
                            window.location.href = 'login.html';
                        }
                    }, 1400);
                } else {
                    await authService.resetPassword(userEmail, resetCode, newPwdInput.value);
                    
                    showAlert(alertBox, 'Password updated successfully! Redirecting to login...', 'success');

                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 2000);
                }
            } catch (error) {
                showAlert(alertBox, error.message || 'Failed to update password.', 'error');
                submitBtn.disabled = false;
                submitBtn.innerText = 'Confirm';
            }
        });
    }
});
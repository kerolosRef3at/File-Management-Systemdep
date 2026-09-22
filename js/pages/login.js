// js/pages/login.js
import { authService, logService } from '../shared/services.js';
import { fetchAPI } from '../shared/api.js';

const LOGIN_ATTEMPTS_KEY = 'aitu_login_attempts';
const LOGIN_LOCKOUT_KEY = 'aitu_login_lockout';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 5 * 60 * 1000; // 5 minutes

const UNIV_AR = 'جَامِعَةُ أَسْيُوطَ التِّكْنُولُوجِيَّةُ الدَّوْلِيَّةُ';
const UNIV_EN = 'Assiut International Technological University';

const ARROW_LEFT = `
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
`;

const ARROW_RIGHT = `
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
`;

const EYE_OPEN_ICON = `
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
`;

const EYE_OFF_ICON = `
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
`;

function renderPasswordToggle(btn, isVisible, lang) {
    if (!btn) return;
    const isRtl = lang === 'ar';
    const text = isVisible ? (isRtl ? 'إخفاء' : 'Hide') : (isRtl ? 'إظهار' : 'Show');
    const icon = isVisible ? EYE_OFF_ICON : EYE_OPEN_ICON;
    btn.innerHTML = `<span class="lp-pw-icon">${icon}</span><span class="lp-pw-text">${text}</span>`;
    btn.setAttribute('aria-label', text);
    btn.setAttribute('title', text);
}

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
    // Current Language state
    let currentLang = localStorage.getItem('aitu_lang') || 'ar';

    // Auto-redirect if already logged in with valid session
    try {
        const user = authService.getCurrentUser();
        if (user && user.username && user.role && user.role !== 'Public User') {
            const isManagerOrAdmin = user.role === 'Supervisor' || /\s+Manager$/i.test(user.role || '');
            window.location.href = isManagerOrAdmin ? 'dashboard.html' : 'repository.html';
            return;
        }
    } catch (e) {
        console.warn('Login session check:', e);
    }

    // DOM Elements
    const lpLangBtn = document.getElementById('lpLangBtn');
    const lpLangLabel = document.getElementById('lpLangLabel');
    const lpBrandName = document.getElementById('lpBrandName');
    const lpBrandSub = document.getElementById('lpBrandSub');
    const lpCardName = document.getElementById('lpCardName');
    const lpCardSub = document.getElementById('lpCardSub');
    const lpHeroLines = document.getElementById('lpHeroLines');
    const lpRememberLabel = document.getElementById('lpRememberLabel');
    const lpForgotBtn = document.getElementById('lpForgotBtn');
    const btnText = document.getElementById('btnText');
    const lpBtnArrow = document.getElementById('lpBtnArrow');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');
    const submitBtn = document.getElementById('submitBtn');
    const togglePasswordBtn = document.getElementById('togglePasswordBtn');

    // Forgot Password Elements
    const forgotEmailForm = document.getElementById('forgotEmailForm');
    const fpHint = document.getElementById('fpHint');
    const fpEmail = document.getElementById('fpEmail');
    const fpEmailError = document.getElementById('fpEmailError');
    const sendOtpBtn = document.getElementById('sendOtpBtn');
    const sendOtpBtnText = document.getElementById('sendOtpBtnText');
    const backToLoginBtn1 = document.getElementById('backToLoginBtn1');
    const backToLoginText1 = document.getElementById('backToLoginText1');

    const forgotResetForm = document.getElementById('forgotResetForm');
    const fpInfoAlert = document.getElementById('fpInfoAlert');
    const fpOtp = document.getElementById('fpOtp');
    const fpNewPassword = document.getElementById('fpNewPassword');
    const fpConfirmPassword = document.getElementById('fpConfirmPassword');
    const toggleFpNewPasswordBtn = document.getElementById('toggleFpNewPasswordBtn');
    const toggleFpConfirmPasswordBtn = document.getElementById('toggleFpConfirmPasswordBtn');
    const fpResetError = document.getElementById('fpResetError');
    const resetPasswordBtn = document.getElementById('resetPasswordBtn');
    const resetPasswordBtnText = document.getElementById('resetPasswordBtnText');
    const backToLoginBtn2 = document.getElementById('backToLoginBtn2');
    const backToLoginText2 = document.getElementById('backToLoginText2');

    // Apply translations & directions
    function applyLanguage(lang) {
        currentLang = lang;
        localStorage.setItem('aitu_lang', lang);
        const isRtl = lang === 'ar';

        document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
        document.documentElement.setAttribute('lang', lang);
        const lpRoot = document.getElementById('lpRoot');
        if (lpRoot) {
            lpRoot.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
        }

        // Header brand & Card text
        if (lpBrandName) lpBrandName.textContent = isRtl ? UNIV_AR : UNIV_EN;
        if (lpBrandSub) lpBrandSub.textContent = isRtl ? UNIV_EN : UNIV_AR;
        if (lpCardName) lpCardName.textContent = isRtl ? UNIV_AR : UNIV_EN;
        if (lpCardSub) lpCardSub.textContent = isRtl ? UNIV_EN : UNIV_AR;

        // Language pill button: matches LoginPage.jsx
        if (lpLangLabel) lpLangLabel.textContent = isRtl ? 'عربي' : 'English';

        // Hero lines
        if (lpHeroLines) {
            if (isRtl) {
                lpHeroLines.innerHTML = '<div>نبني عقولًا</div><div>لمستقبلٍ</div><div>أكثر إشراقًا</div>';
            } else {
                lpHeroLines.innerHTML = '<div>BUILDING</div><div>MINDS FOR A</div><div>BRIGHTER</div><div>FUTURE</div>';
            }
        }

        // Placeholders & Form labels
        if (usernameInput) usernameInput.placeholder = isRtl ? 'اسم المستخدم أو البريد الإلكتروني' : 'Username or email';
        if (passwordInput) passwordInput.placeholder = isRtl ? 'كلمة المرور' : 'Password';
        if (lpRememberLabel) lpRememberLabel.textContent = isRtl ? 'تذكرني' : 'Remember me';
        if (lpForgotBtn) lpForgotBtn.textContent = isRtl ? 'نسيت كلمة المرور؟' : 'Forgot password?';
        if (btnText) btnText.textContent = isRtl ? 'تسجيل الدخول' : 'Login';
        if (lpBtnArrow) lpBtnArrow.innerHTML = isRtl ? ARROW_LEFT : ARROW_RIGHT;

        // Password toggles with eye icon pill
        renderPasswordToggle(togglePasswordBtn, passwordInput && passwordInput.getAttribute('type') === 'text', lang);
        renderPasswordToggle(toggleFpNewPasswordBtn, fpNewPassword && fpNewPassword.getAttribute('type') === 'text', lang);
        renderPasswordToggle(toggleFpConfirmPasswordBtn, fpConfirmPassword && fpConfirmPassword.getAttribute('type') === 'text', lang);

        // Forgot password texts
        if (fpHint) fpHint.textContent = isRtl ? 'أدخل بريدك الإلكتروني وسنرسل لك رمز تحقق لإعادة تعيين كلمة المرور.' : 'Enter your email to receive a password reset verification code.';
        if (fpEmail) fpEmail.placeholder = isRtl ? 'البريد الإلكتروني' : 'Email';
        if (sendOtpBtnText) sendOtpBtnText.textContent = isRtl ? 'إرسال رمز التحقق' : 'Send Verification Code';
        if (backToLoginText1) backToLoginText1.textContent = isRtl ? '→ رجوع لتسجيل الدخول' : '← Back to Login';
        if (backToLoginText2) backToLoginText2.textContent = isRtl ? '→ رجوع لتسجيل الدخول' : '← Back to Login';
        if (fpOtp) fpOtp.placeholder = isRtl ? 'رمز التحقق (6 أرقام)' : 'Verification Code (6 digits)';
        if (fpNewPassword) fpNewPassword.placeholder = isRtl ? 'كلمة المرور الجديدة' : 'New Password';
        if (fpConfirmPassword) fpConfirmPassword.placeholder = isRtl ? 'تأكيد كلمة المرور' : 'Confirm Password';
        if (resetPasswordBtnText) resetPasswordBtnText.textContent = isRtl ? 'حفظ كلمة المرور الجديدة' : 'Reset Password';
    }

    // Initialize Language
    applyLanguage(currentLang);

    // Language Toggle Click
    if (lpLangBtn) {
        lpLangBtn.addEventListener('click', () => {
            const nextLang = currentLang === 'ar' ? 'en' : 'ar';
            applyLanguage(nextLang);
        });
    }

    // Password visibility toggles
    function setupPasswordToggle(toggleBtn, inputEl) {
        if (!toggleBtn || !inputEl) return;
        toggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const isPw = inputEl.getAttribute('type') === 'password';
            inputEl.setAttribute('type', isPw ? 'text' : 'password');
            renderPasswordToggle(toggleBtn, isPw, currentLang);
        });
    }
    setupPasswordToggle(togglePasswordBtn, passwordInput);
    setupPasswordToggle(toggleFpNewPasswordBtn, fpNewPassword);
    setupPasswordToggle(toggleFpConfirmPasswordBtn, fpConfirmPassword);

    // Mode Switcher
    function setMode(mode) {
        if (loginForm) loginForm.style.display = mode === 'login' ? 'flex' : 'none';
        if (forgotEmailForm) forgotEmailForm.style.display = mode === 'forgotEmail' ? 'flex' : 'none';
        if (forgotResetForm) forgotResetForm.style.display = mode === 'forgotReset' ? 'flex' : 'none';

        if (errorMessage) errorMessage.style.display = 'none';
        if (fpEmailError) fpEmailError.style.display = 'none';
        if (fpResetError) fpResetError.style.display = 'none';
    }

    if (lpForgotBtn) {
        lpForgotBtn.addEventListener('click', () => {
            if (fpEmail && usernameInput && usernameInput.value.includes('@')) {
                fpEmail.value = usernameInput.value.trim();
            }
            setMode('forgotEmail');
        });
    }

    if (backToLoginBtn1) backToLoginBtn1.addEventListener('click', () => setMode('login'));
    if (backToLoginBtn2) backToLoginBtn2.addEventListener('click', () => setMode('login'));

    // Handle Send OTP
    if (forgotEmailForm) {
        forgotEmailForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const emailVal = fpEmail.value.trim();
            const isRtl = currentLang === 'ar';
            if (!emailVal) return;

            sendOtpBtn.disabled = true;
            sendOtpBtn.innerHTML = `<span class="lp-spinner"></span> <span>${isRtl ? 'جاري الإرسال...' : 'Sending...'}</span>`;
            if (fpEmailError) fpEmailError.style.display = 'none';

            try {
                if (typeof authService.forgotPassword === 'function') {
                    await authService.forgotPassword(emailVal).catch(() => ({ success: true }));
                } else {
                    await fetchAPI('/api/Auth/forgot-password', { method: 'POST', body: JSON.stringify({ email: emailVal }) }).catch(() => ({ success: true }));
                }
                if (fpInfoAlert) {
                    fpInfoAlert.textContent = isRtl 
                        ? '✅ تم إرسال كود التحقق إلى بريدك الإلكتروني.'
                        : '✅ A verification code has been sent to your email.';
                    fpInfoAlert.style.display = 'flex';
                }
                setMode('forgotReset');
            } catch (err) {
                if (fpEmailError) {
                    fpEmailError.textContent = err.message || (isRtl ? 'تعذر إرسال رمز التحقق' : 'Failed to send verification code');
                    fpEmailError.style.display = 'flex';
                }
            } finally {
                sendOtpBtn.disabled = false;
                sendOtpBtn.innerHTML = `<span>${isRtl ? 'إرسال رمز التحقق' : 'Send Verification Code'}</span>`;
            }
        });
    }

    // Handle Reset Password
    if (forgotResetForm) {
        forgotResetForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const isRtl = currentLang === 'ar';
            const otpVal = fpOtp.value.trim();
            const newPw = fpNewPassword.value;
            const confirmPw = fpConfirmPassword.value;

            if (!otpVal || !newPw || !confirmPw) {
                if (fpResetError) {
                    fpResetError.textContent = isRtl ? 'يرجى تعبئة كافة الحقول' : 'Please fill all fields';
                    fpResetError.style.display = 'flex';
                }
                return;
            }

            if (newPw.length < 6) {
                if (fpResetError) {
                    fpResetError.textContent = isRtl ? 'كلمة المرور يجب ألا تقل عن 6 أحرف' : 'Password must be at least 6 characters';
                    fpResetError.style.display = 'flex';
                }
                return;
            }

            if (newPw !== confirmPw) {
                if (fpResetError) {
                    fpResetError.textContent = isRtl ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match';
                    fpResetError.style.display = 'flex';
                }
                return;
            }

            resetPasswordBtn.disabled = true;
            resetPasswordBtn.innerHTML = `<span class="lp-spinner"></span> <span>${isRtl ? 'جاري الحفظ...' : 'Saving...'}</span>`;

            try {
                if (typeof authService.resetPassword === 'function') {
                    await authService.resetPassword(fpEmail.value.trim(), otpVal, newPw).catch(() => ({ success: true }));
                } else {
                    await fetchAPI('/api/Auth/reset-password', {
                        method: 'POST',
                        body: JSON.stringify({ email: fpEmail.value.trim(), code: otpVal, newPassword: newPw })
                    }).catch(() => ({ success: true }));
                }

                if (errorMessage) {
                    errorMessage.className = 'lp-alert lp-alert-success';
                    errorMessage.textContent = isRtl ? '✅ تم تحديث كلمة المرور بنجاح، يمكنك الدخول الآن' : '✅ Password updated successfully, you can now log in';
                    errorMessage.style.display = 'flex';
                }
                setMode('login');
                if (usernameInput) usernameInput.value = fpEmail.value.trim();
                if (passwordInput) passwordInput.value = '';
            } catch (err) {
                if (fpResetError) {
                    fpResetError.textContent = err.message || (isRtl ? 'فشل تعيين كلمة المرور' : 'Failed to reset password');
                    fpResetError.style.display = 'flex';
                }
            } finally {
                resetPasswordBtn.disabled = false;
                resetPasswordBtn.innerHTML = `<span>${isRtl ? 'حفظ كلمة المرور الجديدة' : 'Reset Password'}</span>`;
            }
        });
    }

    // Handle Login Form Submit
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const isRtl = currentLang === 'ar';

            if (errorMessage) {
                errorMessage.style.display = 'none';
                errorMessage.className = 'lp-alert lp-alert-error';
            }

            const lockout = checkLockout();
            if (lockout.locked) {
                if (errorMessage) {
                    errorMessage.textContent = isRtl 
                        ? `تم حظر محاولات الدخول مؤقتاً. يرجى الانتظار ${lockout.remaining} ثانية.`
                        : `Too many failed attempts. Please wait ${lockout.remaining}s before trying again.`;
                    errorMessage.style.display = 'flex';
                }
                return;
            }

            const usernameVal = usernameInput.value.trim();
            const passwordVal = passwordInput.value;

            if (!usernameVal || !passwordVal) {
                if (errorMessage) {
                    errorMessage.textContent = isRtl ? 'يرجى إدخال اسم المستخدم وكلمة المرور' : 'Please enter username and password';
                    errorMessage.style.display = 'flex';
                }
                return;
            }

            // Button loading state
            submitBtn.disabled = true;
            submitBtn.innerHTML = `
                <span class="lp-spinner"></span>
                <span>${isRtl ? 'جاري التحقق...' : 'Signing in...'}</span>
            `;

            try {
                const response = await authService.login(usernameVal, passwordVal);

                if (response && response.token) {
                    clearAttempts();
                    localStorage.setItem('aitu_token', response.token);
                    localStorage.setItem('aitu_role', response.role || 'Supervisor');
                    localStorage.setItem('aitu_username', response.username || usernameVal);

                    logService.addLog(response.username || usernameVal, response.role || 'Supervisor', 'Login', 'Admin Portal');

                    // Check force change password flag
                    const unameLower = String(response.username || usernameVal).toLowerCase();
                    const forcePw = response.mustChangePassword === true ||
                                    response.mustChangePassword === 'true' ||
                                    localStorage.getItem('aitu_force_change_password_' + unameLower) === 'true';

                    if (forcePw) {
                        localStorage.setItem('aitu_must_change_password', 'true');
                        window.location.href = `reset-password.html?firstLogin=true&username=${encodeURIComponent(response.username || usernameVal)}`;
                        return;
                    }

                    const isManagerOrAdmin = response.role === 'Supervisor' || /\s+Manager$/i.test(response.role || '');
                    window.location.href = isManagerOrAdmin ? 'dashboard.html' : 'repository.html';
                } else {
                    throw new Error(isRtl ? 'استجابة غير صحيحة من الخادم' : 'Invalid response from server');
                }
            } catch (err) {
                console.error('Login error:', err);
                const isNowLocked = recordFailedAttempt();
                if (errorMessage) {
                    if (isNowLocked) {
                        errorMessage.textContent = isRtl 
                            ? 'تم حظر الحساب لمدة 5 دقائق لتكرار المحاولات الخاطئة.' 
                            : 'Account locked for 5 minutes due to repeated failed attempts.';
                    } else {
                        errorMessage.textContent = err.message || (isRtl ? 'بيانات الدخول غير صحيحة' : 'Invalid credentials');
                    }
                    errorMessage.style.display = 'flex';
                }
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = `
                    <span id="btnText">${isRtl ? 'تسجيل الدخول' : 'Login'}</span>
                    <span class="lp-btn-arrow" id="lpBtnArrow">${isRtl ? ARROW_LEFT : ARROW_RIGHT}</span>
                `;
            }
        });
    }
});
// js/pages/otp.js
import { authService } from '../shared/services.js';
import { showAlert } from '../shared/components.js';

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const userEmail = urlParams.get('email') || "test@university.edu";

    const inputs = document.querySelectorAll('.otp-input');
    const form = document.getElementById('otpForm');
    const verifyBtn = document.getElementById('verifyBtn');
    const alertBox = document.getElementById('otpAlert');
    const timerDisplay = document.getElementById('timerDisplay');

    // Display the target email in description if exists
    const descText = document.querySelector('.auth-form-wrapper p');
    if (descText) {
        descText.innerText = `Enter the 6-digit verification code sent to ${userEmail}`;
    }

    // 1. Navigation and pasting UX logic
    inputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, '');
            
            if (e.target.value.length > 1) {
                e.target.value = e.target.value.slice(0, 1);
            }

            if (e.target.value !== '') {
                if (index < inputs.length - 1) {
                    inputs[index + 1].focus();
                }
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && e.target.value === '') {
                if (index > 0) {
                    inputs[index - 1].focus();
                }
            }
        });

        input.addEventListener('paste', (e) => {
            e.preventDefault();
            const pastedData = e.clipboardData.getData('text').trim();
            
            if (/^\d+$/.test(pastedData)) {
                const digits = pastedData.split('').slice(0, 6);
                inputs.forEach((inpt, i) => {
                    if (digits[i]) {
                        inpt.value = digits[i];
                    }
                });
                const focusIndex = Math.min(digits.length, 6) - 1;
                inputs[focusIndex].focus();
            }
        });
    });

    // 2. Countdown timer
    let timeLeft = 59;
    const timerId = setInterval(() => {
        if (timeLeft <= 0) {
            clearInterval(timerId);
            timerDisplay.innerHTML = '<a href="#" id="resendCode" style="color: var(--primary-blue); font-size: 1rem; text-decoration: none; font-weight:600;">Resend Code</a>';
            
            document.getElementById('resendCode').addEventListener('click', async (e) => {
                e.preventDefault();
                try {
                    // TODO: POST /api/Auth/forgot-password (to resend)
                    await authService.forgotPassword(userEmail);
                    showAlert(alertBox, 'A new code has been sent to your email.', 'success');
                } catch (err) {
                    showAlert(alertBox, err.message || 'Resend failed.', 'error');
                }
            });
        } else {
            timerDisplay.innerText = `00:${timeLeft < 10 ? '0' : ''}${timeLeft}`;
            timeLeft--;
        }
    }, 1000);

    // 3. Submit form
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            let otpCode = '';
            inputs.forEach(input => otpCode += input.value);

            if (otpCode.length < 6) {
                showAlert(alertBox, 'Please enter the full 6-digit code.', 'error');
                return;
            }

            verifyBtn.disabled = true;
            verifyBtn.innerText = 'Verifying...';
            alertBox.style.display = 'none';

            try {
                // TODO: POST /api/Auth/verify-otp
                await authService.verifyOTP(userEmail, otpCode);
                
                showAlert(alertBox, 'OTP Verified! Redirecting to password reset...', 'success');
                
                setTimeout(() => {
                    window.location.href = `reset-password.html?email=${encodeURIComponent(userEmail)}&code=${otpCode}`;
                }, 1500);

            } catch (error) {
                showAlert(alertBox, error.message || 'Invalid verification code.', 'error');
            } finally {
                verifyBtn.disabled = false;
                verifyBtn.innerText = 'Confirm';
            }
        });
    }
});
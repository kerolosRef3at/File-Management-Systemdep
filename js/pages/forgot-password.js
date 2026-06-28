// js/pages/forgot-password.js
import { authService } from '../shared/services.js';
import { showAlert } from '../shared/components.js';

document.addEventListener('DOMContentLoaded', () => {
    const forgotForm = document.getElementById('forgotPasswordForm');
    const sendBtn = document.getElementById('confirmBtn');
    const alertBox = document.getElementById('forgotAlert');

    if (forgotForm) {
        forgotForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('forgotEmail').value.trim();

            if (!email) {
                showAlert(alertBox, 'Please enter your email address.', 'error');
                return;
            }

            sendBtn.disabled = true;
            sendBtn.innerText = 'Sending OTP...';
            alertBox.style.display = 'none';

            try {
                // TODO: POST /api/Auth/forgot-password
                await authService.forgotPassword(email);
                
                showAlert(alertBox, 'Verification code sent! Redirecting to verification page...', 'success');
                
                setTimeout(() => {
                    window.location.href = `otp.html?email=${encodeURIComponent(email)}`;
                }, 1500);

            } catch (error) {
                showAlert(alertBox, error.message || 'Something went wrong. Please try again.', 'error');
            } finally {
                sendBtn.disabled = false;
                sendBtn.innerText = 'Confirm';
            }
        });
    }
});
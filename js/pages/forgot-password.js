// js/pages/forgot-password.js
import { fetchAPI } from '../shared/api.js';

document.addEventListener('DOMContentLoaded', () => {
    const forgotForm = document.getElementById('forgotPasswordForm');
    const sendBtn = document.getElementById('confirmBtn'); // تم التعديل هنا
    const alertBox = document.getElementById('forgotAlert');

    function showAlert(message, type) {
        alertBox.innerText = message;
        alertBox.className = `form-alert ${type}`;
        alertBox.style.display = 'block';
    }

    forgotForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('forgotEmail').value;

        sendBtn.disabled = true;
        sendBtn.innerText = 'Sending...';
        alertBox.style.display = 'none';

        try {
            // محاكاة إرسال الـ API
            setTimeout(() => {
                sendBtn.disabled = false;
                sendBtn.innerText = 'Confirm';
                // الانتقال لصفحة الـ OTP مع الإيميل
                window.location.href = `otp.html?email=${encodeURIComponent(email)}`;
            }, 1000);

        } catch (error) {
            showAlert(error.message || 'Something went wrong. Please try again.', 'error');
            sendBtn.disabled = false;
            sendBtn.innerText = 'Confirm';
        }
    });
});
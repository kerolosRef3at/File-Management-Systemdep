// js/pages/login.js
import { fetchAPI } from '../shared/api.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const togglePasswordBtn = document.getElementById('togglePasswordBtn');
    const passwordInput = document.getElementById('password');
    const usernameInput = document.getElementById('username');
    const errorMessage = document.getElementById('errorMessage');
    const submitBtn = document.getElementById('submitBtn');

    // 1. تشغيل زر إظهار/إخفاء الباسورد
    if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.addEventListener('click', () => {
            const isPassword = passwordInput.getAttribute('type') === 'password';
            passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
            
            // تغيير لون الأيقونة لما الباسورد يكون ظاهر
            togglePasswordBtn.style.color = isPassword ? 'var(--primary-blue)' : 'var(--text-gray)';
        });
    }

    // دالة مساعدة لإظهار رسائل الخطأ
    function showError(msg) {
        errorMessage.innerText = msg;
        errorMessage.style.display = 'block';
    }

    // 2. التحقق الذكي (Smart Validation) وإرسال الفورم
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // منع إعادة تحميل الصفحة
            
            errorMessage.style.display = 'none'; // إخفاء الخطأ القديم
            
            const usernameValue = usernameInput.value.trim();
            const passwordValue = passwordInput.value;

            // --- بداية التحقق (Validation) ---
            
            // إذا كان النص يحتوي على @، افحصه كإيميل
            if (usernameValue.includes('@')) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(usernameValue)) {
                    showError('Please enter a valid email address.');
                    return; // إيقاف الإرسال
                }
            } else {
                // إذا لم يحتوي على @، افحصه كـ Username
                if (usernameValue.length < 3) {
                    showError('Username must be at least 3 characters long.');
                    return; // إيقاف الإرسال
                }
            }

            // فحص طول الباسورد
            if (passwordValue.length < 6) {
                showError('Password must be at least 6 characters.');
                return;
            }
            
            // --- نهاية التحقق ---

            // تفعيل حالة الـ Loading
            const originalBtnText = submitBtn.innerText;
            submitBtn.innerText = 'Logging in...';
            submitBtn.disabled = true;

            try {
                // إرسال البيانات للـ API
                const response = await fetchAPI('/api/Auth/login', {
                    method: 'POST',
                    body: JSON.stringify({ username: usernameValue, password: passwordValue })
                });

                // التحقق من نجاح الرد
                if (response && response.token) {
                    localStorage.setItem('aitu_token', response.token);
                    window.location.href = 'repository.html'; 
                } else {
                    // (مؤقت لحين تشغيل الباك اند الحقيقي: توجيه مباشر للاختبار)
                    console.warn("API token not found. Simulating successful login for frontend testing.");
                    window.location.href = 'repository.html';
                }

            } catch (error) {
                showError(error.message || 'Login failed. Please check your credentials.');
            } finally {
                submitBtn.innerText = originalBtnText;
                submitBtn.disabled = false;
            }
        });
    }
});
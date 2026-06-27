// js/pages/otp.js
import { fetchAPI } from '../shared/api.js';

document.addEventListener('DOMContentLoaded', () => {
    // جلب الإيميل من الرابط إن وُجد
    const urlParams = new URLSearchParams(window.location.search);
    const userEmail = urlParams.get('email') || "test@university.edu";

    const inputs = document.querySelectorAll('.otp-input');
    const form = document.getElementById('otpForm');
    const verifyBtn = document.getElementById('verifyBtn');
    const alertBox = document.getElementById('otpAlert');
    const timerDisplay = document.getElementById('timerDisplay');

    // 1. منطق التنقل واللصق (UX Logic)
    inputs.forEach((input, index) => {
        // عند إدخال رقم (Auto-advance)
        input.addEventListener('input', (e) => {
            // السماح بالأرقام فقط
            e.target.value = e.target.value.replace(/[^0-9]/g, '');
            
            // التأكد من وجود رقم واحد فقط في المربع
            if (e.target.value.length > 1) {
                e.target.value = e.target.value.slice(0, 1);
            }

            // الانتقال للمربع التالي إذا تم كتابة رقم
            if (e.target.value !== '') {
                if (index < inputs.length - 1) {
                    inputs[index + 1].focus();
                }
            }
        });

        // عند مسح الرقم (Backspace)
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && e.target.value === '') {
                if (index > 0) {
                    inputs[index - 1].focus();
                }
            }
        });

        // عند اللصق (Ctrl + V)
        input.addEventListener('paste', (e) => {
            e.preventDefault();
            const pastedData = e.clipboardData.getData('text').trim();
            
            // التحقق أن المنسوخ أرقام فقط
            if (/^\d+$/.test(pastedData)) {
                // تقسيم الأرقام وتوزيعها على المربعات بحد أقصى 6
                const digits = pastedData.split('').slice(0, 6);
                
                inputs.forEach((inpt, i) => {
                    if (digits[i]) {
                        inpt.value = digits[i];
                    }
                });

                // نقل المؤشر لآخر مربع تم ملؤه
                const focusIndex = Math.min(digits.length, 6) - 1;
                inputs[focusIndex].focus();
            }
        });
    });

    // 2. المؤقت التنازلي (Timer Logic)
    let timeLeft = 59;
    const timerId = setInterval(() => {
        if (timeLeft <= 0) {
            clearInterval(timerId);
            timerDisplay.innerHTML = '<a href="#" id="resendCode" style="color: var(--primary-blue); font-size: 1rem; text-decoration: none;">Resend Code</a>';
            
            // تفعيل زر إعادة الإرسال
            document.getElementById('resendCode').addEventListener('click', (e) => {
                e.preventDefault();
                alertBox.innerText = 'A new code has been sent to your email.';
                alertBox.className = 'form-alert success';
                alertBox.style.display = 'block';
                // يمكن إعادة تشغيل المؤقت هنا إذا رغبت
            });
        } else {
            timerDisplay.innerText = `00:${timeLeft < 10 ? '0' : ''}${timeLeft}`;
            timeLeft--;
        }
    }, 1000);

    function showAlert(message, type) {
        alertBox.innerText = message;
        alertBox.className = `form-alert ${type}`;
        alertBox.style.display = 'block';
    }

    // 3. إرسال الفورم
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // تجميع الكود
        let otpCode = '';
        inputs.forEach(input => otpCode += input.value);

        if (otpCode.length < 6) {
            showAlert('Please enter the full 6-digit code.', 'error');
            return;
        }

        verifyBtn.disabled = true;
        verifyBtn.innerText = 'Verifying...';
        alertBox.style.display = 'none';

        try {
            // محاكاة الاتصال بالخادم
            setTimeout(() => {
                verifyBtn.disabled = false;
                verifyBtn.innerText = 'Confirm';
                
                // الانتقال لصفحة تعيين كلمة المرور الجديدة مع تمرير الداتا
                window.location.href = `reset-password.html?email=${encodeURIComponent(userEmail)}&code=${otpCode}`;
            }, 1000);

        } catch (error) {
            showAlert('Invalid verification code.', 'error');
            verifyBtn.disabled = false;
            verifyBtn.innerText = 'Confirm';
        }
    });
});
// js/pages/reset-password.js
import { fetchAPI } from '../shared/api.js';

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

    // 1. تفعيل أيقونة إظهار/إخفاء الباسوورد (Eye Toggle)
    document.querySelectorAll('.toggle-password').forEach(icon => {
        icon.addEventListener('click', (e) => {
            const input = e.currentTarget.previousElementSibling;
            if (input.type === 'password') {
                input.type = 'text';
                // تغيير الأيقونة لعين مغلقة (اختياري، هنا نستخدم شفافية لتوضيح الفكرة)
                e.currentTarget.style.opacity = '0.5'; 
            } else {
                input.type = 'password';
                e.currentTarget.style.opacity = '1';
            }
        });
    });

    // 2. التحقق المباشر من قوة كلمة المرور (Real-time Validation)
    const reqLength = document.getElementById('req-length');
    const reqUpper = document.getElementById('req-upper');
    const reqNumber = document.getElementById('req-number');
    const reqSpecial = document.getElementById('req-special');

    let isPasswordValid = false;

    newPwdInput.addEventListener('input', (e) => {
        const val = e.target.value;

        // 8 حروف فأكثر
        const lengthValid = val.length >= 8;
        lengthValid ? reqLength.classList.add('valid') : reqLength.classList.remove('valid');

        // حرف كبير وحرف صغير
        const upperLowerValid = /[A-Z]/.test(val) && /[a-z]/.test(val);
        upperLowerValid ? reqUpper.classList.add('valid') : reqUpper.classList.remove('valid');

        // رقم واحد على الأقل
        const numberValid = /[0-9]/.test(val);
        numberValid ? reqNumber.classList.add('valid') : reqNumber.classList.remove('valid');

        // رمز مميز
        const specialValid = /[^A-Za-z0-9]/.test(val);
        specialValid ? reqSpecial.classList.add('valid') : reqSpecial.classList.remove('valid');

        // تحديث حالة الصلاحية الكلية
        isPasswordValid = lengthValid && upperLowerValid && numberValid && specialValid;
        
        // التحقق من التطابق إذا كان الحقل الثاني مكتوباً
        checkMatch();
    });

    // 3. التحقق من تطابق كلمتي المرور
    confirmPwdInput.addEventListener('input', checkMatch);

    function checkMatch() {
        if (confirmPwdInput.value === '') {
            matchMessage.style.display = 'none';
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

    // 4. إرسال الفورم (Submit)
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!isPasswordValid) {
            alertBox.innerText = 'Please meet all password requirements first.';
            alertBox.className = 'form-alert error';
            alertBox.style.display = 'block';
            return;
        }

        if (newPwdInput.value !== confirmPwdInput.value) {
            alertBox.innerText = 'Passwords do not match.';
            alertBox.className = 'form-alert error';
            alertBox.style.display = 'block';
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerText = 'Updating...';
        alertBox.style.display = 'none';

        try {
            // هنا سيتم إرسال { email, code, newPassword } للباك إند
            
            // محاكاة الاتصال والنجاح
            setTimeout(() => {
                submitBtn.disabled = false;
                submitBtn.innerText = 'Confirm';
                
                alertBox.innerText = 'Password updated successfully! Redirecting...';
                alertBox.className = 'form-alert success';
                alertBox.style.display = 'block';

                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            }, 1500);

        } catch (error) {
            alertBox.innerText = error.message || 'Failed to update password.';
            alertBox.className = 'form-alert error';
            alertBox.style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.innerText = 'Confirm';
        }
    });
});
// js/pages/main.js

document.addEventListener('DOMContentLoaded', () => {
    
    // توجيه زر الـ Login لصفحة تسجيل الدخول
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            window.location.href = 'login.html';
        });
    }

    // توجيه زر تصفح المستودع المركزي
    const browseRepoBtn = document.getElementById('browseRepoBtn');
    if (browseRepoBtn) {
        browseRepoBtn.addEventListener('click', () => {
            window.location.href = 'repository.html';
        });
    }

});
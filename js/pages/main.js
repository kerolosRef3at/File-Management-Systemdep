// js/pages/main.js
import { getCurrentUser } from '../shared/auth.js';

document.addEventListener('DOMContentLoaded', () => {
    
    const loginBtn = document.getElementById('loginBtn');
    const user = getCurrentUser();

    if (loginBtn) {
        if (user) {
            // User is already logged in
            loginBtn.innerHTML = `<a href="repository.html" style="color: white;">Go to Portal</a>`;
            loginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (user.role === 'Public User') {
                    window.location.href = 'repository.html';
                } else {
                    window.location.href = 'dashboard.html';
                }
            });
        } else {
            // Public Guest landing action
            loginBtn.addEventListener('click', () => {
                window.location.href = 'login.html';
            });
        }
    }

    const browseRepoBtn = document.getElementById('browseRepoBtn');
    if (browseRepoBtn) {
        browseRepoBtn.addEventListener('click', () => {
            window.location.href = 'repository.html';
        });
    }

    // Global Search Redirect on Home Page
    const globalSearch = document.getElementById('globalSearchInput');
    if (globalSearch) {
        globalSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const searchVal = globalSearch.value.trim();
                window.location.href = `repository.html${searchVal ? '?search=' + encodeURIComponent(searchVal) : ''}`;
            }
        });
    }
});
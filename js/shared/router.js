// js/shared/router.js
import { renderLayout } from './layout.js';
import { getCurrentUser } from './auth.js';

// Mark SPA environment
window.__spa_initialized = true;

const pageLoaders = {
    dashboard: async () => {
        const mod = await import('../pages/dashboard.js');
        if (mod.initDashboard) await mod.initDashboard();
    },
    repository: async () => {
        const mod = await import('../pages/repository.js');
        if (mod.initRepository) await mod.initRepository();
    },
    courses: async () => {
        const mod = await import('../pages/courses.js');
        if (mod.initCourses) await mod.initCourses();
    },
    'course-details': async () => {
        const mod = await import('../pages/course-details.js');
        if (mod.initCourseDetails) await mod.initCourseDetails();
    },
    'create-course': async () => {
        const mod = await import('../pages/create-course.js');
        const content = document.getElementById('page-content');
        if (mod.initCourseBuilder && content) {
            content.innerHTML = '<div id="builderContainer" style="background:#fff; border-radius:12px; padding:24px; box-shadow:0 2px 8px rgba(0,0,0,0.04);"></div>';
            await mod.initCourseBuilder(document.getElementById('builderContainer'), () => navigateTo('courses'));
        }
    },
    'upload-resources': async () => {
        const mod = await import('../pages/upload-resources.js');
        if (mod.openUploadModal) await mod.openUploadModal();
    },
    users: async () => {
        const mod = await import('../pages/users.js');
        if (mod.initUsers) await mod.initUsers();
    },
    logs: async () => {
        const mod = await import('../pages/logs.js');
        if (mod.initLogs) await mod.initLogs();
    },
    profile: async () => {
        const mod = await import('../pages/profile.js');
        if (mod.initProfile) await mod.initProfile();
    },
};

let currentPage = null;

/**
 * Navigate to a specific page dynamically without full page reload.
 * Keeps App Shell fixed and updates #page-content.
 */
export async function navigateTo(pageId, options = {}) {
    window.__spa_navigating = true;
    const user = getCurrentUser();
    
    // Auth protection for supervisor/manager routes
    if (['dashboard', 'users', 'logs'].includes(pageId)) {
        if (!user) {
            window.location.href = 'login.html';
            return;
        }
        if (['users', 'logs'].includes(pageId) && user.role !== 'Supervisor') {
            navigateTo('repository');
            return;
        }
    }

    // 1. Update/Ensure App Shell layout (Fixed base)
    renderLayout(pageId);

    currentPage = pageId;

    // 2. Update Browser URL via History API
    if (!options.fromPopState) {
        const queryString = options.query ? `?${options.query}` : window.location.search;
        const targetUrl = `${pageId}.html${queryString}`;
        if (window.location.pathname.split('/').pop() !== `${pageId}.html`) {
            window.history.pushState({ pageId }, '', targetUrl);
        }
    }

    // 3. Clear existing content container with a fast skeleton spinner
    const content = document.getElementById('page-content');
    if (content) {
        content.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; min-height: 380px;">
                <div style="display: flex; flex-direction: column; align-items: center; gap: 14px;">
                    <div style="width: 40px; height: 40px; border: 3px solid #E2E8F0; border-top-color: #1565C0; border-radius: 50%; animation: shellSpin 0.75s linear infinite;"></div>
                    <span style="font-size: 13.5px; font-weight: 700; color: #64748B; font-family: 'Cairo', sans-serif;">جاري التحميل...</span>
                </div>
            </div>
            <style>@keyframes shellSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
        `;
    }

    // 4. Load & Initialize the Page Module
    try {
        const loader = pageLoaders[pageId];
        if (loader) {
            await loader();
        } else {
            console.warn(`No SPA loader found for page: ${pageId}`);
            window.location.href = `${pageId}.html`;
        }
    } catch (err) {
        console.error(`Error loading page ${pageId}:`, err);
        if (content) {
            content.innerHTML = `
                <div style="padding: 40px; text-align: center; color: #DC2626; font-family: 'Cairo', sans-serif;">
                    <h3>حدث خطأ أثناء تحميل الصفحة</h3>
                    <p style="color: #64748B; margin-top: 8px;">${err.message || 'تعذر استدعاء محتوى الصفحة'}</p>
                    <button onclick="window.navigateTo('${pageId}')" style="margin-top: 16px; padding: 8px 18px; background: #1565C0; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-family: 'Cairo', sans-serif; font-weight: 700;">إعادة المحاولة</button>
                </div>
            `;
        }
    } finally {
        window.__spa_navigating = false;
    }

    // 5. Scroll main container to top
    if (content) {
        content.scrollTop = 0;
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
}

// Make navigateTo globally accessible
window.navigateTo = navigateTo;

// Listen to browser Back / Forward buttons
window.addEventListener('popstate', (e) => {
    const pageId = e.state?.pageId || getPageFromLocation();
    if (pageId && pageId !== currentPage) {
        navigateTo(pageId, { fromPopState: true });
    }
});

// Intercept all in-app <a> links to prevent full reloads
document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link || !link.getAttribute('href')) return;

    // For public / guest users, allow normal native navigation between HTML pages!
    const user = getCurrentUser();
    if (!user || user.role === 'Public User') {
        return;
    }

    const href = link.getAttribute('href');
    if (
        href.startsWith('http') ||
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        href.includes('login') ||
        href.includes('index') ||
        href.includes('forgot') ||
        href.includes('reset') ||
        href.includes('otp') ||
        href.includes('403')
    ) {
        return;
    }

    const cleanPage = href.split('?')[0].replace('.html', '').replace(/^\/+/, '');
    if (pageLoaders[cleanPage]) {
        e.preventDefault();
        const query = href.includes('?') ? href.split('?')[1] : '';
        navigateTo(cleanPage, { query });
    }
});

/**
 * Determine initial page from current URL
 */
export function getPageFromLocation() {
    const pathname = window.location.pathname.split('/').pop() || '';
    if (pathname.includes('dashboard')) return 'dashboard';
    if (pathname.includes('users')) return 'users';
    if (pathname.includes('logs')) return 'logs';
    if (pathname.includes('courses')) return 'courses';
    if (pathname.includes('course-details')) return 'course-details';
    if (pathname.includes('create-course')) return 'create-course';
    if (pathname.includes('upload-resources')) return 'upload-resources';
    if (pathname.includes('profile')) return 'profile';
    if (pathname.includes('repository')) return 'repository';
    return 'dashboard';
}

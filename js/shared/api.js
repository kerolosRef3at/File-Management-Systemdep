// js/shared/api.js



// لو عايز كل حاجة على السيرفر
export const BASE_URL = 'https://filesystemapi.runasp.net';
export async function fetchAPI(endpoint, options = {}) {
    // تجهيز الـ Headers
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    // Remove Content-Type if sending FormData (browser sets boundary automatically)
    if (options.body instanceof FormData) {
        delete headers['Content-Type'];
    }

    // إرفاق الـ Bearer Token لو المستخدم مسجل دخول
    const token = localStorage.getItem('aitu_token');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Attach automatic 3.5s timeout if no custom signal provided
    let controller = null;
    let timeoutId = null;
    let signal = options.signal;

    if (!signal) {
        controller = new AbortController();
        signal = controller.signal;
        timeoutId = setTimeout(() => controller.abort(), 3500);
    }

    const config = {
        ...options,
        headers,
        signal
    };

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, config);
        if (timeoutId) clearTimeout(timeoutId);
        
        // Handle 401 Unauthorized errors gracefully
        if (response.status === 401) {
            if (options.forceLogoutOn401) {
                localStorage.removeItem('aitu_token');
                window.location.href = 'login.html';
                throw new Error('Session expired. Please login again.');
            }
            if (options.skip401Redirect || endpoint.includes('/api/Auth/login')) {
                throw new Error('Invalid credentials');
            }
            throw new Error('Unauthorized (401)');
        }

        // لو الرد مش 200/201
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'An error occurred while fetching data.');
        }

        return await response.json().catch(() => ({})); // قد يكون الرد فارغاً في بعض الـ Endpoints
    } catch (error) {
        if (timeoutId) clearTimeout(timeoutId);
        console.error('API Error:', error);
        if (error.name === 'AbortError') {
            throw new Error('Request timed out');
        }
        if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
            throw new Error(`<div style="font-weight: 700; margin-bottom: 6px; font-size: 1rem;">تعذر الاتصال بالسيرفر المحلي</div><div style="font-size: 0.88rem; font-weight: 500; opacity: 0.95;">تأكد من اتصال هاتفك بنفس شبكة الـ <strong>Wi-Fi</strong> وأن السيرفر يعمل على:<br><span style="direction: ltr; display: inline-block; background: rgba(0,0,0,0.06); padding: 3px 10px; border-radius: 6px; font-family: monospace; font-weight: 700; margin-top: 6px; border: 1px solid rgba(0,0,0,0.1); color: inherit;">${BASE_URL}</span></div>`);
        }
        throw error;
    }
}
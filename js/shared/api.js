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

    const config = {
        ...options,
        headers
    };

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, config);
        
        // معالجة حالة انتهاء الجلسة (Unauthorized)
        if (response.status === 401) {
            localStorage.removeItem('aitu_token');
            window.location.href = 'login.html';
            throw new Error('Session expired. Please login again.');
        }

        // لو الرد مش 200/201
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'An error occurred while fetching data.');
        }

        return await response.json().catch(() => ({})); // قد يكون الرد فارغاً في بعض الـ Endpoints
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}
// js/shared/api.js

// غيّر الرابط ده للرابط الحقيقي الخاص بالـ API لما يكون شغال
export const BASE_URL = 'https://your-api-domain.com';

export async function fetchAPI(endpoint, options = {}) {
    // تجهيز الـ Headers
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

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
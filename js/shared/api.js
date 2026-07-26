// js/shared/api.js
import logger from './logger.js';

export const BASE_URL = 'https://filesystemapi.runasp.net';

export async function fetchAPI(endpoint, options = {}) {
    const token = localStorage.getItem('aitu_token');
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'X-Requested-With': 'XMLHttpRequest',
            'X-Client-Version': '1.0.0'
        }
    };

    if (token) {
        defaultOptions.headers['Authorization'] = `Bearer ${token}`;
    }

    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...(options.headers || {})
        }
    };

    if (options.body && options.body instanceof FormData) {
        delete mergedOptions.headers['Content-Type'];
    }

    const timeout = options.timeout || 30000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    mergedOptions.signal = controller.signal;

    const isDelete = options.method === 'DELETE';

    try {
        logger.log(`🌐 ${mergedOptions.method || 'GET'} ${endpoint}`);
        
        const response = await fetch(`${BASE_URL}${endpoint}`, mergedOptions);
        clearTimeout(timeoutId);

        logger.log(`📡 Response status: ${response.status} ${response.statusText}`);

        // Handle 401 Unauthorized errors gracefully
        // Handle 401 Unauthorized errors gracefully
if (response.status === 401) {
    if (!endpoint.includes('/api/Auth/login')) {
        localStorage.removeItem('aitu_token');
        localStorage.removeItem('aitu_refresh_token');
        localStorage.removeItem('aitu_role');
        localStorage.removeItem('aitu_username');
        sessionStorage.clear();

        if (options.forceLogoutOn401 || !options.skip401Redirect) {
            window.location.href = 'login.html';
            throw new Error('Session expired. Please login again.');
        }
    }

    if (options.skip401Redirect || endpoint.includes('/api/Auth/login')) {
        throw new Error('Invalid credentials');
    }

    throw new Error('Unauthorized (401)');
}

        if (response.status === 403) {
            console.error('Access forbidden');
            throw new Error('You do not have permission to perform this action.');
        }

        if (response.status === 404) {
            console.warn('Resource not found:', endpoint);
            
            if (isDelete) {
                throw new Error('Resource not found on server (404). It may have been deleted already.');
            }
            
            return null;
        }

        if (response.status === 204) {
            console.log('No content returned');
            return [];
        }

        const contentLength = response.headers.get('content-length');
        if (contentLength === '0') {
            return [];
        }

        try {
            const data = await response.json();
            return data;
        } catch (jsonError) {
            const text = await response.text();
            console.warn('Response is not JSON:', text.substring(0, 100));
            return text;
        }

    } catch (error) {
        clearTimeout(timeoutId);
        
        if (error.name === 'AbortError') {
            console.error(`Request timeout after ${timeout}ms: ${endpoint}`);
            throw new Error(`Request timeout. Server took too long to respond (${timeout/1000}s).`);
        }

        if (error.message === 'Failed to fetch' || error.message.includes('NetworkError') || error.message.includes('CORS')) {
            console.warn('Network/CORS error:', error);
            
            if (isDelete) {
                throw new Error('CORS or network error - will delete locally only');
            }
            
            throw new Error('Network error. Please check your internet connection and try again.');
        }

        console.error('API Error:', error);
        throw error;
    }
}

export async function fetchAll(requests) {
    try {
        const results = await Promise.allSettled(
            requests.map(([endpoint, options = {}]) => 
                fetchAPI(endpoint, options)
            )
        );
        
        return results.map((result, index) => {
            if (result.status === 'fulfilled') {
                return result.value;
            } else {
                console.error(`Request ${index} failed:`, result.reason);
                return null;
            }
        });
    } catch (error) {
        console.error('fetchAll error:', error);
        throw error;
    }
}

export async function fetchWithRetry(endpoint, options = {}, maxRetries = 3) {
    let lastError;
    let delay = 1000;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fetchAPI(endpoint, options);
        } catch (error) {
            lastError = error;
            console.warn(`Attempt ${attempt}/${maxRetries} failed:`, error.message);
            
            if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2;
            }
        }
    }
    
    throw new Error(`All ${maxRetries} attempts failed. Last error: ${lastError.message}`);
}

export function uploadFileWithProgress(endpoint, formData, onProgress = () => {}, options = {}) {
    return new Promise((resolve, reject) => {
        const token = localStorage.getItem('aitu_token');
        const xhr = new XMLHttpRequest();
        
        xhr.open('POST', `${BASE_URL}${endpoint}`, true);
        
        if (token) {
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }
        
        if (options.headers) {
            Object.keys(options.headers).forEach(key => {
                xhr.setRequestHeader(key, options.headers[key]);
            });
        }
        
        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const percentComplete = Math.round((e.loaded / e.total) * 100);
                onProgress(percentComplete);
            }
        });
        
        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    resolve(response);
                } catch {
                    resolve(xhr.responseText);
                }
            } else if (xhr.status === 401) {
                localStorage.removeItem('aitu_token');
                localStorage.removeItem('aitu_refresh_token');
                localStorage.removeItem('aitu_role');
                localStorage.removeItem('aitu_username');
                window.location.href = '/login.html';
                reject(new Error('Session expired'));
            } else {
                reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.statusText}`));
            }
        });
        
        xhr.addEventListener('error', () => {
            reject(new Error('Network error during upload'));
        });
        
        xhr.addEventListener('abort', () => {
            reject(new Error('Upload aborted by user'));
        });
        
        const timeout = options.timeout || 300000;
        xhr.timeout = timeout;
        xhr.ontimeout = () => {
            reject(new Error(`Upload timeout after ${timeout/1000} seconds`));
        };
        
        xhr.send(formData);
    });
}

export async function downloadFile(endpoint, options = {}) {
    const token = localStorage.getItem('aitu_token');
    
    const headers = {
        ...(options.headers || {}),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: options.method || 'GET',
        headers,
        signal: options.signal || null
    });
    
    if (!response.ok) {
        if (response.status === 401 && !options.skip401Redirect) {
            localStorage.removeItem('aitu_token');
            window.location.href = '/login.html';
            throw new Error('Session expired');
        }
        throw new Error(`Download failed with status ${response.status}`);
    }
    
    return await response.blob();
}

export function getErrorMessage(error) {
    if (typeof error === 'string') return error;
    if (error.message) return error.message;
    if (error.errors) {
        const messages = Object.values(error.errors).flat();
        return messages.join(', ');
    }
    return 'An unknown error occurred. Please try again.';
}

export async function pingAPI(timeout = 5000) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        const response = await fetch(`${BASE_URL}/api/health`, {
            method: 'GET',
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        return response.ok;
    } catch (error) {
        console.warn('API health check failed:', error.message);
        return false;
    }
}

export default {
    BASE_URL,
    fetchAPI,
    fetchAll,
    fetchWithRetry,
    uploadFileWithProgress,
    downloadFile,
    getErrorMessage,
    pingAPI
};
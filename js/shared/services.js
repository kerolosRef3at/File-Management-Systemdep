// js/shared/services.js
import { fetchAPI, BASE_URL } from './api.js';
import * as mock from './mockData.js';

// Toggle to force mock data or let it attempt real API first
const USE_MOCK = false;

// Helper for emulating network latency
const delay = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to construct a mock JWT token
// Helper to construct a mock JWT token
function generateMockJWT(user) {
    try {
        const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
        const payloadStr = JSON.stringify({
            sub: user.username,
            email: user.email,
            role: user.role,
            phone: user.phone,
            joined: user.joined,
            name: user.name || user.username,
            exp: Math.floor(Date.now() / 1000) + 86400 // 24 hours expiry
        });
        const payload = btoa(unescape(encodeURIComponent(payloadStr)));
        const signature = "mock_signature";
        return `${header}.${payload}.${signature}`;
    } catch (e) {
        return "mock.token.signature";
    }
}

// Helper to decode a JWT token
export function decodeJWT(token) {
    try {
        if (!token) return null;
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const decodedPayload = decodeURIComponent(escape(atob(parts[1])));
        return JSON.parse(decodedPayload);
    } catch (e) {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) return null;
            return JSON.parse(atob(parts[1]));
        } catch (err) {
            console.error("JWT decoding failed:", err);
            return null;
        }
    }
}

// ==========================================
// 1. Authentication Service
// ==========================================
export const authService = {
    async login(username, password) {
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 10000);

            const res = await fetchAPI('/api/Auth/login', {
                method: 'POST',
                body: JSON.stringify({ username, password }),
                signal: controller.signal
            });
            clearTimeout(timer);

            if (res && res.token) {
                localStorage.setItem('aitu_token', res.token);
                if (res.refreshToken) localStorage.setItem('aitu_refresh_token', res.refreshToken);
                if (res.role) localStorage.setItem('aitu_role', res.role);
                if (res.username || username) localStorage.setItem('aitu_username', res.username || username);
                return res;
            }
            throw new Error('Invalid login credentials.');
        } catch (err) {
            console.error("Login failed:", err);
            throw new Error(err.message || 'Server is currently unavailable. Please try again later.');
        }
    },

    async verifyPassword(password) {
        if (!password || String(password).trim() === '') return false;
        const currentUser = this.getCurrentUser();
        const username = currentUser?.username || localStorage.getItem('aitu_username') || '';
        if (!username) return false;

        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 4000);
            const res = await fetchAPI('/api/Auth/verify-password', {
                method: 'POST',
                body: JSON.stringify({ username, password }),
                signal: controller.signal
            });
            clearTimeout(timer);
            if (res && (res.success || res.valid || res.status === 200)) return true;
            return false;
        } catch (e) {
            console.error('Password verification failed - API unreachable:', e);
            return false;
        }
    },

    logout() {
        const user = this.getCurrentUser();
        if (user) {
            logService.addLog(user.username, user.role, "Logout", "System");
        }
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('aitu_')) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        sessionStorage.clear();
    },

    getCurrentUser() {
        const token = localStorage.getItem('aitu_token');
        if (!token) return null;
        let decoded = decodeJWT(token);
        if (decoded && decoded.exp) {
            const now = Math.floor(Date.now() / 1000);
            if (decoded.exp < now) {
                console.warn('JWT session expired. Logging out.');
                this.logout();
                return null;
            }
        }
        if (!decoded) {
            return null;
        }

        // ✅ جيب الـ role من الـ claim الصح
        const role = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
            decoded.role ||
            localStorage.getItem('aitu_role') ||
            'User';

        const username = decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ||
            decoded.sub ||
            localStorage.getItem('aitu_username') || '';
            
        const storedPhone = localStorage.getItem('aitu_user_phone_' + username) || localStorage.getItem('aitu_user_phone');
        const defaultMockUser = (mock.mockUsers || []).find(u => u.username === username);
        const phone = decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/mobilephone'] ||
            decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/otherphone'] ||
            decoded.phone ||
            decoded.mobile ||
            storedPhone ||
            (defaultMockUser ? defaultMockUser.phone : '01012345678');

        const storedEmail = localStorage.getItem('aitu_user_email_' + username) || localStorage.getItem('aitu_user_email');
        let rawEmail = decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] ||
            decoded.email ||
            storedEmail ||
            (username ? (username.includes('@') ? username : `${username}@aitu.edu.eg`) : '');

        if (rawEmail && (rawEmail.match(/@/g) || []).length > 1) {
            const parts = rawEmail.split('@');
            rawEmail = `${parts[0]}@${parts[1]}`;
        }
        const email = rawEmail;

        const storedName = localStorage.getItem('aitu_user_fullname_' + username) || localStorage.getItem('aitu_user_fullname');
        let rawName = decoded.name || storedName || (defaultMockUser ? defaultMockUser.name : username);
        const name = String(rawName || '').includes('@') ? String(rawName).split('@')[0] : rawName;

        const storedAvatar = localStorage.getItem('aitu_user_avatar_' + username) || localStorage.getItem('aitu_user_avatar') || sessionStorage.getItem('aitu_user_avatar_' + username) || sessionStorage.getItem('aitu_user_avatar');
        const avatar = decoded.avatar || storedAvatar || '';

        const userId = decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ||
            decoded.sub || '';

        return {
            id: userId,
            username: username,
            email: email,
            role: role,
            phone: phone,
            joined: decoded.joined || (defaultMockUser ? defaultMockUser.joined : '2025-01-15'),
            name: name,
            departmentId: decoded.DepartmentId || '',
            avatar: avatar
        };
    },

    // TODO: POST /api/Auth/forgot-password
async forgotPassword(email) {
    await delay();
    try {
        return await fetchAPI('/api/Auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email })
        });
    } catch (err) {
        throw new Error(err.message || 'Email not found.');
    }
},

async verifyOTP(email, code) {
    await delay();
    try {
        return await fetchAPI('/api/Auth/verify-otp', {
            method: 'POST',
            body: JSON.stringify({ email, code })
        });
    } catch (err) {
        throw new Error('Invalid or expired OTP.');
    }
},

async resetPassword(email, code, newPassword) {
    await delay();
    try {
        return await fetchAPI('/api/Auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ email, code, newPassword })
        });
    } catch (err) {
        throw new Error('Reset password failed.');
    }
}
};
//===========================================
// ✅ Helper Functions
function getFileTypeLabel(mimeType) {
    if (!mimeType) return 'FILE';
    const m = mimeType.toLowerCase();
    if (m.includes('pdf')) return 'PDF';
    if (m.includes('sheet') || m.includes('excel') || m.includes('xlsx')) return 'XLSX';
    if (m.includes('word') || m.includes('docx')) return 'DOCX';
    if (m.includes('dwg') || m.includes('autocad')) return 'DWG';
    if (m.includes('mp4') || m.includes('video')) return 'MP4';
    return mimeType.split('/').pop().toUpperCase().substring(0, 4);
}

function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 KB';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
}

// The API returns the department CODE directly ("IT", "EL", "DESIGN", "AD"),
// so there is nothing to guess.
//
// This used to hard-code the three original departments and fall through to
// `return 'IT'` for anything else. Every department created after launch --
// DESIGN, AD, any future one -- was silently relabelled as IT. Files uploaded
// to DESIGN came back tagged deptId 'IT', so hydrateDepartments added their
// program under IT, which is why "Designs Doc" appeared in both departments
// and reappeared after every delete: it was being regenerated from the file
// list on each load, not restored from any cache.
//
// The substring test was unsafe on its own terms too: any code containing
// "it" or "me" matched (e.g. "MEDIA" -> ME, "SECURITY" -> IT).
function getDeptId(deptStr) {
    if (!deptStr) return '';
    // Tolerates the old "IT DEPT" format still stored in some rows.
    return String(deptStr).trim().replace(/\s+DEPT$/i, '').toUpperCase();
}

// detectProgram() lived here: ~20 lines mapping file names to hard-coded
// program ids ('it-net', 'el-power', 'me-cad') for the three original
// departments. It was already dead code -- nothing called it -- and it could
// never have worked for a department added after launch. Programs come from
// the folder tree now.

// ====================================================
// FAST IMAGE CACHE SERVICE (IndexedDB & Memory Cache)
// ====================================================
const _memImageCache = new Map();

function _getHashCacheKey(url) {
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
        hash = ((hash << 5) - hash) + url.charCodeAt(i);
        hash |= 0;
    }
    const tail = String(url).replace(/[^a-zA-Z0-9]/g, '_').slice(-30);
    return `aitu_img_v2_${Math.abs(hash)}_${tail}`;
}

export const imageCacheService = {
    /** Get cached image URL or fetch & cache it in memory/storage */
    async getCachedImageUrl(url) {
        if (!url || typeof url !== 'string') return 'assets/images/default-course.png';
        if (url.startsWith('data:')) return url; // Already base64

        let fullUrl = url;
        if (!fullUrl.startsWith('http')) {
            fullUrl = fullUrl.startsWith('/') ? `${BASE_URL}${fullUrl}` : `${BASE_URL}/${fullUrl}`;
        }

        if (_memImageCache.has(fullUrl)) {
            return _memImageCache.get(fullUrl);
        }

        try {
            const cacheKey = _getHashCacheKey(fullUrl);
            const cachedBase64 = localStorage.getItem(cacheKey);
            if (cachedBase64) {
                _memImageCache.set(fullUrl, cachedBase64);
                return cachedBase64;
            }

            const res = await fetch(fullUrl);
            if (!res.ok) throw new Error('Image fetch failed');
            const blob = await res.blob();

            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64data = reader.result;
                    try {
                        localStorage.setItem(cacheKey, base64data);
                    } catch (quotaErr) {
                        this.clearOldImageCache();
                    }
                    _memImageCache.set(fullUrl, base64data);
                    resolve(base64data);
                };
                reader.onerror = () => resolve(fullUrl);
                reader.readAsDataURL(blob);
            });
        } catch (e) {
            return fullUrl;
        }
    },

    /** Preload a list of image URLs in background */
    preloadImages(urls = []) {
        if (!Array.isArray(urls)) return;
        urls.forEach(u => {
            if (u) this.getCachedImageUrl(u).catch(() => {});
        });
    },

    /** Clear image cache from localStorage if quota exceeded or invalid */
    clearOldImageCache() {
        try {
            for (let i = localStorage.length - 1; i >= 0; i--) {
                const key = localStorage.key(i);
                if (key && (key.startsWith('aitu_img_cache_') || key.startsWith('aitu_img_v2_'))) {
                    localStorage.removeItem(key);
                }
            }
        } catch (e) {}
    }
};

// Purge legacy colliding image cache keys once
try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith('aitu_img_cache_')) {
            localStorage.removeItem(key);
        }
    }
} catch (e) {}

export async function applyCachedImage(imgEl, srcUrl, fallbackUrl = 'assets/images/default-course.png') {
    if (!imgEl) return;
    imgEl.onerror = () => {
        imgEl.onerror = null;
        imgEl.src = fallbackUrl;
    };
    if (!srcUrl) {
        imgEl.src = fallbackUrl;
        return;
    }
    const cachedUrl = await imageCacheService.getCachedImageUrl(srcUrl);
    imgEl.src = cachedUrl;
}

// ====================================================
// PERSISTENT BACKGROUND UPLOAD TRACKER (Across reloads & pages)
// ====================================================
export function initBackgroundUploadTracker() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const checkJob = () => {
        const stored = localStorage.getItem('aitu_background_upload_job');
        if (!stored) return;

        try {
            const job = JSON.parse(stored);
            if (!job || (!job.isUploading && !job.isCompleted)) return;

            const isAr = (localStorage.getItem('aitu_lang') || 'ar') === 'ar';
            let widget = document.getElementById('ccUploadProgressBanner');
            if (!widget) {
                widget = document.createElement('div');
                widget.id = 'ccUploadProgressBanner';
                widget.className = 'cc-upload-progress-banner';
                document.body.appendChild(widget);
            }

            const isCompleted = job.progressPercent >= 100 || job.isCompleted;

            widget.innerHTML = `
                <div class="cc-upb-header">
                    <span id="ccUpbStatus">${
                        isCompleted 
                            ? (isAr ? `اكتمل الرفع بنجاح (${job.totalFiles}/${job.totalFiles})` : `Upload Complete (${job.totalFiles}/${job.totalFiles})`)
                            : (isAr ? `جاري رفع الملفات (${job.currentFileIndex}/${job.totalFiles})` : `Uploading files (${job.currentFileIndex}/${job.totalFiles})`)
                    }</span>
                    <span id="ccUpbPercent">${
                        isCompleted
                            ? '<span style="color:#22c55e;font-weight:bold;font-size:1.1rem;">✓</span>'
                            : `${job.progressPercent}%`
                    }</span>
                </div>
                <div class="cc-upb-filename" id="ccUpbFilename">${
                    isCompleted
                        ? (isAr ? 'تم حفظ الكورس وجميع محتوياته بنجاح' : 'All course files uploaded & saved')
                        : (job.currentFileName || 'جاري الرفع...')
                }</div>
                <div class="cc-upb-bar-bg">
                    <div class="cc-upb-bar-fill" id="ccUpbFill" style="width:${job.progressPercent}%; ${isCompleted ? 'background:#22c55e;' : ''}"></div>
                </div>
            `;

            // If job is still uploading, simulate progress steps & update localStorage
            if (!isCompleted && !window._bgUploadTimerRunning) {
                window._bgUploadTimerRunning = true;
                const timer = setInterval(() => {
                    const latestStored = localStorage.getItem('aitu_background_upload_job');
                    if (!latestStored) {
                        clearInterval(timer);
                        window._bgUploadTimerRunning = false;
                        if (widget) widget.remove();
                        return;
                    }
                    const activeJob = JSON.parse(latestStored);
                    if (activeJob.progressPercent < 100) {
                        activeJob.progressPercent = Math.min(100, activeJob.progressPercent + 4);
                        if (activeJob.progressPercent >= 100) {
                            activeJob.isCompleted = true;
                            activeJob.isUploading = false;
                        }
                        localStorage.setItem('aitu_background_upload_job', JSON.stringify(activeJob));
                        checkJob();
                    } else {
                        clearInterval(timer);
                        window._bgUploadTimerRunning = false;
                        activeJob.isCompleted = true;
                        activeJob.isUploading = false;
                        localStorage.setItem('aitu_background_upload_job', JSON.stringify(activeJob));
                        checkJob();
                        setTimeout(() => {
                            localStorage.removeItem('aitu_background_upload_job');
                            if (widget) widget.remove();
                        }, 3000);
                    }
                }, 400);
            }

            if (isCompleted) {
                setTimeout(() => {
                    localStorage.removeItem('aitu_background_upload_job');
                    if (widget) widget.remove();
                }, 3000);
            }
        } catch (e) {
            console.warn('Background upload tracker error:', e);
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkJob);
    } else {
        checkJob();
    }
}

initBackgroundUploadTracker();

// =========================================
// GLOBAL DOWNLOAD / UPLOAD PROGRESS WIDGET
// =========================================
export function showProgressWidget(items = [], type = 'download') {
    const isAr = (localStorage.getItem('aitu_lang') || 'ar') === 'ar';
    let widget = document.getElementById('floatingGlobalWidget');
    if (!widget) {
        widget = document.createElement('div');
        widget.id = 'floatingGlobalWidget';
        document.body.appendChild(widget);
    }
    widget.style.display = 'block';

    const itemList = Array.isArray(items) ? items : [items];
    const queue = itemList.map(item => ({
        name: typeof item === 'string' ? item : (item?.name || item?.title || 'Academic Resource'),
        progress: 0,
        status: 'in_progress'
    }));

    function render() {
        const total = queue.length;
        const completed = queue.filter(f => f.status === 'complete').length;
        const isDone = total > 0 && completed === total;
        const isCollapsed = widget.dataset.collapsed === 'true';

        let overallProg = 0;
        if (total > 0) {
            const sum = queue.reduce((acc, f) => acc + (f.progress || 0), 0);
        overallProg = Math.round(sum / total);
        }

        const titleText = isDone 
            ? (isAr ? `تم اكتمال تنزيل ${completed} ملف(ات)` : `${completed} downloads complete`)
            : (isAr ? `جاري تنزيل ${total - completed} ملف(ات)...` : `Downloading ${total - completed} file(s)...`);
        const isCollapsed = widget.dataset.collapsed === 'true';
        const isMaximized = widget.dataset.maximized === 'true';

        let filesHtml = '';
        if (!isCollapsed) {
            filesHtml = `
                <div style="max-height: ${isMaximized ? '320px' : '180px'}; overflow-y: auto; padding: 10px 14px; background: #ffffff;">
                    ${queue.map(f => {
                        const isFileDone = f.status === 'complete' || f.progress >= 100;
                        const icon = isFileDone
                            ? `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#22c55e" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`
                            : `<div style="width:14px; height:14px; border:2px solid #3b82f6; border-top-color:transparent; border-radius:50%; animation:widgetSpin 0.8s linear infinite;"></div>`;

                        return `
                            <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:8px; font-size:0.83rem;">
                                <div style="display:flex; align-items:center; gap:8px; overflow:hidden; flex:1;">
                                    ${icon}
                                    <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; color:#0f172a; font-weight:600;" title="${f.name}">${f.name}</span>
                                </div>
                                <span style="font-size:0.78rem; color:${isFileDone ? '#22c55e' : '#64748b'}; font-weight:600; flex-shrink:0;">${isFileDone ? '100%' : (f.progress || 0) + '%'}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        }

        widget.className = 'google-drive-upload-widget';
        if (isMaximized) {
            widget.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                z-index: 999999;
                width: 480px;
                max-width: 92vw;
                background: #ffffff;
                border-radius: 14px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
                overflow: hidden;
                direction: ${isAr ? 'rtl' : 'ltr'};
                font-family: inherit;
                border: 1px solid #cbd5e1;
            `;
        } else {
            widget.style.cssText = `
                position: fixed;
                bottom: 24px;
                ${isAr ? 'left: 24px;' : 'right: 24px;'}
                z-index: 999999;
                width: 340px;
                background: #ffffff;
                border-radius: 12px;
                box-shadow: 0 12px 32px rgba(0, 0, 0, 0.25);
                overflow: hidden;
                direction: ${isAr ? 'rtl' : 'ltr'};
                font-family: inherit;
                border: 1px solid #cbd5e1;
            `;
        }

        widget.innerHTML = `
            <style>
                @keyframes widgetSpin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            </style>
            <div style="background: #08305b; color: white; padding: 10px 14px; display: flex; align-items: center; justify-content: space-between; border-radius: 12px 12px 0 0;">
                <div style="display: flex; align-items: center; gap: 10px; flex: 1;" id="globalWidgetHeader">
                    <div style="width: 26px; height: 26px; border-radius: 50%; background: ${isDone ? 'rgba(34,197,94,0.2)' : 'rgba(59,130,246,0.2)'}; color: ${isDone ? '#22c55e' : '#60a5fa'}; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                        ${isDone 
                            ? `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`
                            : `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>`
                        }
                    </div>
                    <span style="font-weight: 700; font-size: 0.86rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${titleText}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 4px;">
                    <button type="button" id="globalWidgetExpandBtn" title="${isAr ? 'تكبير / تصغير' : 'Maximize'}" style="background:none; border:none; color:#94a3b8; cursor:pointer; padding:3px; display:flex; align-items:center;">
                        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
                    </button>
                    <button type="button" id="globalWidgetCollapseBtn" title="${isAr ? 'طي / توسيع' : 'Toggle'}" style="background:none; border:none; color:#94a3b8; cursor:pointer; padding:3px; display:flex; align-items:center;">
                        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2">${isCollapsed ? '<polyline points="18 15 12 9 6 15"/>' : '<polyline points="6 9 12 15 18 9"/>'}</svg>
                    </button>
                    <button type="button" id="globalWidgetCloseBtn" title="${isAr ? 'إغلاق' : 'Close'}" style="background:none; border:none; color:#94a3b8; cursor:pointer; padding:3px; font-size:1.1rem; display:flex; align-items:center;">
                        &times;
                    </button>
                </div>
            </div>
            ${!isDone ? `
                <div style="height: 3px; background: #e2e8f0; width: 100%;">
                    <div style="height: 100%; background: #2563eb; width: ${overallProg}%; transition: width 0.2s ease;"></div>
                </div>
            ` : ''}
            ${filesHtml}
        `;

        widget.querySelector('#globalWidgetExpandBtn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            widget.dataset.maximized = widget.dataset.maximized === 'true' ? 'false' : 'true';
            widget.dataset.collapsed = 'false';
            render();
        });
        widget.querySelector('#globalWidgetCollapseBtn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            widget.dataset.collapsed = widget.dataset.collapsed === 'true' ? 'false' : 'true';
            widget.dataset.maximized = 'false';
            render();
        });
        widget.querySelector('#globalWidgetCloseBtn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!isDone) {
                if (!confirm(isAr ? 'عملية الرفع جارية حالياً، هل أنت متأكد من الإغلاق؟' : 'Upload in progress, are you sure you want to close?')) {
                    return;
                }
            }
            widget.style.display = 'none';
            widget.remove();
        });
    }

    render();

    let step = 0;
    const interval = setInterval(() => {
        step += 25;
        queue.forEach(f => {
            if (f.progress < 100) {
                f.progress = Math.min(100, f.progress + 25);
                if (f.progress >= 100) f.status = 'complete';
            }
        });
        render();
        if (step >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                render();
            }, 300);
        }
    }, 200);
}

// ==========================================
// 2. File Repository Service
// ==========================================
const defaultFallbackFiles = [
    { id: 1, name: 'Computer Networks & Protocols Lecture Notes.pdf', type: 'PDF', version: 'v1.0', size: '4.2 MB', dept: 'IT', deptId: 'IT', downloads: 128, uploadDate: '2026-07-01', program: 'it-net' },
    { id: 2, name: 'Database Systems Laboratory Work.docx', type: 'DOCX', version: 'v1.2', size: '2.8 MB', dept: 'IT', deptId: 'IT', downloads: 95, uploadDate: '2026-07-05', program: 'it-db' },
    { id: 3, name: 'Embedded Systems Microcontrollers Guide.pdf', type: 'PDF', version: 'v2.0', size: '8.5 MB', dept: 'EL', deptId: 'EL', downloads: 210, uploadDate: '2026-07-10', program: 'el-embed' },
    { id: 4, name: 'Power Electronics Experiments & Circuits.pptx', type: 'PPTX', version: 'v1.0', size: '15.1 MB', dept: 'EL', deptId: 'EL', downloads: 140, uploadDate: '2026-07-12', program: 'el-power' },
    { id: 5, name: 'Mechanical CAD Blueprints & Manuals.zip', type: 'ZIP', version: 'v3.1', size: '45.0 MB', dept: 'ME', deptId: 'ME', downloads: 320, uploadDate: '2026-07-15', program: 'me-cad' }
];

export const fileService = {
 async getFiles(dept = null, search = null) {
    try {
        let url = '/api/Files';
        const params = [];
        if (dept) params.push(`department=${dept}`);
        if (search) params.push(`search=${search}`);
        if (params.length > 0) url += '?' + params.join('&');

        const backendFiles = await fetchAPI(url);
        if (Array.isArray(backendFiles) && backendFiles.length > 0) {
            return backendFiles.map(f => {
                const deptId = getDeptId(f.dept);
                return {
                    id: f.id,
                    name: f.name,
                    type: getFileTypeLabel(f.type),
                    version: f.version || 'v1.0',
                    size: formatFileSize(f.size),
                    dept: f.dept || '',
                    deptId: deptId,
                    downloads: f.downloadCount || 0,
                    uploadDate: f.uploadedAt
                        ? f.uploadedAt.split('T')[0] : new Date().toISOString().split('T')[0],
                    program: f.program || f.category || f.folderName || null
                };
            });
        }
    } catch (err) {
        console.warn("API failed to get files, using fallback repository files:", err);
    }
    return defaultFallbackFiles;
},

    // Upload a course thumbnail image; returns { url } to store instead of base64.
    async uploadThumbnail(file) {
        const fd = new FormData();
        fd.append('file', file);
        return await fetchAPI('/api/Files/thumbnail', {
            method: 'POST',
            body: fd
        });
    },

    async uploadFile(formData, folderId = 0, type = '', dept = '', customName = '') {
        try {
            let url = `/api/Files/upload?folderId=${folderId}`;
            if (type) url += `&type=${encodeURIComponent(type)}`;
            if (dept) url += `&dept=${encodeURIComponent(dept)}`;
            if (customName) url += `&customName=${encodeURIComponent(customName)}`;

            return await fetchAPI(url, {
                method: 'POST',
                body: formData
            });
        } catch (err) {
            console.warn("Upload API failed.");
            throw err;
        }
    },

    /**
     * Upload a file with real-time progress tracking.
     * Uses XMLHttpRequest because fetch() doesn't support upload progress.
     * @param {FormData} formData - Must contain a 'file' field.
     * @param {{folderId?:number, type?:string, dept?:string, customName?:string, program?:string}} params
     * @param {(percent:number)=>void} onProgress - Called with 0-100 during upload.
     * @returns {Promise<object>} Parsed JSON response from the server.
     */
    /**
     * Chunked upload for very large files (multi-GB). Splits the file into
     * fixed-size chunks and uploads them one at a time, so a dropped connection
     * resumes from the last chunk instead of restarting. Memory stays flat.
     *
     * @param {File} file
     * @param {object} params - { folderId, type, dept, customName, program }
     * @param {(percent:number)=>void} onProgress
     * @param {string} [existingUploadId] - pass to resume a previous attempt
     * @returns {Promise<object>} the completed file record
     */
    async uploadFileChunked(file, params = {}, onProgress = () => {}, existingUploadId = null) {
        const CHUNK_SIZE = 5 * 1024 * 1024;   // 5 MB per chunk
        const token = localStorage.getItem('aitu_token');
        const authHeader = token ? { 'Authorization': `Bearer ${token}` } : {};

        // A stable id for this upload. Reusing one lets the server resume.
        const uploadId = existingUploadId ||
            `up_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

        // Ask the server which chunks it already has (resume support).
        let received = new Set();
        try {
            const statusRes = await fetch(
                `${BASE_URL}/api/Files/chunk/status?uploadId=${encodeURIComponent(uploadId)}`,
                { headers: authHeader });
            if (statusRes.ok) {
                const data = await statusRes.json();
                received = new Set(data.received || []);
            }
        } catch { /* no prior chunks; start fresh */ }

        // Upload each missing chunk in order.
        for (let index = 0; index < totalChunks; index++) {
            if (received.has(index)) {
                onProgress(Math.round(((index + 1) / totalChunks) * 100));
                continue;
            }

            const start = index * CHUNK_SIZE;
            const blob = file.slice(start, start + CHUNK_SIZE);

            // Upload this chunk with XHR so progress updates DURING the chunk,
            // not only after it finishes. With 5 MB chunks on a slow uplink, a
            // whole chunk can take many seconds -- without intra-chunk progress
            // the bar looks frozen, then jumps. base is the % already done from
            // completed chunks; the chunk's own upload adds a slice on top.
            const base = (index / totalChunks) * 100;
            const slice = (1 / totalChunks) * 100;

            const uploadOneChunk = () => new Promise((res) => {
                const fd = new FormData();
                fd.append('chunk', blob);
                fd.append('uploadId', uploadId);
                fd.append('index', index);

                const xhr = new XMLHttpRequest();
                xhr.open('POST', `${BASE_URL}/api/Files/chunk`, true);
                if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

                xhr.upload.addEventListener('progress', (e) => {
                    if (e.lengthComputable) {
                        const within = (e.loaded / e.total) * slice;
                        onProgress(Math.min(99, Math.round(base + within)));
                    }
                });
                xhr.addEventListener('load', () => res(xhr.status >= 200 && xhr.status < 300));
                xhr.addEventListener('error', () => res(false));
                xhr.send(fd);
            });

            // One retry per chunk before giving up.
            let ok = false;
            for (let attempt = 0; attempt < 2 && !ok; attempt++) {
                ok = await uploadOneChunk();
            }
            if (!ok) {
                const err = new Error(`Chunk ${index} failed. Upload paused -- retry to resume.`);
                err.uploadId = uploadId;
                throw err;
            }

            onProgress(Math.round(((index + 1) / totalChunks) * 100));
        }

        // All chunks are up: ask the server to stitch and register the file.
        const { folderId = 0, type = '', dept = '', customName = '', program = '' } = params;
        const completeRes = await fetch(`${BASE_URL}/api/Files/chunk/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeader },
            body: JSON.stringify({
                uploadId,
                totalChunks,
                fileName: file.name,
                folderId,
                type,
                dept,
                customName,
                program
            })
        });

        if (!completeRes.ok) {
            const msg = await completeRes.json().catch(() => ({}));
            throw new Error(msg.message || 'Failed to finalize the upload.');
        }
        return await completeRes.json();
    },

    uploadFileWithProgress(formData, params = {}, onProgress = () => {}) {
        return new Promise((resolve, reject) => {
            const { folderId = 0, type = '', dept = '', customName = '', program = '' } = params;

            let url = `${BASE_URL}/api/Files/upload?folderId=${folderId}`;
            if (type) url += `&type=${encodeURIComponent(type)}`;
            if (dept) url += `&dept=${encodeURIComponent(dept)}`;
            if (customName) url += `&customName=${encodeURIComponent(customName)}`;
            if (program) url += `&program=${encodeURIComponent(program)}`;

            const xhr = new XMLHttpRequest();
            xhr.open('POST', url, true);

            // Auth header
            const token = localStorage.getItem('aitu_token');
            if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

            // Progress
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    onProgress(Math.round((e.loaded / e.total) * 100));
                }
            });

            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        resolve(JSON.parse(xhr.responseText));
                    } catch {
                        resolve({});
                    }
                } else if (xhr.status === 401) {
                    localStorage.removeItem('aitu_token');
                    window.location.href = 'login.html';
                    reject(new Error('Session expired'));
                } else {
                    reject(new Error(`Upload failed (${xhr.status})`));
                }
            });

            xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
            xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));

            xhr.send(formData);
        });
    },

    async deleteFile(id) {
        try {
            return await fetchAPI(`/api/Files/${id}`, {
                method: 'DELETE'
            });
        } catch (err) {
            console.warn("Delete file API failed:", err);
            throw err;
        }
    },

    async deleteFiles(ids) {
        try {
            await Promise.all(
                ids.map(id => fetchAPI(`/api/Files/${id}`, {
                    method: 'DELETE'
                }))
            );
            return { success: true };
        } catch (err) {
            console.warn("Delete files API failed:", err);
            throw err;
        }
    },

    async downloadFile(id, filename, fileObj = null) {
        try {
            showProgressWidget([filename || 'Academic Resource']);

            // Two kinds of "file" exist in this app:
            //  - repository files: a numeric id -> /api/Files/download/{id}
            //  - course lessons:   a string id ("0olacye1k") + a stored path
            //    ("assets/uploads/x.mp4") -> /api/Files/download-by-path?path=
            // Pick the endpoint based on what we actually have.
            const numericId = parseInt(id);
            const path = fileObj && (fileObj.file || fileObj.path);

            let url;
            if (!isNaN(numericId) && numericId > 0 && String(numericId) === String(id)) {
                url = `${BASE_URL}/api/Files/download/${numericId}`;
            } else if (path) {
                url = `${BASE_URL}/api/Files/download-by-path?path=${encodeURIComponent(path)}`;
            } else {
                // Nothing usable to fetch.
                return { success: false };
            }

            // Fetch the real bytes and save them via a blob (reliable, gives a
            // real success/failure signal -- unlike a hidden iframe).
            const token = localStorage.getItem('aitu_token');
            const res = await fetch(url, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            if (!res.ok) throw new Error('Download failed: ' + res.status);

            const blob = await res.blob();
            if (!blob || blob.size === 0) throw new Error('Empty file');

            // Use the server's filename from Content-Disposition when present,
            // otherwise fall back to the passed name.
            let name = filename || 'download';
            const cd = res.headers.get('content-disposition') || '';
            const m = cd.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
            if (m && m[1]) { try { name = decodeURIComponent(m[1]); } catch { name = m[1]; } }

            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = name;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);

            return { success: true };
        } catch (err) {
            console.warn("Download error:", err.message);
            return { success: false };
        }
    },

    async downloadZip(fileIds) {
        try {
            const token = localStorage.getItem('aitu_token');
            const response = await fetch(
                `${BASE_URL}/api/Files/zip`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                    },
                    body: JSON.stringify(fileIds)
                }
            );
            if (!response.ok) throw new Error('ZIP download failed: ' + response.status);

            const blob = await response.blob();
            // Guard against an error body sneaking through as a "zip". A real zip
            // is never a few bytes of JSON.
            if (!blob || blob.size < 100) {
                throw new Error('ZIP response was empty or invalid');
            }

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `files_${Date.now()}.zip`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            // Revoke LATER, not immediately. Revoking right after click() can
            // cancel the save of a large (tens of MB) archive mid-write.
            setTimeout(() => URL.revokeObjectURL(url), 10000);
            return { success: true };
        } catch (err) {
            console.warn("ZIP download failed:", err.message);
            throw err;
        }
    }
};

// ==========================================
// 3. Folder Management Service
// ==========================================
const defaultFallbackFolders = [
    { id: 101, name: 'Information Technology', isDepartment: true, code: 'IT', shortName: 'IT', label: 'Information Technology', icon: 'monitor' },
    { id: 102, name: 'Electrical Engineering', isDepartment: true, code: 'EL', shortName: 'EL', label: 'Electrical Engineering', icon: 'zap' },
    { id: 103, name: 'Mechanical Engineering', isDepartment: true, code: 'ME', shortName: 'ME', label: 'Mechanical Engineering', icon: 'settings' }
];

export const folderService = {
    async getFolders() {
        const cacheKey = 'aitu_folders_cache';
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    this._fetchFreshFolders(cacheKey).catch(() => {});
                    return parsed;
                }
            } catch (e) {}
        }
        return await this._fetchFreshFolders(cacheKey);
    },

    async _fetchFreshFolders(cacheKey) {
        let liveFolders = [];
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 10000);
            const res = await fetchAPI('/api/Folders', { signal: controller.signal });
            clearTimeout(timer);

            if (Array.isArray(res) && res.length > 0) {
                liveFolders = res;
            }
        } catch (err) {
            console.warn("API getFolders failed:", err);
            liveFolders = defaultFallbackFolders;
        }

        if (!Array.isArray(liveFolders) || liveFolders.length === 0) {
            liveFolders = defaultFallbackFolders;
        }

        const createdLocal = JSON.parse(localStorage.getItem('aitu_created_folders') || '[]');
        const combined = [...liveFolders];
        createdLocal.forEach(f => {
            if (!combined.some(x => String(x.id) === String(f.id) || (x.code && f.code && x.code === f.code))) {
                combined.push(f);
            }
        });

        try {
            sessionStorage.setItem(cacheKey, JSON.stringify(combined));
        } catch (storageErr) {
            console.warn("sessionStorage quota exceeded, skipping folders cache:", storageErr);
            sessionStorage.removeItem(cacheKey);
        }
        return combined;
    },

    async createFolder(name, parentFolderId = null, deptOrMeta = '') {
        await delay();

        const meta = (deptOrMeta && typeof deptOrMeta === 'object') ? deptOrMeta : {};
        const deptCode = String(
            (deptOrMeta && typeof deptOrMeta === 'object')
                ? (meta.code || meta.shortName || '')
                : (deptOrMeta || '')
        ).toUpperCase();

        const isDepartment = meta.isDepartment === true || parentFolderId === 0;

        const payload = {
            name: String(name || '').trim(),
            parentFolderId: (typeof parentFolderId === 'number' && parentFolderId > 0)
                ? parentFolderId
                : null,
            dept: deptCode,
            code: isDepartment ? deptCode : '',
            shortName: isDepartment ? deptCode : '',
            icon: meta.icon || 'monitor',
            isDepartment: isDepartment
        };

        const storeLocalFolder = () => {
            const localFolder = {
                id: Date.now(),
                name: payload.name,
                parentFolderId: payload.parentFolderId,
                dept: payload.dept,
                code: payload.code || payload.shortName || payload.name.toUpperCase(),
                shortName: payload.shortName || payload.code || payload.name.toUpperCase(),
                icon: payload.icon || 'monitor',
                isDepartment: payload.isDepartment,
                createdAt: new Date().toISOString()
            };
            const created = JSON.parse(localStorage.getItem('aitu_created_folders') || '[]');
            if (!created.some(f => (f.code && localFolder.code && f.code === localFolder.code) || f.name === localFolder.name)) {
                created.push(localFolder);
                localStorage.setItem('aitu_created_folders', JSON.stringify(created));
            }
            sessionStorage.removeItem('aitu_folders_cache');
            return localFolder;
        };

        try {
            const result = await fetchAPI('/api/Folders', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            storeLocalFolder();
            return result || storeLocalFolder();
        } catch (err) {
            console.warn('createFolder API endpoint failed, creating local fallback folder:', err);
            return storeLocalFolder();
        }
    },

    async getFolderDetails(id) {
        await delay();
        try {
            return await fetchAPI(`/api/Folders/${id}`);
        } catch (err) {
            console.warn("API failed to get folder details.");
            throw err;
        }
    },

    async updateFolder(id, name, parentFolderId = 0) {
        await delay();
        try {
            return await fetchAPI(`/api/Folders/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ name, parentFolderId })
            });
        } catch (err) {
            console.warn("API failed to update folder.");
            throw err;
        }
    },

    async deleteFolder(id) {
        try {
            return await fetchAPI(`/api/Folders/${id}`, {
                method: 'DELETE'
            });
        } catch (err) {
            console.warn("Delete folder API failed:", err);
            throw err;
        }
    }
};

// ==========================================
// 3. Course Management Service
// ==========================================
export const courseService = {
    async getCourses(dept = null) {
        const cacheKey = `aitu_courses_cache_${dept || 'all'}`;
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed)) {
                    // Purge stale mock data if stored in cache
                    if (!parsed.some(c => c.id === '1' && c.title && c.title.includes('Web Development'))) {
                        this._fetchFreshCourses(dept, cacheKey).catch(() => {});
                        return parsed;
                    }
                    sessionStorage.removeItem(cacheKey);
                }
            } catch (e) {}
        }
        return await this._fetchFreshCourses(dept, cacheKey);
    },

    async _fetchFreshCourses(dept = null, cacheKey = null) {
        try {
            let url = '/api/Courses';
            if (dept) url += `?dept=${dept}`;

            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 10000);

            const res = await fetchAPI(url, { signal: controller.signal });
            clearTimeout(timer);

            if (Array.isArray(res)) {
                // Background preload thumbnails for instant zero-latency image loading
                imageCacheService.preloadImages(res.map(c => c.img));

                // Cache the result, but don't let a QuotaExceededError
                // (e.g. from large base64 thumbnails) prevent returning data.
                if (cacheKey) {
                    try {
                        sessionStorage.setItem(cacheKey, JSON.stringify(res));
                    } catch (storageErr) {
                        console.warn("sessionStorage quota exceeded, skipping cache:", storageErr);
                        sessionStorage.removeItem(cacheKey);
                    }
                }
                return res;
            }
        } catch (err) {
            console.warn("API getCourses failed:", err);
        }

        return [];
    },

    // Drafts are hidden from the public list; this asks for them explicitly.
    async getDrafts() {
        try {
            const all = await fetchAPI('/api/Courses?includeDrafts=true');
            return (all || []).filter(c => c.status === 'draft');
        } catch (err) {
            console.warn("API failed to get drafts:", err);
            return [];
        }
    },

    async getCourseDetails(id) {
        try {
            return await fetchAPI(`/api/Courses/${id}`);
        } catch (err) {
            console.warn("API failed to get course details:", err);
            throw err;
        }
    },

    async createCourse(courseData) {
        try {
            const result = await fetchAPI('/api/Courses', {
                method: 'POST',
                body: JSON.stringify(courseData)
            });
            // Invalidate courses cache so the list page fetches fresh data
            this._invalidateCoursesCache();
            return result;
        } catch (err) {
            console.warn("Create course API failed:", err);
            throw err;
        }
    },

    async updateCourse(id, courseData) {
        try {
            const result = await fetchAPI(`/api/Courses/${id}`, {
                method: 'PUT',
                body: JSON.stringify(courseData)
            });
            this._invalidateCoursesCache();
            return result;
        } catch (err) {
            console.warn("Update course API failed:", err);
            throw err;
        }
    },

    async deleteCourse(id) {
        try {
            const result = await fetchAPI(`/api/Courses/${id}`, {
                method: 'DELETE'
            });
            this._invalidateCoursesCache();
            return result;
        } catch (err) {
            console.warn("Delete course API failed:", err);
            throw err;
        }
    },

    /** Remove all courses caches so the next getCourses() hits the API */
    _invalidateCoursesCache() {
        for (let i = sessionStorage.length - 1; i >= 0; i--) {
            const key = sessionStorage.key(i);
            if (key && key.startsWith('aitu_courses_cache_')) {
                sessionStorage.removeItem(key);
            }
        }
    }
};

// ==========================================
// 4. User Account Service
// ==========================================
export const userService = {
    // The department list, straight from the server. Was hard-coded in users.js
    // as three <option> tags plus a name->id map (Information Tech = 1, ...).
    async getDepartments() {
        try {
            const res = await fetchAPI('/api/Admin/departments');
            if (Array.isArray(res) && res.length > 0) {
                return res;
            }
        } catch (err) {
            console.warn('API failed to get departments, using folderService fallback:', err);
        }
        try {
            const folders = await folderService.getFolders();
            const depts = (folders || []).filter(f => f.isDepartment || f.code || f.shortName || f.parentFolderId === null || f.parentFolderId === 0);
            if (depts.length > 0) {
                return depts.map(d => ({
                    id: d.id,
                    name: d.name || d.label || d.code,
                    code: d.code || d.shortName || (d.name ? d.name.substring(0, 3).toUpperCase() : 'DEPT'),
                    icon: d.icon || 'monitor'
                }));
            }
        } catch (e) {}

        return [
            { id: 101, name: 'Information Technology', code: 'IT', icon: 'monitor' },
            { id: 102, name: 'Electrical Engineering', code: 'EL', icon: 'zap' },
            { id: 103, name: 'Mechanical Engineering', code: 'ME', icon: 'settings' }
        ];
    },

    async getRoles() {
        try {
            const res = await fetchAPI('/api/Admin/roles');
            if (Array.isArray(res) && res.length > 0) return res;
        } catch (err) {
            console.warn('API failed to get roles:', err);
        }
        const depts = await this.getDepartments();
        const mgrRoles = depts.map(d => ({
            role: `${d.code} Manager`,
            deptCode: d.code,
            description: `Manager of ${d.name}`
        }));
        return [
            { role: 'Faculty', description: 'Teaching Faculty' },
            { role: 'Supervisor', description: 'System Administrator' },
            ...mgrRoles
        ];
    },

    async getUsers() {
        let apiUsers = [];
        try {
            const res = await fetchAPI('/api/Admin/all');
            if (Array.isArray(res)) apiUsers = res;
            else if (res && Array.isArray(res.users)) apiUsers = res.users;
            else if (res && Array.isArray(res.data)) apiUsers = res.data;
        } catch (err) {
            console.warn("API failed to get users:", err);
        }

        const created = JSON.parse(localStorage.getItem('aitu_created_users') || '[]');
        const baseMock = mock.mockUsers || [];
        const deletedList = (JSON.parse(localStorage.getItem('aitu_deleted_users') || '[]')).map(x => String(x).toLowerCase());

        const allCombined = [];
        const seenUsernames = new Set();

        const addUser = (u) => {
            if (!u) return;
            const uname = String(u.username || u.name || u.email || '').toLowerCase();
            const uid = String(u.id || u.userId || '').toLowerCase();
            if (uname && !seenUsernames.has(uname) && !deletedList.includes(uname) && !deletedList.includes(uid)) {
                seenUsernames.add(uname);
                allCombined.push(u);
            }
        };

        apiUsers.forEach(addUser);
        created.forEach(addUser);
        baseMock.forEach(addUser);

        return allCombined;
    },

    async createUser(username, email, phone, role, departmentId = 1, mustChangePassword = true) {
        const createdUser = {
            id: Date.now(),
            username,
            email,
            phone,
            role,
            mustChangePassword,
            joined: new Date().toISOString().substring(0, 10),
            isProtected: false,
            name: username
        };

        if (mustChangePassword) {
            localStorage.setItem('aitu_force_change_password_' + String(username).toLowerCase(), 'true');
        }

        const storeLocalUser = () => {
            const created = JSON.parse(localStorage.getItem('aitu_created_users') || '[]');
            if (!created.some(u => u.username === username)) {
                created.push(createdUser);
                localStorage.setItem('aitu_created_users', JSON.stringify(created));
            }
            // Remove from deleted list if re-created
            const deletedList = JSON.parse(localStorage.getItem('aitu_deleted_users') || '[]');
            const updatedDeleted = deletedList.filter(x => String(x).toLowerCase() !== String(username).toLowerCase());
            localStorage.setItem('aitu_deleted_users', JSON.stringify(updatedDeleted));
        };

        try {
            const res = await fetchAPI('/api/Admin/create', {
                method: 'POST',
                body: JSON.stringify({
                    username,
                    email,
                    phone,
                    role,
                    password: 'Admin@123',
                    departmentId
                })
            });
            storeLocalUser();
            return res;
        } catch (err) {
            console.warn("Create user API fallback:", err);
            storeLocalUser();
            return createdUser;
        }
    },

    async deleteUser(id, targetUser = null) {
        const loggedInUser = getCurrentUser();
        const loggedInUsername = String(loggedInUser?.username || '').toLowerCase();
        const isPrimaryAdmin = loggedInUsername === 'admin';
        const isAr = getCurrentLang() === 'ar';

        if (targetUser && targetUser.role === 'Supervisor' && !isPrimaryAdmin) {
            throw new Error(isAr 
                ? 'عفواً، حساب الأدمن الرئيسي (admin) فقط هو من يقدر على حذف المشرفين العموم.' 
                : 'Only the primary admin (admin) can delete another Supervisor account.'
            );
        }

        const targetName = targetUser ? targetUser.username : id;
        const deletedList = JSON.parse(localStorage.getItem('aitu_deleted_users') || '[]');
        if (targetName && !deletedList.includes(String(targetName).toLowerCase())) {
            deletedList.push(String(targetName).toLowerCase());
        }
        if (id && !deletedList.includes(String(id).toLowerCase())) {
            deletedList.push(String(id).toLowerCase());
        }
        localStorage.setItem('aitu_deleted_users', JSON.stringify(deletedList));

        const created = JSON.parse(localStorage.getItem('aitu_created_users') || '[]');
        const filteredCreated = created.filter(u => 
            String(u.id) !== String(id) && 
            String(u.username || '').toLowerCase() !== String(targetName).toLowerCase()
        );
        localStorage.setItem('aitu_created_users', JSON.stringify(filteredCreated));

        try {
            await fetchAPI(`/api/Admin/${id}`, {
                method: 'DELETE'
            });
        } catch (err) {
            console.warn("Delete user API endpoint failed, deleted locally:", err);
        }

        return true;
    }
};

// ==========================================
// 5. System Logs Service
// ==========================================
// js/shared/services.js - الجزء الخاص بـ logService فقط

// js/shared/services.js - logService فقط

export const logService = {
    async getLogs(filters = {}, cacheBuster = '') {
        try {
            let url = '/api/Admin/logs';
            const params = [];

            if (filters.action) params.push(`action=${filters.action}`);
            if (filters.username) params.push(`username=${filters.username}`);
            if (filters.from) params.push(`from=${filters.from}`);
            if (filters.to) params.push(`to=${filters.to}`);

            // Cache-busting goes in the URL, NOT in a Cache-Control header. Custom
            // request headers (Cache-Control / Pragma / Expires) are non-simple,
            // so they force a CORS preflight (OPTIONS) on every call -- and on the
            // free host that preflight took minutes, which is what made the page
            // hang and show 0. A query param busts the cache with no preflight.
            if (cacheBuster) params.push(cacheBuster);

            if (params.length > 0) url += '?' + params.join('&');

            // Generous timeout: the first preflight (Authorization header still
            // triggers one) can be slow until the server sets SetPreflightMaxAge.
            const res = await fetchAPI(url, { timeout: 180000 });

            if (Array.isArray(res)) return res;
            if (res && Array.isArray(res.logs)) return res.logs;
            if (res && Array.isArray(res.data)) return res.data;
            return [];
        } catch (err) {
            console.warn('API failed to get logs:', err);
            return [];
        }
    },

    async addLog(admin, role, action, target) {
        // Handle 2-arg overload: addLog(action, target)
        if (action === undefined) {
            action = admin;
            target = role;
            const currentUser = authService.getCurrentUser();
            admin = currentUser?.username || 'admin';
            role = currentUser?.role || 'Supervisor';
        }
        const datetimeStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
        try {
            await fetchAPI('/api/Admin/logs', {
                method: 'POST',
                skip401Redirect: true,
                body: JSON.stringify({
                    admin: admin || 'admin',
                    role: role || 'Supervisor',
                    action: action,
                    target: target || '',
                    datetime: datetimeStr
                })
            });
        } catch (err) {
            console.warn("Log creation API failed:", err);
        }
    }
};

// ==========================================
// 6. User Profile Settings Service
// ==========================================
export const profileService = {
    async updateProfile(email, mobile, fullName, avatar) {
        await delay();
        const currentUser = authService.getCurrentUser();
        const uname = currentUser?.username || 'admin';

        const safeSetItem = (key, val) => {
            try {
                localStorage.setItem(key, val);
            } catch (e) {
                console.warn(`localStorage quota exceeded for ${key}, using sessionStorage fallback:`, e);
                try { sessionStorage.setItem(key, val); } catch (err) {}
            }
        };

        if (mobile) {
            safeSetItem('aitu_user_phone_' + uname, mobile);
            safeSetItem('aitu_user_phone', mobile);
        }
        if (email) {
            safeSetItem('aitu_user_email_' + uname, email);
            safeSetItem('aitu_user_email', email);
        }
        if (fullName) {
            safeSetItem('aitu_user_fullname_' + uname, fullName);
            safeSetItem('aitu_user_fullname', fullName);
        }
        if (avatar !== undefined) {
            if (avatar) {
                safeSetItem('aitu_user_avatar_' + uname, avatar);
                safeSetItem('aitu_user_avatar', avatar);
            } else {
                localStorage.removeItem('aitu_user_avatar_' + uname);
                localStorage.removeItem('aitu_user_avatar');
                sessionStorage.removeItem('aitu_user_avatar_' + uname);
                sessionStorage.removeItem('aitu_user_avatar');
            }
        }

        try {
            return await fetchAPI('/api/Admin/profile', {
                method: 'PUT',
                body: JSON.stringify({ email, mobile, fullName, avatar })
            });
        } catch (err) {
            console.warn("Update profile API fallback.");
            return { success: true, email, mobile, fullName, avatar };
        }
    },

    async changePassword(oldPassword, newPassword) {
        await delay();
        try {
            return await fetchAPI('/api/Auth/change-password', {
                method: 'POST',
                body: JSON.stringify({
                    oldPassword,
                    newPassword,
                    repeatPassword: newPassword
                })
            });
        } catch (err) {
            console.warn("Change password API failed.");
            throw err;
        }
    }
};

async function getLiveAggregates(targetYear = null) {
    let files = [];
    let courses = [];
    let folders = [];
    let logs = [];
    try { files = await fileService.getFiles(); } catch(e) {}
    try { courses = await courseService.getCourses(); } catch(e) {}
    try { folders = await folderService.getFolders(); } catch(e) {}
    try { logs = await logService.getLogs(); } catch(e) {}

    if (!Array.isArray(files)) files = [];
    if (!Array.isArray(courses)) courses = [];
    if (!Array.isArray(folders)) folders = [];
    if (!Array.isArray(logs)) logs = [];

    // Keyed by department CODE, built from whatever departments actually exist.
    const resourceMix = {};
    const programDownloads = {};
    let totalMB = 0;

    const deptCodeOf = f =>
        String(f.deptId || f.department || f.dept || '')
            .trim().replace(/\s+DEPT$/i, '').toUpperCase() || 'UNASSIGNED';

    files.forEach(f => {
        const code = deptCodeOf(f);
        const dl = Number(f.downloads) || 0;
        resourceMix[code] = (resourceMix[code] || 0) + 1;
        programDownloads[code] = (programDownloads[code] || 0) + dl;

        if (f.size) {
            const str = String(f.size).trim().toLowerCase();
            const val = parseFloat(str) || 0;
            if (str.includes('gb')) totalMB += val * 1024;
            else if (str.includes('mb')) totalMB += val;
            else if (str.includes('kb')) totalMB += val / 1024;
        }
    });

    const usedGB = (totalMB / 1024).toFixed(2);
    const usedPercentage = Math.min(100, Math.round((usedGB / 500) * 100));

    const sortedFiles = [...files].sort((a, b) => (Number(b.downloads) || 0) - (Number(a.downloads) || 0));
    const highImpactDocuments = sortedFiles.slice(0, 5).map(f => ({
        name: f.name || f.fileName || 'Untitled File',
        source: String(f.deptId || 'General').toUpperCase(),
        downloads: Number(f.downloads) || 0,
        weight: f.size || '1.0 MB',
        type: String(f.type || f.fileType || 'PDF').toUpperCase()
    }));

    const recentEvents = logs.slice(0, 10).map(l => ({
        user: l.admin || l.user || l.username || 'Admin',
        action: l.action || 'performed action',
        target: l.target || l.details || '',
        time: l.datetime || l.timestamp || 'Recently',
        type: String(l.action || '').toLowerCase().includes('delete') ? 'critical' : 'info'
    }));

    const monthsList = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const nowYear = new Date().getFullYear();
    const selYear = Number(targetYear) || nowYear;
    const isCurrentYear = selYear === nowYear;
    const maxMonthIdx = isCurrentYear ? new Date().getMonth() : 11;

    const downloadVelocityMap = {};
    monthsList.slice(0, Math.max(6, maxMonthIdx + 1)).forEach(m => downloadVelocityMap[m] = 0);

    logs.forEach(l => {
        const dt = l.datetime || l.timestamp;
        if (dt) {
            const d = new Date(dt);
            if (!isNaN(d.getTime()) && (targetYear == null || d.getFullYear() === selYear)) {
                const mName = monthsList[d.getMonth()];
                if (downloadVelocityMap[mName] !== undefined) {
                    downloadVelocityMap[mName] += 1;
                }
            }
        }
    });

    files.forEach(f => {
        const dl = Number(f.downloads) || 0;
        const dt = f.uploadDate || f.createdAt || f.created_at;
        if (dt) {
            const d = new Date(dt);
            if (!isNaN(d.getTime()) && (targetYear == null || d.getFullYear() === selYear)) {
                const mName = monthsList[d.getMonth()];
                if (downloadVelocityMap[mName] !== undefined) {
                    downloadVelocityMap[mName] += dl;
                }
            }
        }
    });

    const downloadVelocity = Object.keys(downloadVelocityMap).map(m => ({
        month: m,
        count: downloadVelocityMap[m]
    }));

    return {
        totalFiles: files.length,
        totalCourses: courses.length,
        totalPrograms: folders.length,
        qnapStorage: {
            usedPercentage: usedPercentage || 0,
            usedValue: `${usedGB || 0} GB`,
            totalValue: "500 GB"
        },
        resourceMix,
        programDownloads,
        downloadVelocity,
        highImpactDocuments,
        recentEvents
    };
}

// ==========================================
// 7. Dashboard Service
// ==========================================
export const dashboardService = {
    // One fetch for the whole dashboard, carrying the selected window.
    // The page used to call six separate methods that each hit
    // /api/Dashboard/metrics with no ?days, so the server was queried six times
    // per load and the window was never sent. Call this once, pass the result
    // to the render functions.
    async getMetrics(days = 30) {
        try {
            const apiData = await fetchAPI(`/api/Dashboard/metrics?days=${days}`);
            if (apiData && typeof apiData === 'object' && (apiData.totalFiles !== undefined || apiData.totalCourses !== undefined || apiData.resourceMix)) {
                return apiData;
            }
        } catch (err) {
            console.warn("Dashboard metrics API fallback:", err);
        }

        const live = await getLiveAggregates();
        return {
            totalFiles: live.totalFiles,
            totalCourses: live.totalCourses,
            totalPrograms: live.totalPrograms,
            storageCapacityUsed: live.qnapStorage.usedPercentage,
            storageCapacityValue: `${live.qnapStorage.usedValue} / ${live.qnapStorage.totalValue}`,
            qnapStorage: live.qnapStorage,
            pendingTasks: 0,
            netActivity: "Active",
            downloadVelocity: live.downloadVelocity,
            resourceMix: live.resourceMix,
            programDownloads: live.programDownloads,
            highImpactDocuments: live.highImpactDocuments,
            recentEvents: live.recentEvents
        };
    },

    async getStats(days = 30) {
        let apiData = null;
        try {
            apiData = await fetchAPI(`/api/Dashboard/metrics?days=${days}`);
        } catch (err) {}

        const live = await getLiveAggregates();
        return {
            totalFiles: (apiData && typeof apiData.totalFiles === 'number') ? apiData.totalFiles : live.totalFiles,
            totalCourses: (apiData && typeof apiData.totalCourses === 'number') ? apiData.totalCourses : live.totalCourses,
            totalPrograms: (apiData && typeof apiData.totalPrograms === 'number') ? apiData.totalPrograms : live.totalPrograms,
            qnapStorage: apiData?.qnapStorage || live.qnapStorage,
            pendingTasks: apiData?.pendingTasks || 0,
            netActivity: apiData?.netActivity || "0",
            trends: apiData?.trends || {
                totalFiles: "Live files count",
                totalCourses: "Live courses count",
                totalPrograms: "Live programs count",
                storageCapacity: `${live.qnapStorage.usedPercentage}% used`,
                pendingTasks: "No pending tasks",
                netActivity: "Active"
            }
        };
    },

    async getDownloads(year) {
        const selectedYear = Number(year) || new Date().getFullYear();
        try {
            const data = await fetchAPI(`/api/Dashboard/metrics?year=${selectedYear}`);
            if (Array.isArray(data.downloadVelocity) && data.downloadVelocity.length > 0) {
                return data.downloadVelocity;
            }
        } catch (err) {}

        const live = await getLiveAggregates(selectedYear);
        return live.downloadVelocity;
    },

    async getResourceMix() {
        try {
            const data = await fetchAPI('/api/Dashboard/metrics');
            // The old guard tested data.resourceMix.it/el/me. The API returns
            // { documents, media, logs } -- different keys entirely -- so it was
            // always false and this always fell through to the live aggregate.
            // Keep using the live one, but say so.
            if (data && data.resourceMix && Object.values(data.resourceMix).some(v => v > 0)) {
                // Only usable if it is keyed by department code.
                const keys = Object.keys(data.resourceMix);
                if (!keys.includes('documents')) return data.resourceMix;
            }
        } catch (err) {}
        const live = await getLiveAggregates();
        return live.resourceMix;
    },

    async getProgramDownloads() {
        try {
            const data = await fetchAPI('/api/Dashboard/metrics');
            if (data && data.programDownloads &&
                Object.values(data.programDownloads).some(v => v > 0)) {
                return data.programDownloads;
            }
        } catch (err) {}
        const live = await getLiveAggregates();
        return live.programDownloads;
    },

    async getDocuments(limit = 5) {
        try {
            const data = await fetchAPI('/api/Dashboard/metrics');
            if (Array.isArray(data.highImpactDocuments) && data.highImpactDocuments.length > 0) {
                return data.highImpactDocuments.slice(0, limit);
            }
        } catch (err) {}
        const live = await getLiveAggregates();
        return live.highImpactDocuments.slice(0, limit);
    },

    async getEvents(limit = 10) {
        try {
            const data = await fetchAPI('/api/Dashboard/metrics');
            if (Array.isArray(data.recentEvents) && data.recentEvents.length > 0) {
                return data.recentEvents.slice(0, limit);
            }
        } catch (err) {}
        const live = await getLiveAggregates();
        return live.recentEvents.slice(0, limit);
    },

    async getNotificationsCount() {
        await delay(100);
        return { count: 0 };
    },

    async exportReport(format = 'pdf') {
        await delay(500);
        return { success: true };
    }
};
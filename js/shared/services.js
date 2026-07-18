// js/shared/services.js
import { fetchAPI, BASE_URL } from './api.js';
import * as mock from './mockData.js';

// Toggle to force mock data or let it attempt real API first
const USE_MOCK = false;

// Helper for emulating network latency
const delay = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to construct a mock JWT token
function generateMockJWT(user) {
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload = btoa(JSON.stringify({
        sub: user.username,
        email: user.email,
        role: user.role,
        phone: user.phone,
        joined: user.joined,
        name: user.name || user.username,
        exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour expiry
    }));
    const signature = "mock_signature";
    return `${header}.${payload}.${signature}`;
}

// Helper to decode a JWT token
export function decodeJWT(token) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const decodedPayload = atob(parts[1]);
        return JSON.parse(decodedPayload);
    } catch (e) {
        console.error("JWT decoding failed:", e);
        return null;
    }
}

// ==========================================
// 1. Authentication Service
// ==========================================
export const authService = {
    // TODO: POST /api/Auth/login
    async login(username, password) {
        try {
            const res = await fetchAPI('/api/Auth/login', {
                method: 'POST',
                body: JSON.stringify({ username, password })
            });
            if (res && res.token) {
                localStorage.setItem('aitu_token', res.token);
                if (res.refreshToken) localStorage.setItem('aitu_refresh_token', res.refreshToken);
                if (res.role) localStorage.setItem('aitu_role', res.role);
            }
            return res;
        } catch (err) {
            console.warn("Login API failed:", err);
            throw err;
        }
    },

    logout() {
        const user = this.getCurrentUser();
        if (user) {
            logService.addLog(user.username, user.role, "Logout", "System");
        }
        localStorage.removeItem('aitu_token');
        localStorage.removeItem('aitu_refresh_token');
    },

    getCurrentUser() {
        const token = localStorage.getItem('aitu_token');
        if (!token) return null;
        let decoded = decodeJWT(token);
        if (!decoded) {
            const fallbackRole = localStorage.getItem('aitu_role') || 'Supervisor';
            const fallbackUser = localStorage.getItem('aitu_username') || 'admin';
            decoded = {
                sub: fallbackUser,
                role: fallbackRole,
                email: `${fallbackUser}@aitu.edu.eg`,
                name: fallbackUser
            };
        }

        // ✅ جيب الـ role من الـ claim الصح
        const role = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
            decoded.role ||
            localStorage.getItem('aitu_role') ||
            'User';

        const username = decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ||
            decoded.sub ||
            localStorage.getItem('aitu_username') || '';
            
        const email = decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] ||
            decoded.email ||
            (username ? `${username}@aitu.edu.eg` : '');

        const userId = decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ||
            decoded.sub || '';

        return {
            id: userId,
            username: username,
            email: decoded.email || '',
            role: role,
            phone: decoded.phone || '',
            joined: decoded.joined || '',
            name: decoded.name || username,
            departmentId: decoded.DepartmentId || ''
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

// ==========================================
// 2. File Repository Service
// ==========================================
export const fileService = {
 async getFiles(dept = null, search = null) {
    try {
        let url = '/api/Files';
        const params = [];
        if (dept) params.push(`department=${dept}`);
        if (search) params.push(`search=${search}`);
        if (params.length > 0) url += '?' + params.join('&');

        const backendFiles = await fetchAPI(url);

        return backendFiles.map(f => {
            const deptId = getDeptId(f.dept);
            return {
                id: f.id,
                name: f.name,
                type: getFileTypeLabel(f.type),
                version: f.version || 'v1.0',
                size: formatFileSize(f.size),
                // No 'IT DEPT' fallback: a file with no department is not an
                // IT file, and pretending otherwise put it in the wrong place.
                dept: f.dept || '',
                deptId: deptId,
                downloads: f.downloadCount || 0,
                uploadDate: f.uploadedAt
                    ? f.uploadedAt.split('T')[0] : new Date().toISOString().split('T')[0],
                program: f.program || f.category || f.folderName || null
            };
        });
    } catch (err) {
        console.warn("API failed to get files:", err);
        return [];
    }
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

    async downloadFile(id, filename) {
        try {
            const token = localStorage.getItem('aitu_token');
            const response = await fetch(
                `${BASE_URL}/api/Files/download/${id}`,
                {
                    headers: token
                        ? { 'Authorization': `Bearer ${token}` }
                        : {}
                }
            );
            if (!response.ok) throw new Error('Download failed');
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
            return { success: true };
        } catch (err) {
            console.warn("Download failed.");
            throw err;
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
            if (!response.ok) throw new Error('ZIP download failed');
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `files_${Date.now()}.zip`;
            a.click();
            URL.revokeObjectURL(url);
            return { success: true };
        } catch (err) {
            console.warn("ZIP download failed.");
            throw err;
        }
    }
};

// ==========================================
// 3. Folder Management Service
// ==========================================
export const folderService = {
    async getFolders() {
        try {
            return await fetchAPI('/api/Folders');
        } catch (err) {
            console.warn("API failed to get folders:", err);
            return [];
        }
    },

/**
 * Creates a folder on the server, which also creates the real folder on the
 * QNAP drive. Accepts both call styles already used across the app:
 *
 *   createFolder('Civil Eng', 0, { code:'CE', shortName:'CE', icon:'zap', isDepartment:true })
 *   createFolder('Networking', null, 'IT')
 *
 * Two bugs are fixed here:
 *  1. The 3rd argument was typed as a string, but repository.js passed an
 *     OBJECT. Model binding dropped it, so `code` never reached the server.
 *     With no code stored, the UI fell back to the numeric DB id and rendered
 *     categories literally named "1", "2", "3", "6".
 *  2. Programs were sent with parentFolderId: null (because `typeof null` is
 *     not 'number'), so the server stored every program as a ROOT folder and
 *     the next page load promoted it to a phantom category. The server now
 *     resolves the parent from `dept`, so null is the correct value to send.
 *
 * Note: parentFolderId 0 is NOT a real row (it broke the self-referencing FK
 * and returned a 500). It is sent as null and the server treats both as root.
 */
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
        // Root is null. Anything else must be a real folder id.
        parentFolderId: (typeof parentFolderId === 'number' && parentFolderId > 0)
            ? parentFolderId
            : null,
        dept: deptCode,
        code: isDepartment ? deptCode : '',
        shortName: isDepartment ? deptCode : '',
        icon: meta.icon || '',
        isDepartment: isDepartment
    };

    try {
        const result = await fetchAPI('/api/Folders', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        // The server reports a folder it saved but could not create on the
        // drive. Surface it instead of reporting a false success.
        if (result && result.warning) {
            console.warn('createFolder warning:', result.warning);
        }
        return result;
    } catch (err) {
        console.error('createFolder failed. Payload was:', payload, err);
        throw err;
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
        try {
            let url = '/api/Courses';
            if (dept) url += `?dept=${dept}`;
            return await fetchAPI(url);
        } catch (err) {
            console.warn("API failed to get courses:", err);
            return [];
        }
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
            return await fetchAPI('/api/Courses', {
                method: 'POST',
                body: JSON.stringify(courseData)
            });
        } catch (err) {
            console.warn("Create course API failed:", err);
            throw err;
        }
    },

    async deleteCourse(id) {
        try {
            return await fetchAPI(`/api/Courses/${id}`, {
                method: 'DELETE'
            });
        } catch (err) {
            console.warn("Delete course API failed:", err);
            throw err;
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
            return Array.isArray(res) ? res : [];
        } catch (err) {
            console.warn('API failed to get departments:', err);
            return [];
        }
    },

    // Roles, generated server-side from the department codes. A new department
    // brings its "{CODE} Manager" role along with no code change here.
    async getRoles() {
        try {
            const res = await fetchAPI('/api/Admin/roles');
            return Array.isArray(res) ? res : [];
        } catch (err) {
            console.warn('API failed to get roles:', err);
            return [];
        }
    },

    async getUsers() {
        try {
            const res = await fetchAPI('/api/Admin/all');
            if (Array.isArray(res)) return res;
            if (res && Array.isArray(res.users)) return res.users;
            if (res && Array.isArray(res.data)) return res.data;
            return [];
        } catch (err) {
            console.warn("API failed to get users:", err);
            return [];
        }
    },

    async createUser(username, email, phone, role, departmentId = 1) {
        try {
            return await fetchAPI('/api/Admin/create', {
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
        } catch (err) {
            console.warn("Create user API failed:", err);
            throw err;
        }
    },

    async deleteUser(id) {
        try {
            return await fetchAPI(`/api/Admin/${id}`, {
                method: 'DELETE'
            });
        } catch (err) {
            console.warn("Delete user API failed:", err);
            throw err;
        }
    }
};

// ==========================================
// 5. System Logs Service
// ==========================================
export const logService = {
    async getLogs(filters = {}) {
        try {
            let url = '/api/Admin/logs';
            const params = [];
            if (filters.action) params.push(`action=${filters.action}`);
            if (filters.username) params.push(`username=${filters.username}`);
            if (filters.from) params.push(`from=${filters.from}`);
            if (filters.to) params.push(`to=${filters.to}`);
            if (params.length > 0) url += '?' + params.join('&');
            const res = await fetchAPI(url);
            if (Array.isArray(res)) return res;
            if (res && Array.isArray(res.logs)) return res.logs;
            if (res && Array.isArray(res.data)) return res.data;
            return [];
        } catch (err) {
            console.warn("API failed to get logs:", err);
            return [];
        }
    },

    async addLog(admin, role, action, target) {
        const datetimeStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
        try {
            await fetchAPI('/api/Admin/logs', {
                method: 'POST',
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
    async updateProfile(email, mobile) {
        await delay();
        try {
            return await fetchAPI('/api/Admin/profile', {
                method: 'PUT',
                body: JSON.stringify({ email, mobile })
            });
        } catch (err) {
            console.warn("Update profile API failed.");
            throw err;
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

async function getLiveAggregates() {
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
    //
    // These were fixed objects { it, el, me } filled by substring tests:
    //     if (dept.includes('el')) ... else if (dept.includes('me')) ... else it++
    // so a DESIGN file fell through to the else and was counted as IT, and a
    // MEDIA file matched 'me' and was counted as Mechanical. The dashboard
    // could only ever describe three departments, and described them wrong.
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
        return await fetchAPI(`/api/Dashboard/metrics?days=${days}`);
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
        try {
            const data = await fetchAPI('/api/Dashboard/metrics');
            if (Array.isArray(data.downloadVelocity) && data.downloadVelocity.length > 0) {
                return data.downloadVelocity;
            }
        } catch (err) {}
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const isCurrentYear = year === new Date().getFullYear();
        const monthLimit = isCurrentYear ? (new Date().getMonth() + 1) : 12;
        return months.slice(0, monthLimit).map(m => ({ month: m, count: 0 }));
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
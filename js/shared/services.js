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

function getDeptId(deptStr) {
    if (!deptStr) return 'IT';
    const d = deptStr.toLowerCase();
    if (d.includes('it') || d.includes('information')) return 'IT';
    if (d.includes('el') || d.includes('elec')) return 'EL';
    if (d.includes('me') || d.includes('mech')) return 'ME';
    return 'IT';
}

function detectProgram(name, deptId) {
    const lower = (name || '').toLowerCase();
    if (deptId === 'IT') {
        if (lower.includes('net') || lower.includes('infra') || lower.includes('cs204') || lower.includes('ip') || lower.includes('route') || lower.includes('switch')) return 'it-net';
        if (lower.includes('security') || lower.includes('cyber') || lower.includes('firewall') || lower.includes('pene') || lower.includes('cs410')) return 'it-cyber';
        if (lower.includes('db') || lower.includes('sql') || lower.includes('data') || lower.includes('query') || lower.includes('cs301') || lower.includes('migration')) return 'it-db';
        return 'it-prog'; // default program for IT
    }
    if (deptId === 'EL') {
        if (lower.includes('power') || lower.includes('grid') || lower.includes('transformer') || lower.includes('ee305')) return 'el-power';
        if (lower.includes('embed') || lower.includes('micro') || lower.includes('arduino') || lower.includes('ee201')) return 'el-embed';
        return 'el-digital'; // default program for EL
    }
    if (deptId === 'ME') {
        if (lower.includes('thermo') || lower.includes('heat') || lower.includes('turbine') || lower.includes('me201')) return 'me-thermo';
        if (lower.includes('fluid') || lower.includes('pump') || lower.includes('flow') || lower.includes('me301')) return 'me-fluid';
        if (lower.includes('cad') || lower.includes('3d') || lower.includes('design') || lower.includes('catalog') || lower.includes('blueprint')) return 'me-cad';
        if (lower.includes('steel') || lower.includes('compos') || lower.includes('material') || lower.includes('me350')) return 'me-materials';
        return 'me-manufacturing'; // default program for ME
    }
    return null;
}
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
                dept: f.dept || 'IT DEPT',
                deptId: deptId,
                downloads: f.downloadCount || 0,
                uploadDate: f.uploadedAt
                    ? f.uploadedAt.split('T')[0] : new Date().toISOString().split('T')[0],
                uploadedBy: f.uploaderName || 'admin',
                program: detectProgram(f.name, deptId)
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
                `${BASE_URL}/api/Files/download-zip`,
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

    async createFolder(name, parentFolderId = 0) {
        await delay();
        try {
            return await fetchAPI('/api/Folders', {
                method: 'POST',
                body: JSON.stringify({ name, parentFolderId })
            });
        } catch (err) {
            console.warn("API failed to create folder.");
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
    async getUsers() {
        try {
            return await fetchAPI('/api/Admin/all');
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
            return await fetchAPI(url);
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

// ==========================================
// 7. Dashboard Service
// ==========================================
export const dashboardService = {
    async getStats(days = 30) {
        try {
            return await fetchAPI('/api/Dashboard/metrics');
        } catch (err) {
            console.warn("API failed to get stats:", err);
            return {
                totalFiles: 0,
                qnapStorage: { usedPercentage: 0, usedValue: "0 GB", totalValue: "0 GB" },
                pendingTasks: 0,
                netActivity: "0",
                trends: { totalFiles: "0", storageCapacity: "0%", pendingTasks: "0", netActivity: "0" }
            };
        }
    },

    async getDownloads(year) {
        try {
            const data = await fetchAPI('/api/Dashboard/metrics');
            return data.downloadVelocity || [];
        } catch (err) {
            console.warn("API failed to get downloads:", err);
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const isCurrentYear = year === new Date().getFullYear();
            const monthLimit = isCurrentYear ? (new Date().getMonth() + 1) : 12;
            return months.slice(0, monthLimit).map(m => ({ month: m, count: 0 }));
        }
    },

    async getResourceMix() {
        try {
            const data = await fetchAPI('/api/Dashboard/metrics');
            return data.resourceMix || { it: 0, el: 0, me: 0 };
        } catch (err) {
            console.warn("API failed to get resource mix:", err);
            return { it: 0, el: 0, me: 0 };
        }
    },

    async getProgramDownloads() {
        try {
            const data = await fetchAPI('/api/Dashboard/metrics');
            return data.programDownloads || { it: 0, el: 0, me: 0 };
        } catch (err) {
            console.warn("API failed to get program downloads:", err);
            return { it: 0, el: 0, me: 0 };
        }
    },

    async getDocuments(limit = 5) {
        try {
            const data = await fetchAPI('/api/Dashboard/metrics');
            return data.highImpactDocuments?.slice(0, limit) || [];
        } catch (err) {
            console.warn("API failed to get documents:", err);
            return [];
        }
    },

    async getEvents(limit = 10) {
        try {
            const data = await fetchAPI('/api/Dashboard/metrics');
            return data.recentEvents?.slice(0, limit) || [];
        } catch (err) {
            console.warn("API failed to get events:", err);
            return [];
        }
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

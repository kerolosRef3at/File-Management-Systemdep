// js/shared/services.js
import { fetchAPI, BASE_URL } from './api.js';
import * as mock from './mockData.js';

// Toggle to force mock data or let it attempt real API first
const USE_MOCK = false;

// Helper for emulating network latency
const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

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
        await delay();
        if (!USE_MOCK) {
            try {
                return await fetchAPI('/api/Auth/login', {
                    method: 'POST',
                    body: JSON.stringify({ username, password })
                });
            } catch (err) {
                console.warn("Real API failed, falling back to mock authentication.");
            }
        }
        
        // Mock authentication check
        const user = mock.mockUsers.find(u => 
            (u.username === username || u.email === username)
        );

        if (!user) {
            throw new Error("Invalid username or password.");
        }

        // Mock password check
        if (user.password && password !== user.password) {
            throw new Error("Invalid username or password.");
        } else if (!user.password && password.length < 6) {
            throw new Error("Password must be at least 6 characters.");
        }

        const token = generateMockJWT(user);
        const refreshToken = "mock_refresh_token_" + Date.now();
        
        localStorage.setItem('aitu_token', token);
        localStorage.setItem('aitu_refresh_token', refreshToken);
        
        // Log this action
        logService.addLog(user.username, user.role, "Login", "System");

        return { token, refreshToken, role: user.role };
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
        const decoded = decodeJWT(token);
        if (!decoded) return null;

        // ✅ جيب الـ role من الـ claim الصح
        const role = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
            decoded.role ||
            localStorage.getItem('aitu_role') ||
            'User';

        const username = decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ||
            decoded.sub ||
            localStorage.getItem('aitu_username') || '';

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
// ==========================================
// 2. File Repository Service
// ==========================================
export const fileService = {
 async getFiles(dept = null, search = null) {
    await delay();
    try {
        let url = '/api/Files';
        const params = [];
        if (dept) params.push(`department=${dept}`);
        if (search) params.push(`search=${search}`);
        if (params.length > 0) url += '?' + params.join('&');

        const backendFiles = await fetchAPI(url);

        // ✅ تحويل الداتا للشكل اللي الـ Frontend بيتوقعه
        return backendFiles.map(f => ({
            id: f.id,
            name: f.name,
            type: getFileTypeLabel(f.type),
            version: f.version || 'v1.0',
            size: formatFileSize(f.size),
            dept: f.dept || 'IT DEPT',
            deptId: getDeptId(f.dept),
            downloads: f.downloadCount || 0,
            uploadDate: f.uploadedAt
                ? f.uploadedAt.split('T')[0] : new Date().toISOString().split('T')[0],
            uploadedBy: f.uploaderName || 'admin',
            program: null
        }));
    } catch (err) {
        console.warn("API failed, returning mock files.");
        return mock.mockFiles;
    }
},

    async uploadFile(formData) {
        await delay();
        try {
            const token = localStorage.getItem('aitu_token');
            const response = await fetch(
                `http://localhost:5260/api/Files/upload`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                }
            );
            if (!response.ok) throw new Error('Upload failed');
            return await response.json();
        } catch (err) {
            console.warn("Upload API failed.");
            throw err;
        }
    },

    async deleteFile(id) {
        await delay();
        try {
            return await fetchAPI(`/api/Files/${id}`, {
                method: 'DELETE'
            });
        } catch (err) {
            console.warn("Delete API failed.");
            throw err;
        }
    },

    async deleteFiles(ids) {
        await delay();
        try {
            const results = await Promise.all(
                ids.map(id => fetchAPI(`/api/Files/${id}`, {
                    method: 'DELETE'
                }))
            );
            return { success: true };
        } catch (err) {
            console.warn("Delete files API failed.");
            throw err;
        }
    },

    async downloadFile(id, filename) {
        try {
            const token = localStorage.getItem('aitu_token');
            const response = await fetch(
                `http://localhost:5260/api/Files/download/${id}`,
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
                `http://localhost:5260/api/Files/download-zip`,
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
// 3. Course Management Service
// ==========================================
export const courseService = {
    async getCourses(dept = null) {
        await delay();
        try {
            let url = '/api/Courses';
            if (dept) url += `?dept=${dept}`;
            return await fetchAPI(url);
        } catch (err) {
            console.warn("API failed, returning mock courses.");
            return mock.mockCourses;
        }
    },

    async getCourseDetails(id) {
        await delay();
        try {
            return await fetchAPI(`/api/Courses/${id}`);
        } catch (err) {
            console.warn("API failed, returning mock course.");
            return mock.mockCourses.find(c => c.id == id);
        }
    },

    async createCourse(courseData) {
        await delay();
        try {
            return await fetchAPI('/api/Courses', {
                method: 'POST',
                body: JSON.stringify(courseData)
            });
        } catch (err) {
            console.warn("Create course API failed.");
            throw err;
        }
    },

    async deleteCourse(id) {
        await delay();
        try {
            return await fetchAPI(`/api/Courses/${id}`, {
                method: 'DELETE'
            });
        } catch (err) {
            console.warn("Delete course API failed.");
            throw err;
        }
    }
};

// ==========================================
// 4. User Account Service
// ==========================================
export const userService = {
    async getUsers() {
        await delay();
        try {
            return await fetchAPI('/api/Admin/all');
        } catch (err) {
            console.warn("API failed, returning mock users.");
            return mock.mockUsers;
        }
    },

    async createUser(username, email, phone, role, departmentId = 1) {
        await delay();
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
            console.warn("Create user API failed.");
            throw err;
        }
    },

    async deleteUser(id) {
        await delay();
        try {
            return await fetchAPI(`/api/Admin/${id}`, {
                method: 'DELETE'
            });
        } catch (err) {
            console.warn("Delete user API failed.");
            throw err;
        }
    }
};

// ==========================================
// 5. System Logs Service
// ==========================================
export const logService = {
    async getLogs(filters = {}) {
        await delay();
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
            console.warn("API failed, returning mock logs.");
            return mock.mockLogs;
        }
    },

    addLog(admin, role, action, target) {
        const newLog = {
            id: mock.mockLogs.length + 1,
            admin,
            role,
            action,
            target,
            datetime: new Date().toISOString()
                .replace('T', ' ').substring(0, 19)
        };
        mock.mockLogs.unshift(newLog);
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
        await delay(300);
        try {
            return await fetchAPI('/api/Dashboard/metrics');
        } catch (err) {
            console.warn("API failed, returning mock stats.");
            return mock.mockDashboardMetrics;
        }
    },

    async getDownloads(year) {
        await delay(300);
        try {
            const data = await fetchAPI('/api/Dashboard/metrics');
            return data.downloadVelocity || [];
        } catch (err) {
            console.warn("API failed, returning mock downloads.");
            return mock.mockDashboardMetrics.downloadVelocity;
        }
    },

    async getResourceMix() {
        await delay(200);
        try {
            const data = await fetchAPI('/api/Dashboard/metrics');
            return data.resourceMix || { it: 0, el: 0, me: 0 };
        } catch (err) {
            console.warn("API failed, returning mock resource mix.");
            return { it: 12450, el: 8200, me: 9100 };
        }
    },

    async getDocuments(limit = 5) {
        await delay(200);
        try {
            const data = await fetchAPI('/api/Dashboard/metrics');
            return data.highImpactDocuments?.slice(0, limit) || [];
        } catch (err) {
            console.warn("API failed, returning mock documents.");
            return mock.mockDashboardMetrics.highImpactDocuments.slice(0, limit);
        }
    },

    async getEvents(limit = 10) {
        await delay(200);
        try {
            const data = await fetchAPI('/api/Dashboard/metrics');
            return data.recentEvents?.slice(0, limit) || [];
        } catch (err) {
            console.warn("API failed, returning mock events.");
            return mock.mockDashboardMetrics.recentEvents.slice(0, limit);
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

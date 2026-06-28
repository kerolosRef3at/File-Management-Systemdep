// js/shared/services.js
import { fetchAPI, BASE_URL } from './api.js';
import * as mock from './mockData.js';

// Toggle to force mock data or let it attempt real API first
const USE_MOCK = true; 

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
        return {
            username: decoded.sub,
            email: decoded.email,
            role: decoded.role,
            phone: decoded.phone,
            joined: decoded.joined,
            name: decoded.name || decoded.sub
        };
    },

    // TODO: POST /api/Auth/forgot-password
    async forgotPassword(email) {
        await delay();
        // Mimic API post
        const userExists = mock.mockUsers.some(u => u.email === email);
        if (!userExists) {
            throw new Error("No account found with this email address.");
        }
        return { message: "OTP sent successfully" };
    },

    // TODO: POST /api/Auth/verify-otp
    async verifyOTP(email, code) {
        await delay();
        if (code !== "123456" && code.length === 6) {
            // Let's accept 123456 as the valid OTP for verification simplicity
            throw new Error("Invalid verification code.");
        }
        return { verified: true };
    },

    // TODO: POST /api/Auth/reset-password
    async resetPassword(email, code, newPassword) {
        await delay();
        const user = mock.mockUsers.find(u => u.email === email);
        if (user) {
            // Update password in mock storage
            user.password = newPassword;
            logService.addLog(user.username, user.role, "Change Password", "Own Account");
        }
        return { success: true };
    }
};

// ==========================================
// 2. File Repository Service
// ==========================================
export const fileService = {
    // TODO: GET /api/Files
    async getFiles() {
        await delay();
        if (!USE_MOCK) {
            try {
                return await fetchAPI('/api/Files');
            } catch (err) {
                console.warn("Real API failed, returning mock files.");
            }
        }
        return mock.mockFiles;
    },

    // TODO: POST /api/Files/upload
    async uploadFile(name, type, size, dept, uploadedBy) {
        await delay();
        const user = authService.getCurrentUser();
        const newFile = {
            id: mock.mockFiles.length + 1,
            name,
            type,
            version: "v1.0",
            size,
            dept: dept.toUpperCase() + " DEPT",
            downloads: 0,
            uploadDate: new Date().toISOString().split('T')[0],
            uploadedBy: uploadedBy || (user ? user.username : "system")
        };
        mock.mockFiles.unshift(newFile);

        // Add log
        if (user) {
            logService.addLog(user.username, user.role, "Add File", name);
        }
        return newFile;
    },

    // TODO: DELETE /api/Files/{id}
    async deleteFiles(ids) {
        await delay();
        const user = authService.getCurrentUser();
        ids.forEach(id => {
            const index = mock.mockFiles.findIndex(f => f.id == id);
            if (index !== -1) {
                const deletedFile = mock.mockFiles[index];
                mock.mockFiles.splice(index, 1);
                if (user) {
                    logService.addLog(user.username, user.role, "Delete File", deletedFile.name);
                }
            }
        });
        return { success: true };
    }
};

// ==========================================
// 3. Course Management Service
// ==========================================
export const courseService = {
    // TODO: GET /api/Courses
    async getCourses() {
        await delay();
        if (!USE_MOCK) {
            try {
                return await fetchAPI('/api/Courses');
            } catch (err) {
                console.warn("Real API failed, returning mock courses.");
            }
        }
        return mock.mockCourses;
    },

    // TODO: GET /api/Courses/{id}
    async getCourseDetails(id) {
        await delay();
        const course = mock.mockCourses.find(c => c.id == id);
        if (!course) {
            throw new Error("Course not found.");
        }
        return course;
    },

    // TODO: POST /api/Courses
    async createCourse(courseData) {
        await delay();
        const user = authService.getCurrentUser();
        const newCourse = {
            id: mock.mockCourses.length + 1,
            title: courseData.title,
            dept: courseData.dept,
            img: courseData.img || "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=500",
            lessons: courseData.modules.reduce((sum, mod) => sum + mod.lessons.length, 0),
            size: courseData.size || "150 MB",
            modules: courseData.modules
        };
        mock.mockCourses.push(newCourse);
        
        if (user) {
            logService.addLog(user.username, user.role, "Create Course", courseData.title);
        }
        return newCourse;
    }
};

// ==========================================
// 4. User Account Service
// ==========================================
export const userService = {
    // TODO: GET /api/Admin/all
    async getUsers() {
        await delay();
        if (!USE_MOCK) {
            try {
                return await fetchAPI('/api/Admin/all');
            } catch (err) {
                console.warn("Real API failed, returning mock users.");
            }
        }
        return mock.mockUsers;
    },

    // TODO: POST /api/Admin/create
    async createUser(username, email, phone, role) {
        await delay();
        const user = authService.getCurrentUser();
        const newUser = {
            id: mock.mockUsers.length + 1,
            username,
            email,
            phone,
            role,
            joined: new Date().toISOString().split('T')[0],
            isProtected: false
        };
        mock.mockUsers.unshift(newUser);

        if (user) {
            logService.addLog(user.username, user.role, "Add User", username);
        }
        return newUser;
    },

    // TODO: DELETE /api/Admin/{id}
    async deleteUser(id) {
        await delay();
        const user = authService.getCurrentUser();
        const index = mock.mockUsers.findIndex(u => u.id == id);
        if (index !== -1) {
            const targetUser = mock.mockUsers[index];
            if (targetUser.isProtected) {
                throw new Error("This account is protected and cannot be deleted.");
            }
            mock.mockUsers.splice(index, 1);
            if (user) {
                logService.addLog(user.username, user.role, "Delete User", targetUser.username);
            }
        }
        return { success: true };
    }
};

// ==========================================
// 5. System Logs Service
// ==========================================
export const logService = {
    // TODO: GET /api/Admin/logs
    async getLogs() {
        await delay();
        if (!USE_MOCK) {
            try {
                return await fetchAPI('/api/Admin/logs');
            } catch (err) {
                console.warn("Real API failed, returning mock logs.");
            }
        }
        return mock.mockLogs;
    },

    addLog(admin, role, action, target) {
        const newLog = {
            id: mock.mockLogs.length + 1,
            admin,
            role,
            action,
            target,
            datetime: new Date().toISOString().replace('T', ' ').substring(0, 19)
        };
        mock.mockLogs.unshift(newLog);
    }
};

// ==========================================
// 6. User Profile Settings Service
// ==========================================
export const profileService = {
    // TODO: PUT /api/Admin/profile
    async updateProfile(email, mobile, name) {
        await delay();
        const user = authService.getCurrentUser();
        if (!user) throw new Error("Unauthorized.");

        // Find in mock storage
        const mockUser = mock.mockUsers.find(u => u.username === user.username);
        if (mockUser) {
            mockUser.email = email;
            mockUser.phone = mobile;
            if (name !== undefined) {
                mockUser.name = name;
            }
        }

        // Re-generate JWT to store updated claims
        const token = generateMockJWT(mockUser);
        localStorage.setItem('aitu_token', token);
        
        logService.addLog(user.username, user.role, "Update Profile", "Own Account");
        return { success: true, user: mockUser };
    },

    // TODO: POST /api/Auth/change-password
    async changePassword(oldPassword, newPassword) {
        await delay();
        const user = authService.getCurrentUser();
        if (!user) throw new Error("Unauthorized.");
        
        logService.addLog(user.username, user.role, "Change Password", "Own Account");
        return { success: true };
    }
};

// ==========================================
// 7. Dashboard Service
// ==========================================
export const dashboardService = {
    // TODO: GET /api/Dashboard/stats?days={days}
    async getStats(days = 30) {
        await delay(300);
        if (!USE_MOCK) {
            try {
                return await fetchAPI('/api/Dashboard/stats?days=' + days);
            } catch (err) {
                console.warn("Real API failed, returning mock dashboard stats.");
            }
        }
        // Mock: dynamically compute from mockFiles
        const metrics = { ...mock.mockDashboardMetrics };
        metrics.totalFiles = mock.mockFiles.length + 14000;
        
        // Count total programs from departments mock
        const totalProgs = mock.mockDepartments.reduce((acc, d) => acc + (d.programs ? d.programs.length : 0), 0);
        metrics.totalPrograms = totalProgs;
        metrics.totalCourses = 48; // mock 48 courses
        metrics.trends = {
            ...metrics.trends,
            totalCourses: "+ 4 new this semester",
            totalPrograms: "Active in 3 departments"
        };
        return metrics;
    },

    // TODO: GET /api/Dashboard/downloads?year={year}
    async getDownloads(year) {
        await delay(300);
        if (!USE_MOCK) {
            try {
                return await fetchAPI('/api/Dashboard/downloads?year=' + year);
            } catch (err) {
                console.warn("Real API failed, returning mock download velocity.");
            }
        }
        // Mock: return velocity data (simulate different data per year)
        const currentYear = new Date().getFullYear();
        const baseData = mock.mockDashboardMetrics.downloadVelocity;
        if (year === currentYear) {
            return baseData;
        }
        // For other years, vary the data slightly
        const seed = year - currentYear;
        return baseData.map(d => ({
            month: d.month,
            count: Math.max(3000, d.count + seed * 800 + Math.floor(Math.random() * 2000 - 1000))
        }));
    },

    // TODO: GET /api/Dashboard/resource-mix
    async getResourceMix() {
        await delay(200);
        if (!USE_MOCK) {
            try {
                return await fetchAPI('/api/Dashboard/resource-mix');
            } catch (err) {
                console.warn("Real API failed, returning mock resource mix.");
            }
        }
        // Mock: return file counts matching mockDepartments
        return {
            it: 12450,
            el: 8200,
            me: 9100
        };
    },

    // TODO: GET /api/Dashboard/documents?limit={limit}
    async getDocuments(limit = 5) {
        await delay(200);
        if (!USE_MOCK) {
            try {
                return await fetchAPI('/api/Dashboard/documents?limit=' + limit);
            } catch (err) {
                console.warn("Real API failed, returning mock documents.");
            }
        }
        return mock.mockDashboardMetrics.highImpactDocuments.slice(0, limit);
    },

    // TODO: GET /api/Dashboard/events?limit={limit}
    async getEvents(limit = 10) {
        await delay(200);
        if (!USE_MOCK) {
            try {
                return await fetchAPI('/api/Dashboard/events?limit=' + limit);
            } catch (err) {
                console.warn("Real API failed, returning mock events.");
            }
        }
        return mock.mockDashboardMetrics.recentEvents.slice(0, limit);
    },

    // TODO: GET /api/Notifications/count
    async getNotificationsCount() {
        await delay(100);
        if (!USE_MOCK) {
            try {
                return await fetchAPI('/api/Notifications/count');
            } catch (err) {
                console.warn("Real API failed, returning mock notifications count.");
            }
        }
        return { count: 3 };
    },

    // TODO: GET /api/Dashboard/export?format={format}
    async exportReport(format = 'pdf') {
        await delay(500);
        if (!USE_MOCK) {
            try {
                // In real implementation, this would trigger a file download
                const response = await fetch(BASE_URL + '/api/Dashboard/export?format=' + format, {
                    headers: { 'Authorization': 'Bearer ' + localStorage.getItem('aitu_token') }
                });
                if (!response.ok) throw new Error('Export failed');
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'dashboard_report.' + format;
                a.click();
                URL.revokeObjectURL(url);
                return { success: true };
            } catch (err) {
                console.warn("Real API failed for export.");
                throw err;
            }
        }
        // Mock: just resolve
        return { success: true, message: "Export will be available when backend is connected." };
    }
};

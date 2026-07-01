// js/shared/mockData.js

export const mockUsers = [
    { id: 1, username: "admin", email: "admin@university.edu", phone: "+1 555-0199", role: "Supervisor", joined: "2025-01-15", isProtected: true, name: "admin" },
    { id: 2, username: "j.carter", email: "j.carter@university.edu", phone: "+1 555-0288", role: "IT Manager", joined: "2025-03-22", isProtected: false, name: "j.carter" },
    { id: 3, username: "m.silva", email: "m.silva@university.edu", phone: "+1 555-0363", role: "EL Manager", joined: "2025-04-10", isProtected: false, name: "m.silva" },
    { id: 4, username: "r.hayes", email: "r.hayes@university.edu", phone: "+1 555-0441", role: "Mechanical Manager", joined: "2025-05-27", isProtected: false, name: "r.hayes" },
    { id: 5, username: "k.nguyen", email: "k.nguyen@university.edu", phone: "+1 555-0586", role: "IT Manager", joined: "2025-07-18", isProtected: false, name: "k.nguyen" },
    { id: 6, username: "aitu.localadmin", email: "admin@aitu.local", phone: "+1 555-0000", role: "Supervisor", joined: "2026-06-27", isProtected: true, password: "Admin123", name: "aitu.localadmin" }
];

// Department hierarchy for the academic sidebar tree
export const mockDepartments = [
    {
        id: 'IT',
        name: 'Information Tech',
        shortName: 'IT',
        label: 'INFORMATION TECH',
        icon: 'monitor',
        totalFiles: 0,
        categories: 0,
        programs: []
    },
    {
        id: 'EL',
        name: 'Electrical Eng.',
        shortName: 'EL',
        label: 'ELECTRICAL ENG',
        icon: 'zap',
        totalFiles: 0,
        categories: 0,
        programs: []
    },
    {
        id: 'ME',
        name: 'Mechanical Eng.',
        shortName: 'ME',
        label: 'MECHANICAL ENG',
        icon: 'settings',
        categories: 0,
        programs: []
    }
];

try {
    const savedCats = JSON.parse(localStorage.getItem('AITU_CUSTOM_CATEGORIES') || '[]');
    if (Array.isArray(savedCats)) {
        savedCats.forEach(cat => {
            if (!mockDepartments.some(d => d.id === cat.id)) {
                mockDepartments.push(cat);
            }
        });
    }
    const savedProgs = JSON.parse(localStorage.getItem('AITU_CUSTOM_PROGRAMS') || '[]');
    if (Array.isArray(savedProgs)) {
        savedProgs.forEach(prog => {
            const targetDept = mockDepartments.find(d => d.id === prog.deptId);
            if (targetDept && !targetDept.programs.some(p => p.id === prog.id)) {
                targetDept.programs.push({ id: prog.id, name: prog.name });
            }
        });
    }
} catch(e) {}

const defaultMockFiles = [];

export const mockCourses = [];

export const mockLogs = [];

export const mockDashboardMetrics = {
    totalFiles: 0,
    qnapStorage: { usedPercentage: 0, usedValue: "0 GB", totalValue: "0 GB" },
    pendingTasks: 0,
    netActivity: "0",
    trends: { totalFiles: "0", storageCapacity: "0%", pendingTasks: "0", netActivity: "0" },
    downloadVelocity: [],
    resourceMix: { it: 0, el: 0, me: 0 },
    programDownloads: { it: 0, el: 0, me: 0 },
    highImpactDocuments: [],
    recentEvents: []
};

export const mockFiles = [];

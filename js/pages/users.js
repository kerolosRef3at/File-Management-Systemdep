// js/pages/users.js
import { renderLayout } from '../shared/layout.js';
import { fetchAPI } from '../shared/api.js';

document.addEventListener('DOMContentLoaded', () => {
    renderLayout('users');

    const contentArea = document.getElementById('page-content');
    let allUsers = [];

    // حقن محتوى الصفحة
    contentArea.innerHTML = `
        <div class="page-header-actions">
            <div>
                <h1 style="color: var(--primary-dark); font-size: 2rem;">User Management & Access Control</h1>
                <p style="color: var(--text-gray);">Manage system access, roles, and administrative privileges.</p>
            </div>
            <button class="btn-primary" id="openAddUserBtn">+ Add New User</button>
        </div>

        <div class="filters-bar">
            <div class="search-bar" style="width: 300px; background: var(--white);">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input type="text" id="userSearch" placeholder="Search by name, email or username...">
            </div>
            <select class="filter-select" id="roleFilter">
                <option value="all">All Roles</option>
                <option value="Supervisor">Supervisor</option>
                <option value="IT Manager">IT Manager</option>
                <option value="EL Manager">EL Manager</option>
                <option value="Mechanic Manager">Mechanic Manager</option>
            </select>
        </div>

        <div class="metrics-grid">
            <div class="metric-card stat-btn active-stat" data-role="all" style="padding: 15px;">
                <div class="metric-value" style="font-size: 1.8rem;" id="statTotal">0</div>
                <div class="metric-card-header" style="margin:0;">Total Users</div>
            </div>
            <div class="metric-card stat-btn" data-role="Supervisor" style="padding: 15px; border-bottom: 4px solid #9333ea;">
                <div class="metric-value" style="font-size: 1.8rem;" id="statSup">0</div>
                <div class="metric-card-header" style="margin:0;">Supervisors</div>
            </div>
            <div class="metric-card stat-btn" data-role="IT Manager" style="padding: 15px; border-bottom: 4px solid #0284c7;">
                <div class="metric-value" style="font-size: 1.8rem;" id="statIT">0</div>
                <div class="metric-card-header" style="margin:0;">IT Managers</div>
            </div>
            <div class="metric-card stat-btn" data-role="Field" style="padding: 15px; border-bottom: 4px solid #16a34a;">
                <div class="metric-value" style="font-size: 1.8rem;" id="statField">0</div>
                <div class="metric-card-header" style="margin:0;">Field Managers</div>
            </div>
        </div>

        <div class="dashboard-panel" style="padding: 0; overflow: hidden;">
            <table class="data-table" style="width: 100%;">
                <thead style="background: #f8fafc;">
                    <tr>
                        <th style="padding: 15px 20px;">User</th>
                        <th>Role</th>
                        <th>Phone</th>
                        <th>Joined</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="usersTableBody">
                    <tr><td colspan="5" style="text-align: center; padding: 20px;">Loading users...</td></tr>
                </tbody>
            </table>
        </div>
    `;

    // معالجة النافذة المنبثقة لإضافة مستخدم
    const addUserModal = document.getElementById('addUserModal');
    document.getElementById('openAddUserBtn').addEventListener('click', () => addUserModal.classList.add('active'));
    
    const closeModal = () => {
        addUserModal.classList.remove('active');
        document.getElementById('addUserForm').reset();
    };
    document.getElementById('closeAddUserBtn').addEventListener('click', closeModal);
    document.getElementById('cancelAddUserBtn').addEventListener('click', closeModal);

    // جلب المستخدمين من الـ API (أو الداتا الوهمية)
    async function loadUsers() {
        try {
            const response = await fetchAPI('/api/Admin/all');
            allUsers = response.data || generateMockUsers();
        } catch (error) {
            console.warn("API failed. Loading mock users.");
            allUsers = generateMockUsers();
        }
        renderUsers(allUsers);
        updateStats();
    }

    function generateMockUsers() {
        return [
            { id: 1, username: "admin", email: "admin@university.edu", phone: "+1 555-0199", role: "Supervisor", joined: "2025-01-15", isProtected: true },
            { id: 2, username: "j.carter", email: "j.carter@university.edu", phone: "+1 555-0288", role: "IT Manager", joined: "2025-03-22", isProtected: false },
            { id: 3, username: "m.silva", email: "m.silva@university.edu", phone: "+1 555-0363", role: "EL Manager", joined: "2025-04-10", isProtected: false },
            { id: 4, username: "r.hayes", email: "r.hayes@university.edu", phone: "+1 555-0441", role: "Mechanic Manager", joined: "2025-05-27", isProtected: false },
            { id: 5, username: "k.nguyen", email: "k.nguyen@university.edu", phone: "+1 555-0586", role: "IT Manager", joined: "2025-07-18", isProtected: false }
        ];
    }

    // دالة مساعدة لتحديد ستايل الـ Badge بناءً على الـ Role
    function getRoleBadgeClass(role) {
        if(role === 'Supervisor') return 'role-supervisor';
        if(role === 'IT Manager') return 'role-it';
        if(role === 'EL Manager') return 'role-el';
        return 'role-me';
    }

    function renderUsers(usersToRender) {
        const tbody = document.getElementById('usersTableBody');
        tbody.innerHTML = '';

        if(usersToRender.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">No users found.</td></tr>';
            return;
        }

        usersToRender.forEach(user => {
            const initial = user.username.charAt(0).toUpperCase();
            const protectedBadge = user.isProtected ? '<span class="badge-protected">Protected</span>' : '';
            const deleteBtnState = user.isProtected ? 'disabled' : '';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="padding: 15px 20px;">
                    <div class="user-cell">
                        <div class="user-avatar">${initial}</div>
                        <div class="user-details">
                            <h5>${user.username} ${protectedBadge}</h5>
                            <span>${user.email}</span>
                        </div>
                    </div>
                </td>
                <td><span class="role-badge ${getRoleBadgeClass(user.role)}">${user.role}</span></td>
                <td style="color: var(--text-gray); font-size: 0.9rem;">${user.phone}</td>
                <td style="color: var(--text-gray); font-size: 0.9rem;">${user.joined}</td>
                <td>
                    <button class="action-btn delete-user-btn" data-id="${user.id}" title="Delete User" ${deleteBtnState}>
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // ربط أحداث الحذف
        document.querySelectorAll('.delete-user-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                if(confirm('Are you sure you want to delete this user?')) {
                    // try { await fetchAPI(`/api/Admin/${id}`, { method: 'DELETE' }); } catch(err) {}
                    allUsers = allUsers.filter(u => u.id != id);
                    renderUsers(allUsers);
                    updateStats();
                }
            });
        });
    }

    function updateStats() {
        document.getElementById('statTotal').innerText = allUsers.length;
        document.getElementById('statSup').innerText = allUsers.filter(u => u.role === 'Supervisor').length;
        document.getElementById('statIT').innerText = allUsers.filter(u => u.role === 'IT Manager').length;
        document.getElementById('statField').innerText = allUsers.filter(u => u.role === 'EL Manager' || u.role === 'Mechanic Manager').length;
    }

    // --- تفعيل فلترة القائمة المنسدلة والبحث ---
    document.getElementById('userSearch').addEventListener('input', () => applyFilters());
    document.getElementById('roleFilter').addEventListener('change', (e) => {
        // عند استخدام القائمة المنسدلة، قم بإلغاء تحديد كروت الإحصائيات للرجوع للوضع الافتراضي
        document.querySelectorAll('.stat-btn').forEach(b => b.classList.remove('active-stat'));
        document.querySelector('.stat-btn[data-role="all"]').classList.add('active-stat');
        applyFilters();
    });

    // --- تفعيل الضغط على كروت الإحصائيات ---
    document.querySelectorAll('.stat-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            // 1. تفعيل التأثير البصري للكارت المضغوط
            document.querySelectorAll('.stat-btn').forEach(b => b.classList.remove('active-stat'));
            e.currentTarget.classList.add('active-stat');

            // 2. مزامنة القائمة المنسدلة مع الكارت المضغوط (للحفاظ على الـ UI متناسق)
            const selectedRole = e.currentTarget.getAttribute('data-role');
            const roleDropdown = document.getElementById('roleFilter');
            
            if (selectedRole === 'Field') {
                roleDropdown.value = 'all'; // Field يضم قسمين
            } else {
                roleDropdown.value = selectedRole;
            }

            // 3. تطبيق الفلتر
            applyFilters(selectedRole);
        });
    });

    // --- دالة الفلترة الذكية الموحدة ---
    function applyFilters(overrideRole = null) {
        const term = document.getElementById('userSearch').value.toLowerCase();
        // نستخدم الفلتر المُمرر من الكروت، وإلا نستخدم قيمة القائمة المنسدلة
        const role = overrideRole || document.getElementById('roleFilter').value; 

        let filtered = allUsers.filter(u => u.username.toLowerCase().includes(term) || u.email.toLowerCase().includes(term));
        
        if (role === 'Field') {
            filtered = filtered.filter(u => u.role === 'EL Manager' || u.role === 'Mechanic Manager');
        } else if (role !== 'all') {
            filtered = filtered.filter(u => u.role === role);
        }
        
        renderUsers(filtered);
    }

    // إضافة مستخدم جديد
    document.getElementById('addUserForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const newUser = {
            id: Date.now(), // ID وهمي
            username: document.getElementById('newUsername').value,
            email: document.getElementById('newEmail').value,
            phone: document.getElementById('newPhone').value,
            role: document.getElementById('newRole').value,
            joined: new Date().toISOString().split('T')[0],
            isProtected: false
        };

        // try { await fetchAPI('/api/Admin/create', { method: 'POST', body: JSON.stringify(newUser) }); } catch(err) {}
        
        allUsers.unshift(newUser); // إضافته في بداية القائمة
        
        // إعادة الفلتر للوضع الافتراضي لضمان ظهور المستخدم الجديد
        document.querySelectorAll('.stat-btn').forEach(b => b.classList.remove('active-stat'));
        document.querySelector('.stat-btn[data-role="all"]').classList.add('active-stat');
        document.getElementById('userSearch').value = '';
        document.getElementById('roleFilter').value = 'all';
        
        applyFilters('all'); // تطبيق الفلتر وتحديث الجدول
        updateStats(); // تحديث الأرقام
        closeModal();
    });

    loadUsers();
});
// js/pages/logs.js
import { renderLayout } from '../shared/layout.js';
import { fetchAPI } from '../shared/api.js';

document.addEventListener('DOMContentLoaded', () => {
    // رسم الـ Layout وتحديد الصفحة النشطة كـ logs
    renderLayout('logs');

    const contentArea = document.getElementById('page-content');
    let allLogs = [];

    // حقن محتوى الصفحة
    contentArea.innerHTML = `
        <div class="page-header-actions">
            <div>
                <h1 style="color: var(--primary-dark); font-size: 2rem;">AITU System Logs</h1>
                <p style="color: var(--text-gray);"><strong style="color:var(--text-dark);" id="logCount">0</strong> events recorded — full administrator activity trail</p>
            </div>
            <button class="btn-outline" style="display:flex; align-items:center; gap:8px;">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                Export CSV
            </button>
        </div>

        <div class="logs-filters-container">
            <div class="chips-wrapper" id="actionChips">
                <button class="chip-btn active" data-action="all">ALL</button>
                <button class="chip-btn" data-action="Login"><span class="action-dot dot-blue"></span> Login</button>
                <button class="chip-btn" data-action="Add File"><span class="action-dot dot-green"></span> Add File</button>
                <button class="chip-btn" data-action="Delete File"><span class="action-dot dot-red"></span> Delete File</button>
                <button class="chip-btn" data-action="Create Folder"><span class="action-dot dot-green"></span> Create Folder</button>
                <button class="chip-btn" data-action="Upload Video"><span class="action-dot dot-purple"></span> Upload Video</button>
                <button class="chip-btn" data-action="Add User"><span class="action-dot dot-cyan"></span> Add User</button>
                <button class="chip-btn" data-action="Delete User"><span class="action-dot dot-red"></span> Delete User</button>
                <button class="chip-btn" data-action="Change Password"><span class="action-dot dot-orange"></span> Change Password</button>
                <button class="chip-btn" data-action="Update Profile"><span class="action-dot dot-blue"></span> Update Profile</button>
            </div>

            <div style="display: flex; gap: 15px; align-items: center;">
                <div class="search-bar" style="flex: 1;">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <input type="text" id="logSearch" placeholder="Search by admin or target...">
                </div>
                <input type="date" id="dateFilter" class="form-control" style="width: auto;">
            </div>
        </div>

        <div class="dashboard-panel" style="padding: 0; overflow: hidden;">
            <table class="data-table" style="width: 100%;">
                <thead style="background: #f8fafc;">
                    <tr>
                        <th style="padding: 15px 20px;">Admin</th>
                        <th>Role</th>
                        <th>Action</th>
                        <th>Target</th>
                        <th>Date & Time</th>
                    </tr>
                </thead>
                <tbody id="logsTableBody">
                    <tr><td colspan="5" style="text-align: center; padding: 20px;">Loading logs...</td></tr>
                </tbody>
            </table>
        </div>
    `;

    // دالة مساعدة لتحديد ستايل الـ Badge بناءً على الـ Role
    function getRoleBadgeClass(role) {
        if(role === 'Supervisor') return 'role-supervisor';
        if(role === 'IT Manager') return 'role-it';
        if(role === 'EL Manager') return 'role-el';
        return 'role-me';
    }

    // دالة مساعدة لتحديد لون النقطة بناءً على العملية
    function getActionDotColor(action) {
        const actionMap = {
            'Login': 'dot-blue', 'Update Profile': 'dot-blue',
            'Add File': 'dot-green', 'Create Folder': 'dot-green',
            'Delete File': 'dot-red', 'Delete User': 'dot-red',
            'Change Password': 'dot-orange',
            'Upload Video': 'dot-purple',
            'Add User': 'dot-cyan'
        };
        return actionMap[action] || 'dot-blue';
    }

    // جلب الداتا
    async function loadLogs() {
        try {
            // حسب ملف Swagger، الـ endpoint هو /api/Admin/logs
            const response = await fetchAPI('/api/Admin/logs');
            allLogs = response.data || generateMockLogs();
        } catch (error) {
            console.warn("API failed. Loading mock logs.");
            allLogs = generateMockLogs();
        }
        renderLogs(allLogs);
    }

    function generateMockLogs() {
        return [
            { id: 1, admin: "admin", role: "Supervisor", action: "Login", target: "System", datetime: "2026-06-23 08:14:32" },
            { id: 2, admin: "j.carter", role: "IT Manager", action: "Upload Video", target: "Python for Engineers", datetime: "2026-06-23 09:02:18" },
            { id: 3, admin: "admin", role: "Supervisor", action: "Add User", target: "k.nguyen", datetime: "2026-06-23 10:35:44" },
            { id: 4, admin: "m.silva", role: "EL Manager", action: "Create Folder", target: "Power Systems Analysis", datetime: "2026-06-22 14:22:07" },
            { id: 5, admin: "r.hayes", role: "Mechanic Manager", action: "Add File", target: "GD&T Advisor 4.0", datetime: "2026-06-22 15:48:33" },
            { id: 6, admin: "admin", role: "Supervisor", action: "Change Password", target: "Own Account", datetime: "2026-06-21 11:05:19" },
            { id: 7, admin: "j.carter", role: "IT Manager", action: "Update Profile", target: "Own Account", datetime: "2026-06-21 13:17:55" }
        ];
    }

    function renderLogs(logsToRender) {
        const tbody = document.getElementById('logsTableBody');
        tbody.innerHTML = '';
        document.getElementById('logCount').innerText = logsToRender.length;

        if(logsToRender.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">No logs match your filter.</td></tr>';
            return;
        }

        logsToRender.forEach(log => {
            const initial = log.admin.charAt(0).toUpperCase();
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="padding: 15px 20px;">
                    <div style="display:flex; align-items:center; gap:12px;">
                        <div class="user-avatar" style="width:30px; height:30px; font-size:0.8rem;">${initial}</div>
                        <span style="font-weight:600; color:var(--primary-dark);">${log.admin}</span>
                    </div>
                </td>
                <td><span class="role-badge ${getRoleBadgeClass(log.role)}">${log.role}</span></td>
                <td style="font-weight:600; color:var(--primary-dark);">
                    <span class="action-dot ${getActionDotColor(log.action)}" style="margin-right:8px;"></span>${log.action}
                </td>
                <td style="color: var(--text-gray);">${log.target}</td>
                <td style="font-size:0.85rem; font-weight:600; color:var(--primary-dark);">${log.datetime.replace(' ', '<br><span style="color:var(--text-gray); font-weight:normal;">')}</span></td>
            `;
            tbody.appendChild(tr);
        });
    }

    // --- الفلترة والبحث ---
    const searchInput = document.getElementById('logSearch');
    const dateFilter = document.getElementById('dateFilter');
    const actionChips = document.querySelectorAll('.chip-btn');
    let currentActionFilter = 'all';

    function applyFilters() {
        const term = searchInput.value.toLowerCase();
        const selectedDate = dateFilter.value; // format: YYYY-MM-DD

        let filtered = allLogs.filter(log => 
            log.admin.toLowerCase().includes(term) || log.target.toLowerCase().includes(term)
        );

        if (currentActionFilter !== 'all') {
            filtered = filtered.filter(log => log.action === currentActionFilter);
        }

        if (selectedDate) {
            filtered = filtered.filter(log => log.datetime.startsWith(selectedDate));
        }

        renderLogs(filtered);
    }

    // تشغيل الـ Chips
    actionChips.forEach(chip => {
        chip.addEventListener('click', (e) => {
            actionChips.forEach(c => c.classList.remove('active'));
            const targetChip = e.currentTarget;
            targetChip.classList.add('active');
            
            currentActionFilter = targetChip.getAttribute('data-action');
            applyFilters();
        });
    });

    searchInput.addEventListener('input', applyFilters);
    dateFilter.addEventListener('change', applyFilters);

    loadLogs();
});
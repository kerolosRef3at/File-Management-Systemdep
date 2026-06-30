// js/pages/logs.js
import { protectPage } from '../shared/auth.js';
import { logService } from '../shared/services.js';
import { renderLayout } from '../shared/layout.js';
import { renderSkeleton, showAlert } from '../shared/components.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Guards access: Logs Page is strictly restricted to Supervisor role
    if (!protectPage(['Supervisor'])) {
        return;
    }

    // Render navigation bar
    renderLayout('logs');

    const contentArea = document.getElementById('page-content');
    if (!contentArea) return;

    let allLogs = [];

    // Inject outer layout framework
    contentArea.innerHTML = `
        <div class="page-header-actions" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px; flex-wrap:wrap; gap:15px;">
            <div>
                <h1 style="color: var(--primary-dark); font-size: 2rem;">AITU System Logs</h1>
                <p style="color: var(--text-gray);"><strong style="color:var(--text-dark);" id="logCount">0</strong> events recorded — full administrator activity trail</p>
            </div>
            <button class="btn-outline" id="exportCSVBtn" style="display:flex; align-items:center; gap:8px;">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                Export CSV
            </button>
        </div>

        <div id="logsPageAlerts"></div>

        <div class="logs-filters-container">
            <div class="chips-wrapper" id="actionChips" style="display:flex; flex-wrap:wrap; gap:10px; margin-bottom:20px; padding-bottom:20px; border-bottom:1px solid var(--border-color);">
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

            <div style="display: flex; gap: 15px; align-items: center; flex-wrap: wrap;">
                <div class="search-bar" style="flex: 1; min-width: 250px;">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <input type="text" id="logSearch" placeholder="Search by admin or target...">
                </div>
                <input type="date" id="dateFilter" class="form-control" style="width: auto; height: 38px;">
            </div>
        </div>

        <div class="dashboard-panel" style="padding: 0; overflow-x: auto; background:white; border: 1px solid var(--border-color); border-radius:10px;">
            <table class="data-table" style="width: 100%; min-width: 800px;">
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

    const logsTableBody = document.getElementById('logsTableBody');
    const alertsContainer = document.getElementById('logsPageAlerts');
    const logCountEl = document.getElementById('logCount');

    // Load logs from logService
    async function loadLogs() {
        renderSkeleton(logsTableBody, 'table', 5);
        try {
            // TODO: GET /api/Admin/logs
            allLogs = await logService.getLogs();
            applyFilters();
        } catch (error) {
            showAlert(alertsContainer, error.message || 'Failed to fetch system logs.', 'error');
        } finally {
            // Hide Global Loader
            const loader = document.getElementById('global-page-loader');
            if (loader) {
                loader.classList.add('hide-loader');
                setTimeout(() => loader.remove(), 400);
            }
        }
    }

    // Role styling utility
    function getRoleBadgeClass(role) {
        const r = role.toLowerCase();
        if (r === 'supervisor') return 'role-supervisor';
        if (r === 'it manager') return 'role-it';
        if (r === 'el manager') return 'role-el';
        return 'role-me';

    }


    // Color code log action category dots
    function getActionDotColor(action) {
        if (!action) return 'dot-blue';
        const lowerAction = action.toLowerCase().replace(/\s+/g, '');
        if (lowerAction.includes('login')) return 'dot-blue';
        if (lowerAction.includes('updateprofile')) return 'dot-blue';
        if (lowerAction.includes('addfile') || lowerAction.includes('createcourse') || lowerAction.includes('createfolder')) return 'dot-green';
        if (lowerAction.includes('delete') || lowerAction.includes('remove')) return 'dot-red';
        if (lowerAction.includes('password')) return 'dot-orange';
        if (lowerAction.includes('upload')) return 'dot-purple';
        if (lowerAction.includes('add') || lowerAction.includes('createuser')) return 'dot-cyan';
        return 'dot-blue'; // Default
    }

    // Draw logs table lines
    function renderLogs(logsToRender) {
        logsTableBody.innerHTML = '';
        logCountEl.innerText = logsToRender.length;

        if (logsToRender.length === 0) {
            logsTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color:var(--text-gray);">No logs match filter guidelines.</td></tr>';
            return;
        }

        logsToRender.forEach(log => {
            const initial = log.admin.charAt(0).toUpperCase();
            const tr = document.createElement('tr');

            // Format datetime: split space and add sub label span
            const formattedTime = log.datetime.replace(' ', '<br><span style="color:var(--text-gray); font-weight:normal; font-size:0.8rem;">') + '</span>';

            tr.innerHTML = `
                <td style="padding: 15px 20px;">
                    <div style="display:flex; align-items:center; gap:12px;">
                        <div class="user-avatar" style="
                            width:30px; height:30px; border-radius: 50%; background-color: var(--primary-dark); color: var(--white); display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.8rem;
                        ">${initial}</div>
                        <span style="font-weight:600; color:var(--primary-dark);">${log.admin}</span>
                    </div>
                </td>
                <td><span class="role-badge ${getRoleBadgeClass(log.role)}" style="padding:4px 12px; border-radius:12px; font-size:0.75rem; font-weight:600; display:inline-block;">${log.role === 'Mechanic Manager' ? 'Mechanical Manager' : log.role}</span></td>
                <td style="font-weight:600; color:var(--primary-dark); white-space: nowrap;">
                    <span class="action-dot ${getActionDotColor(log.action)}" style="
                        width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 8px;
                    "></span>${log.action}
                </td>
                <td style="color: var(--text-gray);">${log.target}</td>
                <td style="font-size:0.85rem; font-weight:600; color:var(--primary-dark); line-height:1.2;">${formattedTime}</td>
            `;
            logsTableBody.appendChild(tr);
        });
    }

    // Unified filter execution
    const searchInput = document.getElementById('logSearch');
    const dateFilter = document.getElementById('dateFilter');
    let currentActionFilter = 'all';

    function applyFilters() {
        const term = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const selectedDate = dateFilter ? dateFilter.value : ''; // format: YYYY-MM-DD

        let filtered = allLogs;

        if (currentActionFilter !== 'all') {
            filtered = filtered.filter(log => log.action === currentActionFilter);
        }

        if (selectedDate) {
            filtered = filtered.filter(log => log.datetime.startsWith(selectedDate));
        }

        if (term) {
            filtered = filtered.filter(log =>
                log.admin.toLowerCase().includes(term) ||
                log.target.toLowerCase().includes(term)
            );
        }

        renderLogs(filtered);
    }

    // Attach actions chips select event listener
    document.querySelectorAll('.chip-btn').forEach(chip => {
        chip.addEventListener('click', (e) => {
            document.querySelectorAll('.chip-btn').forEach(c => c.classList.remove('active'));
            const targetChip = e.currentTarget;
            targetChip.classList.add('active');

            currentActionFilter = targetChip.getAttribute('data-action');
            applyFilters();
        });
    });

    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (dateFilter) dateFilter.addEventListener('change', applyFilters);

    // Export log registry handler
    const csvBtn = document.getElementById('exportCSVBtn');
    if (csvBtn) {
        csvBtn.addEventListener('click', () => {
            alert('Exporting system log trails spreadsheet registry...');
        });
    }

    // First load
    await loadLogs();
});
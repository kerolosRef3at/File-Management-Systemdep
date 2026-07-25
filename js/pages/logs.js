// js/pages/logs.js
import { protectPage } from '../shared/auth.js';
import { logService } from '../shared/services.js';
import { renderLayout } from '../shared/layout.js';
import { renderSkeleton, showAlert } from '../shared/components.js';
import { translations, getCurrentLang } from '../shared/jssharedi18n.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Guards access: Logs Page is strictly restricted to Supervisor role
    if (!protectPage(['Supervisor'])) {
        return;
    }

    // Render navigation bar
    renderLayout('logs');

    const contentArea = document.getElementById('page-content');
    if (!contentArea) return;

    const lang = getCurrentLang();
    const t = (key) => (translations[lang] || translations.en)[key] || translations.en[key] || key;

    let allLogs = [];
    let currentRange = 'today';
    let loadSeq = 0;

    function toDateStr(d) {
        const p = n => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
    }

    function daysAgo(n) {
        const d = new Date();
        d.setDate(d.getDate() - n);
        return toDateStr(d);
    }

    function parseServerDate(dt) {
        const s = String(dt || '').trim();
        if (!s) return null;
        const iso = /[TZ]/.test(s) ? s : s.replace(' ', 'T') + 'Z';
        const d = new Date(iso);
        return isNaN(d) ? null : d;
    }

    function currentBounds() {
        const today = toDateStr(new Date());
        if (currentRange === 'today') return { from: today, to: today };
        if (currentRange === '7') return { from: daysAgo(6), to: today };
        if (currentRange === 'custom') {
            const v = dateFilterValue();
            return { from: v, to: v };
        }
        return { from: '', to: '' };
    }

    function dateFilterValue() {
        const el = document.getElementById('dateFilter');
        return el ? el.value : '';
    }

    function escapeHtml(str) {
        return String(str == null ? '' : str)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    contentArea.innerHTML = `
        <div class="page-header-actions" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px; flex-wrap:wrap; gap:15px;">
            <div>
                <h1 style="color: var(--primary-dark); font-size: 2rem;">${t('logs_title')}</h1>
                <p style="color: var(--text-gray);"><strong style="color:var(--text-dark);" id="logCount">0</strong> ${t('logs_subtitle')}</p>
            </div>
            <button class="btn-outline" id="exportCSVBtn" style="display:flex; align-items:center; gap:8px;">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                ${t('logs_export_csv')}
            </button>
        </div>

        <div id="logsPageAlerts"></div>

        <div class="logs-filters-container">
            <div class="chips-wrapper" id="actionChips" style="display:flex; flex-wrap:wrap; gap:10px; margin-bottom:20px; padding-bottom:20px; border-bottom:1px solid var(--border-color);">
                <button class="chip-btn active" data-action="all">${t('logs_all')}</button>
                <button class="chip-btn" data-action="Login"><span class="action-dot dot-blue"></span> ${t('logs_login')}</button>
                <button class="chip-btn" data-action="Logout"><span class="action-dot dot-blue"></span> ${t('logs_logout')}</button>
                <button class="chip-btn" data-action="Add File"><span class="action-dot dot-green"></span> ${t('logs_add_file')}</button>
                <button class="chip-btn" data-action="Delete File"><span class="action-dot dot-red"></span> ${t('logs_delete_file')}</button>
                <button class="chip-btn" data-action="Create Folder"><span class="action-dot dot-green"></span> ${t('logs_create_folder')}</button>
                <button class="chip-btn" data-action="CreateCourse"><span class="action-dot dot-green"></span> ${t('logs_create_course')}</button>
                <button class="chip-btn" data-action="UpdateCourse"><span class="action-dot dot-blue"></span> ${t('logs_update_course')}</button>
                <button class="chip-btn" data-action="DeleteCourse"><span class="action-dot dot-red"></span> ${t('logs_delete_course')}</button>
                <button class="chip-btn" data-action="SaveDraft"><span class="action-dot dot-orange"></span> ${t('logs_save_draft')}</button>
                <button class="chip-btn" data-action="Upload Video"><span class="action-dot dot-purple"></span> ${t('logs_upload_video')}</button>
                <button class="chip-btn" data-action="Download"><span class="action-dot dot-cyan"></span> ${t('logs_download')}</button>
                <button class="chip-btn" data-action="Download Course"><span class="action-dot dot-purple"></span> ${t('logs_download_course')}</button>
                <button class="chip-btn" data-action="Add User"><span class="action-dot dot-cyan"></span> ${t('logs_add_user')}</button>
                <button class="chip-btn" data-action="Delete User"><span class="action-dot dot-red"></span> ${t('logs_delete_user')}</button>
                <button class="chip-btn" data-action="Change Password"><span class="action-dot dot-orange"></span> ${t('logs_change_pw')}</button>
                <button class="chip-btn" data-action="Update Profile"><span class="action-dot dot-blue"></span> ${t('logs_update_profile')}</button>
                <button class="chip-btn" data-action="Create Course"><span class="action-dot dot-purple"></span> ${t('logs_create_course')}</button>
                <button class="chip-btn" data-action="Update Course"><span class="action-dot dot-orange"></span> ${t('logs_update_course')}</button>
                <button class="chip-btn" data-action="Delete Course"><span class="action-dot dot-red"></span> ${t('logs_delete_course')}</button>
            </div>

            <div style="display: flex; gap: 15px; align-items: center; flex-wrap: wrap;">
                <div class="search-bar" style="flex: 1; min-width: 250px;">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <input type="text" id="logSearch" placeholder="${t('logs_search')}">
                </div>
                <input type="date" id="dateFilter" class="form-control" style="width: auto; height: 38px;">
                <div class="range-btns" style="display:flex; gap:8px;">
                    <button class="chip-btn range-btn active" data-range="today">${t('logs_range_today')}</button>
                    <button class="chip-btn range-btn" data-range="7">${t('logs_range_week')}</button>
                    <button class="chip-btn range-btn" data-range="all">${t('logs_range_all')}</button>
                </div>
            </div>
        </div>

<div class="dashboard-panel" style="padding: 0; overflow-x: auto; background:white; border: 1px solid var(--border-color); border-radius:10px; width: 100%;">
    <table class="data-table" style="width: 100%; min-width: 640px; table-layout: fixed;">
        <thead style="background: #f8fafc;">
            <tr>
                <th style="padding: 15px 20px; width: 20%;">${t('logs_col_admin')}</th>
                <th style="width: 14%;">${t('logs_col_role')}</th>
                <th style="width: 16%;">${t('logs_col_action')}</th>
                <th style="width: 34%;">${t('logs_col_target')}</th>
                <th style="width: 16%;">${t('logs_col_datetime')}</th>
                    </tr>
                </thead>
                <tbody id="logsTableBody">
                    <tr><td colspan="5" style="text-align: center; padding: 20px;">${t('loader_text')}</td></tr>
                </tbody>
            </table>
        </div>
    `;

    const logsTableBody = document.getElementById('logsTableBody');
    const alertsContainer = document.getElementById('logsPageAlerts');
    const logCountEl = document.getElementById('logCount');

    function normalizeLogs(list) {
        if (!Array.isArray(list)) return [];
        return list.map((log, index) => {
            const admin = String(log.admin || log.username || log.user || 'System Admin');
            const role = String(log.role || log.userRole || 'Supervisor');
            const action = String(log.action || log.actionType || log.event || 'System Action');
            const target = String(log.target || log.details || log.description || '-');
            const datetime = String(log.datetime || log.timestamp || log.created_at || log.date || new Date().toISOString().replace('T', ' ').substring(0, 19));
            return {
                id: log.id || index + 1,
                admin,
                role,
                action,
                target,
                datetime
            };
        });
    }

    // Load logs from logService
    async function loadLogs() {
        const seq = ++loadSeq;               // this call's ticket

        renderSkeleton(logsTableBody, 'table', 5);
        try {
            const { from, to } = currentBounds();

            // CreatedAt is stored in UTC. from/to are LOCAL calendar dates, so a
            // local day spans two UTC instants (local midnight .. next local
            // midnight minus 1ms), expressed in UTC. A bare local date would be
            // off by the timezone offset (3h in Egypt) at both edges.
            const apiFrom = from ? new Date(`${from}T00:00:00`).toISOString() : '';
            const apiTo = to ? new Date(`${to}T23:59:59.999`).toISOString() : '';

            const filters = {};
            if (apiFrom) filters.from = apiFrom;
            if (apiTo) filters.to = apiTo;

            // Cache-buster in the URL (not a header) so we don't trigger an extra
            // CORS preflight -- see the note in services.getLogs.
            const cacheBuster = `_=${Date.now()}`;
            const rawLogs = await logService.getLogs(filters, cacheBuster);

            // A newer click already started loading -- discard this stale result
            // so it can't overwrite the list the user is actually looking at.
            if (seq !== loadSeq) return;

            allLogs = normalizeLogs(rawLogs);
            applyFilters();
        } catch (error) {
            if (seq !== loadSeq) return;     // stale failure, ignore
            showAlert(alertsContainer, error.message || 'Failed to fetch system logs.', 'error');
            logsTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color:var(--text-gray);">Failed to load logs from server.</td></tr>';
        } finally {
            if (seq === loadSeq) {
                const loader = document.getElementById('global-page-loader');
                if (loader) {
                    loader.classList.add('hide-loader');
                    setTimeout(() => loader.remove(), 400);
                }
            }
        }
    }

    function getRoleBadgeClass(role) {
        const r = String(role || '').toLowerCase();
        if (r.includes('supervisor')) return 'role-supervisor';
        if (r.includes('it')) return 'role-it';
        if (r.includes('el')) return 'role-el';
        return 'role-me';
    }

    function getActionDotColor(action) {
        if (!action) return 'dot-blue';
        const lowerAction = String(action).toLowerCase().replace(/\s+/g, '');
        if (lowerAction.includes('login') || lowerAction.includes('logout') || lowerAction.includes('updateprofile')) return 'dot-blue';
        if (lowerAction.includes('addfile') || lowerAction.includes('createcourse') || lowerAction.includes('createfolder')) return 'dot-green';
        if (lowerAction.includes('updatecourse') || lowerAction.includes('editcourse')) return 'dot-orange';
        if (lowerAction.includes('delete') || lowerAction.includes('remove')) return 'dot-red';
        if (lowerAction.includes('password')) return 'dot-orange';
if (lowerAction.includes('downloadcourse')) return 'dot-purple';
if (lowerAction.includes('download')) return 'dot-cyan';
if (lowerAction.includes('upload') || lowerAction.includes('course')) return 'dot-purple';
        if (lowerAction.includes('add') || lowerAction.includes('createuser')) return 'dot-cyan';
        return 'dot-blue';
    }

    function renderLogs(logsToRender) {
        logsTableBody.innerHTML = '';
        if (logCountEl) logCountEl.innerText = logsToRender.length;

        if (!Array.isArray(logsToRender) || logsToRender.length === 0) {
            let message = t('logs_no_match');
            if (currentRange === 'today') {
                message = 'No logs recorded for today. Try checking "Last 7 days" or "All time".';
            } else if (currentRange === '7') {
                message = 'No logs found in the last 7 days. Try "All time" to see all records.';
            }
            const hint = currentRange === 'all'
                ? message
                : `${message} <br><span style="font-size:0.85rem;">${t('logs_widen_hint')}</span>`;
            logsTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 30px; color:var(--text-gray);">${hint}</td></tr>`;
            return;
        }

        logsToRender.forEach(log => {
            const initial = (log.admin || 'A').charAt(0).toUpperCase();
            const tr = document.createElement('tr');

            const d = parseServerDate(log.datetime);
            const local = d
                ? `${toDateStr(d)} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`
                : String(log.datetime || '');
            const formattedTime = escapeHtml(local)
                .replace(' ', '<br><span style="color:var(--text-gray); font-weight:normal; font-size:0.8rem;">') + '</span>';

            tr.innerHTML = `
                <td style="padding: 15px 20px;">
                    <div style="display:flex; align-items:center; gap:12px; overflow:hidden;">
                        <div class="user-avatar" style="
flex-shrink:0; width:30px; height:30px; border-radius:50%; background-color:var(--primary-dark); color:var(--white); display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:0.8rem;
">${escapeHtml(initial)}</div>

<span style="font-weight:600; color:var(--primary-dark); word-break:break-word; overflow-wrap:anywhere;">
    ${escapeHtml(log.admin)}
</span>
</div>
</td>

<td>
    <span class="role-badge ${getRoleBadgeClass(log.role)}"
        style="padding:4px 12px; border-radius:12px; font-size:0.75rem; font-weight:600; display:inline-block;">
        ${escapeHtml(log.role === 'Mechanic Manager' ? 'Mechanical Manager' : log.role)}
    </span>
</td>

<td style="font-weight:600; color:var(--primary-dark); word-break:break-word; overflow-wrap:anywhere;">
    <span class="action-dot ${getActionDotColor(log.action)}"
        style="width:8px; height:8px; border-radius:50%; display:inline-block; margin-right:8px; flex-shrink:0;">
    </span>
    ${escapeHtml(log.action)}
</td>

<td style="color:var(--text-gray); word-break:break-word; overflow-wrap:anywhere;">
    ${escapeHtml(log.target)}
</td>

<td style="font-size:0.85rem; font-weight:600; color:var(--primary-dark); line-height:1.2; word-break:break-word;">
    ${formattedTime}
</td>
            `;
            logsTableBody.appendChild(tr);
        });
    }

    // ============================================
    // Unified filter execution - FIXED
    // ============================================
    const searchInput = document.getElementById('logSearch');
    const dateFilter = document.getElementById('dateFilter');
    let currentActionFilter = 'all';

    function applyFilters() {
        const term = searchInput ? searchInput.value.toLowerCase().trim() : '';
        let filtered = [...allLogs];


        // Only filter if currentActionFilter is not 'all'
        if (currentActionFilter !== 'all' && currentActionFilter) {
            const norm = v => String(v || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            const want = norm(currentActionFilter);
            
            
            filtered = filtered.filter(log => norm(log.action) === want);
        }

        // Text search
        if (term) {
            filtered = filtered.filter(log =>
                String(log.admin || '').toLowerCase().includes(term) ||
                String(log.target || '').toLowerCase().includes(term) ||
                String(log.action || '').toLowerCase().includes(term) ||
                String(log.role || '').toLowerCase().includes(term)
            );
        }

        renderLogs(filtered);
    }

    // ============================================
    // Event Listeners
    // ============================================

    // Action chips
    document.querySelectorAll('.chip-btn').forEach(chip => {
        chip.addEventListener('click', (e) => {
            // Skip if it's a range button
            if (chip.classList.contains('range-btn')) return;
            
            document.querySelectorAll('.chip-btn').forEach(c => c.classList.remove('active'));
            const targetChip = e.currentTarget;
            targetChip.classList.add('active');

            currentActionFilter = targetChip.getAttribute('data-action');
            applyFilters();
        });
    });

    // Search input
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                applyFilters();
            }, 300);
        });
    }

    // Date filter
    if (dateFilter) {
        dateFilter.addEventListener('change', async () => {
            currentRange = dateFilter.value ? 'custom' : 'all';
            document.querySelectorAll('.range-btn').forEach(b =>
                b.classList.toggle('active', !dateFilter.value && b.dataset.range === 'all'));
            // Reset action filter to 'all' when changing date range
            currentActionFilter = 'all';
            document.querySelectorAll('.chip-btn').forEach(c => c.classList.remove('active'));
            const allChip = document.querySelector('.chip-btn[data-action="all"]');
            if (allChip) allChip.classList.add('active');
            await loadLogs();
        });
    }

    // Range buttons
    document.querySelectorAll('.range-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            document.querySelectorAll('.range-btn').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            
            const newRange = e.currentTarget.dataset.range;
            currentRange = newRange;
            if (dateFilter) dateFilter.value = '';
            
            // 🔥 Reset action filter to 'all' when changing range
            currentActionFilter = 'all';
            document.querySelectorAll('.chip-btn').forEach(c => c.classList.remove('active'));
            const allChip = document.querySelector('.chip-btn[data-action="all"]');
            if (allChip) allChip.classList.add('active');
            
            
            await loadLogs();
        });
    });

    // Export CSV
    const csvBtn = document.getElementById('exportCSVBtn');
    if (csvBtn) {
        csvBtn.addEventListener('click', () => {
            if (!allLogs || allLogs.length === 0) {
                showAlert(alertsContainer, 'No log records available to export.', 'warning');
                return;
            }
            const headers = ['Admin', 'Role', 'Action', 'Target', 'Date Time'];
            const rows = allLogs.map(l => [
                `"${String(l.admin || '').replace(/"/g, '""')}"`,
                `"${String(l.role || '').replace(/"/g, '""')}"`,
                `"${String(l.action || '').replace(/"/g, '""')}"`,
                `"${String(l.target || '').replace(/"/g, '""')}"`,
                `"${String(l.datetime || '').replace(/"/g, '""')}"`
            ]);
            const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement('a');
            link.setAttribute('href', encodedUri);
            link.setAttribute('download', `system_logs_${new Date().toISOString().slice(0, 10)}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            showAlert(alertsContainer, 'System logs exported to CSV successfully.', 'success');
        });
    }

    // Initial load
    await loadLogs();
});
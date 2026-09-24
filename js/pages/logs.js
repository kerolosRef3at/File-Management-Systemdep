// js/pages/logs.js
import { protectPage } from '../shared/auth.js';
import { logService } from '../shared/services.js';
import { renderLayout } from '../shared/layout.js';
import { renderSkeleton, showAlert } from '../shared/components.js';
import { translations, getCurrentLang } from '../shared/jssharedi18n.js';
import { enhanceSelect } from '../shared/custom-select.js';

export async function initLogs() {
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
    let filteredLogs = [];
    let currentCategory = 'all';
    let currentAction = 'all';
    let currentRange = 'today';
    let currentPage = 1;
    const itemsPerPage = 10;
    let loadSeq = 0;

    // Category configurations
    const CATEGORIES = {
        all: {
            id: 'all',
            label: t('logs_cat_all'),
            actions: []
        },
        auth: {
            id: 'auth',
            label: t('logs_cat_auth'),
            actions: ['Login', 'Logout', 'Change Password', 'Update Profile']
        },
        files: {
            id: 'files',
            label: t('logs_cat_files'),
            actions: ['Add File', 'Delete File', 'Create Folder', 'Upload Video', 'Download', 'Download File']
        },
        courses: {
            id: 'courses',
            label: t('logs_cat_courses'),
            actions: ['Create Course', 'Update Course', 'Delete Course', 'Save Draft', 'Download Course']
        },
        users: {
            id: 'users',
            label: t('logs_cat_users'),
            actions: ['Add User', 'Delete User', 'Change Password', 'Update Profile']
        }
    };

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

    function normalizeActionKey(str) {
        return String(str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    }

    function matchCategory(logAction, catId) {
        if (!catId || catId === 'all') return true;
        const targetKey = normalizeActionKey(logAction);
        const cat = CATEGORIES[catId];
        if (!cat) return true;
        return cat.actions.some(a => normalizeActionKey(a) === targetKey);
    }

    // Modern color palette for actions
    const ACTION_PALETTE = {
        'login':            { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' }, // Blue
        'logout':           { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1' }, // Slate Gray
        'add file':         { bg: '#ECFDF5', text: '#047857', border: '#A7F3D0' }, // Mint Green
        'delete file':      { bg: '#FEF2F2', text: '#B91C1C', border: '#FECACA' }, // Light Red
        'create folder':    { bg: '#F0FDFA', text: '#0F766E', border: '#99F6E4' }, // Forest Teal
        'create course':    { bg: '#F7FEE7', text: '#4D7C0F', border: '#D9F99D' }, // Lime Green
        'createcourse':     { bg: '#F7FEE7', text: '#4D7C0F', border: '#D9F99D' },
        'update course':    { bg: '#F0F9FF', text: '#0369A1', border: '#BAE6FD' }, // Sky Blue
        'updatecourse':     { bg: '#F0F9FF', text: '#0369A1', border: '#BAE6FD' },
        'delete course':    { bg: '#FFF1F2', text: '#991B1B', border: '#FECDD3' }, // Deep Red
        'deletecourse':     { bg: '#FFF1F2', text: '#991B1B', border: '#FECDD3' },
        'save draft':       { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' }, // Amber Orange
        'savedraft':        { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' },
        'upload video':     { bg: '#F5F3FF', text: '#6D28D9', border: '#DDD6FE' }, // Purple
        'download':         { bg: '#ECFEFF', text: '#0E7490', border: '#A5F3FC' }, // Cyan
        'download file':    { bg: '#ECFEFF', text: '#0E7490', border: '#A5F3FC' },
        'download course':  { bg: '#FDF4FF', text: '#A21CAF', border: '#F5D0FE' }, // Fuchsia
        'add user':         { bg: '#E6FFFA', text: '#0D9488', border: '#99F6E4' }, // Teal
        'delete user':      { bg: '#FFF7ED', text: '#C2410C', border: '#FFEDD5' }, // Coral Orange
        'change password':  { bg: '#FEFCE8', text: '#A16207', border: '#FEF08A' }, // Gold Yellow
        'update profile':   { bg: '#FDF2F8', text: '#BE185D', border: '#FBCFE8' }  // Pink
    };

    function getActionColor(action) {
        if (!action) return { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' };
        const key = String(action).trim().toLowerCase();
        if (ACTION_PALETTE[key]) return ACTION_PALETTE[key];

        let hash = 0;
        for (let i = 0; i < key.length; i++) {
            hash = key.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue = Math.abs(hash) % 360;
        return {
            bg: `hsl(${hue}, 85%, 96%)`,
            text: `hsl(${hue}, 75%, 35%)`,
            border: `hsl(${hue}, 70%, 85%)`
        };
    }

    function getRoleBadgeClass(role) {
        const r = String(role || '').toLowerCase();
        if (r.includes('supervisor')) return 'role-supervisor';
        if (r.includes('it')) return 'role-it';
        if (r.includes('el')) return 'role-el';
        if (r.includes('public')) return 'role-public';
        return 'role-me';
    }

    function getTargetIcon() {
        return `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/></svg>`;
    }

    // Render modern HTML layout
    contentArea.innerHTML = `
        <div class="logs-page">
            <!-- Header Section -->
            <div class="logs-header">
                <div class="logs-title-wrap">
                    <h1>
                        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#0D3B7A" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        </svg>
                        ${t('logs_title')}
                    </h1>
                    <p>
                        <span class="logs-live-badge">
                            <span class="logs-live-dot"></span>
                            ${t('logs_live_trail')}
                        </span>
                        <span><strong id="logSummaryCount">0</strong> ${t('logs_subtitle')}</span>
                    </p>
                </div>
                <div class="logs-header-actions">
                    <button class="logs-btn logs-btn-outline" id="refreshLogsBtn" title="${t('logs_refresh')}">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" id="refreshSpinIcon">
                            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                        </svg>
                        <span>${t('logs_refresh')}</span>
                    </button>
                    <button class="logs-btn logs-btn-primary" id="exportCSVBtn">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                        </svg>
                        <span>${t('logs_export_csv')}</span>
                    </button>
                </div>
            </div>

            <!-- Alerts Container -->
            <div id="logsPageAlerts"></div>

            <!-- Metric Summary Cards -->
            <div class="logs-metrics-grid">
                <div class="logs-metric-card active-metric" data-card="all">
                    <div class="logs-metric-top">
                        <span class="logs-metric-label">${t('logs_stat_total')}</span>
                        <div class="logs-metric-icon" style="background:#EFF6FF; color:#1565C0;">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 20V10M18 20V4M6 20v-4"/></svg>
                        </div>
                    </div>
                    <div class="logs-metric-value" id="statTotalCount">0</div>
                    <div class="logs-metric-sub">${t('logs_cat_all')}</div>
                </div>

                <div class="logs-metric-card" data-card="auth">
                    <div class="logs-metric-top">
                        <span class="logs-metric-label">${t('logs_stat_auth')}</span>
                        <div class="logs-metric-icon" style="background:#F5F3FF; color:#7C3AED;">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        </div>
                    </div>
                    <div class="logs-metric-value" id="statAuthCount">0</div>
                    <div class="logs-metric-sub">${t('logs_login')} / ${t('logs_logout')}</div>
                </div>

                <div class="logs-metric-card" data-card="files">
                    <div class="logs-metric-top">
                        <span class="logs-metric-label">${t('logs_stat_files')}</span>
                        <div class="logs-metric-icon" style="background:#ECFDF5; color:#059669;">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                        </div>
                    </div>
                    <div class="logs-metric-value" id="statFilesCount">0</div>
                    <div class="logs-metric-sub">${t('logs_add_file')} / ${t('logs_delete_file')}</div>
                </div>

                <div class="logs-metric-card" data-card="admin">
                    <div class="logs-metric-top">
                        <span class="logs-metric-label">${t('logs_stat_admin')}</span>
                        <div class="logs-metric-icon" style="background:#FFF7ED; color:#EA580C;">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                        </div>
                    </div>
                    <div class="logs-metric-value" id="statAdminCount">0</div>
                    <div class="logs-metric-sub">${t('logs_cat_users')} & ${t('logs_cat_courses')}</div>
                </div>
            </div>

            <!-- Filters Panel -->
            <div class="logs-filter-card">
                <!-- Segmented Category Tabs & Action Filter -->
                <div class="logs-cat-bar">
                    <div class="logs-cat-tabs" id="categoryTabs">
                        <button class="logs-cat-tab active" data-cat="all">
                            <span>${t('logs_cat_all')}</span>
                        </button>
                        <button class="logs-cat-tab" data-cat="auth">
                            <span>${t('logs_cat_auth')}</span>
                        </button>
                        <button class="logs-cat-tab" data-cat="files">
                            <span>${t('logs_cat_files')}</span>
                        </button>
                        <button class="logs-cat-tab" data-cat="courses">
                            <span>${t('logs_cat_courses')}</span>
                        </button>
                        <button class="logs-cat-tab" data-cat="users">
                            <span>${t('logs_cat_users')}</span>
                        </button>
                    </div>

                    <div class="logs-action-select-wrap">
                        <label for="actionDropdown">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                            ${t('logs_col_action')}:
                        </label>
                        <select id="actionDropdown" class="logs-select">
                            <option value="all">${t('logs_all_actions_cat')}</option>
                        </select>
                    </div>
                </div>

                <!-- Secondary Controls (Search, Date Picker, Range Buttons) -->
                <div class="logs-controls-bar">
                    <div class="logs-search-wrap">
                        <div class="logs-search-icon">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        </div>
                        <input type="text" id="logSearch" class="logs-search-input" placeholder="${t('logs_search')}">
                        <button id="clearSearchBtn" class="logs-search-clear" title="Clear">&times;</button>
                    </div>

                    <input type="date" id="dateFilter" class="logs-date-input" title="${t('logs_from')}">

                    <div class="logs-range-group">
                        <button class="logs-range-btn active" data-range="today">${t('logs_range_today')}</button>
                        <button class="logs-range-btn" data-range="7">${t('logs_range_week')}</button>
                        <button class="logs-range-btn" data-range="all">${t('logs_range_all')}</button>
                    </div>
                </div>
            </div>

            <!-- Table Card -->
            <div class="logs-table-card">
                <div class="logs-table-responsive">
                    <table class="logs-table">
                        <thead>
                            <tr>
                                <th style="width: 22%;">${t('logs_col_admin')}</th>
                                <th style="width: 14%;">${t('logs_col_role')}</th>
                                <th style="width: 15%;">${t('logs_col_action')}</th>
                                <th style="width: 21%;">${t('logs_col_target')}</th>
                                <th style="width: 13%;">${t('logs_col_ip')}</th>
                                <th style="width: 15%;">${t('logs_col_datetime')}</th>
                            </tr>
                        </thead>
                        <tbody id="logsTableBody">
                            <tr><td colspan="6" style="text-align: center; padding: 30px;">${t('loader_text')}</td></tr>
                        </tbody>
                    </table>
                </div>

                <!-- Table Footer & Pagination -->
                <div class="logs-table-footer">
                    <div class="logs-footer-count" id="logsFooterCount">
                        ${t('logs_showing')} <strong>0</strong> ${t('logs_of')} <strong>0</strong>
                    </div>
                    <div class="logs-pagination" id="logsPagination"></div>
                </div>
            </div>
        </div>

        <!-- Log Details Modal -->
        <div id="logDetailsModal" class="log-modal-overlay">
            <div class="log-modal-box">
                <div class="log-modal-header">
                    <h3>
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#1565C0" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                        ${t('logs_details_title')}
                    </h3>
                    <button class="log-modal-close" id="closeModalBtn">&times;</button>
                </div>
                <div class="log-modal-body" id="logModalBody"></div>
                <div class="log-modal-footer">
                    <button class="logs-btn logs-btn-outline" id="closeModalFooterBtn">${t('logs_close')}</button>
                </div>
            </div>
        </div>
    `;

    const logsTableBody = document.getElementById('logsTableBody');
    const alertsContainer = document.getElementById('logsPageAlerts');
    const logSummaryCount = document.getElementById('logSummaryCount');
    const logsFooterCount = document.getElementById('logsFooterCount');
    const logsPagination = document.getElementById('logsPagination');
    const searchInput = document.getElementById('logSearch');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    const dateFilter = document.getElementById('dateFilter');
    const actionDropdown = document.getElementById('actionDropdown');
    const refreshLogsBtn = document.getElementById('refreshLogsBtn');
    const refreshSpinIcon = document.getElementById('refreshSpinIcon');
    const logDetailsModal = document.getElementById('logDetailsModal');
    const logModalBody = document.getElementById('logModalBody');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const closeModalFooterBtn = document.getElementById('closeModalFooterBtn');

    // Counts elements
    const statTotalEl = document.getElementById('statTotalCount');
    const statAuthEl = document.getElementById('statAuthCount');
    const statFilesEl = document.getElementById('statFilesCount');
    const statAdminEl = document.getElementById('statAdminCount');

    function normalizeLogs(list) {
        if (!Array.isArray(list)) return [];
        return list.map((log, index) => {
            const admin = String(log.admin || log.username || log.user || 'System Admin');
            const role = String(log.role || log.userRole || 'Supervisor');
            const action = String(log.action || log.actionType || log.event || 'System Action');
            const target = String(log.target || log.details || log.description || '-');
            const datetime = String(log.datetime || log.timestamp || log.created_at || log.date || new Date().toISOString().replace('T', ' ').substring(0, 19));
            const ipAddress = String(log.ipAddress || log.ip || log.ip_address || '-');
            return {
                id: log.id || (index + 1),
                admin,
                role,
                action,
                target,
                datetime,
                ipAddress
            };
        });
    }

    function updateMetricCounts() {
        const total = allLogs.length;
        const authCount = allLogs.filter(l => matchCategory(l.action, 'auth')).length;
        const filesCount = allLogs.filter(l => matchCategory(l.action, 'files')).length;
        const adminCount = allLogs.filter(l => matchCategory(l.action, 'users') || matchCategory(l.action, 'courses')).length;

        if (statTotalEl) statTotalEl.textContent = total;
        if (statAuthEl) statAuthEl.textContent = authCount;
        if (statFilesEl) statFilesEl.textContent = filesCount;
        if (statAdminEl) statAdminEl.textContent = adminCount;
        if (logSummaryCount) logSummaryCount.textContent = total;
    }

    function syncMetricCardActive() {
        document.querySelectorAll('.logs-metric-card').forEach(card => {
            const cardType = card.dataset.card;
            if (currentCategory === 'all' && cardType === 'all') {
                card.classList.add('active-metric');
            } else if (currentCategory === 'auth' && cardType === 'auth') {
                card.classList.add('active-metric');
            } else if (currentCategory === 'files' && cardType === 'files') {
                card.classList.add('active-metric');
            } else if ((currentCategory === 'courses' || currentCategory === 'users') && cardType === 'admin') {
                card.classList.add('active-metric');
            } else {
                card.classList.remove('active-metric');
            }
        });
    }

    function populateActionDropdown() {
        if (!actionDropdown) return;
        const cat = CATEGORIES[currentCategory];
        let availableActions = [];

        if (currentCategory === 'all') {
            // Collect distinct actions present in allLogs
            const set = new Set(allLogs.map(l => l.action).filter(Boolean));
            // Add prominent default actions if empty
            if (set.size === 0) {
                ['Login', 'Logout', 'Add File', 'Delete File', 'Create Folder', 'Create Course', 'Add User'].forEach(a => set.add(a));
            }
            availableActions = Array.from(set);
        } else if (cat) {
            availableActions = cat.actions;
        }

        // Build options
        let html = `<option value="all">${t('logs_all_actions_cat')}</option>`;
        availableActions.forEach(act => {
            const selected = (currentAction === act) ? 'selected' : '';
            html += `<option value="${escapeHtml(act)}" ${selected}>${escapeHtml(act)}</option>`;
        });

        actionDropdown.innerHTML = html;
        if (!availableActions.includes(currentAction) && currentAction !== 'all') {
            currentAction = 'all';
            actionDropdown.value = 'all';
        }
    }

    // Load logs from logService
    async function loadLogs() {
        const seq = ++loadSeq;

        renderSkeleton(logsTableBody, 'table', 6);
        if (refreshSpinIcon) {
            refreshSpinIcon.style.animation = 'livePulse 0.8s infinite linear';
        }

        try {
            const { from, to } = currentBounds();
            const apiFrom = from ? new Date(`${from}T00:00:00`).toISOString() : '';
            const apiTo = to ? new Date(`${to}T23:59:59.999`).toISOString() : '';

            const filters = {};
            if (apiFrom) filters.from = apiFrom;
            if (apiTo) filters.to = apiTo;

            const cacheBuster = `_=${Date.now()}`;
            const rawLogs = await logService.getLogs(filters, cacheBuster);

            if (seq !== loadSeq) return;

            allLogs = normalizeLogs(rawLogs);
            updateMetricCounts();
            populateActionDropdown();
            applyFilters();
        } catch (error) {
            if (seq !== loadSeq) return;
            showAlert(alertsContainer, error.message || 'Failed to fetch system logs.', 'error');
            logsTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 30px; color:#EF4444;">Failed to load logs from server.</td></tr>`;
        } finally {
            if (seq === loadSeq) {
                if (refreshSpinIcon) {
                    refreshSpinIcon.style.animation = '';
                }
                const loader = document.getElementById('global-page-loader');
                if (loader) {
                    loader.classList.add('hide-loader');
                    setTimeout(() => loader.remove(), 400);
                }
            }
        }
    }

    function applyFilters() {
        const term = searchInput ? searchInput.value.toLowerCase().trim() : '';
        let res = [...allLogs];

        // Category filter
        if (currentCategory !== 'all') {
            res = res.filter(log => matchCategory(log.action, currentCategory));
        }

        // Action dropdown filter
        if (currentAction !== 'all' && currentAction) {
            const want = normalizeActionKey(currentAction);
            res = res.filter(log => normalizeActionKey(log.action) === want);
        }

        // Search input (admin, target, action, role, IP)
        if (term) {
            res = res.filter(log =>
                String(log.admin || '').toLowerCase().includes(term) ||
                String(log.target || '').toLowerCase().includes(term) ||
                String(log.action || '').toLowerCase().includes(term) ||
                String(log.role || '').toLowerCase().includes(term) ||
                String(log.ipAddress || '').toLowerCase().includes(term)
            );
        }

        filteredLogs = res;
        currentPage = 1;
        renderLogs();
        renderPagination();
    }

    function renderLogs() {
        logsTableBody.innerHTML = '';

        if (!filteredLogs || filteredLogs.length === 0) {
            let message = t('logs_no_match');
            if (currentRange === 'today') {
                message = lang === 'ar' 
                    ? 'لم يتم تسجيل أي أحداث اليوم. جرّب التحقق من "آخر 7 أيام" أو "كل الفترات".'
                    : 'No logs recorded for today. Try checking "Last 7 days" or "All time".';
            } else if (currentRange === '7') {
                message = lang === 'ar'
                    ? 'لا توجد سجلات في آخر 7 أيام. جرّب "كل الفترات" لعرض كل الأحداث.'
                    : 'No logs found in the last 7 days. Try "All time" to see all records.';
            }

            logsTableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="padding: 0;">
                        <div class="logs-empty-state">
                            <div class="logs-empty-icon">
                                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/>
                                </svg>
                            </div>
                            <h4 class="logs-empty-title">${escapeHtml(message)}</h4>
                            <p class="logs-empty-hint">${t('logs_widen_hint')}</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        const totalItems = filteredLogs.length;
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
        const pageItems = filteredLogs.slice(startIndex, endIndex);

        pageItems.forEach(log => {
            const tr = document.createElement('tr');
            const initial = (log.admin || 'A').charAt(0).toUpperCase();

            const d = parseServerDate(log.datetime);
            const dateStr = d ? toDateStr(d) : String(log.datetime || '').split(' ')[0] || '-';
            const timeStr = d
                ? `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
                : String(log.datetime || '').split(' ')[1] || '';

            const actColor = getActionColor(log.action);
            const roleDisplay = (log.role === 'Mechanic Manager') ? 'Mechanical Manager' : (log.role || 'Supervisor');

            tr.innerHTML = `
                <td>
                    <div class="log-admin-cell">
                        <div class="log-avatar">${escapeHtml(initial)}</div>
                        <div class="log-admin-info">
                            <span class="log-admin-name">${escapeHtml(log.admin)}</span>
                            <span class="log-admin-role">${escapeHtml(roleDisplay)}</span>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="role-badge ${getRoleBadgeClass(log.role)}" style="display:inline-block; font-size:0.75rem; font-weight:700; padding:4px 10px; border-radius:999px;">
                        ${escapeHtml(roleDisplay)}
                    </span>
                </td>
                <td>
                    <span class="log-action-badge" style="background:${actColor.bg}; color:${actColor.text}; border:1px solid ${actColor.border};">
                        <span class="log-action-dot" style="background-color:${actColor.text};"></span>
                        ${escapeHtml(log.action)}
                    </span>
                </td>
                <td>
                    <div class="log-target-cell">
                        <span class="log-target-icon">${getTargetIcon()}</span>
                        <span>${escapeHtml(log.target)}</span>
                    </div>
                </td>
                <td>
                    <span class="log-ip-chip">
                        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>
                        ${escapeHtml(log.ipAddress || '-')}
                    </span>
                </td>
                <td>
                    <div class="log-date-cell">
                        <span class="log-date-main">${escapeHtml(dateStr)}</span>
                        <span class="log-date-time">${escapeHtml(timeStr)}</span>
                    </div>
                </td>
            `;

            // Row click triggers log inspection modal
            tr.style.cursor = 'pointer';
            tr.addEventListener('click', () => {
                showLogDetailsModal(log);
            });

            logsTableBody.appendChild(tr);
        });
    }

    function renderPagination() {
        const total = filteredLogs.length;
        const totalPages = Math.ceil(total / itemsPerPage) || 1;
        const startIndex = total === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
        const endIndex = Math.min(currentPage * itemsPerPage, total);

        if (logsFooterCount) {
            logsFooterCount.innerHTML = `${t('logs_showing')} <strong>${startIndex}-${endIndex}</strong> ${t('logs_of')} <strong>${total}</strong>`;
        }

        if (!logsPagination) return;
        logsPagination.innerHTML = '';

        if (totalPages <= 1) return;

        // Prev Button
        const prevBtn = document.createElement('button');
        prevBtn.className = 'logs-page-btn';
        prevBtn.disabled = (currentPage === 1);
        prevBtn.innerHTML = lang === 'rtl' || document.documentElement.getAttribute('dir') === 'rtl'
            ? `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>`
            : `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>`;
        prevBtn.title = t('logs_prev');
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderLogs();
                renderPagination();
            }
        });
        logsPagination.appendChild(prevBtn);

        // Page Number Buttons (smart range: current +/- 2)
        const startP = Math.max(1, currentPage - 2);
        const endP = Math.min(totalPages, currentPage + 2);

        if (startP > 1) {
            const firstBtn = createPageBtn(1);
            logsPagination.appendChild(firstBtn);
            if (startP > 2) {
                const dots = document.createElement('span');
                dots.textContent = '...';
                dots.style.padding = '0 4px';
                dots.style.color = '#94A3B8';
                logsPagination.appendChild(dots);
            }
        }

        for (let p = startP; p <= endP; p++) {
            logsPagination.appendChild(createPageBtn(p));
        }

        if (endP < totalPages) {
            if (endP < totalPages - 1) {
                const dots = document.createElement('span');
                dots.textContent = '...';
                dots.style.padding = '0 4px';
                dots.style.color = '#94A3B8';
                logsPagination.appendChild(dots);
            }
            const lastBtn = createPageBtn(totalPages);
            logsPagination.appendChild(lastBtn);
        }

        // Next Button
        const nextBtn = document.createElement('button');
        nextBtn.className = 'logs-page-btn';
        nextBtn.disabled = (currentPage === totalPages);
        nextBtn.innerHTML = lang === 'rtl' || document.documentElement.getAttribute('dir') === 'rtl'
            ? `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>`
            : `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>`;
        nextBtn.title = t('logs_next');
        nextBtn.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                renderLogs();
                renderPagination();
            }
        });
        logsPagination.appendChild(nextBtn);
    }

    function createPageBtn(p) {
        const btn = document.createElement('button');
        btn.className = `logs-page-btn ${p === currentPage ? 'active' : ''}`;
        btn.textContent = p;
        btn.addEventListener('click', () => {
            if (currentPage !== p) {
                currentPage = p;
                renderLogs();
                renderPagination();
            }
        });
        return btn;
    }

    // Modal display logic
    function showLogDetailsModal(log) {
        if (!logDetailsModal || !logModalBody) return;
        const actColor = getActionColor(log.action);
        const roleDisplay = (log.role === 'Mechanic Manager') ? 'Mechanical Manager' : (log.role || 'Supervisor');

        logModalBody.innerHTML = `
            <div class="log-detail-grid">
                <div class="log-detail-item">
                    <span class="log-detail-key">${t('logs_col_admin')}</span>
                    <span class="log-detail-val">${escapeHtml(log.admin)}</span>
                </div>
                <div class="log-detail-item">
                    <span class="log-detail-key">${t('logs_col_role')}</span>
                    <span class="log-detail-val">${escapeHtml(roleDisplay)}</span>
                </div>
                <div class="log-detail-item">
                    <span class="log-detail-key">${t('logs_col_action')}</span>
                    <span class="log-detail-val">
                        <span class="log-action-badge" style="background:${actColor.bg}; color:${actColor.text}; border:1px solid ${actColor.border};">
                            <span class="log-action-dot" style="background-color:${actColor.text};"></span>
                            ${escapeHtml(log.action)}
                        </span>
                    </span>
                </div>
                <div class="log-detail-item">
                    <span class="log-detail-key">${t('logs_col_ip')}</span>
                    <span class="log-detail-val" style="font-family:monospace; font-size:0.85rem;">${escapeHtml(log.ipAddress || '-')}</span>
                </div>
                <div class="log-detail-item full-width">
                    <span class="log-detail-key">${t('logs_col_target')} / Details</span>
                    <span class="log-detail-val" style="font-weight:600; line-height:1.4;">${escapeHtml(log.target)}</span>
                </div>
                <div class="log-detail-item full-width">
                    <span class="log-detail-key">${t('logs_col_datetime')}</span>
                    <span class="log-detail-val">${escapeHtml(log.datetime)}</span>
                </div>
            </div>
        `;
        logDetailsModal.classList.add('active');
    }

    function hideLogDetailsModal() {
        if (logDetailsModal) {
            logDetailsModal.classList.remove('active');
        }
    }

    if (closeModalBtn) closeModalBtn.addEventListener('click', hideLogDetailsModal);
    if (closeModalFooterBtn) closeModalFooterBtn.addEventListener('click', hideLogDetailsModal);
    if (logDetailsModal) {
        logDetailsModal.addEventListener('click', (e) => {
            if (e.target === logDetailsModal) hideLogDetailsModal();
        });
    }

    // ============================================
    // Event Listeners
    // ============================================

    // Category Tabs click
    document.querySelectorAll('#categoryTabs .logs-cat-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            document.querySelectorAll('#categoryTabs .logs-cat-tab').forEach(t => t.classList.remove('active'));
            e.currentTarget.classList.add('active');

            currentCategory = e.currentTarget.dataset.cat || 'all';
            currentAction = 'all';

            syncMetricCardActive();
            populateActionDropdown();
            applyFilters();
        });
    });

    // Metric Cards click (quick filter synchronization)
    document.querySelectorAll('.logs-metric-card').forEach(card => {
        card.addEventListener('click', (e) => {
            const cardType = e.currentTarget.dataset.card;
            if (cardType === 'all') {
                currentCategory = 'all';
            } else if (cardType === 'auth') {
                currentCategory = 'auth';
            } else if (cardType === 'files') {
                currentCategory = 'files';
            } else if (cardType === 'admin') {
                currentCategory = 'users';
            }

            document.querySelectorAll('#categoryTabs .logs-cat-tab').forEach(t => {
                t.classList.toggle('active', t.dataset.cat === currentCategory);
            });

            currentAction = 'all';
            syncMetricCardActive();
            populateActionDropdown();
            applyFilters();
        });
    });

    // Action Dropdown change
    if (actionDropdown) {
        actionDropdown.addEventListener('change', () => {
            currentAction = actionDropdown.value;
            applyFilters();
        });
        enhanceSelect(actionDropdown);
    }

    // Search Input
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', () => {
            if (clearSearchBtn) {
                clearSearchBtn.style.display = searchInput.value ? 'block' : 'none';
            }
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                applyFilters();
            }, 250);
        });
    }

    // Clear Search Button
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
            if (searchInput) {
                searchInput.value = '';
                clearSearchBtn.style.display = 'none';
                searchInput.focus();
                applyFilters();
            }
        });
    }

    // Date Filter Picker
    if (dateFilter) {
        dateFilter.addEventListener('change', async () => {
            currentRange = dateFilter.value ? 'custom' : 'all';
            document.querySelectorAll('.logs-range-btn').forEach(b =>
                b.classList.toggle('active', !dateFilter.value && b.dataset.range === 'all')
            );
            await loadLogs();
        });
    }

    // Date Range Buttons
    document.querySelectorAll('.logs-range-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            document.querySelectorAll('.logs-range-btn').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');

            currentRange = e.currentTarget.dataset.range;
            if (dateFilter) dateFilter.value = '';

            await loadLogs();
        });
    });

    // Refresh Button
    if (refreshLogsBtn) {
        refreshLogsBtn.addEventListener('click', async () => {
            await loadLogs();
        });
    }

    // Export CSV
    const csvBtn = document.getElementById('exportCSVBtn');
    if (csvBtn) {
        csvBtn.addEventListener('click', () => {
            const recordsToExport = (filteredLogs && filteredLogs.length > 0) ? filteredLogs : allLogs;
            if (!recordsToExport || recordsToExport.length === 0) {
                showAlert(alertsContainer, 'No log records available to export.', 'warning');
                return;
            }

            const headers = ['Admin', 'Role', 'Action', 'Target', 'IP Address', 'Date Time'];
            const rows = recordsToExport.map(l => [
                `"${String(l.admin || '').replace(/"/g, '""')}"`,
                `"${String(l.role || '').replace(/"/g, '""')}"`,
                `"${String(l.action || '').replace(/"/g, '""')}"`,
                `"${String(l.target || '').replace(/"/g, '""')}"`,
                `"${String(l.ipAddress || '').replace(/"/g, '""')}"`,
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

    // Keyboard support: Escape closes modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') hideLogDetailsModal();
    });

    // Initial load
    await loadLogs();
}

if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        if (window.location.pathname.includes('logs')) {
            initLogs();
        }
    });
}
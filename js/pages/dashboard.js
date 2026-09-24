// js/pages/dashboard.js
import { renderLayout } from '../shared/layout.js';
import { protectPage, getCurrentUser } from '../shared/auth.js';
import { dashboardService } from '../shared/services.js';
import { translations, getCurrentLang } from '../shared/jssharedi18n.js';
import { enhanceSelect } from '../shared/custom-select.js';

function canManageContent(role) {
    const r = String(role || '').trim();
    if (r === 'Supervisor') return true;
    return /\s+Manager$/i.test(r);
}

export async function initDashboard() {
    // Protect: only authenticated non-public users
    if (!protectPage()) return;
    if (!canManageContent(getCurrentUser()?.role)) {
        if (window.navigateTo) {
            window.navigateTo('repository');
        } else {
            window.location.href = 'repository.html';
        }
        return;
    }

    // Render the admin sidebar layout
    renderLayout('dashboard');

    const content = document.getElementById('page-content');
    if (!content) return;

    // --- State ---
    let currentYear = new Date().getFullYear();
    let currentDays = 30;
    let activeBreakdownTab = 'mix'; // 'mix' | 'downloads'
    let currentMetrics = null;
    let clockTimer = null;

    const lang = getCurrentLang();
    const isAr = lang === 'ar';
    const t = (key) => (translations[lang] || translations.en)[key] || translations.en[key] || key;

    function getLiveTimeString() {
        const now = new Date();
        return now.toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' });
    }

    function getLiveDateString() {
        const now = new Date();
        return now.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // --- Load metrics ---
    async function loadDashboard() {
        renderDashboardSkeleton(content);
        try {
            const m = await dashboardService.getMetrics(currentDays);
            currentMetrics = m;

            const stats = {
                totalFiles: m.totalFiles,
                totalCourses: m.totalCourses,
                totalPrograms: m.totalPrograms,
                qnapStorage: m.qnapStorage || {
                    usedPercentage: m.storageCapacityUsed || 0,
                    usedValue: (m.storageCapacityValue || '0 GB / 0 GB').split('/')[0].trim(),
                    totalValue: (m.storageCapacityValue || '0 GB / 0 GB').split('/')[1]?.trim() || 'Total'
                },
                pendingTasks: m.pendingTasks || 0,
                netActivity: m.netActivity || '0',
                trends: m.trends || {}
            };

            renderDashboard(content, {
                stats,
                downloads: m.downloadVelocity || [],
                courseDownloads: m.courseVelocity || [],
                programVelocity: m.programVelocity || [],
                resourceMix: m.resourceMix || {},
                programDownloads: m.programDownloads || {},
                documents: (m.highImpactDocuments || []).slice(0, 5),
                events: (m.recentEvents || []).slice(0, 10)
            });
        } catch (err) {
            console.error('Dashboard load failed:', err);
            content.innerHTML = `
                <div style="padding: 40px; color: #E63946; text-align: center; font-weight: 700;">
                    ${isAr ? 'تعذر تحميل بيانات لوحة التحكم. يرجى المحاولة مرة أخرى.' : 'Failed to load dashboard data. Please try again.'}
                </div>
            `;
        } finally {
            const loader = document.getElementById('global-page-loader');
            if (loader) {
                loader.classList.add('hide-loader');
                setTimeout(() => loader.remove(), 400);
            }
        }
    }

    await loadDashboard();

    // --- Skeleton Loader ---
    function renderDashboardSkeleton(container) {
        container.innerHTML = `
            <div class="dash-root">
                <div class="dash-skeleton" style="height: 140px; border-radius: 20px;"></div>
                <div class="dash-stats-grid">
                    <div class="dash-skeleton" style="height: 130px;"></div>
                    <div class="dash-skeleton" style="height: 130px;"></div>
                    <div class="dash-skeleton" style="height: 130px;"></div>
                    <div class="dash-skeleton" style="height: 130px;"></div>
                </div>
                <div class="dash-analytics-row">
                    <div class="dash-skeleton" style="height: 380px;"></div>
                    <div class="dash-skeleton" style="height: 380px;"></div>
                </div>
                <div class="dash-skeleton" style="height: 260px;"></div>
            </div>
        `;
    }

    // --- Main Render ---
    function renderDashboard(container, { stats, courseDownloads, programVelocity, resourceMix, programDownloads, documents }) {
        const user = getCurrentUser();
        const rawUserDisplayName = user ? (user.name || user.username) : 'Admin';
        const userDisplayName = String(rawUserDisplayName || '').includes('@') ? String(rawUserDisplayName).split('@')[0] : rawUserDisplayName;

        const hour = new Date().getHours();
        let greeting = t('dash_evening');
        if (hour >= 5 && hour < 12) {
            greeting = t('dash_morning');
        } else if (hour >= 12 && hour < 17) {
            greeting = t('dash_afternoon');
        }

        const roleDisplay = user?.role === 'Supervisor' 
            ? (isAr ? 'مشرف النظام' : 'Supervisor')
            : (user?.role || (isAr ? 'مدير القسم' : 'Manager'));

        container.innerHTML = `
            <div class="dash-root">
                <!-- 1. Executive Welcome Banner -->
                <div class="dash-banner">
                    <div class="dash-banner-left">
                        <h1>${greeting}، ${escapeHtml(userDisplayName)} 👋</h1>
                        <p>${isAr ? 'جامعة أسيوط التكنولوجية الدولية — لوحة مؤشرات الأداء ومساحة العمل الأكاديمية' : 'Assiut International Technological University — Performance & Workspace Dashboard'}</p>
                        <div class="dash-banner-chips">
                            <span class="dash-banner-chip">
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                <span id="dashLiveClock">${getLiveTimeString()}</span>
                            </span>
                            <span class="dash-banner-chip">
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                <span>${getLiveDateString()}</span>
                            </span>
                            <span class="dash-banner-chip">
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                                <span>${escapeHtml(roleDisplay)}</span>
                            </span>
                        </div>
                    </div>
                    <div class="dash-banner-right">
                        <select class="dash-banner-select" id="dashDaysFilter" title="${t('dash_overview')}">
                            <option value="7" ${currentDays === 7 ? 'selected' : ''}>${t('dash_last7')}</option>
                            <option value="30" ${currentDays === 30 ? 'selected' : ''}>${t('dash_last30')}</option>
                            <option value="180" ${currentDays === 180 ? 'selected' : ''}>${t('dash_last6m')}</option>
                            <option value="365" ${currentDays === 365 ? 'selected' : ''}>${t('dash_lasty')}</option>
                        </select>
                        <button class="dash-banner-btn" id="dashRefreshBtn" title="${t('dash_refresh')}">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" id="dashRefreshIcon">
                                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                            </svg>
                            <span>${t('dash_refresh')}</span>
                        </button>
                    </div>
                </div>

                <!-- 2. KPI Stat Cards -->
                <div class="dash-stats-grid">
                    ${renderStatCard(t('dash_total_files'), formatNumber(stats.totalFiles || 0), stats.trends?.totalFiles, 'files', 'blue')}
                    ${renderStorageCard(stats)}
                    ${renderStatCard(t('dash_total_courses'), formatNumber(stats.totalCourses || 0), stats.trends?.totalCourses, 'courses', 'rose')}
                    ${renderStatCard(t('dash_total_programs'), formatNumber(stats.totalPrograms || 0), stats.trends?.totalPrograms, 'programs', 'emerald')}
                </div>

                <!-- 3. Analytics Row (Download Velocity Line Chart + Academic Resources Breakdown) -->
                <div class="dash-analytics-row">
                    <!-- Left: Multi-Line Download Velocity Chart -->
                    <div class="section-card dash-velocity-card">
                        <div class="dash-chart-top-bar">
                            <div>
                                <h3 class="section-title">${t('dash_download_velocity')}</h3>
                                <div class="section-sub" style="margin-bottom:0;">
                                    ${isAr ? 'تتبع وتيرة تحميل المقررات والمكتبة الرقمية على مدار العام' : 'Track downloads velocity for courses and digital library over the year'}
                                </div>
                            </div>
                            <div class="dash-year-select-wrap">
                                <div class="dash-chart-legend">
                                    <span class="dash-legend-badge courses">
                                        <span class="dash-legend-badge-dot" style="background:#E11D48;"></span>
                                        ${t('dash_course_downloads_velocity')}
                                    </span>
                                    <span class="dash-legend-badge programs">
                                        <span class="dash-legend-badge-dot" style="background:#1565C0;"></span>
                                        ${t('dash_program_downloads_velocity')}
                                    </span>
                                </div>
                                <select id="chartYearSelect" class="dash-year-select">
                                    <option value="2026" ${currentYear === 2026 ? 'selected' : ''}>2026</option>
                                    <option value="2025" ${currentYear === 2025 ? 'selected' : ''}>2025</option>
                                    <option value="2024" ${currentYear === 2024 ? 'selected' : ''}>2024</option>
                                    <option value="2023" ${currentYear === 2023 ? 'selected' : ''}>2023</option>
                                </select>
                            </div>
                        </div>
                        <div class="dash-velocity-chart-wrapper" id="velocityChartContainer">
                            ${renderMultiVelocityChartSVG(courseDownloads, programVelocity, isAr ? 'الكورسات' : 'Courses', isAr ? 'البرامج والمكتبة' : 'Programs', '#E11D48', '#1565C0')}
                        </div>
                    </div>

                    <!-- Right: Academic Breakdown with Donut & Department Progress Bars -->
                    <div class="section-card dash-breakdown-card">
                        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:12px;">
                            <div>
                                <h3 class="section-title">${isAr ? 'تحليل الأقسام الأكاديمية' : 'Department Analytics'}</h3>
                                <div class="section-sub" style="margin-bottom:0;">
                                    ${isAr ? 'توزيع الملفات ونسب النشاط والتحميل' : 'File mix and activity share by department'}
                                </div>
                            </div>
                        </div>

                        <!-- Tab switcher for Resource Mix vs Program Downloads -->
                        <div class="dash-tab-pills">
                            <button class="dash-tab-pill ${activeBreakdownTab === 'mix' ? 'active' : ''}" id="tabResourceMix">
                                ${t('dash_resource_mix')}
                            </button>
                            <button class="dash-tab-pill ${activeBreakdownTab === 'downloads' ? 'active' : ''}" id="tabProgramDl">
                                ${t('dash_program_downloads')}
                            </button>
                        </div>

                        <div id="breakdownContainer">
                            ${renderBreakdownSection(activeBreakdownTab === 'mix' ? resourceMix : programDownloads, activeBreakdownTab === 'mix' ? t('dash_files') : t('dash_downloads'))}
                        </div>
                    </div>
                </div>

                <!-- 5. High-Impact Documents Table -->
                <div class="dash-table-card">
                    <div class="dash-table-header-wrap">
                        <div>
                            <h3 class="section-title">${t('dash_high_impact')}</h3>
                            <div class="section-sub" style="margin-bottom:0;">
                                ${isAr ? 'أكثر الملفات الأكاديمية استخدامًا وتحميلًا من قِبل الطلاب والأساتذة' : 'Most accessed and downloaded documents across departments'}
                            </div>
                        </div>
                        <a class="dash-table-view-all" href="repository.html">
                            <span>${t('dash_view_all')}</span>
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="${isAr ? '15 18 9 12 15 6' : '9 18 15 12 9 6'}"/></svg>
                        </a>
                    </div>
                    <div class="dash-docs-table-wrapper">
                        <table class="dash-docs-table">
                            <thead>
                                <tr>
                                    <th style="width: 45%;">${t('dash_filename')}</th>
                                    <th style="width: 25%;">${t('dash_source')}</th>
                                    <th style="width: 15%; text-align: center;">${t('dash_access_count')}</th>
                                    <th style="width: 15%; text-align: end;">${t('dash_weight')}</th>
                                </tr>
                            </thead>
                            <tbody id="docsTableBody">
                                ${renderDocRows(documents)}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        // Update live clock every 30s
        if (clockTimer) clearInterval(clockTimer);
        clockTimer = setInterval(() => {
            const clockEl = document.getElementById('dashLiveClock');
            if (clockEl) clockEl.textContent = getLiveTimeString();
        }, 30000);

        // Attach event listeners
        attachDashboardListeners({ courseDownloads, programVelocity, resourceMix, programDownloads });
    }

    // --- Stat Card Renderer (StatCard.jsx spec) ---
    function renderStatCard(label, value, change, type, colorTheme) {
        const icons = {
            files: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>',
            courses: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>',
            programs: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>'
        };

        function formatTrendText(str) {
            if (!str || typeof str !== 'string') return isAr ? 'نشط في النظام' : 'Active in system';
            if (!isAr) return str;
            return str
                .replace(/^in\s+(\d+)\s+days/gi, 'خلال $1 يوم')
                .replace(/^Active in\s+(\d+)\s+departments/gi, 'نشط في $1 أقسام')
                .replace(/Drive not connected/gi, 'القرص غير متصل')
                .replace(/Live files count/gi, 'مباشر من المستودع')
                .replace(/Live courses count/gi, 'متاح للطلاب')
                .replace(/Live programs count/gi, 'برامج وتخصصات نشطة');
        }

        const isPositive = typeof change === 'string' && change.includes('+');
        const trendBadgeClass = isPositive ? 'positive' : (type === 'programs' ? 'info' : 'neutral');
        const trendPrefix = isPositive ? '↑ ' : '';

        return `
            <div class="dash-stat-card">
                <div class="dash-stat-top">
                    <div>
                        <div class="dash-stat-label">${label}</div>
                        <div class="dash-stat-value">${value}</div>
                    </div>
                    <div class="dash-stat-icon-box ${colorTheme}">
                        ${icons[type] || ''}
                    </div>
                </div>
                <div class="dash-trend-pill ${trendBadgeClass}">
                    ${trendPrefix}${formatTrendText(change)}
                </div>
            </div>
        `;
    }

    // --- Storage Card Renderer ---
    function renderStorageCard(stats) {
        const usedPercent = stats.qnapStorage ? stats.qnapStorage.usedPercentage : (stats.storageCapacityUsed || 0);
        const usedValue = stats.qnapStorage ? stats.qnapStorage.usedValue : (stats.storageCapacityValue || '0 TB');
        const totalValue = stats.qnapStorage ? stats.qnapStorage.totalValue : 'Total';
        const displayTotalValue = (totalValue === 'Drive not connected' || totalValue === 'Total') 
            ? t('dash_drive_not_connected') 
            : totalValue;

        return `
            <div class="dash-stat-card">
                <div class="dash-stat-top">
                    <div>
                        <div class="dash-stat-label">${t('dash_qnap_storage')}</div>
                        <div class="dash-stat-value" style="font-size:24px;">
                            ${usedValue}
                        </div>
                    </div>
                    <div class="dash-stat-icon-box purple">
                        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
                    </div>
                </div>
                <div class="dash-storage-progress">
                    <div class="dash-storage-track">
                        <div class="dash-storage-fill" style="width:${usedPercent}%"></div>
                    </div>
                    <div class="dash-storage-labels">
                        <span>${usedPercent}% ${isAr ? 'مستخدم' : 'used'}</span>
                        <span dir="ltr">${usedValue} / ${displayTotalValue}</span>
                    </div>
                </div>
            </div>
        `;
    }

    // --- Multi-Line Download Velocity Chart SVG ---
    function renderMultiVelocityChartSVG(series1Data, series2Data, label1 = 'Courses', label2 = 'Programs', color1 = '#E11D48', color2 = '#1565C0') {
        const data1 = Array.isArray(series1Data) ? series1Data : [];
        const data2 = Array.isArray(series2Data) ? series2Data : [];

        if (!data1.length && !data2.length) {
            return `
                <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:240px; color:#94A3B8; gap:10px;">
                    <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <span style="font-weight:700;">${t('dash_no_data')}</span>
                </div>
            `;
        }

        let months = [];
        if (data1.length) months = data1.map(d => d.month);
        else if (data2.length) months = data2.map(d => d.month);

        const counts1 = months.map((m, idx) => (data1[idx] && typeof data1[idx].count === 'number') ? data1[idx].count : 0);
        const counts2 = months.map((m, idx) => (data2[idx] && typeof data2[idx].count === 'number') ? data2[idx].count : 0);

        const allCounts = [...counts1, ...counts2];
        const rawMin = Math.min(...allCounts, 0);
        const rawMax = Math.max(...allCounts, 1);

        const W = 720, H = 290;
        const padL = 45, padR = 25, padT = 20, padB = 45;
        const chartW = W - padL - padR;
        const chartH = H - padT - padB;

        const maxVal = Math.max(Math.ceil(rawMax * 1.25), 5);
        const minVal = 0;
        const range = maxVal - minVal || 1;
        const xStep = months.length > 1 ? chartW / (months.length - 1) : chartW;

        const points1 = months.map((m, i) => {
            const x = padL + (months.length > 1 ? i * xStep : chartW / 2);
            const count = counts1[i];
            const y = padT + chartH - ((count - minVal) / range) * chartH;
            return { x, y, month: m, count };
        });

        const points2 = months.map((m, i) => {
            const x = padL + (months.length > 1 ? i * xStep : chartW / 2);
            const count = counts2[i];
            const y = padT + chartH - ((count - minVal) / range) * chartH;
            return { x, y, month: m, count };
        });

        function buildBezierPath(pts) {
            if (!pts || !pts.length) return '';
            let pathD = 'M ' + pts[0].x + ' ' + pts[0].y;
            for (let i = 1; i < pts.length; i++) {
                const cpX1 = pts[i-1].x + xStep * 0.45;
                const cpY1 = pts[i-1].y;
                const cpX2 = pts[i].x - xStep * 0.45;
                const cpY2 = pts[i].y;
                pathD += ' C ' + cpX1 + ' ' + cpY1 + ', ' + cpX2 + ' ' + cpY2 + ', ' + pts[i].x + ' ' + pts[i].y;
            }
            return pathD;
        }

        const pathD1 = buildBezierPath(points1);
        const pathD2 = buildBezierPath(points2);

        const areaD1 = pathD1 ? (pathD1 + ' L ' + points1[points1.length-1].x + ' ' + (padT + chartH) + ' L ' + points1[0].x + ' ' + (padT + chartH) + ' Z') : '';
        const areaD2 = pathD2 ? (pathD2 + ' L ' + points2[points2.length-1].x + ' ' + (padT + chartH) + ' L ' + points2[0].x + ' ' + (padT + chartH) + ' Z') : '';

        // Horizontal Gridlines
        let yTicks = '';
        const gridSteps = 4;
        for (let i = 0; i <= gridSteps; i++) {
            const val = Math.round((maxVal / gridSteps) * i);
            const y = padT + chartH - (i / gridSteps) * chartH;
            yTicks += `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="#F1F5F9" stroke-width="1.5"/>`;
            yTicks += `<text x="${padL - 8}" y="${y + 4}" fill="#94A3B8" font-size="11" font-weight="700" text-anchor="end" font-family="'Cairo', sans-serif">${val}</text>`;
        }

        // X Labels: Sample strictly 5 evenly spaced labels so dates NEVER overlap
        let xLabels = '';
        const totalPoints = months.length;
        if (totalPoints <= 6) {
            months.forEach((m, i) => {
                const x = padL + (totalPoints > 1 ? i * xStep : chartW / 2);
                xLabels += `<text x="${x}" y="${padT + chartH + 26}" fill="#64748B" font-size="11.5" font-weight="700" text-anchor="middle" font-family="'Cairo', sans-serif">${m}</text>`;
            });
        } else {
            const targetCount = 5;
            const stepIdx = (totalPoints - 1) / (targetCount - 1);
            const chosen = [];
            for (let k = 0; k < targetCount; k++) {
                chosen.push(Math.round(k * stepIdx));
            }

            chosen.forEach((idx, k) => {
                const m = months[idx];
                if (!m) return;
                const x = padL + (totalPoints > 1 ? idx * xStep : chartW / 2);
                const anchor = k === 0 ? 'start' : (k === chosen.length - 1 ? 'end' : 'middle');
                xLabels += `<text x="${x}" y="${padT + chartH + 26}" fill="#64748B" font-size="11.5" font-weight="700" text-anchor="${anchor}" font-family="'Cairo', sans-serif">${m}</text>`;
            });
        }

        // Highlight Dots: ONLY render dots on points with actual activity (count > 0)
        // Completely removes the bead line / dashed dots sitting on the zero baseline
        let dots1 = '';
        points1.forEach(p => {
            if (p.count === 0) return;
            dots1 += `<circle cx="${p.x}" cy="${p.y}" r="5.5" fill="${color1}" stroke="#FFFFFF" stroke-width="2.5" style="cursor:pointer; transition: transform 0.2s; filter:drop-shadow(0 2px 5px rgba(225,29,72,0.4));"><title>${label1} (${p.month}): ${p.count}</title></circle>`;
        });

        let dots2 = '';
        points2.forEach(p => {
            if (p.count === 0) return;
            dots2 += `<circle cx="${p.x}" cy="${p.y}" r="5.5" fill="${color2}" stroke="#FFFFFF" stroke-width="2.5" style="cursor:pointer; transition: transform 0.2s; filter:drop-shadow(0 2px 5px rgba(21,101,192,0.4));"><title>${label2} (${p.month}): ${p.count}</title></circle>`;
        });

        const grad1 = 'grad_v1_' + Math.random().toString(36).substring(2, 7);
        const grad2 = 'grad_v2_' + Math.random().toString(36).substring(2, 7);

        return `
            <svg viewBox="0 0 ${W} ${H}" style="width:100%; height:auto;">
                <defs>
                    <linearGradient id="${grad1}" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="${color1}" stop-opacity="0.22"/>
                        <stop offset="100%" stop-color="${color1}" stop-opacity="0"/>
                    </linearGradient>
                    <linearGradient id="${grad2}" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="${color2}" stop-opacity="0.20"/>
                        <stop offset="100%" stop-color="${color2}" stop-opacity="0"/>
                    </linearGradient>
                </defs>
                ${yTicks}
                <path d="${areaD1}" fill="url(#${grad1})"/>
                <path d="${pathD1}" fill="none" stroke="${color1}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="${areaD2}" fill="url(#${grad2})"/>
                <path d="${pathD2}" fill="none" stroke="${color2}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
                ${dots1}
                ${dots2}
                ${xLabels}
            </svg>
        `;
    }

    // --- Donut & Department Progress Breakdown ---
    function namedDeptColor(code) {
        const named = { IT: '#1565C0', EL: '#E11D48', ME: '#059669', CS: '#7C3AED', DESIGN: '#D97706' };
        return named[String(code).toUpperCase()] || null;
    }

    function deptColor(code, index, count) {
        const named = namedDeptColor(code);
        if (named) return named;
        const hue = Math.round((index * 360) / Math.max(count, 1));
        return `hsl(${hue}, 70%, 45%)`;
    }

    function mixToSlices(mix) {
        const entries = Object.entries(mix || {})
            .map(([k, v]) => [String(k).toUpperCase(), Number(v) || 0])
            .filter(([, v]) => v > 0)
            .sort((a, b) => b[1] - a[1]);

        return entries.map(([key, value], i) => ({
            key,
            value,
            color: deptColor(key, i, entries.length)
        }));
    }

    function renderBreakdownSection(mixData, suffixLabel = '') {
        const slices = mixToSlices(mixData);
        const total = slices.reduce((sum, d) => sum + d.value, 0);

        if (total === 0) {
            return `
                <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; padding:50px 20px; color:#94A3B8; gap:8px;">
                    <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <span style="font-weight:700;">${t('dash_no_data')}</span>
                </div>
            `;
        }

        // SVG Donut
        const cx = 85, cy = 85, R = 72, r = 48;
        let startAngle = -90;
        let paths = '';

        if (slices.length === 1) {
            // Full circle with inner cutout
            paths = `<path d="M ${cx} ${cy - R} A ${R} ${R} 0 1 1 ${cx - 0.01} ${cy - R} L ${cx - 0.01} ${cy - r} A ${r} ${r} 0 1 0 ${cx} ${cy - r} Z" fill="${slices[0].color}"/>`;
        } else {
            slices.forEach(d => {
                const pct = d.value / total;
                const angle = pct * 360;
                const endAngle = startAngle + angle;

                const startRad = (startAngle * Math.PI) / 180;
                const endRad = (endAngle * Math.PI) / 180;

                const x1 = cx + R * Math.cos(startRad);
                const y1 = cy + R * Math.sin(startRad);
                const x2 = cx + R * Math.cos(endRad);
                const y2 = cy + R * Math.sin(endRad);
                const x3 = cx + r * Math.cos(endRad);
                const y3 = cy + r * Math.sin(endRad);
                const x4 = cx + r * Math.cos(startRad);
                const y4 = cy + r * Math.sin(startRad);

                const largeArc = angle > 180 ? 1 : 0;
                paths += `<path d="M ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${r} ${r} 0 ${largeArc} 0 ${x4} ${y4} Z" fill="${d.color}"/>`;
                startAngle = endAngle;
            });
        }

        // Department Breakdown Progress Bars
        let itemsHtml = '';
        slices.forEach(d => {
            const pct = Math.round((d.value / total) * 100);
            itemsHtml += `
                <a class="dash-dept-item" href="repository.html?dept=${encodeURIComponent(d.key)}">
                    <div class="dash-dept-header">
                        <div class="dash-dept-code">
                            <span class="dash-dept-dot" style="background:${d.color};"></span>
                            <span>قسم ${escapeHtml(d.key)}</span>
                        </div>
                        <div class="dash-dept-stat">
                            <span>${d.value} ${suffixLabel}</span>
                            <span style="color:#64748B; font-weight:800; margin-inline-start:4px;">(${pct}%)</span>
                        </div>
                    </div>
                    <div class="dash-dept-progress-track">
                        <div class="dash-dept-progress-fill" style="width:${pct}%; background:${d.color};"></div>
                    </div>
                </a>
            `;
        });

        return `
            <div class="dash-donut-container">
                <div class="dash-donut-visual-wrap">
                    <svg viewBox="0 0 170 170">${paths}</svg>
                    <div class="dash-donut-center-info">
                        <span class="dash-donut-center-val">${total}</span>
                        <span class="dash-donut-center-lbl">${suffixLabel}</span>
                    </div>
                </div>
                <div class="dash-dept-list">
                    ${itemsHtml}
                </div>
            </div>
        `;
    }

    // --- High-Impact Documents Table Rows ---
    function renderDocRows(documents) {
        if (!documents || !documents.length) {
            return `<tr><td colspan="4" style="text-align:center; padding:30px; color:#94A3B8; font-weight:700;">${t('dash_no_data')}</td></tr>`;
        }
        return documents.map(doc => {
            const rawType = (doc.type || 'pdf').toLowerCase().replace(/[^a-z0-9]/g, '');
            let badgeClass = 'default';
            if (rawType.includes('pdf')) badgeClass = 'pdf';
            else if (rawType.includes('xls')) badgeClass = 'xlsx';
            else if (rawType.includes('doc')) badgeClass = 'docx';
            else if (rawType.includes('zip') || rawType.includes('rar')) badgeClass = 'zip';
            else if (rawType.includes('mp4') || rawType.includes('video')) badgeClass = 'video';

            const displayBadge = rawType.length > 4 ? rawType.substring(0, 3) : rawType;

            return `
                <tr>
                    <td>
                        <div class="dash-file-cell">
                            <span class="dash-file-badge ${badgeClass}">${displayBadge}</span>
                            <span class="dash-file-name-txt">${escapeHtml(doc.name)}</span>
                        </div>
                    </td>
                    <td>
                        <span class="dash-source-chip">
                            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                            ${escapeHtml(doc.source || 'General')}
                        </span>
                    </td>
                    <td style="text-align: center;">
                        <span class="dash-count-chip">
                            +${formatNumber(doc.downloads || 0)}
                        </span>
                    </td>
                    <td style="text-align: end;">
                        <span class="dash-size-chip">${escapeHtml(doc.weight || '-')}</span>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // --- Event Listeners Wiring ---
    function attachDashboardListeners({ courseDownloads, programVelocity, resourceMix, programDownloads }) {
        // Date range select
        const daysFilter = document.getElementById('dashDaysFilter');
        if (daysFilter) {
            daysFilter.addEventListener('change', async (e) => {
                currentDays = Number(e.target.value);
                await loadDashboard();
            });
            enhanceSelect(daysFilter);
        }

        // Refresh button
        const refreshBtn = document.getElementById('dashRefreshBtn');
        const refreshIcon = document.getElementById('dashRefreshIcon');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', async () => {
                if (refreshIcon) refreshIcon.style.animation = 'bannerShift 1s infinite linear';
                await loadDashboard();
            });
        }

        // Year selector for Velocity Chart
        const yearSelect = document.getElementById('chartYearSelect');
        if (yearSelect) {
            yearSelect.addEventListener('change', async (e) => {
                currentYear = parseInt(e.target.value, 10);
                const chartBox = document.getElementById('velocityChartContainer');
                if (chartBox) {
                    chartBox.innerHTML = '<div class="dash-skeleton" style="height:250px;"></div>';
                    try {
                        const cDl = await dashboardService.getCourseDownloads(currentYear);
                        const pDl = await dashboardService.getProgramDownloadsVelocity(currentYear);
                        chartBox.innerHTML = renderMultiVelocityChartSVG(cDl, pDl, isAr ? 'الكورسات' : 'Courses', isAr ? 'البرامج والمكتبة' : 'Programs', '#E11D48', '#1565C0');
                    } catch (err) {
                        chartBox.innerHTML = '<div style="color:#E11D48; text-align:center; padding:30px;">Failed to reload chart</div>';
                    }
                }
            });
            enhanceSelect(yearSelect);
        }

        // Tab switcher for Academic Breakdown
        const tabMix = document.getElementById('tabResourceMix');
        const tabDl = document.getElementById('tabProgramDl');
        const breakdownContainer = document.getElementById('breakdownContainer');

        if (tabMix && tabDl && breakdownContainer) {
            tabMix.addEventListener('click', () => {
                activeBreakdownTab = 'mix';
                tabMix.classList.add('active');
                tabDl.classList.remove('active');
                breakdownContainer.innerHTML = renderBreakdownSection(resourceMix, t('dash_files'));
            });

            tabDl.addEventListener('click', () => {
                activeBreakdownTab = 'downloads';
                tabDl.classList.add('active');
                tabMix.classList.remove('active');
                breakdownContainer.innerHTML = renderBreakdownSection(programDownloads, t('dash_downloads'));
            });
        }
    }

    function formatNumber(num) {
        if (num == null) return '0';
        return new Intl.NumberFormat().format(num);
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
}

if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        const isCurrentPage = window.location.pathname.includes('dashboard') || (!window.location.pathname.includes('.html') && !window.__spa_navigating);
        if (isCurrentPage) {
            initDashboard();
        }
    });
}
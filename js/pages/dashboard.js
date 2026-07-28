// js/pages/dashboard.js
import { renderLayout } from '../shared/layout.js';
import { protectPage, getCurrentUser } from '../shared/auth.js';
import { dashboardService } from '../shared/services.js';
import { translations, getCurrentLang } from '../shared/jssharedi18n.js';


// Mirrors RoleHelper.cs. A hard-coded list like
//     ['Supervisor', 'IT Manager', 'EL Manager', 'Mechanical Manager']
// locks out the manager of every department created after launch: a
// DESIGN Manager is not in the list, so the page bounces them to login.
// Matching the SHAPE of the role instead means any department works.
function canManageContent(role) {
    const r = String(role || '').trim();
    if (r === 'Supervisor') return true;
    return /\s+Manager$/i.test(r);
}

document.addEventListener('DOMContentLoaded', async () => {
    // Protect: only authenticated non-public users
    if (!protectPage()) return;
    if (!canManageContent(getCurrentUser()?.role)) {
        window.location.href = 'repository.html';
        return;
    }

    // Render the admin sidebar layout
    renderLayout('dashboard');

    const content = document.getElementById('page-content');
    if (!content) return;

    // --- State ---
    let currentYear = new Date().getFullYear();
    let currentDays = 30;
    let chartMenuOpen = false;
    let yearPickerOpen = false;
    let pollingInterval = null;

    const lang = getCurrentLang();
    const isAr = lang === 'ar';
    const t = (key) => (translations[lang] || translations.en)[key] || translations.en[key] || key;

    // --- Load (or reload) the whole dashboard for the current window --------
    // One fetch, keyed by currentDays, feeds every section. The date dropdown
    // calls this again, so changing the window updates the chart, donuts,
    // events and captions together -- not just the stat cards.
    async function loadDashboard() {
        if (pollingInterval) { clearInterval(pollingInterval); pollingInterval = null; }
        renderDashboardSkeleton(content);
        try {
            const m = await dashboardService.getMetrics(currentDays);

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

            pollingInterval = setInterval(async () => {
                try {
                    const fresh = await dashboardService.getMetrics(currentDays);
                    renderEventsOnly((fresh.recentEvents || []).slice(0, 10));
                } catch (e) { /* silently fail on poll */ }
            }, 30000);
        } catch (err) {
            console.error('Dashboard load failed:', err);
            content.innerHTML = '<div style="padding: 40px; color: #E63946; text-align: center;">Failed to load dashboard data. Please try again.</div>';
        } finally {
            const loader = document.getElementById('global-page-loader');
            if (loader) {
                loader.classList.add('hide-loader');
                setTimeout(() => loader.remove(), 400);
            }
        }
    }

    await loadDashboard();

    // --- Skeleton loader ---
    function renderDashboardSkeleton(container) {
        container.innerHTML = `
            <div style="padding: 0;">
                <div class="dash-header">
                    <div><div class="dash-skeleton" style="width:300px;height:30px;margin-bottom:8px;"></div><div class="dash-skeleton" style="width:380px;height:16px;"></div></div>
                    <div style="display:flex;gap:10px;"><div class="dash-skeleton" style="width:120px;height:36px;border-radius:8px;"></div><div class="dash-skeleton" style="width:130px;height:36px;border-radius:8px;"></div></div>
                </div>
                <div class="dash-stats-grid">
                    <div class="dash-skeleton dash-skeleton-stat"></div>
                    <div class="dash-skeleton dash-skeleton-stat"></div>
                    <div class="dash-skeleton dash-skeleton-stat"></div>
                    <div class="dash-skeleton dash-skeleton-stat"></div>
                </div>
                <div class="dash-charts-row">
                    <div class="dash-skeleton dash-skeleton-chart"></div>
                    <div class="dash-skeleton dash-skeleton-chart"></div>
                </div>
                <div class="dash-bottom-row">
                    <div class="dash-skeleton dash-skeleton-table"></div>
                    <div class="dash-skeleton dash-skeleton-table"></div>
                </div>
            </div>
        `;
    }

    // --- Main render ---
    function renderDashboard(container, { stats, downloads, courseDownloads, programVelocity, resourceMix, programDownloads, documents, events }) {
        const user = getCurrentUser();
        const rawUserDisplayName = user ? (user.name || user.username) : 'User';
        const userDisplayName = String(rawUserDisplayName || '').includes('@') ? String(rawUserDisplayName).split('@')[0] : rawUserDisplayName;
        
        const hour = new Date().getHours();
        let greeting = t('dash_evening');
        if (hour >= 5 && hour < 12) {
            greeting = t('dash_morning');
        } else if (hour >= 12 && hour < 17) {
            greeting = t('dash_afternoon');
        }

        container.innerHTML = `
            <!-- Page Header -->
            <div class="dash-header">
                <div class="dash-header-left">
                    <h1>${greeting}, ${userDisplayName} 👋</h1>
                    <p>${t('dash_overview')}</p>
                </div>
                <div class="dash-header-right">
                    <select class="dash-filter-select" id="dashDaysFilter">
                        <option value="7"${currentDays === 7 ? ' selected' : ''}>${t('dash_last7')}</option>
                        <option value="30"${currentDays === 30 ? ' selected' : ''}>${t('dash_last30')}</option>
                        <option value="180"${currentDays === 180 ? ' selected' : ''}>${t('dash_last6m')}</option>
                        <option value="365"${currentDays === 365 ? ' selected' : ''}>${t('dash_lasty')}</option>
                    </select>
                </div>
            </div>

            <!-- Stat Cards -->
            <div class="dash-stats-grid">
                ${renderStatCard(t('dash_total_files'), formatNumber(stats.totalFiles || 0), stats.trends?.totalFiles, 'files', 'blue')}
                ${renderStorageCard(stats)}
                ${renderStatCard(t('dash_total_courses'), stats.totalCourses || 0, stats.trends?.totalCourses, 'courses', 'red')}
                ${renderStatCard(t('dash_total_programs'), stats.totalPrograms || 0, stats.trends?.totalPrograms, 'programs', 'green')}
            </div>

            <!-- Charts Row -->
            <div class="dash-charts-row">
                <!-- Download Velocity (Combined Multi-Line Chart) -->
                <div class="dash-chart-card">
                    <div class="dash-chart-header" style="flex-wrap:wrap; gap:12px;">
                        <div>
                            <h3 class="dash-chart-title">${t('dash_download_velocity')}</h3>
                            <div style="display:flex; align-items:center; gap:16px; margin-top:6px; font-size:12px; font-weight:600;">
                                <span style="display:flex; align-items:center; gap:6px; color:#e63946;">
                                    <span style="width:10px; height:10px; border-radius:50%; background:#e63946; display:inline-block;"></span>
                                    ${t('dash_course_downloads_velocity')}
                                </span>
                                <span style="display:flex; align-items:center; gap:6px; color:#1A3CAA;">
                                    <span style="width:10px; height:10px; border-radius:50%; background:#1A3CAA; display:inline-block;"></span>
                                    ${t('dash_program_downloads_velocity')}
                                </span>
                            </div>
                        </div>
                        <div style="display:flex;align-items:center;gap:8px; margin-left:auto;">
                            <select id="chartYearSelect" class="dash-year-select" style="font-size:13px; font-weight:700; color:#1a3caa; background:#f4f6fb; border:1px solid #e8ecf4; border-radius:8px; padding:4px 10px; cursor:pointer; outline:none; transition:all 0.2s;">
                                <option value="2026" ${currentYear === 2026 ? 'selected' : ''}>2026</option>
                                <option value="2025" ${currentYear === 2025 ? 'selected' : ''}>2025</option>
                                <option value="2024" ${currentYear === 2024 ? 'selected' : ''}>2024</option>
                                <option value="2023" ${currentYear === 2023 ? 'selected' : ''}>2023</option>
                                <option value="2022" ${currentYear === 2022 ? 'selected' : ''}>2022</option>
                                <option value="2021" ${currentYear === 2021 ? 'selected' : ''}>2021</option>
                            </select>
                            <div style="position:relative;">
                                <button class="dash-chart-menu-btn" id="chartMenuBtn" title="${isAr ? 'خيارات السنة' : 'Year Options'}">
                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
                                </button>
                                <div class="dash-chart-dropdown" id="chartDropdown">
                                    <button data-action="prev">${isAr ? '← السنة السابقة' : '← Previous Year'}</button>
                                    <button data-action="next">${isAr ? 'السنة التالية →' : 'Next Year →'}</button>
                                    <button data-action="pick">${isAr ? 'اختر سنة محددة...' : 'Select Year...'}</button>
                                </div>
                                <div class="dash-year-picker" id="yearPicker"></div>
                            </div>
                        </div>
                    </div>
                    <div class="dash-velocity-chart" id="velocityChartContainer">
                        ${renderMultiVelocityChartSVG(courseDownloads, programVelocity, isAr ? 'الكورسات' : 'Courses', isAr ? 'البرامج والمكتبة' : 'Programs', '#e63946', '#1A3CAA')}
                    </div>
                </div>

                <!-- Program Downloads -->
                <div class="dash-donut-card">
                    <h3 class="dash-chart-title">${t('dash_program_downloads')}</h3>
                    <div class="dash-donut-wrapper" id="donutChartContainer1">
                        ${renderDonutSVG(programDownloads)}
                    </div>
                    <div class="dash-donut-legend" id="donutLegend1">
                        ${renderDonutLegend(programDownloads, t('dash_downloads'))}
                    </div>
                </div>

                <!-- Resource Mix -->
                <div class="dash-donut-card">
                    <h3 class="dash-chart-title">${t('dash_resource_mix')}</h3>
                    <div class="dash-donut-wrapper" id="donutChartContainer2">
                        ${renderDonutSVG(resourceMix)}
                    </div>
                    <div class="dash-donut-legend" id="donutLegend2">
                        ${renderDonutLegend(resourceMix, t('dash_files'))}
                    </div>
                </div>
            </div>

            <!-- Bottom Row -->
            <div class="dash-bottom-row" style="grid-template-columns: 1fr;">
                <!-- High-Impact Documents -->
                <div class="dash-docs-card">
                    <div class="dash-docs-header">
                        <h3>${t('dash_high_impact')}</h3>
                        <a class="dash-docs-viewall" href="repository.html">${t('dash_view_all')}</a>
                    </div>
                    <div class="dash-docs-table-wrapper">
                        <table class="dash-docs-table">
                            <thead>
                                <tr>
                                    <th>${t('dash_filename')}</th>
                                    <th>${t('dash_source')}</th>
                                    <th class="align-center">${t('dash_access_count')}</th>
                                    <th class="align-right">${t('dash_weight')}</th>
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

        // Attach event listeners
        attachListeners();
    }

    // --- Stat Card HTML ---
    function renderStatCard(label, value, change, type, iconColor) {
        const icons = {
            files: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>',
            pending: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>',
            net: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
            courses: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>',
            programs: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>'
        };

        const isPositive = typeof change === 'string' && change.includes('+');
        const isMuted = typeof change === 'string' && (change.includes('Requires') || change.includes('capacity'));
        const changeClass = isMuted ? 'muted' : (isPositive ? 'positive' : 'muted');

        function formatTrend(str) {
            if (!str || typeof str !== 'string') return str || '';
            if (lang !== 'ar') return str;
            return str
                .replace(/^in\s+(\d+)\s+days/gi, 'خلال $1 يوم')
                .replace(/^Active in\s+(\d+)\s+departments/gi, 'نشط في $1 أقسام')
                .replace(/Drive not connected/gi, 'القرص غير متصل')
                .replace(/Live files count/gi, 'عدد الملفات المباشر')
                .replace(/Live courses count/gi, 'عدد الكورسات المباشر')
                .replace(/Live programs count/gi, 'عدد البرامج المباشر');
        }

        const formattedChange = formatTrend(change);

        return `
            <div class="dash-stat-card">
                <div class="dash-stat-top">
                    <span class="dash-stat-label">${label}</span>
                    <div class="dash-stat-icon ${iconColor}">${icons[type] || ''}</div>
                </div>
                <div class="dash-stat-value">${value}</div>
                <div class="dash-stat-change ${changeClass}">${isPositive ? '↑ ' : ''}${formattedChange}</div>
            </div>
        `;
    }

    function renderStorageCard(stats) {
        const usedPercent = stats.qnapStorage ? stats.qnapStorage.usedPercentage : (stats.storageCapacityUsed || 0);
        const usedValue = stats.qnapStorage ? stats.qnapStorage.usedValue : (stats.storageCapacityValue || '0 TB');
        const totalValue = stats.qnapStorage ? stats.qnapStorage.totalValue : 'Total';

        const displayTotalValue = (totalValue === 'Drive not connected' || totalValue === 'Total') ? t('dash_drive_not_connected') : totalValue;

        return `
            <div class="dash-stat-card">
                <div class="dash-stat-top">
                    <span class="dash-stat-label">${t('dash_qnap_storage')}</span>
                    <div class="dash-stat-icon blue">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
                    </div>
                </div>
                <div class="dash-stat-value" style="font-size: 18px;">
                    <span style="display:inline-flex; align-items:baseline; gap:4px; flex-wrap:wrap;">
                        <span dir="ltr" style="unicode-bidi: embed;">${usedValue}</span>
                        <span style="font-size:13px; color:#6B7A99; font-weight:500;">/ ${displayTotalValue}</span>
                    </span>
                    <span class="percent" dir="ltr" style="unicode-bidi: embed;">${usedPercent}%</span>
                </div>
                <div class="dash-progress-track">
                    <div class="dash-progress-fill" style="width:${usedPercent}%"></div>
                </div>
            </div>
        `;
    }

    // --- Multi-Line Velocity Chart SVG ---
    function renderMultiVelocityChartSVG(series1Data, series2Data, label1 = 'Courses', label2 = 'Programs', color1 = '#e63946', color2 = '#1A3CAA') {
        let data1 = Array.isArray(series1Data) ? series1Data : [];
        let data2 = Array.isArray(series2Data) ? series2Data : [];

        if (!data1.length && !data2.length) {
            return '<div style="color:#6B7A99;text-align:center;padding:40px;">No data available</div>';
        }

        let months = [];
        if (data1.length) months = data1.map(d => d.month);
        else if (data2.length) months = data2.map(d => d.month);

        const counts1 = months.map((m, idx) => (data1[idx] && typeof data1[idx].count === 'number') ? data1[idx].count : 0);
        const counts2 = months.map((m, idx) => (data2[idx] && typeof data2[idx].count === 'number') ? data2[idx].count : 0);

        const allCounts = [...counts1, ...counts2];
        const rawMin = Math.min(...allCounts, 0);
        const rawMax = Math.max(...allCounts, 1);

        const W = 700, H = 300;
        const padL = 55, padR = 20, padT = 20, padB = 75;
        const chartW = W - padL - padR;
        const chartH = H - padT - padB;

        function niceNum(val, round) {
            if (val <= 0) return 1;
            const exp = Math.floor(Math.log10(val));
            const frac = val / Math.pow(10, exp);
            let nice;
            if (round) {
                if (frac < 1.5) nice = 1;
                else if (frac < 3) nice = 2;
                else if (frac < 7) nice = 5;
                else nice = 10;
            } else {
                if (frac <= 1) nice = 1;
                else if (frac <= 2) nice = 2;
                else if (frac <= 5) nice = 5;
                else nice = 10;
            }
            return nice * Math.pow(10, exp);
        }

        let minVal, maxVal, tickStep, yTickCount;
        if (rawMax === rawMin) {
            const v = rawMax || 1;
            minVal = 0;
            maxVal = v <= 5 ? (v + 2) : Math.ceil(v * 1.3);
            tickStep = maxVal <= 10 ? 1 : niceNum(maxVal / 5, true);
            yTickCount = Math.ceil(maxVal / tickStep);
            maxVal = yTickCount * tickStep;
        } else {
            const rawRange = rawMax - rawMin;
            tickStep = niceNum(rawRange / 5, true);
            minVal = Math.floor(rawMin / tickStep) * tickStep;
            maxVal = Math.ceil(rawMax / tickStep) * tickStep;
            if (minVal < 0) minVal = 0;
            yTickCount = Math.round((maxVal - minVal) / tickStep);
        }
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
                const cpX1 = pts[i-1].x + xStep * 0.4;
                const cpY1 = pts[i-1].y;
                const cpX2 = pts[i].x - xStep * 0.4;
                const cpY2 = pts[i].y;
                pathD += ' C ' + cpX1 + ' ' + cpY1 + ', ' + cpX2 + ' ' + cpY2 + ', ' + pts[i].x + ' ' + pts[i].y;
            }
            return pathD;
        }

        const pathD1 = buildBezierPath(points1);
        const pathD2 = buildBezierPath(points2);

        const areaD1 = pathD1 ? (pathD1 + ' L ' + points1[points1.length-1].x + ' ' + (padT + chartH) + ' L ' + points1[0].x + ' ' + (padT + chartH) + ' Z') : '';
        const areaD2 = pathD2 ? (pathD2 + ' L ' + points2[points2.length-1].x + ' ' + (padT + chartH) + ' L ' + points2[0].x + ' ' + (padT + chartH) + ' Z') : '';

        let yTicks = '';
        for (let i = 0; i <= yTickCount; i++) {
            const val = minVal + tickStep * i;
            const y = padT + chartH - ((val - minVal) / range) * chartH;
            yTicks += '<line x1="' + padL + '" y1="' + y + '" x2="' + (W - padR) + '" y2="' + y + '" stroke="#E8ECF4" stroke-width="1"/>';
            yTicks += '<text x="' + (padL - 8) + '" y="' + (y + 4) + '" fill="#6B7A99" font-size="11" font-weight="500" text-anchor="end" font-family="system-ui">' + formatNumber(Math.round(val)) + '</text>';
        }

        let xLabels = '';
        const shouldRotate = months.length > 8;
        const xLabelY = padT + chartH + (shouldRotate ? 26 : 22);
        const targetLabels = Math.min(months.length, 12);
        const labelSkip = Math.max(1, Math.ceil(months.length / targetLabels));

        months.forEach((m, i) => {
            const x = padL + (months.length > 1 ? i * xStep : chartW / 2);
            if (months.length > 12 && i !== 0 && i !== months.length - 1 && i % labelSkip !== 0) return;
            if (shouldRotate) {
                xLabels += '<text x="' + (x - 2) + '" y="' + xLabelY + '" fill="#6B7A99" font-size="10" font-weight="500" text-anchor="end" font-family="system-ui" transform="rotate(-30,' + (x - 2) + ',' + xLabelY + ')">' + m + '</text>';
            } else {
                xLabels += '<text x="' + x + '" y="' + xLabelY + '" fill="#6B7A99" font-size="11" font-weight="500" text-anchor="middle" font-family="system-ui">' + m + '</text>';
            }
        });

        let dots1 = '';
        const showAllDots = months.length <= 20;
        points1.forEach((p) => {
            const r = showAllDots ? '4' : '3';
            dots1 += '<circle cx="' + p.x + '" cy="' + p.y + '" r="' + r + '" fill="' + color1 + '" stroke="#fff" stroke-width="2" style="cursor:pointer"><title>' + label1 + ' (' + p.month + '): ' + formatNumber(p.count) + ' downloads</title></circle>';
        });

        let dots2 = '';
        points2.forEach((p) => {
            const r = showAllDots ? '4' : '3';
            dots2 += '<circle cx="' + p.x + '" cy="' + p.y + '" r="' + r + '" fill="' + color2 + '" stroke="#fff" stroke-width="2" style="cursor:pointer"><title>' + label2 + ' (' + p.month + '): ' + formatNumber(p.count) + ' downloads</title></circle>';
        });

        const gradId1 = 'areaGrad_c1_' + Math.random().toString(36).substring(2, 8);
        const gradId2 = 'areaGrad_c2_' + Math.random().toString(36).substring(2, 8);

        return '<svg viewBox="0 0 ' + W + ' ' + H + '">' +
            '<defs>' +
            '<linearGradient id="' + gradId1 + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="' + color1 + '" stop-opacity="0.18"/><stop offset="100%" stop-color="' + color1 + '" stop-opacity="0"/></linearGradient>' +
            '<linearGradient id="' + gradId2 + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="' + color2 + '" stop-opacity="0.15"/><stop offset="100%" stop-color="' + color2 + '" stop-opacity="0"/></linearGradient>' +
            '<clipPath id="chartClip"><rect x="0" y="0" width="' + W + '" height="' + H + '" class="chart-clip-rect"/></clipPath>' +
            '</defs>' +
            yTicks +
            '<g clip-path="url(#chartClip)">' +
            '<path d="' + areaD1 + '" fill="url(#' + gradId1 + ')"/>' +
            '<path d="' + pathD1 + '" fill="none" stroke="' + color1 + '" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>' +
            '<path d="' + areaD2 + '" fill="url(#' + gradId2 + ')"/>' +
            '<path d="' + pathD2 + '" fill="none" stroke="' + color2 + '" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>' +
            '</g>' +
            dots1 +
            dots2 +
            xLabels +
            '</svg>';
    }

    // --- Donut charts -----------------------------------------------------
    // These used to read mix.it / mix.el / mix.me and nothing else, so the
    // charts could only ever describe three departments. Everything else was
    // invisible: a DESIGN slice simply did not exist, and the percentages of
    // the three that were drawn were wrong because the total ignored the rest.
    //
    // services.js keys resourceMix/programDownloads by department CODE, for
    // however many departments there are. Both renderers now take whatever
    // keys they are handed.

    // Named colours for the three original departments; the rest are generated
    // by spacing hues evenly around the wheel, so any number of slices stays
    // legible without anyone maintaining a colour list.
    // A function, not a const: function declarations hoist, so this is usable
    // from renderDashboard above. As a const it sat in the temporal dead zone
    // until execution reached line 353, and renderDonutSVG -- called earlier --
    // threw "Cannot access 'NAMED_DEPT_COLORS' before initialization", which is
    // what blanked the whole dashboard.
    function namedDeptColor(code) {
        const named = { IT: '#1B2340', EL: '#E63946', ME: '#6B7A99' };
        return named[code] || null;
    }

    function deptColor(code, index, count) {
        const named = namedDeptColor(code);
        if (named) return named;
        const hue = Math.round((index * 360) / Math.max(count, 1));
        return `hsl(${hue}, 55%, 45%)`;
    }

    /** { IT: 2, DESIGN: 1 } -> [{ key, value, color }], biggest first, zeroes dropped. */
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

    function renderDonutSVG(mix) {
        const data = mixToSlices(mix);
        const total = data.reduce((sum, d) => sum + d.value, 0);
        if (total === 0) return '<div style="color:#6B7A99;text-align:center;">No data</div>';

        const cx = 85, cy = 85, R = 70, r = 45;
        let startAngle = -90; // Start at top
        let paths = '';

        data.forEach(d => {
            const pct = d.value / total;
            const angle = pct * 360;
            const endAngle = startAngle + angle;

            // Convert to radians
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

            paths += '<path d="M ' + x1 + ' ' + y1 + ' A ' + R + ' ' + R + ' 0 ' + largeArc + ' 1 ' + x2 + ' ' + y2 +
                ' L ' + x3 + ' ' + y3 + ' A ' + r + ' ' + r + ' 0 ' + largeArc + ' 0 ' + x4 + ' ' + y4 + ' Z" fill="' + d.color + '"/>';

            startAngle = endAngle;
        });

        return '<svg viewBox="0 0 170 170">' + paths + '</svg>';
    }

    function renderDonutLegend(mix, suffix = '') {
        const data = mixToSlices(mix);
        const total = data.reduce((sum, d) => sum + d.value, 0);

        if (total === 0) {
            return '<div style="color:#6B7A99;font-size:13px;">No data</div>';
        }

        return data.map(d => {
            const pct = Math.round((d.value / total) * 100);
            // The label was looked up in a fixed { IT: 'Information Tech', ... }
            // map, so a new department had no name to show. The code is what the
            // API returns and what ?dept= expects, so use it directly.
            return '<a class="dash-legend-item" href="repository.html?dept=' + encodeURIComponent(d.key) + '">' +
                '<div class="dash-legend-dot" style="background:' + d.color + '"></div>' +
                '<span class="dash-legend-label">' + escapeHtml(d.key) + '</span>' +
                '<span class="dash-legend-value">' + d.value + (suffix ? ' ' + suffix : '') +
                ' <span style="font-size:11px;color:#6B7A99;">(' + pct + '%)</span></span>' +
                '</a>';
        }).join('');
    }

    // --- Documents table rows ---
    function renderDocRows(documents) {
        if (!documents || !documents.length) {
            return '<tr><td colspan="4" style="text-align:center;padding:20px;color:#6B7A99;">' + t('dash_no_data') + '</td></tr>';
        }
        return documents.map(doc => {
            const typeClass = (doc.type || '').toLowerCase();
            return '<tr>' +
                '<td><div class="dash-file-name"><span class="dash-file-type-badge ' + typeClass + '">' + (doc.type || '').toUpperCase() + '</span>' + escapeHtml(doc.name) + '</div></td>' +
                '<td style="color:#6B7A99;">' + escapeHtml(doc.source) + '</td>' +
                '<td class="align-center">' + formatNumber(doc.downloads) + '</td>' +
                '<td class="align-right">' + escapeHtml(doc.weight) + '</td>' +
                '</tr>';
        }).join('');
    }

    // --- Events timeline ---
    function renderEventItems(events) {
        if (!events || !events.length) {
            return '<div style="text-align:center;color:#6B7A99;padding:20px;">' + t('dash_no_data') + '</div>';
        }
        return events.map(ev => {
            const dotClass = ev.type === 'critical' ? 'critical' : (ev.type === 'info' ? 'info' : 'neutral');
            const linkClass = ev.type === 'critical' ? 'event-link' : 'event-link info-link';
            const targetHTML = ev.target ? ' <span class="' + linkClass + '">' + escapeHtml(ev.target) + '</span>' : '';

            return '<div class="dash-event-item">' +
                '<div class="dash-event-dot ' + dotClass + '"></div>' +
                '<div class="dash-event-text"><strong>' + escapeHtml(ev.user) + '</strong> ' + escapeHtml(ev.action) + targetHTML + '</div>' +
                '<div class="dash-event-time">' + escapeHtml(ev.time) + '</div>' +
                '</div>';
        }).join('');
    }

    // Only update events (for polling)
    function renderEventsOnly(events) {
        const container = document.getElementById('eventsListContainer');
        if (container) {
            container.innerHTML = renderEventItems(events);
        }
    }

    // --- Attach event listeners ---
    function attachListeners() {
        // Days filter
        const daysSelect = document.getElementById('dashDaysFilter');
        if (daysSelect) {
            daysSelect.addEventListener('change', async (e) => {
                currentDays = Number(e.target.value);
                // The window drives the chart, the donuts, the events and the
                // trend captions -- not just the stat cards. Reload everything.
                await loadDashboard();
            });
        }

        // Export button
        const exportBtn = document.getElementById('dashExportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', async () => {
                exportBtn.disabled = true;
                exportBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg> Exporting...';
                try {
                    await dashboardService.exportReport('pdf');
                    // TODO: When backend is ready, this will trigger a file download
                    alert('Export report requested. The backend will serve the file download.');
                } catch (err) {
                    alert('Export failed: ' + err.message);
                } finally {
                    exportBtn.disabled = false;
                    exportBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg> Export Report';
                }
            });
        }

        // Chart Year Select Dropdown
        const yearSelect = document.getElementById('chartYearSelect');
        if (yearSelect) {
            yearSelect.addEventListener('change', async (e) => {
                currentYear = parseInt(e.target.value, 10);
                await reloadChart();
            });
        }

        // Chart three-dot menu
        const menuBtn = document.getElementById('chartMenuBtn');
        const dropdown = document.getElementById('chartDropdown');
        const yearPicker = document.getElementById('yearPicker');

        if (menuBtn && dropdown) {
            menuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                chartMenuOpen = !chartMenuOpen;
                dropdown.classList.toggle('open', chartMenuOpen);
                // Close year picker
                yearPickerOpen = false;
                if (yearPicker) yearPicker.classList.remove('open');
            });

            dropdown.querySelectorAll('button').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const action = btn.dataset.action;
                    chartMenuOpen = false;
                    dropdown.classList.remove('open');

                    if (action === 'prev') {
                        currentYear--;
                        await reloadChart();
                    } else if (action === 'next') {
                        currentYear++;
                        await reloadChart();
                    } else if (action === 'pick') {
                        showYearPicker();
                    }
                });
            });
        }

        // Close dropdowns on outside click
        document.addEventListener('click', () => {
            if (chartMenuOpen) {
                chartMenuOpen = false;
                if (dropdown) dropdown.classList.remove('open');
            }
            if (yearPickerOpen) {
                yearPickerOpen = false;
                if (yearPicker) yearPicker.classList.remove('open');
            }
        });
    }

    function showYearPicker() {
        const yearPicker = document.getElementById('yearPicker');
        if (!yearPicker) return;

        const now = new Date().getFullYear();
        let html = '';
        for (let y = now - 4; y <= now; y++) {
            html += '<button data-year="' + y + '"' + (y === currentYear ? ' class="active"' : '') + '>' + y + '</button>';
        }
        yearPicker.innerHTML = html;
        yearPickerOpen = true;
        yearPicker.classList.add('open');

        yearPicker.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                currentYear = parseInt(btn.dataset.year, 10);
                yearPickerOpen = false;
                yearPicker.classList.remove('open');
                await reloadChart();
            });
        });
    }

    async function reloadChart() {
        const container = document.getElementById('velocityChartContainer');
        const yearSelect = document.getElementById('chartYearSelect');
        if (yearSelect) {
            let optionExists = Array.from(yearSelect.options).some(opt => Number(opt.value) === currentYear);
            if (!optionExists) {
                const newOpt = new Option(currentYear, currentYear);
                yearSelect.add(newOpt);
            }
            yearSelect.value = currentYear;
        }
        if (container) {
            container.innerHTML = '<div class="dash-skeleton" style="height:240px;border-radius:8px;"></div>';
            try {
                const courseDl = await dashboardService.getCourseDownloads(currentYear);
                const progDl = await dashboardService.getProgramDownloadsVelocity(currentYear);
                const isAr = getCurrentLang() === 'ar';
                const label1 = isAr ? 'الكورسات' : 'Courses';
                const label2 = isAr ? 'البرامج والمكتبة' : 'Programs';
                container.innerHTML = renderMultiVelocityChartSVG(courseDl, progDl, label1, label2, '#e63946', '#1A3CAA');
            } catch (err) {
                container.innerHTML = '<div style="color:#E63946;text-align:center;padding:40px;">Failed to load chart data</div>';
            }
        }
    }

    // --- Utility functions ---
    function formatNumber(num) {
        if (num == null) return '0';
        return new Intl.NumberFormat().format(num);
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
});
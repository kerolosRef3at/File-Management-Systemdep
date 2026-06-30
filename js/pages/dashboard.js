// js/pages/dashboard.js
import { renderLayout } from '../shared/layout.js';
import { protectPage, getCurrentUser } from '../shared/auth.js';
import { dashboardService } from '../shared/services.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Protect: only authenticated non-public users
    if (!protectPage(['Supervisor', 'IT Manager', 'EL Manager', 'Mechanical Manager'])) return;

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

    // --- Initial render with skeletons ---
    renderDashboardSkeleton(content);

    // --- Load all data ---
    try {
        const [stats, downloads, resourceMix, programDownloads, documents, events] = await Promise.all([
            dashboardService.getStats(currentDays),
            dashboardService.getDownloads(currentYear),
            dashboardService.getResourceMix(),
            dashboardService.getProgramDownloads(),
            dashboardService.getDocuments(5),
            dashboardService.getEvents(10)
        ]);

        renderDashboard(content, { stats, downloads, resourceMix, programDownloads, documents, events });

        // Poll events every 30s
        pollingInterval = setInterval(async () => {
            try {
                const freshEvents = await dashboardService.getEvents(10);
                renderEventsOnly(freshEvents);
            } catch (e) { /* silently fail on poll */ }
        }, 30000);
    } catch (err) {
        content.innerHTML = '<div style="padding: 40px; color: #E63946; text-align: center;">Failed to load dashboard data. Please try again.</div>';
    } finally {
        // Hide Global Loader
        const loader = document.getElementById('global-page-loader');
        if (loader) {
            loader.classList.add('hide-loader');
            setTimeout(() => loader.remove(), 400);
        }
    }

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
    function renderDashboard(container, { stats, downloads, resourceMix, programDownloads, documents, events }) {
        const user = getCurrentUser();
        const userDisplayName = user ? (user.name || user.username) : 'User';
        
        const hour = new Date().getHours();
        let greeting = 'Good evening';
        if (hour >= 5 && hour < 12) {
            greeting = 'Good morning';
        } else if (hour >= 12 && hour < 17) {
            greeting = 'Good afternoon';
        }

        container.innerHTML = `
            <!-- Page Header -->
            <div class="dash-header">
                <div class="dash-header-left">
                    <h1>${greeting}, ${userDisplayName} 👋</h1>
                    <p>Here's your workspace overview</p>
                </div>
                <div class="dash-header-right">
                    <select class="dash-filter-select" id="dashDaysFilter">
                        <option value="7"${currentDays === 7 ? ' selected' : ''}>Last 7 days</option>
                        <option value="30"${currentDays === 30 ? ' selected' : ''}>Last 30 days</option>
                        <option value="90"${currentDays === 90 ? ' selected' : ''}>Last 90 days</option>
                        <option value="365"${currentDays === 365 ? ' selected' : ''}>This Year</option>
                    </select>
                </div>
            </div>

            <!-- Stat Cards -->
            <div class="dash-stats-grid">
                ${renderStatCard('TOTAL FILES', formatNumber(stats.totalFiles), stats.trends.totalFiles, 'files', 'blue')}
                ${renderStorageCard(stats)}
                ${renderStatCard('TOTAL COURSES', stats.totalCourses, stats.trends.totalCourses, 'courses', 'red')}
                ${renderStatCard('TOTAL PROGRAMS', stats.totalPrograms, stats.trends.totalPrograms, 'programs', 'green')}
            </div>

            <!-- Charts Row -->
            <div class="dash-charts-row">
                <!-- Download Velocity -->
                <div class="dash-chart-card">
                    <div class="dash-chart-header">
                        <h3 class="dash-chart-title">Download Velocity</h3>
                        <div style="display:flex;align-items:center;gap:8px;">
                            <span id="chartYearLabel" style="font-size:13px;font-weight:600;color:#6B7A99;">${currentYear}</span>
                            <div style="position:relative;">
                                <button class="dash-chart-menu-btn" id="chartMenuBtn">
                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
                                </button>
                                <div class="dash-chart-dropdown" id="chartDropdown">
                                    <button data-action="prev">← Previous Year</button>
                                    <button data-action="next">Next Year →</button>
                                    <button data-action="pick">Select Year...</button>
                                </div>
                                <div class="dash-year-picker" id="yearPicker"></div>
                            </div>
                        </div>
                    </div>
                    <div class="dash-velocity-chart" id="velocityChartContainer">
                        ${renderVelocityChartSVG(downloads)}
                    </div>
                </div>

                <!-- Program Downloads -->
                <div class="dash-donut-card">
                    <h3 class="dash-chart-title">Program Downloads</h3>
                    <div class="dash-donut-wrapper" id="donutChartContainer1">
                        ${renderDonutSVG(programDownloads)}
                    </div>
                    <div class="dash-donut-legend" id="donutLegend1">
                        ${renderDonutLegend(programDownloads, 'DLs')}
                    </div>
                </div>

                <!-- Resource Mix -->
                <div class="dash-donut-card">
                    <h3 class="dash-chart-title">Resource Mix</h3>
                    <div class="dash-donut-wrapper" id="donutChartContainer2">
                        ${renderDonutSVG(resourceMix)}
                    </div>
                    <div class="dash-donut-legend" id="donutLegend2">
                        ${renderDonutLegend(resourceMix, 'Files')}
                    </div>
                </div>
            </div>

            <!-- Bottom Row -->
            <div class="dash-bottom-row" style="grid-template-columns: 1fr;">
                <!-- High-Impact Documents -->
                <div class="dash-docs-card">
                    <div class="dash-docs-header">
                        <h3>High-Impact Documents</h3>
                        <a class="dash-docs-viewall" href="repository.html">View All</a>
                    </div>
                    <table class="dash-docs-table">
                        <thead>
                            <tr>
                                <th>FILE NAME</th>
                                <th>SOURCE</th>
                                <th class="align-center">ACCESS COUNT</th>
                                <th class="align-right">WEIGHT</th>
                            </tr>
                        </thead>
                        <tbody id="docsTableBody">
                            ${renderDocRows(documents)}
                        </tbody>
                    </table>
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

        return `
            <div class="dash-stat-card">
                <div class="dash-stat-top">
                    <span class="dash-stat-label">${label}</span>
                    <div class="dash-stat-icon ${iconColor}">${icons[type] || ''}</div>
                </div>
                <div class="dash-stat-value">${value}</div>
                <div class="dash-stat-change ${changeClass}">${isPositive ? '↑ ' : ''}${change}</div>
            </div>
        `;
    }

    function renderStorageCard(stats) {
        const usedPercent = stats.qnapStorage ? stats.qnapStorage.usedPercentage : (stats.storageCapacityUsed || 0);
        const usedValue = stats.qnapStorage ? stats.qnapStorage.usedValue : (stats.storageCapacityValue || '0 TB');
        const totalValue = stats.qnapStorage ? stats.qnapStorage.totalValue : 'Total';

        return `
            <div class="dash-stat-card">
                <div class="dash-stat-top">
                    <span class="dash-stat-label">QNAP STORAGE CAPACITY</span>
                    <div class="dash-stat-icon blue">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
                    </div>
                </div>
                <div class="dash-stat-value" style="font-size: 20px;">
                    ${usedValue} <span style="font-size:13px; color:#6B7A99; font-weight:500;">/ ${totalValue}</span>
                    <span class="percent">${usedPercent}%</span>
                </div>
                <div class="dash-progress-track">
                    <div class="dash-progress-fill" style="width:${usedPercent}%"></div>
                </div>
            </div>
        `;
    }

    // --- Velocity Chart SVG ---
    function renderVelocityChartSVG(data) {
        if (!data || !data.length) return '<div style="color:#6B7A99;text-align:center;padding:40px;">No data available</div>';

        const W = 700, H = 260;
        const padL = 50, padR = 20, padT = 20, padB = 40;
        const chartW = W - padL - padR;
        const chartH = H - padT - padB;

        const counts = data.map(d => d.count);
        const minVal = Math.floor(Math.min(...counts) / 1000) * 1000;
        const maxVal = Math.ceil(Math.max(...counts) / 1000) * 1000;
        const range = maxVal - minVal || 1;

        const xStep = chartW / (data.length - 1);

        const points = data.map((d, i) => {
            const x = padL + i * xStep;
            const y = padT + chartH - ((d.count - minVal) / range) * chartH;
            return { x, y, ...d };
        });

        // Build smooth path (cubic bezier)
        let pathD = 'M ' + points[0].x + ' ' + points[0].y;
        for (let i = 1; i < points.length; i++) {
            const cpX1 = points[i-1].x + xStep * 0.4;
            const cpY1 = points[i-1].y;
            const cpX2 = points[i].x - xStep * 0.4;
            const cpY2 = points[i].y;
            pathD += ' C ' + cpX1 + ' ' + cpY1 + ', ' + cpX2 + ' ' + cpY2 + ', ' + points[i].x + ' ' + points[i].y;
        }

        // Area path
        const areaD = pathD + ' L ' + points[points.length-1].x + ' ' + (padT + chartH) + ' L ' + points[0].x + ' ' + (padT + chartH) + ' Z';

        // Y-axis ticks
        const yTickCount = 5;
        let yTicks = '';
        for (let i = 0; i <= yTickCount; i++) {
            const val = minVal + (range / yTickCount) * i;
            const y = padT + chartH - (i / yTickCount) * chartH;
            yTicks += '<line x1="' + padL + '" y1="' + y + '" x2="' + (W - padR) + '" y2="' + y + '" stroke="#E8ECF4" stroke-width="1"/>';
            yTicks += '<text x="' + (padL - 8) + '" y="' + (y + 4) + '" fill="#6B7A99" font-size="11" font-weight="500" text-anchor="end" font-family="system-ui">' + formatNumber(Math.round(val)) + '</text>';
        }

        // X-axis labels
        let xLabels = '';
        points.forEach(p => {
            xLabels += '<text x="' + p.x + '" y="' + (H - 8) + '" fill="#6B7A99" font-size="11" font-weight="500" text-anchor="middle" font-family="system-ui">' + p.month + '</text>';
        });

        // Dots
        let dots = '';
        points.forEach(p => {
            dots += '<circle cx="' + p.x + '" cy="' + p.y + '" r="4" fill="#1A3CAA" stroke="#fff" stroke-width="2" style="cursor:pointer"><title>' + p.month + ': ' + formatNumber(p.count) + ' downloads</title></circle>';
        });

        return '<svg viewBox="0 0 700 260">' +
            '<defs>' +
            '<linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#1A3CAA" stop-opacity="0.15"/><stop offset="100%" stop-color="#1A3CAA" stop-opacity="0"/></linearGradient>' +
            '<clipPath id="chartClip"><rect x="0" y="0" width="700" height="260" class="chart-clip-rect"/></clipPath>' +
            '</defs>' +
            yTicks +
            '<g clip-path="url(#chartClip)">' +
            '<path d="' + areaD + '" fill="url(#areaGrad)"/>' +
            '<path d="' + pathD + '" fill="none" stroke="#1A3CAA" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>' +
            '</g>' +
            dots +
            xLabels +
            '</svg>';
    }

    // --- Donut Chart SVG ---
    function renderDonutSVG(mix) {
        const colors = { IT: '#1B2340', EL: '#E63946', ME: '#6B7A99' };
        const total = (mix.it || 0) + (mix.el || 0) + (mix.me || 0);
        if (total === 0) return '<div style="color:#6B7A99;text-align:center;">No data</div>';

        const data = [
            { key: 'IT', value: mix.it, color: colors.IT },
            { key: 'EL', value: mix.el, color: colors.EL },
            { key: 'ME', value: mix.me, color: colors.ME }
        ];

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
        const colors = { IT: '#1B2340', EL: '#E63946', ME: '#6B7A99' };
        const labels = { IT: 'Information Tech', EL: 'Electrical Eng.', ME: 'Mechanical Eng.' };
        const total = (mix.it || 0) + (mix.el || 0) + (mix.me || 0);

        return ['IT', 'EL', 'ME'].map(key => {
            const val = mix[key.toLowerCase()] || 0;
            const pct = total > 0 ? Math.round((val / total) * 100) : 0;
            return '<a class="dash-legend-item" href="repository.html?dept=' + key + '">' +
                '<div class="dash-legend-dot" style="background:' + colors[key] + '"></div>' +
                '<span class="dash-legend-label">' + labels[key] + '</span>' +
                '<span class="dash-legend-value">' + val + (suffix ? ' ' + suffix : '') + ' <span style="font-size:11px;color:#6B7A99;">(' + pct + '%)</span></span>' +
                '</a>';
        }).join('');
    }

    // --- Documents table rows ---
    function renderDocRows(documents) {
        if (!documents || !documents.length) {
            return '<tr><td colspan="4" style="text-align:center;padding:20px;color:#6B7A99;">No documents found</td></tr>';
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
            return '<div style="text-align:center;color:#6B7A99;padding:20px;">No recent events</div>';
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
                try {
                    const stats = await dashboardService.getStats(currentDays);
                    // Re-render stat cards only
                    const grid = document.querySelector('.dash-stats-grid');
                    if (grid) {
                        grid.innerHTML =
                            renderStatCard('TOTAL FILES', formatNumber(stats.totalFiles), stats.trends.totalFiles, 'files', 'blue') +
                            renderStorageCard(stats) +
                            renderStatCard('TOTAL COURSES', stats.totalCourses, stats.trends.totalCourses, 'courses', 'red') +
                            renderStatCard('TOTAL PROGRAMS', stats.totalPrograms, stats.trends.totalPrograms, 'programs', 'green');
                    }
                } catch (err) {
                    console.error('Failed to refresh stats:', err);
                }
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
        for (let y = now - 3; y <= now + 1; y++) {
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
        const label = document.getElementById('chartYearLabel');
        if (label) label.textContent = currentYear;
        if (container) {
            container.innerHTML = '<div class="dash-skeleton" style="height:240px;border-radius:8px;"></div>';
            try {
                const downloads = await dashboardService.getDownloads(currentYear);
                container.innerHTML = renderVelocityChartSVG(downloads);
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
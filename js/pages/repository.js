// js/pages/repository.js
import { getCurrentUser } from '../shared/auth.js';
import { fileService } from '../shared/services.js';
import { mockDepartments } from '../shared/mockData.js';

import { renderLayout } from '../shared/layout.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = getCurrentUser();
    const isGuest = !user || user.role === 'Public User';

    // If the user is logged in as admin, redirect to admin layout version dynamically
    if (user && user.role !== 'Public User') {
        // Hide the public navbar
        const repoNavbar = document.getElementById('repoNavbar');
        if (repoNavbar) repoNavbar.style.display = 'none';

        // Detach the repo body and download modal
        const repoBody = document.querySelector('.repo-body');
        const downloadModalEl = document.getElementById('downloadModal');
        if (repoBody) {
            repoBody.parentNode.removeChild(repoBody);
            if (downloadModalEl) downloadModalEl.parentNode.removeChild(downloadModalEl);
            
            // Render admin layout
            document.body.innerHTML = '<div id="app"></div>';
            renderLayout('repository');
            
            // Hide the academic departments sidebar for admins
            const deptSidebarEl = repoBody.querySelector('#deptSidebar');
            if (deptSidebarEl) deptSidebarEl.style.display = 'none';
            
            // Move repo body into the layout's content area
            const pageContent = document.getElementById('page-content');
            if (pageContent) {
                pageContent.appendChild(repoBody);
            }
            
            // Re-append the download modal to the body
            if (downloadModalEl) {
                document.body.appendChild(downloadModalEl);
            }
            
            // Adjust styles so it fits well inside the admin layout
            repoBody.style.padding = '0';
            repoBody.style.maxWidth = '100%';
            repoBody.style.minHeight = 'auto';
            document.body.classList.add('admin-mode');
        }
    } else {
        // For public users, keep the normal navbar and show Logout if logged in
        const loginBtn = document.getElementById('navLoginBtn');
        if (loginBtn && user) {
            loginBtn.textContent = 'Logout';
            loginBtn.style.backgroundColor = '#E63946';
            loginBtn.onclick = () => {
                import('../shared/auth.js').then(auth => auth.logout());
            };
        }
    }

    // State
    let allFiles = [];
    let selectedFiles = new Set();
    let currentView = 'list'; // 'grid' or 'list'
    let currentFilterType = 'all';
    let currentDept = null; // null = all departments
    let currentProgram = null; // null = all programs
    let currentPage = 1;
    const filesPerPage = 8;
    let searchTerm = '';
    let browsingMode = 'departments'; // 'departments' or 'categories' or 'files'

    // DOM References
    const deptTree = document.getElementById('deptTree');
    const deptSummaryCards = document.getElementById('deptSummaryCards');
    const repoTitleSection = document.getElementById('repoTitleSection');
    const repoBreadcrumb = document.getElementById('repoBreadcrumb');
    const repoControls = document.getElementById('repoControls');
    const repoFilterChips = document.getElementById('repoFilterChips');
    const filesContainer = document.getElementById('filesContainer');
    const repoPagination = document.getElementById('repoPagination');
    const selectionBar = document.getElementById('selectionBar');
    const selectedCountEl = document.getElementById('selectedCount');
    const downloadModal = document.getElementById('downloadModal');

    // Create categories container dynamically
    const categoriesContainer = document.createElement('div');
    categoriesContainer.id = 'categoriesContainer';
    if (deptSummaryCards && deptSummaryCards.parentNode) {
        deptSummaryCards.parentNode.insertBefore(categoriesContainer, deptSummaryCards.nextSibling);
    }

    // Mobile sidebar toggle
    const mobileMenuBtn = document.getElementById('repoMobileMenuBtn');
    const deptSidebar = document.getElementById('deptSidebar');
    const deptSidebarOverlay = document.getElementById('deptSidebarOverlay');

    if (mobileMenuBtn && deptSidebar && deptSidebarOverlay) {
        mobileMenuBtn.addEventListener('click', () => {
            deptSidebar.classList.toggle('open');
            deptSidebarOverlay.classList.toggle('active');
        });
        deptSidebarOverlay.addEventListener('click', () => {
            deptSidebar.classList.remove('open');
            deptSidebarOverlay.classList.remove('active');
        });
    }

    // ========================
    // 1. DEPARTMENT SIDEBAR
    // ========================
    function renderDeptSidebar() {
        let html = '';
        mockDepartments.forEach(dept => {
            const isExpanded = currentDept === dept.id;
            const deptIconSvg = getDeptIconSvg(dept.icon);

            html += `
                <div class="dept-group">
                    <div class="dept-group-header ${isExpanded ? 'expanded' : ''}" data-dept="${dept.id}">
                        <svg class="dept-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${deptIconSvg}</svg>
                        <span class="dept-group-name">${dept.name}</span>
                        <svg class="dept-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                    </div>
                    <div class="dept-programs ${isExpanded ? 'open' : ''}" data-dept-programs="${dept.id}">
                        ${dept.programs.map(prog => `
                            <div class="dept-program-item ${currentProgram === prog.id ? 'active' : ''}" data-program="${prog.id}" data-dept="${dept.id}">
                                ${prog.name}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        });

        deptTree.innerHTML = html;

        // Attach events
        deptTree.querySelectorAll('.dept-group-header').forEach(header => {
            header.addEventListener('click', () => {
                const deptId = header.dataset.dept;
                const programs = deptTree.querySelector(`[data-dept-programs="${deptId}"]`);
                const isOpen = header.classList.contains('expanded');

                // Close all groups
                deptTree.querySelectorAll('.dept-group-header').forEach(h => h.classList.remove('expanded'));
                deptTree.querySelectorAll('.dept-programs').forEach(p => p.classList.remove('open'));

                if (!isOpen) {
                    header.classList.add('expanded');
                    programs.classList.add('open');
                    currentDept = deptId;
                    currentProgram = null;
                    browsingMode = 'categories';
                } else {
                    currentDept = null;
                    currentProgram = null;
                    browsingMode = 'departments';
                }

                currentPage = 1;
                updateViewMode();
                renderCategoriesView();
                applyFilters();
                renderBreadcrumb();
                renderTitle();
                renderDeptSummaryCards();
            });
        });

        deptTree.querySelectorAll('.dept-program-item').forEach(item => {
            item.addEventListener('click', () => {
                currentDept = item.dataset.dept;
                currentProgram = item.dataset.program;
                currentPage = 1;
                browsingMode = 'files';

                // Update active styling
                deptTree.querySelectorAll('.dept-program-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');

                // Ensure parent is expanded
                const header = deptTree.querySelector(`.dept-group-header[data-dept="${currentDept}"]`);
                const programs = deptTree.querySelector(`[data-dept-programs="${currentDept}"]`);
                deptTree.querySelectorAll('.dept-group-header').forEach(h => h.classList.remove('expanded'));
                deptTree.querySelectorAll('.dept-programs').forEach(p => p.classList.remove('open'));
                header.classList.add('expanded');
                programs.classList.add('open');

                updateViewMode();
                applyFilters();
                renderBreadcrumb();
                renderTitle();
                renderDeptSummaryCards();

                // Close mobile sidebar
                if (deptSidebar) deptSidebar.classList.remove('open');
                if (deptSidebarOverlay) deptSidebarOverlay.classList.remove('active');
            });
        });
    }

    function getDeptIconSvg(icon) {
        switch (icon) {
            case 'monitor':
                return '<rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>';
            case 'zap':
                return '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>';
            case 'settings':
                return '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>';
            default:
                return '<rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>';
        }
    }

    // ========================
    // 2. DEPARTMENT SUMMARY CARDS
    // ========================
    function renderDeptSummaryCards() {
        let html = '';
        mockDepartments.forEach(dept => {
            const isActive = currentDept === dept.id;
            const deptIconSvg = getDeptIconSvg(dept.icon);
            html += `
                <div class="dept-summary-card ${isActive ? 'active' : ''}" data-dept="${dept.id}">
                    <div>
                        <div class="dept-card-label">${dept.label}</div>
                        <div class="dept-card-short">${dept.shortName}</div>
                        <div class="dept-card-stats">${dept.totalFiles.toLocaleString()} Files &bull; ${dept.categories} Categories</div>
                    </div>
                    <div class="dept-card-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${deptIconSvg}</svg>
                    </div>
                </div>
            `;
        });

        deptSummaryCards.innerHTML = html;

        // Click handlers
        deptSummaryCards.querySelectorAll('.dept-summary-card').forEach(card => {
            card.addEventListener('click', () => {
                const deptId = card.dataset.dept;

                if (currentDept === deptId) {
                    // Deselect → go back to departments
                    currentDept = null;
                    currentProgram = null;
                    browsingMode = 'departments';
                } else {
                    currentDept = deptId;
                    currentProgram = null;
                    browsingMode = 'categories';
                }

                currentPage = 1;
                updateViewMode();
                renderCategoriesView();
                applyFilters();
                renderBreadcrumb();
                renderTitle();
                renderDeptSummaryCards();
                renderDeptSidebar();
            });
        });
    }

    // ========================
    // 3. BREADCRUMB
    // ========================
    function renderBreadcrumb() {
        if (!currentDept && !currentProgram) {
            repoBreadcrumb.innerHTML = '';
            return;
        }

        const dept = mockDepartments.find(d => d.id === currentDept);
        let crumbs = `<a href="#" data-nav="home">Repository</a><span class="bc-separator">&rsaquo;</span>`;
        crumbs += `<a href="#" data-nav="dept" data-dept="${dept.id}">${dept.shortName}</a>`;

        if (currentProgram) {
            const prog = dept.programs.find(p => p.id === currentProgram);
            crumbs += `<span class="bc-separator">&rsaquo;</span>`;
            crumbs += `<span>Programs</span>`;
            crumbs += `<span class="bc-separator">&rsaquo;</span>`;
            crumbs += `<span class="bc-current">${prog.name}</span>`;
        }

        repoBreadcrumb.innerHTML = crumbs;

        // Breadcrumb click handlers
        repoBreadcrumb.querySelectorAll('a[data-nav]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const nav = link.dataset.nav;
                if (nav === 'home') {
                    currentDept = null;
                    currentProgram = null;
                    browsingMode = 'departments';
                    updateViewMode();
                    renderCategoriesView();
                } else if (nav === 'dept') {
                    currentDept = link.dataset.dept;
                    currentProgram = null;
                    browsingMode = 'categories';
                    updateViewMode();
                    renderCategoriesView();
                }
                currentPage = 1;
                applyFilters();
                renderBreadcrumb();
                renderTitle();
                renderDeptSummaryCards();
                renderDeptSidebar();
            });
        });
    }

    // ========================
    // 4. PAGE TITLE
    // ========================
    function renderTitle() {
        let title = 'Central Repository';
        let subtitle = 'The official AITU file management system for academic and administrative record keeping.';
        let showToggle = false;

        if (browsingMode === 'departments') {
            title = 'Central Repository';
            subtitle = 'The official AITU file management system for academic and administrative record keeping.';
        } else if (browsingMode === 'categories' && currentDept) {
            const dept = mockDepartments.find(d => d.id === currentDept);
            title = `${dept.name}`;
            subtitle = `Browse categories and programs in the ${dept.name} department.`;
        } else if (browsingMode === 'files' && currentProgram && currentDept) {
            const dept = mockDepartments.find(d => d.id === currentDept);
            const prog = dept.programs.find(p => p.id === currentProgram);
            title = `${prog.name} Resources`;
            subtitle = 'Official course materials, peer-reviewed manuals, and architecture blueprints.';
            showToggle = true;
        } else if (browsingMode === 'files' && currentDept) {
            const dept = mockDepartments.find(d => d.id === currentDept);
            title = `${dept.name} Files`;
            subtitle = `Browse all files in the ${dept.name} department.`;
            showToggle = true;
        }

        repoTitleSection.innerHTML = `
            <div class="repo-title-row">
                <div>
                    <h1>${title}</h1>
                    <p>${subtitle}</p>
                </div>
                <div class="repo-title-actions">
                    ${!isGuest && browsingMode === 'departments' ? `
                        <button class="repo-add-btn" id="addCategoryBtn">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                            Add Category
                        </button>
                    ` : ''}
                    ${!isGuest && browsingMode === 'categories' ? `
                        <button class="repo-add-btn" id="addProgramBtn">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                            Add Program
                        </button>
                    ` : ''}
                    ${!isGuest ? `
                        <a href="upload-resources.html" class="repo-upload-btn">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>
                            Upload Resources
                        </a>
                    ` : ''}
                    ${showToggle ? `
                        <div class="repo-view-toggle">
                            <button class="repo-view-btn ${currentView === 'list' ? 'active' : ''}" data-view="list" title="List view">
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                            </button>
                            <button class="repo-view-btn ${currentView === 'grid' ? 'active' : ''}" data-view="grid" title="Grid view">
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        // View toggle handler
        repoTitleSection.querySelectorAll('.repo-view-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                currentView = btn.dataset.view;
                renderTitle();
                renderFiles(getFilteredFiles());
            });
        });

        // Add Category button handler
        const addCategoryBtn = document.getElementById('addCategoryBtn');
        if (addCategoryBtn) {
            addCategoryBtn.addEventListener('click', () => showAddCategoryModal());
        }

        // Add Program button handler
        const addProgramBtn = document.getElementById('addProgramBtn');
        if (addProgramBtn) {
            addProgramBtn.addEventListener('click', () => showAddProgramModal());
        }
    }

    // ========================
    // CATEGORIES VIEW (program cards for a selected department)
    // ========================
    function getProgramIconSvg(progId) {
        const icons = {
            'it-net': '<rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/><line x1="17" y1="17" x2="22" y2="17"/>',
            'it-db': '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>',
            'it-prog': '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
            'it-cyber': '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
            'el-power': '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
            'el-embed': '<rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>',
            'el-digital': '<path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/>',
            'me-thermo': '<path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>',
            'me-fluid': '<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>',
            'me-cad': '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
            'me-materials': '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>',
            'me-manufacturing': '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>'
        };
        return icons[progId] || '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>';
    }

    function renderCategoriesView() {
        if (browsingMode !== 'categories' || !currentDept) {
            categoriesContainer.innerHTML = '';
            return;
        }

        const dept = mockDepartments.find(d => d.id === currentDept);
        if (!dept) return;

        let html = '<div class="program-cards-grid">';

        dept.programs.forEach(prog => {
            const fileCount = allFiles.filter(f => f.program === prog.id).length;
            const totalFiles = fileCount > 0 ? fileCount : dept.totalFiles;
            const iconSvg = getProgramIconSvg(prog.id);

            html += `
                <div class="program-card" data-dept="${dept.id}" data-program="${prog.id}">
                    <div class="program-card-icon">
                        <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="var(--primary-dark)" stroke-width="1.8">${iconSvg}</svg>
                    </div>
                    <div class="program-card-name">${prog.name}</div>
                    <div class="program-card-meta">
                        <span class="program-card-count">${totalFiles.toLocaleString()} Files</span>
                        <span class="program-card-badge">${dept.shortName} DEPT</span>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        categoriesContainer.innerHTML = html;

        // Click handlers → enter files mode
        categoriesContainer.querySelectorAll('.program-card').forEach(card => {
            card.addEventListener('click', () => {
                currentDept = card.dataset.dept;
                currentProgram = card.dataset.program;
                currentPage = 1;
                browsingMode = 'files';
                updateViewMode();
                renderDeptSidebar();
                renderDeptSummaryCards();
                renderBreadcrumb();
                renderTitle();
                applyFilters();
            });
        });
    }

    // ========================
    // VIEW MODE TOGGLE (3 levels)
    // ========================
    function updateViewMode() {
        if (browsingMode === 'departments') {
            // Show only dept summary cards
            if (deptSummaryCards) deptSummaryCards.style.display = '';
            categoriesContainer.style.display = 'none';
            if (repoControls) repoControls.style.display = 'none';
            if (repoFilterChips) repoFilterChips.style.display = 'none';
            if (filesContainer) filesContainer.style.display = 'none';
            if (repoPagination) repoPagination.style.display = 'none';
        } else if (browsingMode === 'categories') {
            // Show dept cards + program category cards
            if (deptSummaryCards) deptSummaryCards.style.display = '';
            categoriesContainer.style.display = '';
            if (repoControls) repoControls.style.display = 'none';
            if (repoFilterChips) repoFilterChips.style.display = 'none';
            if (filesContainer) filesContainer.style.display = 'none';
            if (repoPagination) repoPagination.style.display = 'none';
        } else {
            // Show dept cards + files UI
            if (deptSummaryCards) deptSummaryCards.style.display = '';
            categoriesContainer.style.display = 'none';
            if (repoControls) repoControls.style.display = '';
            if (repoFilterChips) repoFilterChips.style.display = '';
            if (filesContainer) filesContainer.style.display = '';
            if (repoPagination) repoPagination.style.display = '';
        }
    }

    // ========================
    // 5. CONTROLS BAR (Search + Filters + Sort)
    // ========================
    function renderControls() {
        repoControls.innerHTML = `
            <div class="repo-search-input">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input type="text" id="repoSearchField" placeholder="Filter files by name, type, or version..." value="${searchTerm}">
            </div>
            <button class="repo-control-btn" id="filtersBtn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/></svg>
                Filters
            </button>
            <button class="repo-control-btn" id="sortBtn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="6" x2="16" y2="6"/><line x1="4" y1="12" x2="13" y2="12"/><line x1="4" y1="18" x2="10" y2="18"/></svg>
                Sort
            </button>
        `;

        const searchField = document.getElementById('repoSearchField');
        if (searchField) {
            searchField.addEventListener('input', () => {
                searchTerm = searchField.value.trim().toLowerCase();
                currentPage = 1;
                applyFilters();
            });
        }
    }

    // ========================
    // 6. FILTER CHIPS
    // ========================
    function renderFilterChips() {
        const types = [
            { label: 'Filters', value: 'all', hasIcon: true },
            { label: 'All Types', value: 'all' },
            { label: 'Date Added', value: 'date' }
        ];

        repoFilterChips.innerHTML = types.map(chip => `
            <button class="repo-chip ${currentFilterType === chip.value && chip.label !== 'Filters' ? 'active' : ''}" data-filter="${chip.value}">
                ${chip.hasIcon ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/></svg>' : ''}
                ${chip.label}
            </button>
        `).join('');
    }

    // ========================
    // 7. FILE TYPE ICONS
    // ========================
    function getFileTypeIcon(type, size = 48) {
        const colors = {
            'PDF': '#dc2626',
            'XLSX': '#16a34a',
            'DWG': '#2563eb',
            'DOCX': '#ea580c',
            'MP4': '#9333ea'
        };
        const color = colors[type] || '#64748b';

        if (type === 'PDF') {
            return `<svg viewBox="0 0 48 48" width="${size}" height="${size}" fill="none">
                <rect x="8" y="4" width="32" height="40" rx="3" stroke="${color}" stroke-width="2" fill="#fef2f2"/>
                <path d="M16 4V14H8" stroke="${color}" stroke-width="2"/>
                <text x="24" y="30" text-anchor="middle" fill="${color}" font-size="10" font-weight="bold">PDF</text>
            </svg>`;
        } else if (type === 'XLSX') {
            return `<svg viewBox="0 0 48 48" width="${size}" height="${size}" fill="none">
                <rect x="8" y="4" width="32" height="40" rx="3" stroke="${color}" stroke-width="2" fill="#f0fdf4"/>
                <rect x="14" y="16" width="20" height="18" rx="1" stroke="${color}" stroke-width="1.5"/>
                <line x1="14" y1="22" x2="34" y2="22" stroke="${color}" stroke-width="1"/>
                <line x1="14" y1="28" x2="34" y2="28" stroke="${color}" stroke-width="1"/>
                <line x1="24" y1="16" x2="24" y2="34" stroke="${color}" stroke-width="1"/>
            </svg>`;
        } else if (type === 'DWG') {
            return `<svg viewBox="0 0 48 48" width="${size}" height="${size}" fill="none">
                <rect x="8" y="4" width="32" height="40" rx="3" stroke="${color}" stroke-width="2" fill="#eff6ff"/>
                <path d="M18 30L24 18L30 30" stroke="${color}" stroke-width="2" fill="none"/>
                <line x1="20" y1="26" x2="28" y2="26" stroke="${color}" stroke-width="1.5"/>
            </svg>`;
        } else if (type === 'DOCX') {
            return `<svg viewBox="0 0 48 48" width="${size}" height="${size}" fill="none">
                <rect x="8" y="4" width="32" height="40" rx="3" stroke="${color}" stroke-width="2" fill="#fff7ed"/>
                <line x1="16" y1="16" x2="32" y2="16" stroke="${color}" stroke-width="1.5"/>
                <line x1="16" y1="22" x2="32" y2="22" stroke="${color}" stroke-width="1.5"/>
                <line x1="16" y1="28" x2="28" y2="28" stroke="${color}" stroke-width="1.5"/>
            </svg>`;
        } else if (type === 'MP4') {
            return `<svg viewBox="0 0 48 48" width="${size}" height="${size}" fill="none">
                <rect x="8" y="4" width="32" height="40" rx="3" stroke="${color}" stroke-width="2" fill="#faf5ff"/>
                <polygon points="20,17 20,31 32,24" fill="${color}"/>
            </svg>`;
        }
        return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="${color}" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
        </svg>`;
    }

    function getFileTypeIconSmall(type) {
        return getFileTypeIcon(type, 22);
    }

    // ========================
    // 8. FILE RENDERING
    // ========================
    function getFilteredFiles() {
        let filtered = [...allFiles];

        // Department filter
        if (currentDept) {
            filtered = filtered.filter(f => f.deptId === currentDept);
        }

        // Program filter
        if (currentProgram) {
            filtered = filtered.filter(f => f.program === currentProgram);
        }

        // Type filter
        if (currentFilterType !== 'all' && currentFilterType !== 'date') {
            filtered = filtered.filter(f => f.type === currentFilterType);
        }

        // Search
        if (searchTerm) {
            filtered = filtered.filter(f =>
                f.name.toLowerCase().includes(searchTerm) ||
                f.type.toLowerCase().includes(searchTerm) ||
                f.version.toLowerCase().includes(searchTerm) ||
                f.dept.toLowerCase().includes(searchTerm)
            );
        }

        // Date sort
        if (currentFilterType === 'date') {
            filtered.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
        }

        return filtered;
    }

    function renderFiles(filesToRender) {
        const totalFiles = filesToRender.length;
        const totalPages = Math.max(1, Math.ceil(totalFiles / filesPerPage));

        if (currentPage > totalPages) currentPage = totalPages;

        const startIdx = (currentPage - 1) * filesPerPage;
        const endIdx = startIdx + filesPerPage;
        const pageFiles = filesToRender.slice(startIdx, endIdx);

        if (totalFiles === 0) {
            filesContainer.innerHTML = `
                <div style="text-align:center; padding:60px 20px; color:var(--text-gray);">
                    <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#cbd5e1" stroke-width="1.5" style="margin-bottom:15px;">
                        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/>
                    </svg>
                    <h3 style="color:var(--primary-dark); margin-bottom:8px;">No files found</h3>
                    <p>Try adjusting your search or filter criteria.</p>
                </div>
            `;
            repoPagination.innerHTML = '';
            return;
        }

        if (currentView === 'grid') {
            renderGridView(pageFiles);
        } else {
            renderTableView(pageFiles);
        }

        renderPagination(totalFiles, totalPages);
    }

    function renderGridView(files) {
        let html = '<div class="repo-file-grid">';
        files.forEach(file => {
            const isSelected = selectedFiles.has(file.id.toString());
            html += `
                <div class="repo-file-card ${isSelected ? 'selected' : ''}" data-file-id="${file.id}">
                    <input type="checkbox" class="repo-card-checkbox" data-id="${file.id}" ${isSelected ? 'checked' : ''}>
                    <div class="repo-card-icon">${getFileTypeIcon(file.type)}</div>
                    <div class="repo-card-name" title="${file.name}">${file.name}</div>
                    <div class="repo-card-version">${file.version}</div>
                    <div class="repo-card-meta">
                        <span>${file.size} <span class="repo-dept-badge">${file.dept}</span></span>
                        <span class="repo-card-downloads">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                            ${file.downloads.toLocaleString()}
                        </span>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        filesContainer.innerHTML = html;
        attachCheckboxListeners();
    }

    function renderTableView(files) {
        let html = `
            <div class="repo-file-table-wrapper">
                <table class="repo-file-table">
                    <thead>
                        <tr>
                            <th><input type="checkbox" class="repo-table-checkbox" id="tableSelectAll"></th>
                            <th>File Name</th>
                            <th>Type</th>
                            <th>Version</th>
                            <th>Size</th>
                            <th>Downloads</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        files.forEach(file => {
            const isSelected = selectedFiles.has(file.id.toString());
            html += `
                <tr class="${isSelected ? 'selected' : ''}" data-file-id="${file.id}">
                    <td><input type="checkbox" class="repo-table-checkbox" data-id="${file.id}" ${isSelected ? 'checked' : ''}></td>
                    <td>
                        <div class="repo-table-file-name">
                            ${getFileTypeIconSmall(file.type)}
                            ${file.name}
                        </div>
                    </td>
                    <td><span class="repo-type-badge ${file.type.toLowerCase()}">${file.type}</span></td>
                    <td class="repo-table-version">${file.version}</td>
                    <td class="repo-table-size">${file.size}</td>
                    <td class="repo-table-downloads">${file.downloads.toLocaleString()}</td>
                    <td>
                        <button class="repo-table-action-btn" data-download="${file.id}" title="Download">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                        </button>
                    </td>
                </tr>
            `;
        });

        html += '</tbody></table></div>';
        filesContainer.innerHTML = html;

        // Select all handler in table header
        const selectAllCheckbox = document.getElementById('tableSelectAll');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', (e) => {
                const checkboxes = filesContainer.querySelectorAll('.repo-table-checkbox[data-id]');
                checkboxes.forEach(box => {
                    const id = box.dataset.id;
                    const row = box.closest('tr');
                    box.checked = e.target.checked;
                    if (e.target.checked) {
                        selectedFiles.add(id);
                        row.classList.add('selected');
                    } else {
                        selectedFiles.delete(id);
                        row.classList.remove('selected');
                    }
                });
                updateSelectionBar();
            });
        }

        attachCheckboxListeners();

        // Download button per row
        filesContainer.querySelectorAll('.repo-table-action-btn[data-download]').forEach(btn => {
            btn.addEventListener('click', () => {
                const fileId = btn.dataset.download;
                const file = allFiles.find(f => f.id.toString() === fileId);
                if (file) {
                    alert(`Downloading: ${file.name} (${file.size})`);
                }
            });
        });
    }

    function attachCheckboxListeners() {
        const checkboxes = filesContainer.querySelectorAll('.repo-card-checkbox, .repo-table-checkbox[data-id]');
        checkboxes.forEach(box => {
            box.addEventListener('change', (e) => {
                const id = e.target.dataset.id;
                if (!id) return;
                const parent = e.target.closest('.repo-file-card') || e.target.closest('tr');
                if (e.target.checked) {
                    selectedFiles.add(id);
                    if (parent) parent.classList.add('selected');
                } else {
                    selectedFiles.delete(id);
                    if (parent) parent.classList.remove('selected');
                }
                updateSelectionBar();
            });
        });
    }

    // ========================
    // 9. PAGINATION
    // ========================
    function renderPagination(totalFiles, totalPages) {
        const start = (currentPage - 1) * filesPerPage + 1;
        const end = Math.min(currentPage * filesPerPage, totalFiles);

        let pagesHtml = '';
        pagesHtml += `<button class="repo-page-btn" data-page="prev" ${currentPage === 1 ? 'disabled' : ''}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>`;

        for (let i = 1; i <= totalPages; i++) {
            if (totalPages > 5 && i > 3 && i < totalPages - 1 && Math.abs(i - currentPage) > 1) {
                if (i === 4) pagesHtml += '<span style="padding:0 6px; color:var(--text-gray);">...</span>';
                continue;
            }
            pagesHtml += `<button class="repo-page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }

        pagesHtml += `<button class="repo-page-btn" data-page="next" ${currentPage === totalPages ? 'disabled' : ''}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>`;

        repoPagination.innerHTML = `
            <span class="repo-pagination-info">Showing ${start} of ${totalFiles} files</span>
            <div class="repo-pagination-pages">${pagesHtml}</div>
        `;

        repoPagination.querySelectorAll('.repo-page-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = btn.dataset.page;
                if (page === 'prev') currentPage = Math.max(1, currentPage - 1);
                else if (page === 'next') currentPage = Math.min(totalPages, currentPage + 1);
                else currentPage = parseInt(page);
                renderFiles(getFilteredFiles());
            });
        });
    }

    // ========================
    // 10. SELECTION BAR
    // ========================
    function updateSelectionBar() {
        if (!selectionBar || !selectedCountEl) return;
        selectedCountEl.innerText = selectedFiles.size;
        if (selectedFiles.size > 0) {
            selectionBar.classList.add('visible');
        } else {
            selectionBar.classList.remove('visible');
        }
    }

    // Clear Selection
    const clearSelectionBtn = document.getElementById('clearSelectionBtn');
    if (clearSelectionBtn) {
        clearSelectionBtn.addEventListener('click', () => {
            selectedFiles.clear();
            updateSelectionBar();
            renderFiles(getFilteredFiles());
        });
    }

    // Download Selected → Show modal
    const downloadSelectedBtn = document.getElementById('downloadSelectedBtn');
    if (downloadSelectedBtn) {
        downloadSelectedBtn.addEventListener('click', () => {
            if (selectedFiles.size === 0) return;
            showDownloadModal();
        });
    }

    // ========================
    // 11. DOWNLOAD MODAL
    // ========================
    function showDownloadModal() {
        const modalFileList = document.getElementById('modalFileList');
        const modalSummary = document.getElementById('modalSummary');

        const selected = allFiles.filter(f => selectedFiles.has(f.id.toString()));

        let filesHtml = '';
        selected.forEach(file => {
            filesHtml += `
                <div class="repo-modal-file-item">
                    <div class="repo-modal-file-name">
                        ${getFileTypeIconSmall(file.type)}
                        ${file.name}
                    </div>
                    <div class="repo-modal-file-size">${file.size}</div>
                </div>
            `;
        });
        modalFileList.innerHTML = filesHtml;

        // Parse and sum sizes
        let totalSizeMB = 0;
        selected.forEach(f => {
            const match = f.size.match(/([\d.]+)\s*(MB|KB|GB)/i);
            if (match) {
                let val = parseFloat(match[1]);
                const unit = match[2].toUpperCase();
                if (unit === 'KB') val /= 1024;
                else if (unit === 'GB') val *= 1024;
                totalSizeMB += val;
            }
        });

        modalSummary.innerHTML = `
            <span>${selected.length} items selected</span>
            <span>Total Size: <strong>${totalSizeMB.toFixed(1)} MB</strong></span>
        `;

        downloadModal.classList.add('active');
    }

    function hideDownloadModal() {
        downloadModal.classList.remove('active');
    }

    document.getElementById('closeDownloadModal').addEventListener('click', hideDownloadModal);
    document.getElementById('cancelDownloadModal').addEventListener('click', hideDownloadModal);
    document.getElementById('confirmDownloadModal').addEventListener('click', async () => {
    const count = selectedFiles.size;
    const ids = Array.from(selectedFiles).map(id => parseInt(id));
    hideDownloadModal();

    try {
        await fileService.downloadZip(ids);
    } catch (err) {
        alert(`Downloading ${count} files...`);
    }

    selectedFiles.clear();
    updateSelectionBar();
    renderFiles(getFilteredFiles());
});

    // ========================
    // 12. GLOBAL SEARCH (navbar)
    // ========================
    const globalSearch = document.getElementById('globalSearchInput');
    if (globalSearch) {
        globalSearch.addEventListener('input', () => {
            searchTerm = globalSearch.value.trim().toLowerCase();
            // Also update the content search field
            const repoSearchField = document.getElementById('repoSearchField');
            if (repoSearchField) repoSearchField.value = globalSearch.value;
            currentPage = 1;
            applyFilters();
        });
    }

    // ========================
    // 13. APPLY FILTERS (master)
    // ========================
    function applyFilters() {
        const filtered = getFilteredFiles();
        renderFiles(filtered);
    }

    // ========================
    // CATEGORY & PROGRAM ADD CREATION MODALS
    // ========================
    function showAddCategoryModal() {
        let modal = document.getElementById('addCategoryModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'addCategoryModal';
            modal.className = 'repo-modal-overlay';
            modal.innerHTML = `
                <div class="repo-download-modal" style="max-width: 450px;">
                    <div class="repo-modal-header">
                        <div class="repo-modal-title-group">
                            <h3>Add New Category (Dept)</h3>
                        </div>
                        <button class="repo-modal-close" id="closeAddCategoryModalBtn">&times;</button>
                    </div>
                    <div style="padding: 20px; display: flex; flex-direction: column; gap: 15px;">
                        <div style="display: flex; flex-direction: column; gap: 5px;">
                            <label style="font-weight: 700; font-size: 0.85rem; color: var(--primary-dark);">Category Name</label>
                            <input type="text" id="newCatName" placeholder="e.g. Civil Engineering" style="padding: 10px; border: 1px solid var(--border-color); border-radius: 8px; width: 100%; box-sizing: border-box;">
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 5px;">
                            <label style="font-weight: 700; font-size: 0.85rem; color: var(--primary-dark);">Abbreviation / Code</label>
                            <input type="text" id="newCatId" placeholder="e.g. CE" style="padding: 10px; border: 1px solid var(--border-color); border-radius: 8px; width: 100%; box-sizing: border-box;">
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 5px;">
                            <label style="font-weight: 700; font-size: 0.85rem; color: var(--primary-dark);">Icon Type</label>
                            <select id="newCatIcon" style="padding: 10px; border: 1px solid var(--border-color); border-radius: 8px; width: 100%; box-sizing: border-box; background: white;">
                                <option value="monitor">Monitor (IT)</option>
                                <option value="zap">Lightning (Electrical)</option>
                                <option value="settings">Gear (Mechanical)</option>
                            </select>
                        </div>
                    </div>
                    <div class="repo-modal-actions">
                        <button class="repo-modal-cancel" id="cancelAddCategoryBtn">Cancel</button>
                        <button class="repo-modal-confirm" id="confirmAddCategory">Add Category</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            const closeModal = () => modal.classList.remove('active');
            document.getElementById('closeAddCategoryModalBtn').addEventListener('click', closeModal);
            document.getElementById('cancelAddCategoryBtn').addEventListener('click', closeModal);
            
            document.getElementById('confirmAddCategory').addEventListener('click', () => {
                const name = document.getElementById('newCatName').value.trim();
                const id = document.getElementById('newCatId').value.trim().toUpperCase();
                const icon = document.getElementById('newCatIcon').value;
                if (!name || !id) {
                    alert('Please fill out all fields.');
                    return;
                }
                if (mockDepartments.some(d => d.id === id)) {
                    alert('A category with this Abbreviation already exists.');
                    return;
                }
                
                mockDepartments.push({
                    id: id,
                    name: name,
                    shortName: id,
                    label: name.toUpperCase(),
                    icon: icon,
                    totalFiles: 0,
                    categories: 0,
                    programs: []
                });
                
                closeModal();
                
                renderDeptSidebar();
                renderDeptSummaryCards();
                renderCategoriesView();
                renderTitle();
            });
        }
        
        document.getElementById('newCatName').value = '';
        document.getElementById('newCatId').value = '';
        document.getElementById('newCatIcon').selectedIndex = 0;
        
        modal.classList.add('active');
    }

    function showAddProgramModal() {
        if (!currentDept) {
            alert('Please select a Category first.');
            return;
        }
        const dept = mockDepartments.find(d => d.id === currentDept);
        if (!dept) return;

        let modal = document.getElementById('addProgramModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'addProgramModal';
            modal.className = 'repo-modal-overlay';
            modal.innerHTML = `
                <div class="repo-download-modal" style="max-width: 450px;">
                    <div class="repo-modal-header">
                        <div class="repo-modal-title-group">
                            <h3>Add New Program</h3>
                        </div>
                        <button class="repo-modal-close" id="closeAddProgramModalBtn">&times;</button>
                    </div>
                    <div style="padding: 20px; display: flex; flex-direction: column; gap: 15px;">
                        <div style="display: flex; flex-direction: column; gap: 5px;">
                            <label style="font-weight: 700; font-size: 0.85rem; color: var(--primary-dark);">Parent Category</label>
                            <input type="text" id="parentDeptName" readonly style="padding: 10px; border: 1px solid var(--border-color); border-radius: 8px; width: 100%; box-sizing: border-box; background: #f1f5f9;">
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 5px;">
                            <label style="font-weight: 700; font-size: 0.85rem; color: var(--primary-dark);">Program Name</label>
                            <input type="text" id="newProgName" placeholder="e.g. Structural Engineering" style="padding: 10px; border: 1px solid var(--border-color); border-radius: 8px; width: 100%; box-sizing: border-box;">
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 5px;">
                            <label style="font-weight: 700; font-size: 0.85rem; color: var(--primary-dark);">Program Code / ID</label>
                            <input type="text" id="newProgId" placeholder="e.g. ce-struct" style="padding: 10px; border: 1px solid var(--border-color); border-radius: 8px; width: 100%; box-sizing: border-box;">
                        </div>
                    </div>
                    <div class="repo-modal-actions">
                        <button class="repo-modal-cancel" id="cancelAddProgramBtn">Cancel</button>
                        <button class="repo-modal-confirm" id="confirmAddProgram">Add Program</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            const closeModal = () => modal.classList.remove('active');
            document.getElementById('closeAddProgramModalBtn').addEventListener('click', closeModal);
            document.getElementById('cancelAddProgramBtn').addEventListener('click', closeModal);
            
            document.getElementById('confirmAddProgram').addEventListener('click', () => {
                const name = document.getElementById('newProgName').value.trim();
                const progId = document.getElementById('newProgId').value.trim().toLowerCase();
                if (!name || !progId) {
                    alert('Please fill out all fields.');
                    return;
                }
                
                const activeDept = mockDepartments.find(d => d.id === currentDept);
                if (activeDept) {
                    if (activeDept.programs.some(p => p.id === progId)) {
                        alert('A program with this ID already exists in this department.');
                        return;
                    }
                    activeDept.programs.push({
                        id: progId,
                        name: name
                    });
                    activeDept.categories = activeDept.programs.length;
                }
                
                closeModal();
                
                renderDeptSidebar();
                renderDeptSummaryCards();
                renderCategoriesView();
                renderTitle();
            });
        }
        
        document.getElementById('parentDeptName').value = dept.name;
        document.getElementById('newProgName').value = '';
        document.getElementById('newProgId').value = '';
        
        modal.classList.add('active');
    }

    // ========================
    // 14. URL PARAMETER HANDLING
    // ========================
    function handleUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const deptParam = urlParams.get('dept');
        if (deptParam) {
            const dept = mockDepartments.find(d => d.id.toUpperCase() === deptParam.toUpperCase());
            if (dept) {
                currentDept = dept.id;
                browsingMode = 'categories';
            }
        }
        const searchParam = urlParams.get('search');
        if (searchParam) {
            searchTerm = searchParam.trim().toLowerCase();
            const globalSearch = document.getElementById('globalSearchInput');
            if (globalSearch) globalSearch.value = searchParam;
        }
    }

    // ========================
    // INIT: Load and Render Everything
    // ========================
    handleUrlParams();

    try {
        allFiles = await fileService.getFiles();
    } catch (e) {
        allFiles = [];
    }

    renderDeptSidebar();
    renderDeptSummaryCards();
    renderBreadcrumb();
    renderTitle();
    renderControls();
    renderFilterChips();
    renderCategoriesView();
    updateViewMode();
    applyFilters();
});
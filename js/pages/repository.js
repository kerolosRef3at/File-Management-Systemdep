// js/pages/repository.js
import { getCurrentUser } from '../shared/auth.js';
import { fileService, logService, folderService, authService } from '../shared/services.js';
import { mockDepartments, hydrateDepartments } from '../shared/mockData.js';

import { renderLayout } from '../shared/layout.js';
import { translations, getCurrentLang, getDeptDisplayName } from '../shared/jssharedi18n.js';

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
            const loader = document.getElementById('global-page-loader');
            document.body.innerHTML = '<div id="app"></div>';
            if (loader) document.body.appendChild(loader);
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
        const joinBtn = document.getElementById('coursesJoinBtn');
        if (user) {
            if (joinBtn) joinBtn.style.display = 'none';
            if (loginBtn) {
                loginBtn.textContent = 'Logout';
                loginBtn.style.backgroundColor = '#E63946';
                loginBtn.onclick = () => {
                    import('../shared/auth.js').then(auth => auth.logout());
                };
            }
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
                        <span class="dept-group-name">${getDeptDisplayName(dept.name)}</span>
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
            case 'book-open':
                return '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>';
            case 'briefcase':
                return '<rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>';
            case 'activity':
                return '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>';
            case 'compass':
                return '<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>';
            case 'cpu':
                return '<rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>';
            case 'globe':
                return '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>';
            case 'pen-tool':
                return '<path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/>';
            default:
                return '<rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>';
        }
    }

    // ========================
    // 2. DEPARTMENT SUMMARY CARDS
    // ========================
    function renderDeptSummaryCards() {
        let html = '';
        const lang = getCurrentLang();
        const t = (key) => (translations[lang] || translations.en)[key] || translations.en[key] || key;

        mockDepartments.forEach(dept => {
            const isActive = currentDept === dept.id;
            const deptIconSvg = getDeptIconSvg(dept.icon);
            const deptFilesCount = allFiles.filter(f => {
                const fDept = String(f.dept || f.deptId || f.department || '').toUpperCase();
                const deptId = String(dept.id).toUpperCase();
                const deptCode = String(dept.shortName || '').toUpperCase();
                return fDept === deptId || fDept === deptCode;
            }).length;

            const displayLabel = getDeptDisplayName(dept.label);
            const displayShort = getDeptDisplayName(dept.shortName);
            const filesText = lang === 'ar' ? 'ملفات' : 'Files';
            const catText = lang === 'ar' ? 'أقسام' : 'Categories';

            html += `
                <div class="dept-summary-card ${isActive ? 'active' : ''}" data-dept="${dept.id}">
                    <div style="flex:1; overflow:hidden;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                            <div class="dept-card-label" style="margin-bottom:0;">${displayLabel}</div>
                            ${!isGuest ? `
                                <button class="delete-dept-btn" data-id="${dept.dbId ?? dept.id}" data-name="${dept.name || dept.label}" title="${lang === 'ar' ? 'حذف القسم' : 'Delete Department'}">
                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                </button>
                            ` : ''}
                        </div>
                        <div class="dept-card-short">${displayShort}</div>
                        <div class="dept-card-stats">${deptFilesCount.toLocaleString()} ${filesText} &bull; ${dept.programs ? dept.programs.length : dept.categories} ${catText}</div>
                    </div>
                    <div class="dept-card-icon" style="margin-left:12px; flex-shrink:0;">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${deptIconSvg}</svg>
                    </div>
                </div>
            `;
        });

        deptSummaryCards.innerHTML = html;
        deptSummaryCards.classList.toggle('has-active-card', !!currentDept);

        // Delete department handler
        deptSummaryCards.querySelectorAll('.delete-dept-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const deptId = btn.dataset.id;
                const deptName = btn.dataset.name;

                showPasswordConfirmModal({
                    itemName: deptName,
                    onConfirm: async () => {
                        const numericId = /^\d+$/.test(String(deptId)) ? parseInt(deptId) : NaN;
                        const targetId = !isNaN(numericId) ? numericId : deptId;
                        try {
                            await folderService.deleteFolder(targetId);
                        } catch (err) {
                            console.warn('Delete dept API notice, removing locally:', err);
                        }

                        logService.addLog(user?.username || 'admin', user?.role || 'Supervisor', 'Delete Department', deptName);

                        // Remove from mockDepartments in memory immediately
                        const idx = mockDepartments.findIndex(d => 
                            String(d.id) === String(deptId) || 
                            String(d.dbId) === String(deptId) || 
                            String(d.shortName) === String(deptId) ||
                            d.name === deptName ||
                            d.label === deptName
                        );
                        if (idx !== -1) {
                            mockDepartments.splice(idx, 1);
                        }

                        if (currentDept === deptId) {
                            currentDept = null;
                            currentProgram = null;
                            browsingMode = 'departments';
                        }

                        // Re-render components instantly
                        renderDeptSummaryCards();
                        renderDeptSidebar();
                        renderCategoriesView();
                        updateViewMode();
                        applyFilters();
                        renderBreadcrumb();
                        renderTitle();

                        alert(lang === 'ar' ? 'تم حذف القسم بنجاح.' : 'Department deleted successfully.');
                    }
                });
            });
        });

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
        const lang = getCurrentLang();
        const t = (key) => (translations[lang] || translations.en)[key] || translations.en[key] || key;

        let title = t('repo_title');
        let subtitle = t('repo_subtitle');
        let showToggle = false;

        if (browsingMode === 'departments') {
            title = t('repo_title');
            subtitle = t('repo_subtitle');
        } else if (browsingMode === 'categories' && currentDept) {
            const dept = mockDepartments.find(d => d.id === currentDept);
            const deptName = getDeptDisplayName(dept.name);
            title = deptName;
            subtitle = lang === 'ar' ? `تصفح الأقسام والبرامج في تخصص ${deptName}.` : `Browse categories and programs in the ${dept.name} department.`;
        } else if (browsingMode === 'files' && currentProgram && currentDept) {
            const dept = mockDepartments.find(d => d.id === currentDept);
            const prog = dept.programs.find(p => p.id === currentProgram);
            title = lang === 'ar' ? `موارد ${prog.name}` : `${prog.name} Resources`;
            subtitle = lang === 'ar' ? `مواد الكورسات الرسمية، الأدلة المعروضة، والمخططات الهندسية.` : `Official course materials, peer-reviewed manuals, and architecture blueprints.`;
            showToggle = true;
        } else if (browsingMode === 'files' && currentDept) {
            const dept = mockDepartments.find(d => d.id === currentDept);
            const deptName = getDeptDisplayName(dept.name);
            title = lang === 'ar' ? `ملفات ${deptName}` : `${dept.name} Files`;
            subtitle = lang === 'ar' ? `تصفح جميع الملفات في تخصص ${deptName}.` : `Browse all files in the ${dept.name} department.`;
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
                            ${t('repo_add_category')}
                        </button>
                    ` : ''}
                    ${!isGuest && browsingMode === 'categories' ? `
                        <button class="repo-add-btn" id="addProgramBtn">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                            ${t('repo_add_program')}
                        </button>
                    ` : ''}
                    ${!isGuest ? `
                        <button class="repo-upload-btn" id="openUploadModalBtn">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>
                            ${t('repo_upload')}
                        </button>
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

        // Upload Resources modal button handler
        const uploadModalBtn = document.getElementById('openUploadModalBtn');
        if (uploadModalBtn) {
            uploadModalBtn.addEventListener('click', async () => {
                const { openUploadModal } = await import('./upload-resources.js');
                openUploadModal(currentDept || '', currentProgram || '');
            });
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

        if (!dept.programs || dept.programs.length === 0) {
            const deptFiles = getFilteredFiles();
            if (deptFiles.length === 0) {
                const isAr = getCurrentLang() === 'ar';
                categoriesContainer.innerHTML = `
                    <div style="text-align:center; padding:50px 20px; color:var(--text-gray); direction:${isAr ? 'rtl' : 'ltr'}; background:white; border-radius:12px; border:1px dashed #cbd5e1; margin-top:20px;">
                        <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#94a3b8" stroke-width="1.5" style="margin-bottom:14px;">
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                            <line x1="9" y1="13" x2="15" y2="13"/>
                        </svg>
                        <h3 style="color:var(--primary-dark); margin-bottom:8px; font-size:1.15rem; font-weight:700;">
                            ${isAr ? 'لا توجد ملفات في هذا القسم' : 'No files found in this department'}
                        </h3>
                        <p style="margin:0; font-size:0.9rem; color:#64748b;">
                            ${isAr ? 'لم يتم رفع أي ملفات في هذا القسم حتى الآن.' : 'No files have been uploaded to this department yet.'}
                        </p>
                    </div>
                `;
                return;
            } else {
                browsingMode = 'files';
                updateViewMode();
                renderFiles(deptFiles);
                return;
            }
        }

        let html = '<div class="program-cards-grid">';

        dept.programs.forEach(prog => {
            // Count only files that are BOTH in this department AND this program.
            // The department check was missing, so a file whose program name
            // matched (e.g. any "Mec Doc") was counted here regardless of which
            // department it actually belonged to -- inflating the card's number.
            const deptCode = String(dept.shortName || dept.id || '').toLowerCase();
            const fileCount = allFiles.filter(f => {
                const fDept = String(f.dept || f.deptId || '').toLowerCase();
                if (fDept !== deptCode) return false;
                const fProg = String(f.program || '').toLowerCase();
                return fProg === String(prog.id).toLowerCase() ||
                       fProg === String(prog.name).toLowerCase();
            }).length;
            const totalFiles = fileCount;
            const iconSvg = getProgramIconSvg(prog.id);

            const isAr = getCurrentLang() === 'ar';
            const filesLabel = isAr ? 'ملفات' : 'Files';
            const formattedBadge = isAr 
                ? `قسم ${getDeptDisplayName(dept.shortName)}` 
                : `${getDeptDisplayName(dept.shortName)} DEPT`;
            html += `
                <div class="program-card" data-dept="${dept.id}" data-program="${prog.id}">
                    <div class="program-card-icon">
                        <svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="var(--primary-dark)" stroke-width="1.8">${iconSvg}</svg>
                    </div>
                    <div class="program-card-name">${prog.name}</div>
                    <div class="program-card-meta">
                        <span class="program-card-count">${totalFiles.toLocaleString()} ${filesLabel}</span>
                        <div style="display:flex; align-items:center; gap:8px;">
                            <span class="program-card-badge">${formattedBadge}</span>
                            ${!isGuest ? `<button class="delete-category-btn" data-id="${prog.dbId ?? prog.id}" data-name="${prog.name}" title="Delete Category" style="background:none; border:none; color:#dc2626; cursor:pointer; padding:0; display:flex; align-items:center;"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>` : ''}
                        </div>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        categoriesContainer.innerHTML = html;

        // Category Delete handlers with password confirmation
        categoriesContainer.querySelectorAll('.delete-category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const catId = btn.dataset.id;
                const catName = btn.dataset.name;

                showPasswordConfirmModal({
                    itemName: catName,
                    onConfirm: async () => {
                        const numericId = /^\d+$/.test(String(catId)) ? parseInt(catId) : NaN;
                        const targetId = !isNaN(numericId) ? numericId : catId;
                        try {
                            await folderService.deleteFolder(targetId);
                        } catch (err) {
                            console.warn('Delete category API notice, removing locally:', err);
                        }

                        logService.addLog(user?.username || 'admin', user?.role || 'Supervisor', 'Delete Category', catName);

                        // Remove program/category from current department
                        if (currentDept) {
                            const dept = mockDepartments.find(d => d.id === currentDept);
                            if (dept && dept.programs) {
                                dept.programs = dept.programs.filter(p => 
                                    String(p.id) !== String(catId) && 
                                    String(p.dbId) !== String(catId) && 
                                    p.name !== catName
                                );
                                dept.categories = dept.programs.length;
                            }
                        }

                        // Re-render UI components instantly without page reload
                        renderCategoriesView();
                        renderDeptSummaryCards();
                        renderDeptSidebar();
                        applyFilters();

                        alert(lang === 'ar' ? 'تم حذف التخصص بنجاح.' : 'Category deleted successfully.');
                    }
                });
            });
        });

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
        const lang = getCurrentLang();
        const t = (key) => (translations[lang] || translations.en)[key] || translations.en[key] || key;
        const searchPlaceholder = lang === 'ar' ? 'تصفية الملفات حسب الاسم أو النوع أو الإصدار...' : 'Filter files by name, type, or version...';
        const sortText = lang === 'ar' ? 'فرز' : 'Sort';

        repoControls.innerHTML = `
            <div class="repo-search-input">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input type="text" id="repoSearchField" placeholder="${searchPlaceholder}" value="${searchTerm}">
            </div>
            <button class="repo-control-btn" id="filtersBtn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/></svg>
                ${t('repo_filters')}
            </button>
            <button class="repo-control-btn" id="sortBtn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="6" x2="16" y2="6"/><line x1="4" y1="12" x2="13" y2="12"/><line x1="4" y1="18" x2="10" y2="18"/></svg>
                ${sortText}
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
        const lang = getCurrentLang();
        const t = (key) => (translations[lang] || translations.en)[key] || translations.en[key] || key;
        const types = [
            { label: t('repo_filters'), value: 'all', hasIcon: true },
            { label: lang === 'ar' ? 'كل الأنواع' : 'All Types', value: 'all' },
            { label: lang === 'ar' ? 'تاريخ الإضافة' : 'Date Added', value: 'date' }
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

        // Department filter -- exact match. startsWith let "MEDIA" files leak
        // into the "ME" view (and any code that is a prefix of another).
        if (currentDept) {
            const want = String(currentDept).toUpperCase();
            filtered = filtered.filter(f => {
                const fDept = String(f.dept || f.deptId || f.department || '').toUpperCase();
                return fDept === want;
            });
        }

        // Program filter
        // Program filter
if (currentProgram) {
    const currentProg = mockDepartments
        .flatMap(d => d.programs)
        .find(p => p.id === currentProgram);
    const progName = currentProg ? currentProg.name : currentProgram;
    
    filtered = filtered.filter(f => {
        const fProgram = String(f.program || '').toLowerCase();
        return fProgram === String(progName).toLowerCase() ||
               fProgram === String(currentProgram).toLowerCase();
    });
}

        // Type filter
        if (currentFilterType !== 'all' && currentFilterType !== 'date') {
            filtered = filtered.filter(f => String(f.type || '').toUpperCase() === currentFilterType.toUpperCase());
        }

        // Search
        if (searchTerm) {
            filtered = filtered.filter(f =>
                String(f.name || f.fileName || '').toLowerCase().includes(searchTerm) ||
                String(f.type || f.fileType || '').toLowerCase().includes(searchTerm) ||
                String(f.version || '').toLowerCase().includes(searchTerm) ||
                String(f.dept || f.deptId || '').toLowerCase().includes(searchTerm)
            );
        }

        // Date sort
        if (currentFilterType === 'date') {
            filtered.sort((a, b) => new Date(b.uploadDate || 0) - new Date(a.uploadDate || 0));
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
            const isAr = getCurrentLang() === 'ar';
            const emptyTitle = isAr ? 'لا توجد ملفات في هذا القسم' : 'No files found';
            const emptySub = isAr ? 'لم يتم رفع أي ملفات في هذا التخصص حتى الآن.' : 'No uploaded files found in this category yet.';

            filesContainer.innerHTML = `
                <div style="text-align:center; padding:50px 20px; color:var(--text-gray); direction:${isAr ? 'rtl' : 'ltr'}; background:white; border-radius:12px; border:1px dashed #cbd5e1; margin-top:10px;">
                    <svg viewBox="0 0 24 24" width="52" height="52" fill="none" stroke="#94a3b8" stroke-width="1.5" style="margin-bottom:14px;">
                        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/>
                        <line x1="9" y1="13" x2="15" y2="13"/>
                    </svg>
                    <h3 style="color:var(--primary-dark); margin-bottom:8px; font-size:1.15rem; font-weight:700;">${emptyTitle}</h3>
                    <p style="margin:0; font-size:0.9rem; color:#64748b;">${emptySub}</p>
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
                        <div style="display:flex; gap:10px; align-items:center;">
                            <span class="repo-card-downloads">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                                ${file.downloads.toLocaleString()}
                            </span>
                            ${!isGuest ? `<button class="repo-action-btn delete-file-btn" data-id="${file.id}" title="Delete File" style="background:none; border:none; color:#dc2626; cursor:pointer; padding:0; display:flex; align-items:center;"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>` : ''}
                        </div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        filesContainer.innerHTML = html;
        attachCheckboxListeners();
        attachSingleFileDeleteListeners();
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
                        <div style="display:flex; gap:8px;">
                            <button class="repo-table-action-btn" data-download="${file.id}" title="Download">
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                            </button>
                            ${!isGuest ? `<button class="repo-table-action-btn delete-file-btn" data-id="${file.id}" title="Delete File" style="color:#dc2626;">
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            </button>` : ''}
                        </div>
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
        attachDownloadListeners();
        attachSingleFileDeleteListeners();
    }

    function attachDownloadListeners() {
        filesContainer.querySelectorAll('[data-download]').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const fileId = btn.dataset.download;
                const file = allFiles.find(f => f.id.toString() === fileId.toString());
                if (file) {
                    const isAr = getCurrentLang() === 'ar';
                    showDownloadToast(
                        isAr ? 'جاري بدء التحميل...' : 'Starting Download...',
                        isAr ? `سيتم تحميل ملف "${file.name}" الآن.` : `File "${file.name}" will start downloading now.`
                    );

                    // Uncheck if selected
                    if (selectedFiles.has(fileId.toString())) {
                        selectedFiles.delete(fileId.toString());
                        updateSelectionBar();
                    }

                    try {
                        await fileService.downloadFile(fileId, file.name, file);
                        file.downloads = (file.downloads || 0) + 1;
                        renderFiles(getFilteredFiles());
                    } catch (err) {
                        console.error('Download error:', err);
                    }
                }
            });
        });
    }

    function attachSingleFileDeleteListeners() {
        filesContainer.querySelectorAll('.delete-file-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const fileId = btn.dataset.id;
                const file = allFiles.find(f => f.id.toString() === fileId.toString());
                if (!file) return;

                showPasswordConfirmModal({
                    itemName: file.name,
                    onConfirm: async () => {
                        try {
                            await fileService.deleteFile(fileId);
                        } catch (err) {
                            console.warn('Delete file API error, removing locally:', err);
                        }
                        logService.addLog(user?.username || 'admin', user?.role || 'Supervisor', 'Delete File', file.name);
                        allFiles = allFiles.filter(f => f.id.toString() !== fileId.toString());
                        renderFiles(getFilteredFiles());
                        const isAr = getCurrentLang() === 'ar';
                        alert(isAr ? 'تم حذف الملف بنجاح.' : 'File deleted successfully.');
                    }
                });
            });
        });
    }

    function attachCheckboxListeners() {
        // 1. Direct checkbox change handlers
        const checkboxes = filesContainer.querySelectorAll('.repo-card-checkbox, .repo-table-checkbox[data-id]');
        checkboxes.forEach(box => {
            box.addEventListener('change', (e) => {
                const id = e.target.dataset.id;
                if (!id) return;
                const parent = e.target.closest('.repo-file-card') || e.target.closest('tr');
                if (e.target.checked) {
                    selectedFiles.add(id.toString());
                    if (parent) parent.classList.add('selected');
                } else {
                    selectedFiles.delete(id.toString());
                    if (parent) parent.classList.remove('selected');
                }
                updateSelectionBar();
            });
        });

        // 2. Click anywhere on Card (Grid View)
        filesContainer.querySelectorAll('.repo-file-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('button') || e.target.closest('a') || e.target.closest('.repo-action-btn') || e.target.tagName === 'INPUT') {
                    return;
                }
                const fileId = card.dataset.fileId;
                if (!fileId) return;

                const checkbox = card.querySelector('.repo-card-checkbox');
                const isSelected = selectedFiles.has(fileId.toString());

                if (isSelected) {
                    selectedFiles.delete(fileId.toString());
                    card.classList.remove('selected');
                    if (checkbox) checkbox.checked = false;
                } else {
                    selectedFiles.add(fileId.toString());
                    card.classList.add('selected');
                    if (checkbox) checkbox.checked = true;
                }
                updateSelectionBar();
            });
        });

        // 3. Click anywhere on Row (Table View)
        filesContainer.querySelectorAll('tr[data-file-id]').forEach(row => {
            row.addEventListener('click', (e) => {
                if (e.target.closest('button') || e.target.closest('a') || e.target.closest('.repo-table-action-btn') || e.target.tagName === 'INPUT') {
                    return;
                }
                const fileId = row.dataset.fileId;
                if (!fileId) return;

                const checkbox = row.querySelector('.repo-table-checkbox');
                const isSelected = selectedFiles.has(fileId.toString());

                if (isSelected) {
                    selectedFiles.delete(fileId.toString());
                    row.classList.remove('selected');
                    if (checkbox) checkbox.checked = false;
                } else {
                    selectedFiles.add(fileId.toString());
                    row.classList.add('selected');
                    if (checkbox) checkbox.checked = true;
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
        
        const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
        if (deleteSelectedBtn) {
            deleteSelectedBtn.style.display = (!isGuest && selectedFiles.size > 0) ? 'inline-flex' : 'none';
        }
        
        if (selectedFiles.size > 0) {
            selectionBar.classList.add('visible');
        } else {
            selectionBar.classList.remove('visible');
        }
        console.log("Classes:", selectionBar.className);
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

    // Delete Selected
    const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
    if (deleteSelectedBtn) {
        deleteSelectedBtn.addEventListener('click', async () => {
            if (selectedFiles.size === 0) return;
            
            const count = selectedFiles.size;
            if (confirm(`Are you sure you want to permanently delete the ${count} selected file(s)?`)) {
                const ids = Array.from(selectedFiles).map(id => parseInt(id));
                
                // Get file names before delete for logging
                const filesToDelete = allFiles.filter(f => selectedFiles.has(f.id.toString()));
                
                try {
                    await fileService.deleteFiles(ids);
                    
                    // Log each deleted file
                    filesToDelete.forEach(f => {
                        logService.addLog(user?.username || 'admin', user?.role || 'Supervisor', 'Delete File', f.name);
                    });
                    
                    // Refetch files
                    try {
                        allFiles = await fileService.getFiles();
                    } catch(e) {
                        allFiles = allFiles.filter(f => !selectedFiles.has(f.id.toString()));
                    }
                    
                    alert(`Successfully deleted ${count} file(s).`);
                } catch (err) {
                    // Even if API fails, delete locally from allFiles in-memory for demo
                    filesToDelete.forEach(f => {
                        logService.addLog(user?.username || 'admin', user?.role || 'Supervisor', 'Delete File', f.name);
                    });
                    allFiles = allFiles.filter(f => !selectedFiles.has(f.id.toString()));
                    alert(`Successfully deleted ${count} file(s).`);
                }
                
                selectedFiles.clear();
                updateSelectionBar();
                applyFilters();
            }
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
        const selectedList = allFiles.filter(f => selectedFiles.has(f.id.toString()));
        hideDownloadModal();

        const isAr = getCurrentLang() === 'ar';
        showDownloadToast(
            isAr ? 'تم بدء تحميل الملفات المحددة' : 'Download Started',
            isAr ? `جاري تجهيز وتحميل الحزمة (${count} ملفات)...` : `Downloading bundle containing ${count} file(s)...`
        );

        // Clear selection and uncheck items
        selectedFiles.clear();
        updateSelectionBar();
        renderFiles(getFilteredFiles());

        try {
            await fileService.downloadZip(ids);
        } catch (err) {
            // The zip failed. Downloading each file in a tight loop used to drop
            // large ones (the browser cancels rapid parallel navigations, so the
            // video died while the small PDF slipped through). Space them out so
            // each download actually starts.
            console.warn('Zip failed, falling back to individual downloads:', err);
            for (let i = 0; i < selectedList.length; i++) {
                const f = selectedList[i];
                setTimeout(() => fileService.downloadFile(f.id, f.name, f), i * 1500);
            }
        }
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
        const lang = getCurrentLang();
        const isAr = lang === 'ar';

        let modal = document.getElementById('addCategoryModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'addCategoryModal';
            modal.className = 'repo-modal-overlay';
            modal.innerHTML = `
                <div class="repo-download-modal" style="max-width: 450px; direction: ${isAr ? 'rtl' : 'ltr'}; text-align: ${isAr ? 'right' : 'left'};">
                    <div class="repo-modal-header">
                        <div class="repo-modal-title-group">
                            <h3>${isAr ? 'إضافة قسم / تخصص جديد' : 'Add New Category (Dept)'}</h3>
                        </div>
                        <button class="repo-modal-close" id="closeAddCategoryModalBtn">&times;</button>
                    </div>
                    <div style="padding: 20px; display: flex; flex-direction: column; gap: 15px;">
                        <div style="display: flex; flex-direction: column; gap: 5px;">
                            <label style="font-weight: 700; font-size: 0.85rem; color: var(--primary-dark); text-align: ${isAr ? 'right' : 'left'};">${isAr ? 'اسم القسم / التخصص' : 'Category Name'}</label>
                            <input type="text" id="newCatName" maxlength="50" placeholder="${isAr ? 'مثال: الهندسة المدنية' : 'e.g. Civil Engineering'}" style="padding: 10px; border: 1px solid var(--border-color); border-radius: 8px; width: 100%; box-sizing: border-box; text-align: ${isAr ? 'right' : 'left'};">
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 5px;">
                            <label style="font-weight: 700; font-size: 0.85rem; color: var(--primary-dark); text-align: ${isAr ? 'right' : 'left'};">${isAr ? 'الرمز المختصر / الكود' : 'Abbreviation / Code'}</label>
                            <input type="text" id="newCatId" maxlength="15" placeholder="${isAr ? 'مثال: CE' : 'e.g. CE'}" style="padding: 10px; border: 1px solid var(--border-color); border-radius: 8px; width: 100%; box-sizing: border-box; text-align: ${isAr ? 'right' : 'left'};">
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 5px;">
                            <label style="font-weight: 700; font-size: 0.85rem; color: var(--primary-dark); text-align: ${isAr ? 'right' : 'left'};">${isAr ? 'اختر أيقونة التخصص' : 'Select Specialty Icon'}</label>
                            <input type="hidden" id="newCatIcon" value="monitor">
                            <div class="icon-picker-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(48px, 1fr)); gap: 10px; margin-top: 5px;" id="iconPickerGrid">
                                <!-- Icons generated by JS -->
                            </div>
                        </div>
                    </div>
                    <div class="repo-modal-actions" style="direction: ${isAr ? 'rtl' : 'ltr'}; justify-content: flex-end;">
                        <button class="repo-modal-cancel" id="cancelAddCategoryBtn">${isAr ? 'إلغاء' : 'Cancel'}</button>
                        <button class="repo-modal-confirm" id="confirmAddCategory">${isAr ? 'إضافة القسم' : 'Add Category'}</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            // Icon library data
            const iconLibrary = [
                { id: 'monitor', title: 'Computer / IT', svg: '<rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line>' },
                { id: 'zap', title: 'Electrical', svg: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>' },
                { id: 'settings', title: 'Mechanical', svg: '<circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>' },
                { id: 'book-open', title: 'Literature / Education', svg: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>' },
                { id: 'briefcase', title: 'Business / Law', svg: '<rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>' },
                { id: 'activity', title: 'Medical / Healthcare', svg: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>' },
                { id: 'compass', title: 'Architecture / Design', svg: '<circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>' },
                { id: 'cpu', title: 'Computer Engineering', svg: '<rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line>' },
                { id: 'globe', title: 'Earth Sciences', svg: '<circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>' },
                { id: 'pen-tool', title: 'Arts', svg: '<path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path><path d="M2 2l7.586 7.586"></path><circle cx="11" cy="11" r="2"></circle>' }
            ];

            const grid = document.getElementById('iconPickerGrid');
            const hiddenInput = document.getElementById('newCatIcon');

            iconLibrary.forEach((icon, index) => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'icon-picker-btn' + (index === 0 ? ' active' : '');
                btn.title = icon.title;
                btn.style.cssText = 'padding:12px; border:1px solid ' + (index === 0 ? 'var(--primary-blue)' : 'var(--border-color)') + '; border-radius:8px; background:' + (index === 0 ? 'rgba(26,60,170,0.05)' : 'white') + '; cursor:pointer; color:' + (index === 0 ? 'var(--primary-blue)' : 'var(--text-gray)') + '; transition:all 0.2s; display:flex; align-items:center; justify-content:center;';
                btn.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icon.svg}</svg>`;
                
                btn.addEventListener('click', () => {
                    // Remove active from all
                    document.querySelectorAll('.icon-picker-btn').forEach(b => {
                        b.classList.remove('active');
                        b.style.borderColor = 'var(--border-color)';
                        b.style.background = 'white';
                        b.style.color = 'var(--text-gray)';
                    });
                    // Add active to clicked
                    btn.classList.add('active');
                    btn.style.borderColor = 'var(--primary-blue)';
                    btn.style.background = 'rgba(26,60,170,0.05)';
                    btn.style.color = 'var(--primary-blue)';
                    hiddenInput.value = icon.id;
                });
                grid.appendChild(btn);
            });

            const closeModal = () => modal.classList.remove('active');
            document.getElementById('closeAddCategoryModalBtn').addEventListener('click', closeModal);
            document.getElementById('cancelAddCategoryBtn').addEventListener('click', closeModal);
            
            document.getElementById('confirmAddCategory').addEventListener('click', async () => {
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
                
                // The server call is what creates the real folder on the QNAP
                // drive and makes the category selectable on the Upload page.
                // If it fails we must NOT add the category locally: it would show
                // in this sidebar while being invisible to everyone else and
                // absent from the drive.
                let apiResult;
                try {
                    apiResult = await folderService.createFolder(name, 0, {
                        code: id, shortName: id, icon: icon, isDepartment: true
                    });
                } catch (e) {
                    console.error('createFolder (category) failed:', e);
                    alert(
                        'The category was not created.\n\n' +
                        (e && e.message ? e.message : e) +
                        '\n\nA folder name cannot contain / \\ : * ? " < > | or ".."' +
                        ', and cannot be blank, a plain number, or a GUID.' +
                        '\n\nNothing was changed. Fix the name and try again.'
                    );
                    return;   // keep the modal open so the name can be corrected
                }

                // Saved in the database, but the drive folder could not be made.
                if (apiResult && apiResult.warning) {
                    alert(
                        'The category was created, but the folder on the drive was not:\n\n' +
                        apiResult.warning
                    );
                }

                const newCat = {
                    id: id,
                    name: name,
                    shortName: id,
                    label: name.toUpperCase(),
                    icon: icon,
                    totalFiles: 0,
                    categories: 0,
                    programs: []
                };
                mockDepartments.push(newCat);
                
                // Log action
                logService.addLog(user?.username || 'admin', user?.role || 'Supervisor', 'Create Folder', `Category: ${name} (${id})`);
                
                closeModal();
                
                renderDeptSidebar();
                renderDeptSummaryCards();
                renderCategoriesView();
                renderTitle();
            });
        }
        
        document.getElementById('newCatName').value = '';
        document.getElementById('newCatId').value = '';
        document.getElementById('newCatIcon').value = 'monitor';
        document.querySelectorAll('.icon-picker-btn').forEach((b, idx) => {
            if (idx === 0) {
                b.classList.add('active');
                b.style.borderColor = 'var(--primary-blue)';
                b.style.background = 'rgba(26,60,170,0.05)';
                b.style.color = 'var(--primary-blue)';
            } else {
                b.classList.remove('active');
                b.style.borderColor = 'var(--border-color)';
                b.style.background = 'white';
                b.style.color = 'var(--text-gray)';
            }
        });
        
        modal.classList.add('active');
    }

    function showAddProgramModal() {
        const lang = getCurrentLang();
        const isAr = lang === 'ar';

        if (!currentDept) {
            alert(isAr ? 'يرجى اختيار القسم الرئيسي أولاً.' : 'Please select a Category first.');
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
                <div class="repo-download-modal" style="max-width: 450px; direction: ${isAr ? 'rtl' : 'ltr'}; text-align: ${isAr ? 'right' : 'left'};">
                    <div class="repo-modal-header">
                        <div class="repo-modal-title-group">
                            <h3>${isAr ? 'إضافة برنامج / تخصص فرعي' : 'Add New Program'}</h3>
                        </div>
                        <button class="repo-modal-close" id="closeAddProgramModalBtn">&times;</button>
                    </div>
                    <div style="padding: 20px; display: flex; flex-direction: column; gap: 15px;">
                        <div style="display: flex; flex-direction: column; gap: 5px;">
                            <label style="font-weight: 700; font-size: 0.85rem; color: var(--primary-dark); text-align: ${isAr ? 'right' : 'left'};">${isAr ? 'القسم الرئيسي' : 'Parent Category'}</label>
                            <input type="text" id="parentDeptName" readonly style="padding: 10px; border: 1px solid var(--border-color); border-radius: 8px; width: 100%; box-sizing: border-box; background: #f1f5f9; text-align: ${isAr ? 'right' : 'left'};">
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 5px;">
                            <label style="font-weight: 700; font-size: 0.85rem; color: var(--primary-dark); text-align: ${isAr ? 'right' : 'left'};">${isAr ? 'اسم البرنامج الفرعي' : 'Program Name'}</label>
                            <input type="text" id="newProgName" maxlength="50" placeholder="${isAr ? 'مثال: الهندسة الإنشائية' : 'e.g. Structural Engineering'}" style="padding: 10px; border: 1px solid var(--border-color); border-radius: 8px; width: 100%; box-sizing: border-box; text-align: ${isAr ? 'right' : 'left'};">
                        </div>
                    </div>
                    <div class="repo-modal-actions" style="direction: ${isAr ? 'rtl' : 'ltr'}; justify-content: flex-end;">
                        <button class="repo-modal-cancel" id="cancelAddProgramBtn">${isAr ? 'إلغاء' : 'Cancel'}</button>
                        <button class="repo-modal-confirm" id="confirmAddProgram">${isAr ? 'إضافة البرنامج' : 'Add Program'}</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            const closeModal = () => modal.classList.remove('active');
            document.getElementById('closeAddProgramModalBtn').addEventListener('click', closeModal);
            document.getElementById('cancelAddProgramBtn').addEventListener('click', closeModal);
            
            document.getElementById('confirmAddProgram').addEventListener('click', async () => {
                const name = document.getElementById('newProgName').value.trim();
                if (!name) {
                    alert('Please enter a program name.');
                    return;
                }
                const progId = name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now().toString().slice(-4);
                
                const activeDept = mockDepartments.find(d => d.id === currentDept);
                if (activeDept) {
                    if (activeDept.programs.some(p => p.id === progId)) {
                        alert('A program with this ID already exists in this department.');
                        return;
                    }
                    // Creates the real subfolder on the QNAP drive. Same rule as
                    // above: if the server rejects it, do not add it locally.
                    let progResult;
                    try {
                        progResult = await folderService.createFolder(name, null, activeDept.id);
                    } catch (e) {
                        console.error('createFolder (program) failed:', e);
                        alert(
                            'The program was not created.\n\n' +
                            (e && e.message ? e.message : e) +
                            '\n\nA folder name cannot contain / \\ : * ? " < > | or ".."' +
                            ', and cannot be blank, a plain number, or a GUID.' +
                            '\n\nNothing was changed. Fix the name and try again.'
                        );
                        return;
                    }

                    if (progResult && progResult.warning) {
                        alert(
                            'The program was created, but the folder on the drive was not:\n\n' +
                            progResult.warning
                        );
                    }

                    activeDept.programs.push({
                        id: progId,
                        name: name
                    });
                    activeDept.categories = activeDept.programs.length;
                    
                    // Log action
                    logService.addLog(user?.username || 'admin', user?.role || 'Supervisor', 'Create Folder', `Program: ${activeDept.name} > ${name} (${progId})`);
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
        
        modal.classList.add('active');
    }

    // ========================
    // DOWNLOAD TOAST VISUAL FEEDBACK
    // ========================
    function showDownloadToast(title, message) {
        const isAr = getCurrentLang() === 'ar';
        const existing = document.getElementById('downloadToastNotification');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.id = 'downloadToastNotification';
        toast.style.cssText = `
            position: fixed;
            bottom: 24px;
            ${isAr ? 'left: 24px;' : 'right: 24px;'}
            z-index: 999999;
            background: #08305b;
            color: white;
            padding: 14px 20px;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.25);
            display: flex;
            align-items: center;
            gap: 14px;
            direction: ${isAr ? 'rtl' : 'ltr'};
            font-family: inherit;
            animation: toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            border: 1px solid rgba(255,255,255,0.1);
        `;

        toast.innerHTML = `
            <style>
                @keyframes toastSlideIn {
                    from { transform: translateY(100px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes toastFadeOut {
                    from { transform: translateY(0); opacity: 1; }
                    to { transform: translateY(20px); opacity: 0; }
                }
            </style>
            <div style="width:36px; height:36px; border-radius:50%; background:rgba(34,197,94,0.18); color:#22c55e; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            </div>
            <div>
                <div style="font-weight: 700; font-size: 0.95rem; margin-bottom: 2px;">${title}</div>
                <div style="font-size: 0.82rem; color: #cbd5e1;">${message}</div>
            </div>
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'toastFadeOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }

    // ========================
    // PASSWORD CONFIRMATION MODAL FOR DELETION
    // ========================
    // ========================
    // PASSWORD CONFIRMATION MODAL FOR DELETION (2-Step Flow & Modern Design)
    // ========================
// In repository.js - Replace the entire showPasswordConfirmModal function:

function showPasswordConfirmModal({ itemName, onConfirm }) {
    const lang = getCurrentLang();
    const isAr = lang === 'ar';

    const overlay = document.createElement('div');
    overlay.className = 'upload-modal-overlay visible';
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(15, 23, 42, 0.65); backdrop-filter: blur(8px);
        z-index: 999999; display: flex; align-items: center; justify-content: center;
        padding: 20px; box-sizing: border-box; animation: modalOverlayFade 0.25s ease;
    `;

    overlay.innerHTML = `
        <style>
            @keyframes modalOverlayFade { from { opacity: 0; } to { opacity: 1; } }
            @keyframes modalCardSlide { from { opacity: 0; transform: translateY(18px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
            .confirm-modal-card {
                background: #ffffff;
                border-radius: 20px;
                padding: 30px;
                width: 100%;
                max-width: 450px;
                box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.35);
                border: 1px solid #e2e8f0;
                direction: ${isAr ? 'rtl' : 'ltr'};
                text-align: ${isAr ? 'right' : 'left'};
                animation: modalCardSlide 0.25s cubic-bezier(0.16, 1, 0.3, 1);
                font-family: inherit;
            }
            .confirm-modal-btn {
                padding: 11px 20px;
                border-radius: 10px;
                font-size: 0.9rem;
                font-weight: 700;
                cursor: pointer;
                transition: all 0.2s ease;
                border: none;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
            }
            .confirm-btn-cancel {
                background: #f1f5f9;
                color: #475569;
                border: 1px solid #cbd5e1;
            }
            .confirm-btn-cancel:hover {
                background: #e2e8f0;
                color: #0f172a;
            }
            .confirm-btn-danger {
                background: linear-gradient(135deg, #dc2626, #b91c1c);
                color: #ffffff;
                box-shadow: 0 4px 12px rgba(220, 38, 38, 0.25);
            }
            .confirm-btn-danger:hover {
                background: linear-gradient(135deg, #b91c1c, #991b1b);
                box-shadow: 0 6px 16px rgba(220, 38, 38, 0.35);
                transform: translateY(-1px);
            }
            .modal-pass-input:focus {
                outline: none;
                border-color: #2563eb !important;
                box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12) !important;
                background: #ffffff !important;
            }
        </style>

        <div class="confirm-modal-card" id="confirmModalContent">
            <!-- STEP 1: Confirmation Question -->
            <div id="modalStep1">
                <div style="display:flex; align-items:center; gap:14px; margin-bottom:18px;">
                    <div style="width:52px; height:52px; border-radius:14px; background:#fef2f2; color:#ef4444; display:flex; align-items:center; justify-content:center; flex-shrink:0; border: 1px solid #fee2e2; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.12);">
                        <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                    </div>
                    <div>
                        <h3 style="margin:0; font-size:1.15rem; color:#0f172a; font-weight:800;">${isAr ? 'تأكيد إجراء الحذف' : 'Confirm Deletion'}</h3>
                        <span style="font-size:0.78rem; font-weight:600; color:#ef4444; background:#fef2f2; padding:2px 8px; border-radius:6px; margin-top:4px; display:inline-block;">${isAr ? 'تحذير: لا يمكن التراجع عن هذه العملية' : 'Warning: Cannot be undone'}</span>
                    </div>
                </div>

                <p style="margin:0 0 24px 0; font-size:0.92rem; color:#475569; line-height:1.6; background:#f8fafc; padding:14px; border-radius:10px; border:1px solid #e2e8f0;">
                    ${isAr 
                        ? `هل أنت متأكد من رغبتك في حذف <strong style="color:#0f172a;">"${itemName}"</strong>؟ سيتم مسح هذا العنصر نهائياً.` 
                        : `Are you sure you want to delete <strong style="color:#0f172a;">"${itemName}"</strong>? This action will permanently remove it.`
                    }
                </p>

                <div style="display:flex; justify-content:flex-end; gap:10px;">
                    <button type="button" id="modalStep1CancelBtn" class="confirm-modal-btn confirm-btn-cancel">${isAr ? 'إلغاء' : 'Cancel'}</button>
                    <button type="button" id="modalStep1NextBtn" class="confirm-modal-btn confirm-btn-danger">
                        ${isAr ? 'نعم، متابعة الحذف' : 'Yes, Proceed to Delete'}
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" style="transform:${isAr ? 'rotate(180deg)' : 'none'}"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                    </button>
                </div>
            </div>

            <!-- STEP 2: Password Authorization (Hidden Initially) -->
            <div id="modalStep2" style="display:none;">
                <div style="display:flex; align-items:center; gap:14px; margin-bottom:18px;">
                    <div style="width:52px; height:52px; border-radius:14px; background:#eff6ff; color:#2563eb; display:flex; align-items:center; justify-content:center; flex-shrink:0; border: 1px solid #dbeafe; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.12);">
                        <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><circle cx="12" cy="11" r="3"/><path d="M12 14v3"/></svg>
                    </div>
                    <div>
                        <h3 style="margin:0; font-size:1.15rem; color:#0f172a; font-weight:800;">${isAr ? 'تأكيد كلمة المرور' : 'Admin Password Authorization'}</h3>
                        <span style="font-size:0.78rem; font-weight:600; color:#2563eb; background:#eff6ff; padding:2px 8px; border-radius:6px; margin-top:4px; display:inline-block;">${isAr ? 'مطلوب للمصادقة الأمنية' : 'Required for Security Authorization'}</span>
                    </div>
                </div>

                <p style="margin:0 0 16px 0; font-size:0.88rem; color:#64748b; line-height:1.5;">
                    ${isAr 
                        ? `يرجى إدخال كلمة المرور الخاصة بحسابك للتحقق من الهوية والموافقة على حذف "${itemName}".` 
                        : `Please enter your account password to verify identity and authorize deletion of "${itemName}".`
                    }
                </p>

                <div style="margin-bottom: 22px;">
                    <label style="display:block; font-size:0.85rem; font-weight:700; color:#1e293b; margin-bottom:8px;">${isAr ? 'كلمة المرور الخاصة بك:' : 'Enter your password:'}</label>
                    <div style="position:relative; display:flex; align-items:center;">
                        <input type="password" id="modalDeletePasswordInput" class="modal-pass-input" autocomplete="current-password" placeholder="${isAr ? 'أدخل كلمة المرور هنا...' : 'Enter your password...'}" style="width:100%; height:46px; padding:${isAr ? '0 14px 0 42px' : '0 42px 0 14px'}; border:1px solid #cbd5e1; border-radius:12px; font-size:0.95rem; background:#f8fafc; color:#0f172a; box-sizing:border-box; transition:all 0.2s;">
                        <button type="button" id="togglePasswordEyeBtn" style="position:absolute; ${isAr ? 'left:10px' : 'right:10px'}; background:none; border:none; color:#94a3b8; cursor:pointer; padding:6px; display:flex; align-items:center;">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        </button>
                    </div>
                    <div id="modalDeleteError" style="color:#ef4444; font-size:0.82rem; margin-top:8px; font-weight:600; display:none; background:#fef2f2; padding:8px 12px; border-radius:8px; border:1px solid #fee2e2;"></div>
                </div>

                <div style="display:flex; justify-content:flex-end; gap:10px;">
                    <button type="button" id="modalStep2CancelBtn" class="confirm-modal-btn confirm-btn-cancel">${isAr ? 'إلغاء' : 'Cancel'}</button>
                    <button type="button" id="modalDeleteConfirmBtn" class="confirm-modal-btn confirm-btn-danger">
                        ${isAr ? 'تأكيد الحذف النهائي' : 'Confirm & Delete'}
                    </button>
                </div>
            </div>
        </div>
    `;

    // IMPORTANT: Append to DOM BEFORE attaching event listeners
    document.body.appendChild(overlay);

    // DOM references
    const step1 = overlay.querySelector('#modalStep1');
    const step2 = overlay.querySelector('#modalStep2');
    const step1CancelBtn = overlay.querySelector('#modalStep1CancelBtn');
    const step1NextBtn = overlay.querySelector('#modalStep1NextBtn');
    const step2CancelBtn = overlay.querySelector('#modalStep2CancelBtn');
    const confirmBtn = overlay.querySelector('#modalDeleteConfirmBtn');
    const input = overlay.querySelector('#modalDeletePasswordInput');
    const errorEl = overlay.querySelector('#modalDeleteError');
    const eyeBtn = overlay.querySelector('#togglePasswordEyeBtn');

    const closeModal = () => overlay.remove();

    // Step 1 event listeners
    step1CancelBtn.addEventListener('click', closeModal);
    step1NextBtn.addEventListener('click', () => {
        step1.style.display = 'none';
        step2.style.display = 'block';
        setTimeout(() => {
            input.focus();
        }, 50);
    });

    // Step 2 event listeners
    step2CancelBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });

    // Toggle password eye
    let isPassVisible = false;
    eyeBtn?.addEventListener('click', () => {
        isPassVisible = !isPassVisible;
        input.type = isPassVisible ? 'text' : 'password';
        eyeBtn.style.color = isPassVisible ? '#2563eb' : '#94a3b8';
    });

    const emptyErr = isAr ? 'يرجى إدخال كلمة المرور للتأكيد.' : 'Please enter your password.';
    const invalidErr = isAr ? 'كلمة المرور غير صحيحة. تعذر الحذف.' : 'Incorrect password. Action cancelled.';
    const confirmText = isAr ? 'تأكيد الحذف النهائي' : 'Confirm & Delete';

    const handleConfirm = async () => {
        const password = input.value.trim();
        if (!password) {
            errorEl.textContent = emptyErr;
            errorEl.style.display = 'block';
            input.focus();
            return;
        }

        errorEl.style.display = 'none';
        confirmBtn.disabled = true;
        confirmBtn.style.opacity = '0.7';
        confirmBtn.textContent = isAr ? 'جاري التحقق...' : 'Verifying...';

        try {
            const user = getCurrentUser();
            const username = user?.username || user?.sub || 'admin';
            let verified = false;

            try {
                const res = await authService.login(username, password);
                if (res && (res.token || res.success || res.status === 200)) {
                    verified = true;
                }
            } catch (err) {
                console.warn('Password verification via login API failed:', err);
            }

            if (!verified) {
                errorEl.textContent = invalidErr;
                errorEl.style.display = 'block';
                confirmBtn.disabled = false;
                confirmBtn.style.opacity = '1';
                confirmBtn.textContent = confirmText;
                input.focus();
                return;
            }

            // Execute the onConfirm callback
            // If it throws, the error will be caught and displayed
            await onConfirm();
            
            // If we get here, everything succeeded - close the modal
            closeModal();
        } catch (err) {
            // Display error and keep modal open
            errorEl.textContent = err.message || 'Action failed. Please try again.';
            errorEl.style.display = 'block';
            confirmBtn.disabled = false;
            confirmBtn.style.opacity = '1';
            confirmBtn.textContent = confirmText;
            input.focus();
        }
    };

    confirmBtn.addEventListener('click', handleConfirm);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleConfirm();
    });
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
    // handleUrlParams() used to run HERE, before the departments were fetched.
    // It looks the ?dept= code up in mockDepartments, so it only ever worked
    // for the three departments that were hard-coded into that array at module
    // scope -- ?dept=DESIGN was silently ignored. Now that the list is built
    // entirely from the server, it has to run after the fetch. See below.

    // Show Skeletons before fetching data
    const filesContainerEl = document.getElementById('filesContainer');
    if (filesContainerEl) {
        filesContainerEl.innerHTML = `
            <div class="skeleton-grid-container">
                <div class="global-skeleton skeleton-card"></div>
                <div class="global-skeleton skeleton-card"></div>
                <div class="global-skeleton skeleton-card"></div>
                <div class="global-skeleton skeleton-card"></div>
                <div class="global-skeleton skeleton-card"></div>
                <div class="global-skeleton skeleton-card"></div>
                <div class="global-skeleton skeleton-card"></div>
                <div class="global-skeleton skeleton-card"></div>
            </div>
        `;
    }
    const catContainerEl = document.getElementById('categoriesContainer');
    if (catContainerEl) {
        catContainerEl.innerHTML = `
            <div class="skeleton-grid-container">
                <div class="global-skeleton skeleton-card" style="height:140px;"></div>
                <div class="global-skeleton skeleton-card" style="height:140px;"></div>
                <div class="global-skeleton skeleton-card" style="height:140px;"></div>
                <div class="global-skeleton skeleton-card" style="height:140px;"></div>
            </div>
        `;
    }

    try {
        allFiles = await fileService.getFiles();
    } catch (e) {
        allFiles = [];
    }

    // Departments + programs, filtered and de-duplicated (see mockData.js).
    try {
        hydrateDepartments(await folderService.getFolders(), allFiles);
    } catch (e) {
        console.warn('Could not load folders:', e);
    }

    // Only now can ?dept=CODE be resolved against a real department list.
    handleUrlParams();

    renderDeptSidebar();
    renderDeptSummaryCards();
    renderBreadcrumb();
    renderTitle();
    renderControls();
    renderFilterChips();
    renderCategoriesView();
    updateViewMode();
    applyFilters();

    // Hide Global Loader
    const loader = document.getElementById('global-page-loader');
    if (loader) {
        loader.classList.add('hide-loader');
        setTimeout(() => loader.remove(), 400);
    }
});
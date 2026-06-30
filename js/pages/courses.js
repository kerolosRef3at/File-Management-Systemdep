// js/pages/courses.js
import { renderLayout } from '../shared/layout.js';
import { courseService } from '../shared/services.js';
import { getCurrentUser } from '../shared/auth.js';
import { renderSkeleton, renderEmptyState, showAlert } from '../shared/components.js';
import { mockDepartments } from '../shared/mockData.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = getCurrentUser();
    const isAdmin = user && !['Public User'].includes(user.role);
    const canManageCourses = user && ['Supervisor', 'IT Manager', 'EL Manager', 'Mechanical Manager', 'Mechanic Manager'].includes(user.role);

    let allCourses = [];
    let currentDeptFilter = 'all';
    let currentProgramFilter = 'all'; // متغير الفلتر الفرعي الجديد
    let searchTerm = '';
    let currentPage = 1;
    const coursesPerPage = 6;

    // ============================
    // DECIDE: PUBLIC or ADMIN
    // ============================
    if (isAdmin) {
        renderAdminView();
    } else {
        renderPublicView();
    }

    // ============================
    // PUBLIC VIEW
    // ============================
    function renderPublicView() {
        document.getElementById('publicShell').style.display = 'block';
        document.getElementById('app').style.display = 'none';

        // Handle logged-in navbar state
        const loginBtnEl = document.getElementById('coursesLoginBtn');
        const joinBtnEl = document.getElementById('coursesJoinBtn');
        if (user) {
            if (joinBtnEl) joinBtnEl.style.display = 'none';
            if (loginBtnEl) {
                loginBtnEl.textContent = 'Logout';
                loginBtnEl.style.backgroundColor = '#E63946';
                loginBtnEl.onclick = () => {
                    import('../shared/auth.js').then(auth => auth.logout());
                };
            }
        }

        // Mobile sidebar toggle
        const mobileBtn = document.getElementById('coursesMobileMenuBtn');
        const leftPanel = document.getElementById('coursesLeftPanel');
        const overlay = document.getElementById('courseSidebarOverlay');

        if (mobileBtn && leftPanel && overlay) {
            mobileBtn.addEventListener('click', () => {
                leftPanel.classList.toggle('open');
                overlay.classList.toggle('active');
            });
            overlay.addEventListener('click', () => {
                leftPanel.classList.remove('open');
                overlay.classList.remove('active');
            });
        }

        // Department sidebar tree
        renderPublicDeptTree();

        // Search
        const searchInput = document.getElementById('coursesSearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                searchTerm = searchInput.value.trim().toLowerCase();
                currentPage = 1;
                renderPublicCourses();
            });
        }

        // Load courses
        loadAndRenderPublic();
    }

    async function loadAndRenderPublic() {
        try {
            allCourses = await courseService.getCourses();
            renderPublicCourses();
        } catch (e) {
            document.getElementById('publicCourseGrid').innerHTML = '<p style="text-align:center;color:var(--text-gray);padding:40px;">Failed to load courses.</p>';
        }
    }

    function renderPublicDeptTree() {
        const tree = document.getElementById('coursesDeptTree');
        if (!tree) return;

        let html = '';
        mockDepartments.forEach(dept => {
            const isExpanded = currentDeptFilter === dept.id;
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
                            <div class="dept-program-item ${currentProgramFilter === prog.id ? 'active' : ''}" data-program="${prog.id}" data-dept="${dept.id}">
                                ${prog.name}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        });

        tree.innerHTML = html;

        // 1. Click handlers للأقسام الرئيسية (Departments)
        tree.querySelectorAll('.dept-group-header').forEach(header => {
            header.addEventListener('click', () => {
                const deptId = header.dataset.dept;
                const isOpen = header.classList.contains('expanded');

                tree.querySelectorAll('.dept-group-header').forEach(h => h.classList.remove('expanded'));
                tree.querySelectorAll('.dept-programs').forEach(p => p.classList.remove('open'));

                if (!isOpen) {
                    header.classList.add('expanded');
                    tree.querySelector(`[data-dept-programs="${deptId}"]`).classList.add('open');
                    currentDeptFilter = deptId;
                    currentProgramFilter = 'all'; // تصفير الفلتر الفرعي
                } else {
                    currentDeptFilter = 'all';
                    currentProgramFilter = 'all'; // تصفير الفلتر الفرعي
                }

                // إزالة التحديد عن التخصصات الفرعية
                tree.querySelectorAll('.dept-program-item').forEach(i => i.classList.remove('active'));

                currentPage = 1;
                renderPublicCourses();
            });
        });

        // 2. Click handlers للبرامج الفرعية (Programs)
        tree.querySelectorAll('.dept-program-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation(); // منع تداخل الحدث مع القسم الرئيسي
                
                currentDeptFilter = item.dataset.dept;
                currentProgramFilter = item.dataset.program;
                currentPage = 1;

                // تحديث الـ Active State
                tree.querySelectorAll('.dept-program-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');

                // الحفاظ على القسم الرئيسي مفتوح
                const header = tree.querySelector(`.dept-group-header[data-dept="${currentDeptFilter}"]`);
                const programs = tree.querySelector(`[data-dept-programs="${currentDeptFilter}"]`);
                
                tree.querySelectorAll('.dept-group-header').forEach(h => h.classList.remove('expanded'));
                tree.querySelectorAll('.dept-programs').forEach(p => p.classList.remove('open'));
                
                if (header) header.classList.add('expanded');
                if (programs) programs.classList.add('open');

                renderPublicCourses();
            });
        });
    }

    function renderPublicCourses() {
        const grid = document.getElementById('publicCourseGrid');
        if (!grid) return;

        let filtered = [...allCourses];

        // فلترة بالقسم الرئيسي
        if (currentDeptFilter !== 'all') {
            filtered = filtered.filter(c => c.dept === currentDeptFilter);
        }

        // فلترة بالتخصص الفرعي (البرنامج)
        if (currentProgramFilter !== 'all') {
            filtered = filtered.filter(c => c.category === currentProgramFilter || c.program === currentProgramFilter);
        }

        // فلترة بشريط البحث
        if (searchTerm) {
            filtered = filtered.filter(c =>
                c.title.toLowerCase().includes(searchTerm) ||
                (c.description && c.description.toLowerCase().includes(searchTerm)) ||
                c.dept.toLowerCase().includes(searchTerm)
            );
        }

        const total = filtered.length;
        const totalPages = Math.max(1, Math.ceil(total / coursesPerPage));
        if (currentPage > totalPages) currentPage = totalPages;

        const startIdx = (currentPage - 1) * coursesPerPage;
        const pageCourses = filtered.slice(startIdx, startIdx + coursesPerPage);

        if (total === 0) {
            grid.innerHTML = '<p style="text-align:center;color:var(--text-gray);padding:40px;">No courses match your criteria.</p>';
            document.getElementById('coursesPagination').innerHTML = '';
            return;
        }

        grid.innerHTML = pageCourses.map(course => {
            const deptClass = course.dept.toLowerCase();
            return `
                <div class="course-card-public" data-course-id="${course.id}">
                    <div class="course-card-thumb">
                        <img src="${course.img}" alt="${course.title}" loading="lazy">
                        <div class="course-card-badges">
                            <span class="course-badge-dept ${deptClass}">${course.dept}</span>
                            ${course.category ? `<span class="course-badge-cat">${course.category}</span>` : ''}
                        </div>
                    </div>
                    <div class="course-card-body">
                        <h3>${course.title}</h3>
                        <p class="course-card-desc">${course.description || ''}</p>
                        <div class="course-card-meta">
                            <span>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                                ${course.lessons} Lessons
                            </span>
                            <span>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
                                ${course.size}
                            </span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Card click → course details
        grid.querySelectorAll('.course-card-public').forEach(card => {
            card.addEventListener('click', () => {
                window.location.href = `course-details.html?id=${card.dataset.courseId}`;
            });
        });

        // Pagination
        renderPublicPagination(total, totalPages);
    }

    function renderPublicPagination(total, totalPages) {
        const pag = document.getElementById('coursesPagination');
        if (!pag || totalPages <= 1) {
            if (pag) pag.innerHTML = '';
            return;
        }

        let html = `<button class="repo-page-btn" data-page="prev" ${currentPage === 1 ? 'disabled' : ''}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>`;

        for (let i = 1; i <= totalPages; i++) {
            html += `<button class="repo-page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }

        html += `<button class="repo-page-btn" data-page="next" ${currentPage === totalPages ? 'disabled' : ''}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>`;

        pag.innerHTML = html;

        pag.querySelectorAll('.repo-page-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = btn.dataset.page;
                if (page === 'prev') currentPage = Math.max(1, currentPage - 1);
                else if (page === 'next') currentPage = Math.min(totalPages, currentPage + 1);
                else currentPage = parseInt(page);
                renderPublicCourses();
            });
        });
    }

    // ============================
    // ADMIN VIEW
    // ============================
    function renderAdminView() {
        document.getElementById('publicShell').style.display = 'none';
        document.getElementById('app').style.display = 'block';

        renderLayout('courses');

        const contentArea = document.getElementById('page-content');
        if (!contentArea) return;

        contentArea.innerHTML = `
            <div class="admin-courses-header">
                <div>
                    <h1>Course Repository</h1>
                    <p>Explore and manage standardized academic curriculums for the Faculty of Engineering and Information Technology.</p>
                </div>
                <div class="admin-dept-tabs" id="adminDeptTabs">
                    <button class="admin-dept-tab active" data-dept="all">All Departments</button>
                    <button class="admin-dept-tab" data-dept="IT">IT</button>
                    <button class="admin-dept-tab" data-dept="ME">ME</button>
                    <button class="admin-dept-tab" data-dept="EL">EL</button>
                </div>
            </div>
            <div id="adminAlerts"></div>
            <div class="admin-course-grid" id="adminCourseGrid"></div>
            <div class="admin-course-footer" id="adminCourseFooter" style="display:none;">
                <p>Showing <span id="adminVisibleCount">0</span> of <span id="adminTotalCount">0</span> Courses</p>
                <button class="btn-outline" id="adminLoadMoreBtn">Load More Resources</button>
            </div>
        `;

        // Tab click handlers
        const tabs = document.querySelectorAll('.admin-dept-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                currentDeptFilter = tab.dataset.dept;
                renderAdminCourses();
            });
        });

        // Load More
        document.getElementById('adminLoadMoreBtn').addEventListener('click', () => {
            alert('Loading additional archived curriculum entries...');
        });

        // Top search bar integration
        const layoutSearch = document.getElementById('globalSearchInput');
        if (layoutSearch) {
            layoutSearch.addEventListener('input', (e) => {
                searchTerm = e.target.value.toLowerCase().trim();
                renderAdminCourses();
            });
        }

        loadAndRenderAdmin();
    }

    async function loadAndRenderAdmin() {
        const grid = document.getElementById('adminCourseGrid');
        const alertsContainer = document.getElementById('adminAlerts');

        try {
            allCourses = await courseService.getCourses();
            renderAdminCourses();
        } catch (error) {
            showAlert(alertsContainer, error.message || 'Failed to fetch course repository.', 'error');
            renderEmptyState(grid, 'Unable to load courses.');
        }
    }

    function getDeptBadgeColor(dept) {
        if (dept === 'IT') return 'it';
        if (dept === 'ME') return 'me';
        if (dept === 'EL') return 'el';
        return 'it';
    }

    function renderAdminCourses() {
        const grid = document.getElementById('adminCourseGrid');
        if (!grid) return;

        let filtered = [...allCourses];

        if (currentDeptFilter !== 'all') {
            filtered = filtered.filter(c => c.dept === currentDeptFilter);
        }

        if (searchTerm) {
            filtered = filtered.filter(c => c.title.toLowerCase().includes(searchTerm));
        }

        grid.innerHTML = filtered.map(course => `
            <div class="admin-course-card" data-id="${course.id}">
                <div class="admin-card-thumb">
                    <img src="${course.img}" alt="${course.title}" loading="lazy">
                    <span class="admin-card-badge ${getDeptBadgeColor(course.dept)}">${course.dept}</span>
                </div>
                <div class="admin-card-body">
                    <h3>${course.title}</h3>
                    <div class="admin-card-meta">
                        <span>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                            ${course.lessons} Lessons
                        </span>
                        <span>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
                            ${course.size}
                        </span>
                    </div>
                </div>
            </div>
        `).join('');

        // Add "Upload New Course" card if allowed
        if (canManageCourses) {
            grid.innerHTML += `
                <div class="admin-add-course-card" id="addNewCourseCard">
                    <div class="admin-add-icon">
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    </div>
                    <h3>Upload New Course</h3>
                    <p>Standardize curriculum by adding new course modules to the central repository.</p>
                </div>
            `;
            document.getElementById('addNewCourseCard').addEventListener('click', () => {
                window.location.href = 'create-course.html';
            });
        }

        // Card clicks → course details
        grid.querySelectorAll('.admin-course-card').forEach(card => {
            card.addEventListener('click', () => {
                window.location.href = `course-details.html?id=${card.dataset.id}`;
            });
        });

        // Update counts & footer visibility
        const visible = document.getElementById('adminVisibleCount');
        const total = document.getElementById('adminTotalCount');
        const footer = document.getElementById('adminCourseFooter');
        if (visible) visible.innerText = filtered.length;
        if (total) total.innerText = allCourses.length;
        // Only show footer when there are more than 6 courses (enough to paginate)
        if (footer) {
            footer.style.display = allCourses.length > 6 ? '' : 'none';
        }
    }

    // ============================
    // UTILITY
    // ============================
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
});
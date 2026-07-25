import { renderLayout } from '../shared/layout.js';
import { courseService, folderService, applyCachedImage } from '../shared/services.js';
import { BASE_URL } from '../shared/api.js';
import { resolveCourseImg } from '../shared/assets.js';
import { getCurrentUser } from '../shared/auth.js';
import { renderSkeleton, renderEmptyState, showAlert, showConfirmModal } from '../shared/components.js';
import { mockDepartments, hydrateDepartments } from '../shared/mockData.js';
import { getDeptDisplayName, getCurrentLang } from '../shared/jssharedi18n.js';
import { initCourseBuilder } from './create-course.js';


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


function escapeHtml(str) {
    return String(str == null ? '' : str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

document.addEventListener('DOMContentLoaded', () => {
    const user = getCurrentUser();
    const isAdmin = user && !['Public User'].includes(user.role);
    const canManageCourses = user && canManageContent(user.role);

    let allCourses = [];
    let currentDeptFilter = 'all';
    let currentProgramFilter = 'all';
    let searchTerm = '';
    let currentPage = 1;
    const coursesPerPage = 6;

    // 1. Render layout shell immediately so the page is never blank!
    if (isAdmin) {
        renderAdminView();
    } else {
        renderPublicView();
    }

    // 2. Hide global loader fast
    const dismissLoader = () => {
        const loader = document.getElementById('global-page-loader');
        if (loader) {
            loader.classList.add('hide-loader');
            setTimeout(() => loader.remove(), 250);
        }
    };
    setTimeout(dismissLoader, 150);

    // 3. Load Folders and Courses in background
    (async () => {
        try {
            const [foldersData, coursesData] = await Promise.all([
                folderService.getFolders().catch(() => []),
                courseService.getCourses().catch(() => [])
            ]);

            if (foldersData && foldersData.length) {
                hydrateDepartments(foldersData);
                if (!isAdmin) renderPublicDeptTree();
                // The dept tabs were built from an empty mockDepartments during
                // the initial layout render. Now that departments exist, rebuild
                // them so IT/EL/ME/DESIGN/... actually show up.
                if (isAdmin) rebuildAdminDeptTabs();
            }

            if (coursesData && coursesData.length) {
                allCourses = normalizeCourses(coursesData);
            }

            if (isAdmin) {
                renderAdminCourses();
            } else {
                renderPublicCourses();
            }
        } catch (e) {
            console.warn('Courses data load issue:', e);
        } finally {
            dismissLoader();
        }
    })();

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
        const filterBtn = document.getElementById('coursesMobileFilterBtn');
        const leftPanel = document.getElementById('coursesLeftPanel');
        const overlay = document.getElementById('courseSidebarOverlay');

        const togglePanel = () => {
            leftPanel.classList.toggle('open');
            overlay.classList.toggle('active');
        };

        if (mobileBtn && leftPanel && overlay) mobileBtn.addEventListener('click', togglePanel);
        if (filterBtn && leftPanel && overlay) filterBtn.addEventListener('click', togglePanel);

        if (overlay) {
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

        // Initial skeleton grid
        const grid = document.getElementById('publicCourseGrid');
        if (grid && allCourses.length === 0) {
            grid.innerHTML = `
                <div class="skeleton-grid-container">
                    <div class="global-skeleton skeleton-card"></div>
                    <div class="global-skeleton skeleton-card"></div>
                    <div class="global-skeleton skeleton-card"></div>
                    <div class="global-skeleton skeleton-card"></div>
                    <div class="global-skeleton skeleton-card"></div>
                    <div class="global-skeleton skeleton-card"></div>
                </div>
            `;
        }
    }

    async function loadAndRenderPublic() {
        renderPublicCourses();
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
                        <span class="dept-group-name">${getDeptDisplayName(dept.name)}</span>
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
        const isAr = getCurrentLang() === 'ar';

        if (total === 0) {
            grid.innerHTML = `<p style="text-align:center;color:var(--text-gray);padding:40px;">${isAr ? 'لا توجد كورسات تطابق معاييرك.' : 'No courses match your criteria.'}</p>`;
            document.getElementById('coursesPagination').innerHTML = '';
            return;
        }

        grid.innerHTML = pageCourses.map(course => {
            const deptClass = getDeptBadgeColor(course.dept);
            return `
        <div class="course-card-thumb">
    ${course.img
        ? `<img class="cc-card-img" src="${escapeHtml(resolveCourseImg(course.img))}" alt="${escapeHtml(course.title)}" loading="lazy" onerror="this.style.display='none';this.parentElement.classList.add('no-thumb');">`
        : ''}
    <div class="course-card-badges">
        <span class="course-badge-dept ${deptClass}">${escapeHtml(course.dept)}</span>
        ${course.category ? `<span class="course-badge-cat">${escapeHtml(course.category)}</span>` : ''}
    </div>
</div>
                    <div class="course-card-body">
                        <h3>${escapeHtml(course.title)}</h3>
                        <p class="course-card-desc">${escapeHtml(course.description || '')}</p>
                        <div class="course-card-meta">
                            <span>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                                ${course.lessons} ${isAr ? 'درس' : 'Lessons'}
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

        // Apply cached images for zero-latency load & smooth fallback
        grid.querySelectorAll('.course-card-public').forEach(card => {
            const courseId = card.dataset.courseId;
            const course = pageCourses.find(c => String(c.id) === String(courseId));
            const imgEl = card.querySelector('.cc-card-img');
            if (imgEl && course) {
                applyCachedImage(imgEl, course.img);
            }
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

        const isAr = getCurrentLang() === 'ar';

        contentArea.innerHTML = `
            <div class="admin-courses-header">
                <div>
                    <h1>${isAr ? 'مستودع الكورسات الأكاديمية' : 'Course Repository'}</h1>
                    <p>${isAr ? 'استكشف وادر المناهج الأكاديمية المعتمدة لكلية الهندسة وتكنولوجيا المعلومات.' : 'Explore and manage standardized academic curriculums for the Faculty of Engineering and Information Technology.'}</p>
                </div>
                <div class="admin-dept-tabs" id="adminDeptTabs">
                    <button class="admin-dept-tab active" data-dept="all">${isAr ? 'جميع الأقسام' : 'All Departments'}</button>
                    ${mockDepartments.map(d =>
            `<button class="admin-dept-tab" data-dept="${d.id}">${d.shortName}</button>`
        ).join('')}
                    <button class="admin-dept-tab" id="draftsTabBtn" data-dept="__drafts__"
                        style="margin-left:8px;border:1px dashed #94a3b8;">
                        ${isAr ? 'المسودات' : 'Drafts'} <span id="draftsCountBadge" style="opacity:.7;"></span>
                    </button>
                </div>
            </div>
            <div id="adminAlerts"></div>
            <div class="admin-course-grid" id="adminCourseGrid"></div>
            <div class="admin-course-footer" id="adminCourseFooter" style="display:none;">
                <p>${isAr ? 'عرض' : 'Showing'} <span id="adminVisibleCount">0</span> ${isAr ? 'من أصل' : 'of'} <span id="adminTotalCount">0</span> ${isAr ? 'كورس' : 'Courses'}</p>
                <button class="btn-outline" id="adminLoadMoreBtn">${isAr ? 'تحميل المزيد من الموارد' : 'Load More Resources'}</button>
            </div>
        `;

        // Tab click handlers
        const tabs = document.querySelectorAll('.admin-dept-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                currentDeptFilter = tab.dataset.dept;
                if (currentDeptFilter === '__drafts__') {
                    renderDrafts();
                } else {
                    renderAdminCourses();
                }
            });
        });

        // Show the draft count on the button as soon as the page loads.
        refreshDraftsCount();

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

        if (grid) {
            grid.innerHTML = `
                <div class="skeleton-grid-container">
                    <div class="global-skeleton skeleton-card"></div>
                    <div class="global-skeleton skeleton-card"></div>
                    <div class="global-skeleton skeleton-card"></div>
                    <div class="global-skeleton skeleton-card"></div>
                    <div class="global-skeleton skeleton-card"></div>
                    <div class="global-skeleton skeleton-card"></div>
                </div>
            `;
        }

        try {
            const rawCourses = await courseService.getCourses();
            allCourses = normalizeCourses(rawCourses);
            renderAdminCourses();
        } catch (error) {
            showAlert(alertsContainer, error.message || 'Failed to fetch course repository.', 'error');
            renderEmptyState(grid, 'Unable to load courses.');
        } finally {
            // Hide Global Loader
            const loader = document.getElementById('global-page-loader');
            if (loader) {
                loader.classList.add('hide-loader');
                setTimeout(() => loader.remove(), 400);
            }
        }
    }

    // Only the three original departments have their own badge colour in the
    // stylesheet. Anything else gets the neutral default rather than being
    // painted as IT, which made DESIGN courses look like IT courses.
    function getDeptBadgeColor(dept) {
        const d = String(dept || '').toUpperCase();
        if (d === 'IT') return 'it';
        if (d === 'ME') return 'me';
        if (d === 'EL') return 'el';
        return '';
    }

    // ===== Drafts =========================================================
    // A draft is a course saved with Save Draft: text only, no files, hidden
    // from the public list, auto-deleted after 30 days server-side.

    async function refreshDraftsCount() {
        try {
            const drafts = await courseService.getDrafts();
            const badge = document.getElementById('draftsCountBadge');
            if (badge) badge.textContent = drafts.length ? `(${drafts.length})` : '';
        } catch (e) { /* non-critical */ }
    }

    async function renderDrafts() {
        const grid = document.getElementById('adminCourseGrid');
        const footer = document.getElementById('adminCourseFooter');
        if (footer) footer.style.display = 'none';
        if (!grid) return;

        grid.innerHTML = '<p style="padding:20px;color:#64748b;">Loading drafts...</p>';

        let drafts = [];
        try {
            drafts = await courseService.getDrafts();
        } catch (e) {
            grid.innerHTML = '<p style="padding:20px;color:#dc2626;">Could not load drafts.</p>';
            return;
        }

        // Lay the drafts out in a responsive grid.
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(320px, 1fr))';
        grid.style.gap = '16px';

        if (drafts.length === 0) {
            grid.innerHTML = `
                <div style="padding:40px;text-align:center;color:#64748b;">
                    <p style="font-weight:600;margin-bottom:6px;">No drafts</p>
                    <p style="font-size:0.9rem;">Use <strong>Save Draft</strong> on a new course to keep a work-in-progress here.</p>
                </div>`;
            return;
        }

        grid.innerHTML = drafts.map(d => `
            <div data-draft-id="${d.id}" style="
                background:#fff;border:1px dashed #cbd5e1;border-radius:12px;
                padding:20px;display:flex;flex-direction:column;gap:12px;
                box-shadow:0 1px 3px rgba(0,0,0,0.06);">
                <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                    <span style="background:#fef3c7;color:#92400e;font-size:0.7rem;
                        font-weight:700;letter-spacing:0.03em;padding:3px 8px;border-radius:5px;">DRAFT</span>
                    <span style="background:#eff6ff;color:#1e40af;font-size:0.7rem;
                        font-weight:700;padding:3px 8px;border-radius:5px;">${escapeHtml(d.dept || '')}</span>
                </div>
                <div>
                    <h3 style="font-size:1.15rem;font-weight:700;color:#0f172a;margin:0 0 4px;">
                        ${escapeHtml(d.title || 'Untitled')}</h3>
                    <p style="font-size:0.88rem;color:#64748b;margin:0;line-height:1.5;
                        display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">
                        ${escapeHtml(d.description || 'No description yet.')}</p>
                </div>
                <div style="display:flex;gap:8px;margin-top:4px;">
                    <button class="draft-continue" data-id="${d.id}" style="
                        flex:1;background:#0b3b70;color:#fff;border:none;border-radius:8px;
                        padding:10px;font-weight:600;cursor:pointer;">Continue</button>
                    <button class="draft-delete" data-id="${d.id}" data-title="${escapeHtml(d.title || 'Untitled')}" style="
                        background:#fff;color:#dc2626;border:1px solid #dc2626;border-radius:8px;
                        padding:10px 16px;font-weight:600;cursor:pointer;">Delete</button>
                </div>
            </div>
        `).join('');

        // Continue -> open the create page with this draft id to resume it.
        grid.querySelectorAll('.draft-continue').forEach(btn => {
            btn.addEventListener('click', () => {
                window.location.href = `create-course.html?draft=${btn.dataset.id}`;
            });
        });

        // Delete -> remove the draft (with confirmation).
        grid.querySelectorAll('.draft-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                const isAr = getCurrentLang() === 'ar';
                showConfirmModal({
                    title: isAr ? 'تأكيد حذف المسودة' : 'Confirm Delete Draft',
                    message: isAr 
                        ? `هل أنت متأكد من رغبتك في حذف مسودة "${btn.dataset.title}"؟ لا يمكن التراجع عن هذا الإجراء.` 
                        : `Delete draft "${btn.dataset.title}"? This cannot be undone.`,
                    confirmText: isAr ? 'تأكيد الحذف' : 'Confirm Delete',
                    cancelText: isAr ? 'إلغاء' : 'Cancel',
                    type: 'danger',
                    onConfirm: async () => {
                        try {
                            await courseService.deleteCourse(btn.dataset.id);
                            await renderDrafts();
                            refreshDraftsCount();
                        } catch (e) {
                            alert(isAr ? 'تعذر حذف المسودة.' : 'Could not delete the draft.');
                        }
                    }
                });
            });
        });
    }

    // Rebuild the department tab row from the now-loaded departments, and
    // re-attach the click handlers. Called after hydrateDepartments so the tabs
    // aren't stuck at just "All Departments" + "Drafts".
    function rebuildAdminDeptTabs() {
        const wrap = document.getElementById('adminDeptTabs');
        if (!wrap) return;
        const isAr = (localStorage.getItem('aitu_lang') || 'en') === 'ar';
        wrap.innerHTML =
            `<button class="admin-dept-tab ${currentDeptFilter === 'all' ? 'active' : ''}" data-dept="all">${isAr ? 'جميع الأقسام' : 'All Departments'}</button>` +
            mockDepartments.map(d =>
                `<button class="admin-dept-tab ${currentDeptFilter === d.id ? 'active' : ''}" data-dept="${d.id}">${d.shortName}</button>`
            ).join('') +
            `<button class="admin-dept-tab ${currentDeptFilter === '__drafts__' ? 'active' : ''}" id="draftsTabBtn" data-dept="__drafts__" style="margin-left:8px;border:1px dashed #94a3b8;">Drafts <span id="draftsCountBadge" style="opacity:.7;"></span></button>`;

        wrap.querySelectorAll('.admin-dept-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                wrap.querySelectorAll('.admin-dept-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                currentDeptFilter = tab.dataset.dept;
                if (currentDeptFilter === '__drafts__') renderDrafts();
                else renderAdminCourses();
            });
        });
        refreshDraftsCount();
    }

    function renderAdminCourses() {
        const grid = document.getElementById('adminCourseGrid');
        if (!grid) return;

        // renderDrafts() sets inline grid styles on this element; clear them so
        // the normal course layout (its own CSS class) is restored.
        grid.style.display = '';
        grid.style.gridTemplateColumns = '';
        grid.style.gap = '';

        let filtered = [...allCourses];

        if (currentDeptFilter !== 'all') {
            filtered = filtered.filter(c => c.dept === currentDeptFilter);
        }

        if (searchTerm) {
            filtered = filtered.filter(c => c.title.toLowerCase().includes(searchTerm));
        }

        const isAr = getCurrentLang() === 'ar';

        grid.innerHTML = filtered.map(course => `
<div class="admin-card-thumb" style="position:relative;">
    ${course.img
        ? `<img class="cc-card-img"
                src="${escapeHtml(resolveCourseImg(course.img))}"
                alt="${escapeHtml(course.title)}"
                loading="lazy"
                onerror="this.style.display='none';this.parentElement.classList.add('no-thumb');">`
        : ''}
    <span class="admin-card-badge ${getDeptBadgeColor(course.dept)}">
        ${escapeHtml(course.dept)}
    </span>

    ${canManageCourses ? `
        <button
            type="button"
            class="admin-card-delete-btn"
            data-id="${course.id}"
            data-title="${escapeHtml(course.title)}"
            title="${isAr ? 'حذف الكورس' : 'Delete Course'}"
            style="position:absolute; top:8px; right:8px; background:rgba(239,68,68,0.9); color:white; border:none; border-radius:50%; width:28px; height:28px; cursor:pointer; display:flex; align-items:center; justify-content:center; z-index:10; transition:transform 0.2s;">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
        </button>
    ` : ''}
</div>
                <div class="admin-card-body">
                    <h3>${escapeHtml(course.title)}</h3>
                    <div class="admin-card-meta">
                        <span>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                            ${course.lessons} ${isAr ? 'دروس' : 'Lessons'}
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
                    <h3>${isAr ? 'رفع كورس جديد' : 'Upload New Course'}</h3>
                    <p>${isAr ? 'قم بتوحيد المناهج الأكاديمية عن طريق إضافة كورسات جديدة لمستودع النظام.' : 'Standardize curriculum by adding new course modules to the central repository.'}</p>
                </div>
            `;
            document.getElementById('addNewCourseCard').addEventListener('click', () => {
                openCreateCourseModal();
            });
        }

        // Card delete button handler
        grid.querySelectorAll('.admin-card-delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                const title = btn.dataset.title;
                showConfirmModal({
                    title: isAr ? 'تأكيد حذف الكورس' : 'Confirm Course Deletion',
                    message: isAr 
                        ? `هل أنت متأكد من رغبتك في حذف كورس "${title}" نهائياً؟ هذا الإجراء لا يمكن التراجع عنه.` 
                        : `Are you sure you want to delete course "${title}"? This cannot be undone.`,
                    confirmText: isAr ? 'تأكيد الحذف' : 'Confirm Delete',
                    cancelText: isAr ? 'إلغاء' : 'Cancel',
                    type: 'danger',
                    onConfirm: async () => {
                        try {
                            await courseService.deleteCourse(id);
                            const user = getCurrentUser();
                            logService.addLog(user?.username || 'admin', user?.role || 'Supervisor', 'Delete Course', title);
                            await loadAndRenderAdmin();
                        } catch (e) {
                            alert(isAr ? 'تعذر حذف الكورس.' : 'Could not delete the course.');
                        }
                    }
                });
            });
        });

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

    function openCreateCourseModal(editId = null, draftId = null) {
        const modal = document.getElementById('createCourseModal');
        const modalBody = document.getElementById('createCourseModalBody');
        if (!modal || !modalBody) return;

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        initCourseBuilder(modalBody, (saved) => {
            modal.classList.remove('active');
            document.body.style.overflow = '';
            if (saved) {
                // Refresh courses list
                if (isAdmin) {
                    loadAndRenderAdmin();
                    refreshDraftsCount();
                } else {
                    renderPublicCourses();
                }
            }
        }, editId, draftId);
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

    function normalizeCourses(list) {
        if (!Array.isArray(list)) return [];
        return list.map(c => ({
            ...c,
            id: c.id || c.courseId || Math.random().toString(36).substr(2, 9),
            title: c.title || c.name || c.courseName || 'Untitled Course',
            description: c.description || c.desc || '',
            // No 'IT' fallback: an unlabelled course is not an IT course.
            dept: String(c.dept || c.deptId || c.department || '').toUpperCase(),
            category: c.category || c.program || c.subCategory || '',
            lessons: Number(c.lessons || c.lessonCount || c.totalLessons || 0),
            size: c.size || c.fileSize || '100 MB',
            img: resolveCourseImg(c.img || c.image || c.thumbnail)
        }));
    }
});
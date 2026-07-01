// js/pages/course-details.js
import { courseService, logService } from '../shared/services.js';
import { getCurrentUser } from '../shared/auth.js';
import { renderLayout } from '../shared/layout.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = getCurrentUser();
    const isAdmin = user && !['Public User'].includes(user.role);

    let body = document.getElementById('courseDetailBody');
    if (!body) return;

    // If admin, switch to admin layout and sidebar
    if (isAdmin) {
        const publicShell = document.getElementById('publicShell');
        const app = document.getElementById('app');
        if (publicShell) publicShell.style.display = 'none';
        if (app) app.style.display = 'block';
        renderLayout('courses');
        body = document.getElementById('page-content');
        if (body) body.className = 'course-detail-body';
    }

    // Get Course ID
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('id') || '1';

    // Show Shimmer Loading Skeleton immediately
    if (body) {
        body.innerHTML = `
            <div style="padding: 20px;">
                <div class="global-skeleton" style="height: 24px; width: 220px; margin-bottom: 20px; border-radius: 6px;"></div>
                <div class="global-skeleton" style="height: 40px; width: 55%; margin-bottom: 24px; border-radius: 8px;"></div>
                <div class="global-skeleton" style="height: 260px; width: 100%; margin-bottom: 30px; border-radius: 16px;"></div>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px;">
                    <div class="global-skeleton skeleton-card" style="height: 140px;"></div>
                    <div class="global-skeleton skeleton-card" style="height: 140px;"></div>
                    <div class="global-skeleton skeleton-card" style="height: 140px;"></div>
                </div>
            </div>
        `;
    }

    try {
        let allCourses = [];
        let course = null;
        try { allCourses = await courseService.getCourses(); } catch(e) {}
        try { course = await courseService.getCourseDetails(courseId); } catch(e) {}

        if (!course && Array.isArray(allCourses)) {
            course = allCourses.find(c => String(c.id) === String(courseId) || String(c.courseId) === String(courseId));
        }
        if (!course && Array.isArray(allCourses) && allCourses.length > 0) {
            course = allCourses[0];
        }
        if (!course) throw new Error('Course not found on the server.');

        if (!Array.isArray(course.modules) || course.modules.length === 0) {
            course.modules = [
                {
                    name: course.title || 'Course Modules',
                    desc: course.description || 'Main course content and lessons.',
                    lessons: [
                        { name: 'Introduction & Overview', duration: '15 mins', size: '12 MB', type: 'PDF' },
                        { name: 'Core Lecture Materials', duration: '45 mins', size: '48 MB', type: 'PPTX' }
                    ]
                }
            ];
        }
        if (!Array.isArray(course.resources)) {
            course.resources = [
                { name: 'Course Syllabus', type: 'PDF', size: '2.1 MB' },
                { name: 'Lecture Notes', type: 'PPTX', size: '15.4 MB' }
            ];
        }

        const totalLessons = course.modules.reduce((sum, m) => sum + (Array.isArray(m.lessons) ? m.lessons.length : 0), 0);
        const totalCategories = course.modules.length;

        body.innerHTML = `
            <!-- Breadcrumb -->
            <div class="course-detail-breadcrumb">
                <a href="index.html">Home</a>
                <span class="bc-separator">&rsaquo;</span>
                <a href="courses.html">Courses</a>
                <span class="bc-separator">&rsaquo;</span>
                <span class="bc-current">${course.title}</span>
            </div>

            <!-- Title -->
            <div class="course-detail-title" style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
                <div>
                    <h1>${course.title}</h1>
                    <div class="course-detail-badges">
                        <span class="cd-badge-certified">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                            AITU Certified Materials
                        </span>
                        <span class="cd-meta-text">Archived Resource</span>
                        <span class="cd-meta-dot"></span>
                        <span class="cd-meta-text">Last updated ${course.lastUpdated || 'N/A'}</span>
                    </div>
                </div>
                ${isAdmin ? `
                <div class="admin-course-actions" style="display: flex; gap: 10px;">
                    <button id="btnAdminEditCourse" class="btn-upload" style="background: white; color: var(--primary-dark); border: 1px solid var(--border-color); padding: 8px 16px; border-radius: 6px; font-weight: 600; font-size: 0.9rem; display: flex; align-items: center; gap: 6px; cursor: pointer;">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        Edit Course
                    </button>
                    <button id="btnAdminDeleteCourse" class="btn-upload" style="background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; padding: 8px 16px; border-radius: 6px; font-weight: 600; font-size: 0.9rem; display: flex; align-items: center; gap: 6px; cursor: pointer;">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        Delete
                    </button>
                </div>
                ` : ''}
            </div>

            <!-- Hero Banner -->
            <div class="course-detail-hero">
                <img src="${course.img}" alt="${course.title}" loading="lazy">
                <div class="course-detail-hero-overlay">
                    <div class="hero-package-info">
                        <div class="hero-package-label">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                            Complete Resource Package
                        </div>
                        <div class="hero-package-title">${course.title}</div>
                        <div class="hero-package-desc">All syllabus materials, datasets, and technical documentation included in one download.</div>
                    </div>
                    <div class="hero-size-badge">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                        ${course.size} Total Size
                    </div>
                </div>
            </div>

            <!-- Two Column Layout -->
            <div class="course-detail-layout">
                <div>
                    <!-- Package Overview -->
                    <div class="package-overview">
                        <h2>Package Overview</h2>
                        <p>${course.description || 'No description available.'}</p>
                        <div class="package-overview-stats">
                            <div class="po-stat">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                <strong>Content Type</strong> PDF Guides, Jupyter Notebooks, Datasets.
                            </div>
                            <div class="po-stat">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                <strong>Archived Content</strong> ${totalCategories} Modules • ${totalLessons} Technical Resources.
                            </div>
                        </div>
                    </div>

                    <!-- Resource List -->
                    <div class="resource-list-section">
                        <div class="resource-list-header">
                            <h2>Resource List</h2>
                            <span class="resource-list-count">${totalCategories} Categories • ${totalLessons} Files</span>
                        </div>
                        <div id="moduleAccordion"></div>
                    </div>
                </div>

                <!-- Right Sidebar -->
                <div class="course-detail-sidebar">
                    <!-- Download Bundle -->
                    <div class="download-bundle-card">
                        <h3>Download Bundle</h3>
                        <div class="db-size-badge">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                            ${course.size} Archive Available
                        </div>
                        <div class="db-feature">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                            Official AITU Study Guides
                        </div>
                        <div class="db-feature">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                            Complete historical syllabus
                        </div>
                        <button class="db-download-all-btn" id="downloadAllBtn">
                            Download All Resources
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                        </button>
                    </div>

                    <!-- Author Card -->
                    ${course.author ? `
                    <div class="author-card">
                        <div class="author-card-label">Curriculum Author</div>
                        <div class="author-info">
                            <div class="author-avatar">${course.author.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
                            <div>
                                <div class="author-name">${course.author.name}</div>
                                <div class="author-title">${course.author.title}</div>
                            </div>
                        </div>
                        <p class="author-bio">${course.author.bio}</p>
                        <a href="#" class="author-profile-link">View Faculty Profile</a>
                    </div>
                    ` : ''}

                    <!-- Related Bundles -->
                    ${course.relatedCourses && course.relatedCourses.length > 0 ? `
                    <div class="related-bundles-card">
                        <h4>Related Resource Bundles</h4>
                        ${course.relatedCourses.map(relId => {
                            const rel = allCourses.find(c => c.id === relId);
                            if (!rel) return '';
                            return `
                                <div class="related-bundle-item" data-id="${rel.id}">
                                    <div class="related-bundle-thumb">
                                        <img src="${rel.img}" alt="${rel.title}">
                                    </div>
                                    <div>
                                        <div class="related-bundle-name">${rel.title}</div>
                                        <div class="related-bundle-meta">Resource Archive • ${rel.size}</div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                    ` : ''}
                </div>
            </div>
        `;

        // Render Module Accordion
        const accordion = document.getElementById('moduleAccordion');
        course.modules.forEach((mod, idx) => {
            const isFirst = idx === 0;
            const moduleEl = document.createElement('div');
            moduleEl.className = 'rl-module';
            moduleEl.innerHTML = `
                <div class="rl-module-header ${isFirst ? 'open' : ''}">
                    <div style="display:flex;align-items:center;">
                        <span class="rl-module-num">${String(idx + 1).padStart(2, '0')}</span>
                        <span class="rl-module-name">${mod.name}</span>
                    </div>
                    <svg class="rl-module-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
                <div class="rl-module-content ${isFirst ? 'open' : ''}">
                    ${mod.lessons.map(lesson => `
                        <div class="rl-file-row">
                            <div class="rl-file-name">
                                <svg viewBox="0 0 24 24" fill="none" stroke="${lesson.type === 'video' ? '#9333ea' : '#2563eb'}" stroke-width="2">
                                    ${lesson.type === 'video' ? '<polygon points="5 3 19 12 5 21 5 3"/>' : '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>'}
                                </svg>
                                ${lesson.title}
                            </div>
                            <div class="rl-file-actions">
                                <span class="rl-file-size">${lesson.size || ''}</span>
                                ${isAdmin ? `
                                <button class="rl-file-admin-edit-btn" title="Edit File" style="background:transparent; border:none; cursor:pointer; color: var(--primary-blue);">
                                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                </button>
                                <button class="rl-file-admin-delete-btn" title="Delete File" style="background:transparent; border:none; cursor:pointer; color: #dc2626;">
                                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                </button>
                                ` : ''}
                                <button class="rl-file-download-btn" title="Download">
                                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
            accordion.appendChild(moduleEl);

            // Toggle
            const header = moduleEl.querySelector('.rl-module-header');
            const content = moduleEl.querySelector('.rl-module-content');
            header.addEventListener('click', () => {
                header.classList.toggle('open');
                content.classList.toggle('open');
            });
        });

        // Download individual file buttons
        document.querySelectorAll('.rl-file-download-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                alert('Downloading individual resource file...');
            });
        });

        // Admin Edit individual file buttons
        document.querySelectorAll('.rl-file-admin-edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const newName = prompt('Enter new filename:');
                if (newName && newName.trim() !== '') {
                    // find text node and replace it
                    const nameContainer = e.target.closest('.rl-file-row').querySelector('.rl-file-name');
                    nameContainer.innerHTML = nameContainer.innerHTML.replace(/<\/svg>[\s\S]*$/, '</svg> ' + newName.trim());
                }
            });
        });

        // Admin Delete individual file buttons
        document.querySelectorAll('.rl-file-admin-delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('Are you sure you want to delete this resource?')) {
                    const row = e.target.closest('.rl-file-row');
                    row.style.opacity = '0.5';
                    setTimeout(() => row.remove(), 200);
                }
            });
        });

        // Admin course level actions
        if (isAdmin) {
            const editCourseBtn = document.getElementById('btnAdminEditCourse');
            const deleteCourseBtn = document.getElementById('btnAdminDeleteCourse');
            
            if (editCourseBtn) {
                editCourseBtn.addEventListener('click', () => {
                    window.location.href = `create-course.html?edit=${course.id}`;
                });
            }
            if (deleteCourseBtn) {
                deleteCourseBtn.addEventListener('click', async () => {
                    if (confirm(`Are you sure you want to permanently delete course "${course.title}"?`)) {
                        deleteCourseBtn.disabled = true;
                        deleteCourseBtn.innerText = 'Deleting...';
                        try {
                            await courseService.deleteCourse(course.id);
                            logService.addLog(user?.username || 'admin', user?.role || 'Supervisor', 'Delete Course', course.title);
                            alert('Course deleted successfully.');
                            window.location.href = 'courses.html';
                        } catch (err) {
                            alert('Failed to delete course.');
                            deleteCourseBtn.disabled = false;
                            deleteCourseBtn.innerText = 'Delete';
                        }
                    }
                });
            }
        }

        // Download All → Show Modal
        document.getElementById('downloadAllBtn').addEventListener('click', () => {
            showDownloadModal(course);
        });

        // Related bundles click
        document.querySelectorAll('.related-bundle-item').forEach(item => {
            item.addEventListener('click', () => {
                window.location.href = `course-details.html?id=${item.dataset.id}`;
            });
        });

    } catch (error) {
        body.innerHTML = `<div style="text-align:center;padding:80px 20px;color:var(--text-gray);"><h2 style="color:var(--primary-dark);">Course Not Found</h2><p>${error.message}</p><a href="courses.html" style="color:var(--primary-blue);margin-top:15px;display:inline-block;">Back to Courses</a></div>`;
    } finally {
        // Hide Global Loader
        const loader = document.getElementById('global-page-loader');
        if (loader) {
            loader.classList.add('hide-loader');
            setTimeout(() => loader.remove(), 400);
        }
    }

    // ============================
    // DOWNLOAD MODAL LOGIC
    // ============================
    function showDownloadModal(course) {
        const modal = document.getElementById('courseDownloadModal');
        document.getElementById('modalCourseName').textContent = course.title;
        document.getElementById('modalCourseDesc').textContent = 'Full course resource bundle for guest access.';
        document.getElementById('modalTotalSize').textContent = course.size;

        const grid = document.getElementById('modalContentGrid');
        const iconMap = {
            'PDF': { cls: 'pdf', svg: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>' },
            'PPTX': { cls: 'pptx', svg: '<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>' },
            'ZIP': { cls: 'zip', svg: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>' },
            'MULTI': { cls: 'multi', svg: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>' },
            'XLSX': { cls: 'xlsx', svg: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>' }
        };

        const resources = course.resources || [];
        grid.innerHTML = resources.map(res => {
            const icon = iconMap[res.type] || iconMap['PDF'];
            return `
                <div class="cdm-content-card">
                    <div class="cdm-content-icon ${icon.cls}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${icon.svg}</svg>
                    </div>
                    <div>
                        <div class="cdm-content-name">${res.name}</div>
                        <div class="cdm-content-meta">${res.type} • ${res.size}</div>
                    </div>
                </div>
            `;
        }).join('');

        modal.classList.add('active');
    }

    function hideModal() {
        document.getElementById('courseDownloadModal').classList.remove('active');
    }

    document.getElementById('closeModal').addEventListener('click', hideModal);
    document.getElementById('cancelModal').addEventListener('click', hideModal);
    document.getElementById('confirmModal').addEventListener('click', () => {
        hideModal();
        alert('Downloading complete course archive as ZIP package...');
    });
});
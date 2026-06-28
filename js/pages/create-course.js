// js/pages/create-course.js
import { protectPage } from '../shared/auth.js';
import { courseService } from '../shared/services.js';
import { renderLayout } from '../shared/layout.js';
import { showAlert } from '../shared/components.js';

document.addEventListener('DOMContentLoaded', () => {
    // Route guard
    if (!protectPage(['Supervisor', 'IT Manager', 'EL Manager', 'Mechanical Manager', 'Mechanic Manager'])) {
        return;
    }

    renderLayout('courses');

    const contentArea = document.getElementById('page-content');
    if (!contentArea) return;

    contentArea.innerHTML = `
        <form id="courseBuilderForm">
            <!-- Header -->
            <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom: 30px; flex-wrap:wrap; gap:15px;">
                <div>
                    <h1 style="color: var(--primary-dark); font-size: 2rem;">Create New Course</h1>
                    <p style="color: var(--text-gray);">Drafting specialized academic content for the 2024 Semester.</p>
                </div>
                <div style="display:flex; gap:15px;">
                    <button type="button" class="btn-outline" id="saveDraftBtn">Save Draft</button>
                    <button type="submit" class="btn-primary" id="publishCourseBtn">Publish Course</button>
                </div>
            </div>

            <div id="builderAlerts"></div>

            <div class="create-course-layout">
                <!-- LEFT COLUMN -->
                <div>
                    <!-- Basic Information -->
                    <div class="create-course-section">
                        <div class="create-course-section-title">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
                            Basic Information
                        </div>

                        <div class="form-group" style="margin-bottom:15px;">
                            <label style="display:block; margin-bottom:5px; font-weight:600; font-size:0.9rem;">Course Title</label>
                            <input type="text" class="form-control" id="courseTitle" placeholder="e.g. Advanced Machine Learning for Data Science" required>
                        </div>

                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px; margin-bottom:15px;">
                            <div class="form-group" style="margin-bottom:0;">
                                <label style="display:block; margin-bottom:5px; font-weight:600; font-size:0.9rem;">Department</label>
                                <select class="form-control" id="courseDept" required>
                                    <option value="">Select...</option>
                                    <option value="IT">IT</option>
                                    <option value="ME">ME</option>
                                    <option value="EL">EL</option>
                                </select>
                            </div>
                            <div class="form-group" style="margin-bottom:0;">
                                <label style="display:block; margin-bottom:5px; font-weight:600; font-size:0.9rem;">Category</label>
                                <select class="form-control" id="courseCat">
                                    <option value="UNDERGRAD">Undergraduate</option>
                                    <option value="PROFESSIONAL">Professional</option>
                                    <option value="RESEARCH">Research</option>
                                </select>
                            </div>
                        </div>

                        <div class="form-group" style="margin-bottom:15px;">
                            <label style="display:block; margin-bottom:5px; font-weight:600; font-size:0.9rem;">Course Description</label>
                            <textarea class="form-control" id="courseDescription" rows="4" placeholder="Describe the objectives and learning outcomes..."></textarea>
                        </div>

                        <div class="form-group">
                            <label style="display:block; margin-bottom:5px; font-weight:600; font-size:0.9rem;">Course Thumbnail</label>
                            <div id="thumbnailUpload" style="border:2px dashed #cbd5e1; border-radius:8px; padding:30px; text-align:center; cursor:pointer; background-position:center; background-size:cover;">
                                <input type="file" id="thumbnailInput" accept="image/png, image/jpeg, image/webp" style="display:none;">
                                <div id="thumbnailContent" style="display:flex; flex-direction:column; align-items:center; color:var(--text-gray);">
                                    <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom:10px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                                    <span>Click to upload or drag and drop</span>
                                    <span style="font-size:0.78rem; color:#94a3b8; margin-top:4px;">PNG, JPG or WebP (max. 10MB)</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Content & Asset Management -->
                    <div class="create-course-section">
                        <div class="content-management-header">
                            <div class="create-course-section-title" style="margin-bottom:0;">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                Content & Asset Management
                            </div>
                            <div class="content-tabs">
                                <button type="button" class="content-tab active">Add Single Lesson</button>
                                <button type="button" class="content-tab">Bulk Upload Directory</button>
                            </div>
                        </div>

                        <table class="content-table" id="contentTable">
                            <thead>
                                <tr>
                                    <th>Lesson Title</th>
                                    <th>File Type</th>
                                    <th>Size</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody id="contentTableBody">
                                <tr>
                                    <td><input type="text" class="form-control" value="Introduction to Neural Networks" style="border:none;padding:0;font-weight:500;"></td>
                                    <td><div class="file-type-cell"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#9333ea" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg> Video</div></td>
                                    <td style="color:var(--text-gray);">450 MB</td>
                                    <td>
                                        <div class="action-btns">
                                            <button type="button" class="action-btn" title="Edit"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                                            <button type="button" class="action-btn delete" title="Delete"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td><input type="text" class="form-control" value="Statistical Foundation PDF" style="border:none;padding:0;font-weight:500;"></td>
                                    <td><div class="file-type-cell"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#dc2626" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> PDF</div></td>
                                    <td style="color:var(--text-gray);">12 MB</td>
                                    <td>
                                        <div class="action-btns">
                                            <button type="button" class="action-btn" title="Edit"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                                            <button type="button" class="action-btn delete" title="Delete"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td><input type="text" class="form-control" value="Code Repository (Week 1)" style="border:none;padding:0;font-weight:500;"></td>
                                    <td><div class="file-type-cell"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#16a34a" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg> ZIP</div></td>
                                    <td style="color:var(--text-gray);">750 MB</td>
                                    <td>
                                        <div class="action-btns">
                                            <button type="button" class="action-btn" title="Edit"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                                            <button type="button" class="action-btn delete" title="Delete"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        <div class="package-status-bar">
                            <span class="package-status-label">Downloadable Package Status</span>
                            <span class="package-status-size">Total: 1.2 GB</span>
                        </div>
                    </div>

                    <!-- Publishing Options -->
                    <div class="create-course-section">
                        <div class="create-course-section-title">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                            Publishing Options
                        </div>

                        <div class="publishing-layout">
                            <div>
                                <label style="display:block; margin-bottom:10px; font-weight:600; font-size:0.88rem; color:var(--text-gray);">Visibility Settings</label>
                                <label class="visibility-option" id="visPublic">
                                    <input type="radio" name="visibility" value="public">
                                    <div class="visibility-option-text">
                                        <strong>Public Guest</strong>
                                        <span>Available to anyone with the link</span>
                                    </div>
                                </label>
                                <label class="visibility-option active" id="visStudents">
                                    <input type="radio" name="visibility" value="students" checked>
                                    <div class="visibility-option-text">
                                        <strong>Registered Students</strong>
                                        <span>Students must login to view</span>
                                    </div>
                                </label>
                                <label class="visibility-option" id="visAdmin">
                                    <input type="radio" name="visibility" value="admin">
                                    <div class="visibility-option-text">
                                        <strong>Admin Only</strong>
                                        <span>Only faculty and admins can view</span>
                                    </div>
                                </label>
                            </div>
                            <div>
                                <label style="display:block; margin-bottom:10px; font-weight:600; font-size:0.88rem; color:var(--text-gray);">Download Restrictions</label>
                                <div class="toggle-switch-row">
                                    <div class="toggle-switch-text">
                                        <strong>Enable Guest Downloads</strong>
                                        <span>Allow non-registered users to download assets</span>
                                    </div>
                                    <label class="toggle-switch">
                                        <input type="checkbox" id="guestDownloadToggle">
                                        <span class="toggle-slider"></span>
                                    </label>
                                </div>

                                <div class="create-warning-notice" style="margin-top:15px;">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                                    <p>Changes to visibility might affect existing enrollments. Please verify student quotas before publishing.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- RIGHT COLUMN: Guidelines + Preview -->
                <div>
                    <div class="admin-guidelines-card">
                        <h4>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
                            Admin Guidelines
                        </h4>
                        <div class="guideline-item">
                            <h5>File Naming Conventions</h5>
                            <p>Use lowercase, underscores instead of spaces, and include versioning (e.g. lect_01_v2.mp4).</p>
                        </div>
                        <div class="guideline-item">
                            <h5>Bandwidth Optimization</h5>
                            <p>Target video bitrate of 2500-4500kbps for 1080p content to ensure smooth delivery across campus network segments.</p>
                        </div>
                        <div class="guideline-item">
                            <h5>Thumbnail Specs</h5>
                            <p>Optimal aspect ratio is 16:9. Recommended resolution 1280×720 pixels.</p>
                        </div>
                    </div>

                    <div class="preview-card" id="previewCard">
                        <div class="preview-card-thumb">
                            <img id="previewThumb" src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=500" alt="Preview">
                        </div>
                        <div class="preview-card-body">
                            <div class="preview-mode-label">PREVIEW MODE</div>
                            <h4 id="previewTitle">Course Title Preview</h4>
                            <p>This is how your course will appear to students in the Academic Portal.</p>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    `;

    const alertsContainer = document.getElementById('builderAlerts');
    let thumbnailDataUrl = '';

    // Visibility option active state
    document.querySelectorAll('.visibility-option').forEach(opt => {
        opt.addEventListener('click', () => {
            document.querySelectorAll('.visibility-option').forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
        });
    });

    // Thumbnail upload
    const thumbnailUpload = document.getElementById('thumbnailUpload');
    const thumbnailInput = document.getElementById('thumbnailInput');
    const thumbnailContent = document.getElementById('thumbnailContent');

    if (thumbnailUpload && thumbnailInput) {
        thumbnailUpload.addEventListener('click', () => thumbnailInput.click());
        thumbnailInput.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (event) {
                    thumbnailDataUrl = event.target.result;
                    thumbnailUpload.style.backgroundImage = `url('${thumbnailDataUrl}')`;
                    thumbnailUpload.style.borderStyle = 'solid';
                    thumbnailUpload.style.borderColor = 'var(--border-color)';
                    if (thumbnailContent) thumbnailContent.style.display = 'none';
                    // Update preview
                    const previewThumb = document.getElementById('previewThumb');
                    if (previewThumb) previewThumb.src = thumbnailDataUrl;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Title → Preview sync
    const titleInput = document.getElementById('courseTitle');
    if (titleInput) {
        titleInput.addEventListener('input', () => {
            const previewTitle = document.getElementById('previewTitle');
            if (previewTitle) previewTitle.textContent = titleInput.value || 'Course Title Preview';
        });
    }

    // Delete buttons on content table
    document.querySelectorAll('.action-btn.delete').forEach(btn => {
        btn.addEventListener('click', () => {
            const row = btn.closest('tr');
            if (row) row.remove();
            updatePackageSize();
        });
    });

    function updatePackageSize() {
        const rows = document.querySelectorAll('#contentTableBody tr');
        let totalMB = 0;
        rows.forEach(row => {
            const sizeCell = row.querySelector('td:nth-child(3)');
            if (sizeCell) {
                const text = sizeCell.textContent.trim();
                const match = text.match(/([\d.]+)\s*(MB|GB)/i);
                if (match) {
                    let val = parseFloat(match[1]);
                    if (match[2].toUpperCase() === 'GB') val *= 1024;
                    totalMB += val;
                }
            }
        });
        const sizeStr = totalMB >= 1024 ? `${(totalMB / 1024).toFixed(1)} GB` : `${totalMB.toFixed(0)} MB`;
        const statusSize = document.querySelector('.package-status-size');
        if (statusSize) statusSize.textContent = `Total: ${sizeStr}`;
    }

    // Form submit
    document.getElementById('courseBuilderForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const publishBtn = document.getElementById('publishCourseBtn');
        const title = document.getElementById('courseTitle').value.trim();
        const dept = document.getElementById('courseDept').value;
        const desc = document.getElementById('courseDescription').value.trim();
        const category = document.getElementById('courseCat').value;

        if (!title || !dept) {
            showAlert(alertsContainer, 'Course title and department are required.', 'warning');
            return;
        }

        publishBtn.disabled = true;
        publishBtn.innerText = 'Publishing...';

        const coursePayload = {
            title,
            dept,
            description: desc,
            category,
            img: thumbnailDataUrl || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=500',
            modules: [{ name: 'Module 1', lessons: [] }],
            size: '120 MB'
        };

        try {
            await courseService.createCourse(coursePayload);
            showAlert(alertsContainer, 'Course published successfully! Redirecting...', 'success');
            setTimeout(() => { window.location.href = 'courses.html'; }, 1500);
        } catch (error) {
            showAlert(alertsContainer, error.message || 'Failed to publish course.', 'error');
            publishBtn.disabled = false;
            publishBtn.innerText = 'Publish Course';
        }
    });

    // Save Draft
    document.getElementById('saveDraftBtn').addEventListener('click', () => {
        showAlert(alertsContainer, 'Draft configuration stored locally.', 'success');
    });
});
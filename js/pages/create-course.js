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

                    <!-- Content Builder (Downloadable Modules) -->
                    <div class="create-course-section content-builder-section">
                        <div class="content-builder-header">
                            <div class="content-builder-title-area">
                                <div class="content-builder-icon">
                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                                </div>
                                <div>
                                    <h3 class="content-builder-title">Content Builder (Downloadable Modules)</h3>
                                    <p class="content-builder-subtitle">Modules added here will be available for offline download by students.</p>
                                </div>
                            </div>
                            <div class="content-builder-actions-top">
                                <button type="button" class="cb-btn-bulk-upload" id="bulkUploadBtn">
                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                                    Bulk Upload
                                </button>
                                <button type="button" class="cb-btn-add-lesson" id="addLessonBtn">
                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                    Add Lesson
                                </button>
                            </div>
                        </div>

                        <div class="content-builder-upload-area" id="contentBuilderUploadArea">
                            <div class="cb-lesson-input-row">
                                <div class="cb-lesson-name-group">
                                    <label class="cb-label">Lesson Title (e.g., Introduction to Neural Networks)</label>
                                    <input type="text" class="form-control cb-lesson-title-input" id="lessonTitleInput" placeholder="Enter lesson title...">
                                </div>
                            </div>

                            <div class="cb-file-type-tags">
                                <button type="button" class="cb-file-tag active" data-type="video">
                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                                    Video, mp4
                                </button>
                                <button type="button" class="cb-file-tag" data-type="pdf">
                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                    Syllabus pdf
                                </button>
                                <button type="button" class="cb-file-tag" data-type="video-bulk">
                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/><line x1="17" y1="17" x2="22" y2="17"/></svg>
                                    Add Video(s)
                                </button>
                                <button type="button" class="cb-file-tag" data-type="other">
                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
                                    Other Files
                                </button>
                            </div>

                            <div class="cb-upload-buttons-row">
                                <button type="button" class="cb-upload-single-btn" id="uploadSingleVideoBtn">
                                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                                    <span>Upload Single Video</span>
                                </button>
                                <button type="button" class="cb-upload-multi-btn" id="uploadMultiVideoBtn">
                                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/></svg>
                                    <span>Upload Multiple Videos</span>
                                </button>
                            </div>

                            <input type="file" id="singleFileInput" accept="video/*,application/pdf,.zip,.rar,.doc,.docx,.ppt,.pptx,.xls,.xlsx" style="display:none;">
                            <input type="file" id="multiFileInput" accept="video/*,application/pdf,.zip,.rar,.doc,.docx,.ppt,.pptx,.xls,.xlsx" multiple style="display:none;">

                            <p class="cb-upload-hint">Students can download these files for offline study.</p>
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
                                <button type="button" class="content-tab active" id="tabSingleLesson">Add Single Lesson</button>
                                <button type="button" class="content-tab" id="tabBulkUpload">Bulk Upload Directory</button>
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
                            </tbody>
                        </table>

                        <div id="emptyContentMessage" class="cb-empty-state">
                            <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="#94a3b8" stroke-width="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                            <p>No files uploaded yet. Use the <strong>Content Builder</strong> above to add lessons.</p>
                        </div>

                        <div class="package-status-bar">
                            <span class="package-status-label">Downloadable Package Status</span>
                            <span class="package-status-size">Total: 0 MB</span>
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

    // File type tag toggle
    document.querySelectorAll('.cb-file-tag').forEach(tag => {
        tag.addEventListener('click', () => {
            document.querySelectorAll('.cb-file-tag').forEach(t => t.classList.remove('active'));
            tag.classList.add('active');
        });
    });

    // Content tabs toggle
    document.querySelectorAll('.content-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.content-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
        });
    });

    // Upload file inputs
    const singleFileInput = document.getElementById('singleFileInput');
    const multiFileInput = document.getElementById('multiFileInput');

    document.getElementById('uploadSingleVideoBtn').addEventListener('click', () => {
        singleFileInput.click();
    });

    document.getElementById('uploadMultiVideoBtn').addEventListener('click', () => {
        multiFileInput.click();
    });

    // Also wire the top-level Bulk Upload button
    document.getElementById('bulkUploadBtn').addEventListener('click', () => {
        multiFileInput.click();
    });

    // Add Lesson button scrolls to the upload area
    document.getElementById('addLessonBtn').addEventListener('click', () => {
        const uploadArea = document.getElementById('contentBuilderUploadArea');
        if (uploadArea) {
            uploadArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
            document.getElementById('lessonTitleInput').focus();
        }
    });

    singleFileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            addFilesToTable([e.target.files[0]]);
            singleFileInput.value = '';
        }
    });

    multiFileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            addFilesToTable(Array.from(e.target.files));
            multiFileInput.value = '';
        }
    });

    function getFileTypeInfo(file) {
        const ext = file.name.split('.').pop().toLowerCase();
        const videoExts = ['mp4', 'avi', 'mov', 'mkv', 'webm', 'flv', 'wmv'];
        const pdfExts = ['pdf'];
        const zipExts = ['zip', 'rar', '7z', 'tar', 'gz'];
        const docExts = ['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'];

        if (videoExts.includes(ext)) {
            return { type: 'Video', icon: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#9333ea" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>`, color: '#9333ea' };
        } else if (pdfExts.includes(ext)) {
            return { type: 'PDF', icon: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#dc2626" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`, color: '#dc2626' };
        } else if (zipExts.includes(ext)) {
            return { type: 'ZIP', icon: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#16a34a" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>`, color: '#16a34a' };
        } else if (docExts.includes(ext)) {
            return { type: ext.toUpperCase(), icon: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#2563eb" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`, color: '#2563eb' };
        }
        return { type: ext.toUpperCase() || 'FILE', icon: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#64748b" stroke-width="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>`, color: '#64748b' };
    }

    function formatFileSize(bytes) {
        if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + ' GB';
        if (bytes >= 1048576) return (bytes / 1048576).toFixed(0) + ' MB';
        if (bytes >= 1024) return (bytes / 1024).toFixed(0) + ' KB';
        return bytes + ' B';
    }

    function addFilesToTable(files) {
        const tbody = document.getElementById('contentTableBody');
        const emptyMsg = document.getElementById('emptyContentMessage');
        const table = document.getElementById('contentTable');
        const lessonTitleInput = document.getElementById('lessonTitleInput');

        if (emptyMsg) emptyMsg.style.display = 'none';
        if (table) table.style.display = 'table';

        files.forEach((file, index) => {
            const fileInfo = getFileTypeInfo(file);
            const lessonName = lessonTitleInput.value.trim() || file.name.replace(/\.[^/.]+$/, '');
            const uniqueId = 'upload-' + Date.now() + '-' + index;

            const tr = document.createElement('tr');
            tr.className = 'content-row-animated';
            tr.dataset.sizeBytes = file.size;
            tr.innerHTML = `
                <td>
                    <input type="text" class="form-control" value="${lessonName}" style="border:none;padding:0;font-weight:500;">
                    <div class="upload-progress-container" id="progress-${uniqueId}">
                        <div class="upload-progress-bar-track">
                            <div class="upload-progress-bar-fill" id="bar-${uniqueId}"></div>
                        </div>
                        <span class="upload-progress-text" id="text-${uniqueId}">0%</span>
                    </div>
                </td>
                <td><div class="file-type-cell">${fileInfo.icon} ${fileInfo.type}</div></td>
                <td style="color:var(--text-gray);">${formatFileSize(file.size)}</td>
                <td>
                    <div class="action-btns">
                        <button type="button" class="action-btn" title="Edit"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                        <button type="button" class="action-btn delete" title="Delete"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
                    </div>
                </td>
            `;

            tbody.appendChild(tr);

            // Wire delete button
            tr.querySelector('.action-btn.delete').addEventListener('click', () => {
                tr.style.animation = 'fadeOutRow 0.3s ease forwards';
                setTimeout(() => {
                    tr.remove();
                    updatePackageSize();
                    updateEmptyState();
                }, 300);
            });

            // Simulate upload progress
            simulateProgress(uniqueId);
        });

        // Clear lesson title input after adding
        if (lessonTitleInput) lessonTitleInput.value = '';

        updatePackageSize();
    }

    function simulateProgress(uniqueId) {
        const bar = document.getElementById('bar-' + uniqueId);
        const text = document.getElementById('text-' + uniqueId);
        const container = document.getElementById('progress-' + uniqueId);
        if (!bar || !text || !container) return;

        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 15 + 5;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                bar.style.width = '100%';
                text.textContent = '100%';
                bar.classList.add('upload-complete');
                setTimeout(() => {
                    container.style.animation = 'fadeOutProgress 0.5s ease forwards';
                    setTimeout(() => {
                        container.style.display = 'none';
                    }, 500);
                }, 600);
            } else {
                bar.style.width = progress.toFixed(0) + '%';
                text.textContent = progress.toFixed(0) + '%';
            }
        }, 300 + Math.random() * 200);
    }

    function updateEmptyState() {
        const tbody = document.getElementById('contentTableBody');
        const emptyMsg = document.getElementById('emptyContentMessage');
        const table = document.getElementById('contentTable');
        const hasRows = tbody && tbody.querySelectorAll('tr').length > 0;
        if (emptyMsg) emptyMsg.style.display = hasRows ? 'none' : 'flex';
        if (table) table.style.display = hasRows ? 'table' : 'none';
    }

    // Initial empty state check
    updateEmptyState();

    function updatePackageSize() {
        const rows = document.querySelectorAll('#contentTableBody tr');
        let totalBytes = 0;
        rows.forEach(row => {
            if (row.dataset.sizeBytes) {
                totalBytes += parseInt(row.dataset.sizeBytes) || 0;
            } else {
                const sizeCell = row.querySelector('td:nth-child(3)');
                if (sizeCell) {
                    const text = sizeCell.textContent.trim();
                    const match = text.match(/([\d.]+)\s*(MB|GB|KB|B)/i);
                    if (match) {
                        let val = parseFloat(match[1]);
                        const unit = match[2].toUpperCase();
                        if (unit === 'GB') val *= 1073741824;
                        else if (unit === 'MB') val *= 1048576;
                        else if (unit === 'KB') val *= 1024;
                        totalBytes += val;
                    }
                }
            }
        });
        let sizeStr;
        if (totalBytes >= 1073741824) sizeStr = (totalBytes / 1073741824).toFixed(1) + ' GB';
        else if (totalBytes >= 1048576) sizeStr = (totalBytes / 1048576).toFixed(0) + ' MB';
        else if (totalBytes >= 1024) sizeStr = (totalBytes / 1024).toFixed(0) + ' KB';
        else sizeStr = totalBytes + ' B';
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
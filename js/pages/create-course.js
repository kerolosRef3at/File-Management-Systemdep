// js/pages/create-course.js
import { renderLayout } from '../shared/layout.js';

document.addEventListener('DOMContentLoaded', () => {
    // رسم القائمة الجانبية
    renderLayout('courses');

    const contentArea = document.getElementById('page-content');

    // بناء واجهة الأداة (مع إصلاح الـ Layout)
    contentArea.innerHTML = `
        <form id="courseBuilderForm">
            <div class="page-header-actions" style="margin-bottom: 30px;">
                <div>
                    <a href="courses.html" style="color:var(--text-gray); font-size:0.9rem; display:flex; align-items:center; gap:5px; margin-bottom:10px; text-decoration:none;">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                        Back to Courses
                    </a>
                    <h1 style="color: var(--primary-dark); font-size: 2rem;">Course Builder</h1>
                </div>
                <div style="display:flex; gap:15px;">
                    <button type="button" class="btn-outline">Save Draft</button>
                    <button type="submit" class="btn-primary">Publish Course</button>
                </div>
            </div>

            <div class="builder-grid">
                <div class="form-section">
                    <div class="form-section-title">Course Information</div>
                    
                    <div class="form-group">
                        <label>Course Title</label>
                        <input type="text" class="form-control" id="courseTitle" placeholder="e.g. Advanced Thermodynamics" required>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Department</label>
                            <select class="form-control" id="courseDept" required>
                                <option value="">Select Department...</option>
                                <option value="IT">Information Tech (IT)</option>
                                <option value="ME">Mechanical Eng (ME)</option>
                                <option value="EL">Electrical Eng (EL)</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Course Code (Optional)</label>
                            <input type="text" class="form-control" placeholder="e.g. ME-401">
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Course Description</label>
                        <textarea class="form-control" rows="4" placeholder="Briefly describe what students will learn..."></textarea>
                    </div>

                    <div class="form-group">
                        <label>Course Thumbnail</label>
                        <div class="thumbnail-upload" id="thumbnailUpload">
                            <input type="file" id="thumbnailInput" accept="image/png, image/jpeg, image/gif" style="display: none;">
                            <div id="thumbnailContent" style="display: flex; flex-direction: column; align-items: center; pointer-events: none;">
                                <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom:10px;"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                                <span>Click to upload image</span>
                            </div>
                        </div>
                    </div>
                </div> <div class="form-section">
                    <div class="form-section-title">
                        Curriculum Structure
                        <span style="background:#e0e7ff; color:#4338ca; font-size:0.75rem; padding:3px 8px; border-radius:12px;" id="lessonCountBadge">1 Module</span>
                    </div>

                    <div id="curriculumList">
                        ${createModuleHTML(1)}
                    </div>

                    <button type="button" class="add-lesson-btn" id="addLessonBtn">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        Add New Module
                    </button>
                </div> </div>
        </form>
    `;

    // --- الوظائف الخاصة بالكورسات والمناهج ---
    const curriculumList = document.getElementById('curriculumList');
    const addLessonBtn = document.getElementById('addLessonBtn');
    const lessonCountBadge = document.getElementById('lessonCountBadge');
    let moduleCount = 1;

    // دالة إنشاء كود الوحدة (Module)
    function createModuleHTML(index) {
        const removeBtnHTML = index > 1 ? `
            <button type="button" class="remove-lesson-btn" title="Remove Module">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>` : '';

        return `
            <div class="lesson-item">
                ${removeBtnHTML}
                <div class="lesson-header">
                    <svg class="drag-handle" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                    <span class="lesson-title-label">Module ${index}</span>
                </div>
                <div class="form-group" style="margin-bottom:15px;">
                    <input type="text" class="form-control" placeholder="Module Title (e.g. Chapter 1: Introduction)" required>
                </div>
                
                <div class="module-files-list"></div>

                <div class="form-group" style="margin-bottom:0;">
                    <button type="button" class="btn-outline bulk-upload-btn" style="width:100%; border-style:dashed; display:flex; justify-content:center; gap:8px;">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                        Upload Multiple Videos / Files
                    </button>
                    <input type="file" class="hidden-bulk-input" multiple style="display:none;">
                </div>
            </div>
        `;
    }

    // تفعيل أحداث الرفع المتعدد للملفات
    function attachBulkUploadEvents() {
        document.querySelectorAll('.bulk-upload-btn').forEach(btn => {
            if(!btn.dataset.bound) {
                btn.dataset.bound = "true";
                btn.addEventListener('click', (e) => {
                    const fileInput = e.currentTarget.nextElementSibling;
                    fileInput.click();
                });
            }
        });

        document.querySelectorAll('.hidden-bulk-input').forEach(input => {
            if(!input.dataset.bound) {
                input.dataset.bound = "true";
                input.addEventListener('change', (e) => {
                    const filesListContainer = e.currentTarget.closest('.lesson-item').querySelector('.module-files-list');
                    
                    // الدوران على كل الملفات المختارة وإضافتها
                    Array.from(e.target.files).forEach(file => {
                        // إزالة امتداد الملف من الاسم (مثلاً: video.mp4 -> video)
                        const fileNameWithoutExt = file.name.split('.').slice(0, -1).join('.') || file.name;

                        const fileDiv = document.createElement('div');
                        fileDiv.className = 'file-sub-item';
                        fileDiv.innerHTML = `
                            <div class="file-sub-item-icon">
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><circle cx="12" cy="14" r="3"/><line x1="12" y1="17" x2="12" y2="17.01"/></svg>
                            </div>
                            <input type="text" value="${fileNameWithoutExt}">
                            <button type="button" class="remove-file-btn" title="Remove file">&times;</button>
                        `;
                        
                        filesListContainer.appendChild(fileDiv);

                        // تفعيل زر حذف الملف الفرعي
                        fileDiv.querySelector('.remove-file-btn').addEventListener('click', () => {
                            fileDiv.remove();
                        });
                    });

                    // تفريغ الـ input عشان لو حب يختار نفس الملفات تاني يقبل
                    e.target.value = '';
                });
            }
        });
    }

    // إضافة Module جديد
    addLessonBtn.addEventListener('click', () => {
        moduleCount++;
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = createModuleHTML(moduleCount);
        curriculumList.appendChild(tempDiv.firstElementChild);
        
        updateModuleCount();
        attachRemoveEvents();
        attachBulkUploadEvents();
    });

    // حذف Module
    function attachRemoveEvents() {
        document.querySelectorAll('.remove-lesson-btn').forEach(btn => {
            if(!btn.dataset.bound) {
                btn.dataset.bound = "true";
                btn.addEventListener('click', function(e) {
                    const item = e.currentTarget.closest('.lesson-item');
                    item.remove();
                    updateModuleCount();
                    reindexModules();
                });
            }
        });
    }

    function reindexModules() {
        const labels = document.querySelectorAll('.lesson-title-label');
        labels.forEach((label, index) => {
            label.innerText = `Module ${index + 1}`; 
        });
        moduleCount = labels.length;
    }

    function updateModuleCount() {
        const total = document.querySelectorAll('.lesson-item').length;
        lessonCountBadge.innerText = `${total} Module${total > 1 ? 's' : ''}`;
    }

    // --- تفعيل الصورة المصغرة (Thumbnail) ---
    const thumbnailUpload = document.getElementById('thumbnailUpload');
    const thumbnailInput = document.getElementById('thumbnailInput');
    const thumbnailContent = document.getElementById('thumbnailContent');

    if (thumbnailUpload && thumbnailInput) {
        thumbnailUpload.addEventListener('click', () => thumbnailInput.click());

        thumbnailInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    thumbnailUpload.style.backgroundImage = `url('${event.target.result}')`;
                    thumbnailUpload.style.borderStyle = 'solid';
                    thumbnailUpload.style.borderColor = 'var(--border-color)';
                    if (thumbnailContent) thumbnailContent.style.display = 'none';
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // التنفيذ الأولي
    attachRemoveEvents();
    attachBulkUploadEvents();
});
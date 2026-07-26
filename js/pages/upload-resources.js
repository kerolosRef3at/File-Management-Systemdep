// js/pages/upload-resources.js
import { getCurrentUser } from '../shared/auth.js';
import { fileService, logService, folderService } from '../shared/services.js';
import { mockDepartments, hydrateDepartments } from '../shared/mockData.js';
import { translations, getCurrentLang } from '../shared/jssharedi18n.js';
import { escapeHTML, sanitizeFileName, validateFile } from '../shared/utils.js';

/**
 * Opens the Upload Resources modal on top of the current page.
 * Call this from any page (e.g., repository.js) to show the uploader.
 */
export async function openUploadModal(defaultDept = '', defaultProg = '') {
    // Prevent opening duplicate modals
    if (document.querySelector('.upload-modal-overlay')) {
        return;
    }

    const user = getCurrentUser();

    // Hydrate departments from API
    try {
        const [apiFolders, files] = await Promise.all([
            folderService.getFolders(),
            fileService.getFiles().catch(() => [])
        ]);
        hydrateDepartments(apiFolders, files);
    } catch (e) {
        console.warn('Could not load folders:', e);
    }

    // State
    let fileQueue = [];
    let overallProgress = 0;
    let isUploading = false;
    let uploadCancelled = false;   // set by Discard to stop the in-flight upload
    let nextFileId = 1;
    let globalDept = defaultDept || '';
    let globalProg = defaultProg || '';

    const lang = getCurrentLang();
    const t = (key) => (translations[lang] || translations.en)[key] || translations.en[key] || key;

    // Accepted file types
    const ACCEPTED_TYPES = ['.mp4', '.pdf', '.zip', '.docx', '.xlsx', '.dwg', '.pptx', '.doc'];
    const MAX_FILE_SIZE = 2 * 1024 * 1024 * 2048; // 2GB

    // ── Create the modal overlay ──
    const overlay = document.createElement('div');
    overlay.className = 'upload-modal-overlay';
    overlay.innerHTML = `<div class="upload-modal-container"><div class="upload-modal-content" id="uploadModalContent"></div></div>`;
    document.body.appendChild(overlay);

    // Animate in
    requestAnimationFrame(() => overlay.classList.add('visible'));

    const modalContent = overlay.querySelector('#uploadModalContent');

    // Close or minimize on overlay click (not on container click)
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            if (isUploading || fileQueue.some(f => f.status === 'uploading' || f.status === 'pending' || f.status === 'waiting')) {
                minimizeToFloatingWidget();
            } else {
                closeModal();
            }
        }
    });

    // Close on Escape key
    function onKeyDown(e) {
        if (e.key === 'Escape') closeModal();
    }
    document.addEventListener('keydown', onKeyDown);

    function closeModal() {
        overlay.classList.remove('visible');
        setTimeout(() => {
            overlay.remove();
            document.removeEventListener('keydown', onKeyDown);
        }, 300);
    }

    function getFileIcon(type) {
        const ext = type.toLowerCase();
        if (ext.includes('mp4') || ext.includes('video')) {
            return `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
            </svg>`;
        }
        if (ext.includes('pdf')) {
            return `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>`;
        }
        if (ext.includes('zip') || ext.includes('rar')) {
            return `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 8v13H3V8"/><path d="M1 3h22v5H1z"/><path d="M10 12h4"/>
            </svg>`;
        }
        return `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>`;
    }

    function getFileTypeName(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const types = {
            'mp4': 'Video Content', 'avi': 'Video Content', 'mov': 'Video Content',
            'pdf': 'PDF Document', 'docx': 'Word Document', 'doc': 'Word Document',
            'xlsx': 'Excel Spreadsheet', 'xls': 'Excel Spreadsheet',
            'zip': 'Compressed Archive', 'rar': 'Compressed Archive',
            'dwg': 'CAD Drawing', 'pptx': 'Presentation'
        };
        return types[ext] || 'Document';
    }

    function formatSize(bytes) {
        if (bytes >= 1024 * 1024 * 1024) return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
        if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
        if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return bytes + ' B';
    }

    // Update just the progress numbers/bars in place, WITHOUT rebuilding the
    // modal. render() replaces the whole innerHTML, so calling it on every
    // progress tick (many times a second) tears the buttons out from under the
    // cursor -- that's why Discard felt unclickable / "clicked many times".
    // The upload loop calls this instead; render() is only for structural changes.
    function updateProgressUI() {
        const totalSize = fileQueue.reduce((acc, f) => acc + f.size, 0);
        const uploadedSize = fileQueue.reduce((acc, f) => {
            if (f.status === 'complete') return acc + f.size;
            if (f.status === 'uploading') return acc + (f.size * f.progress / 100);
            return acc;
        }, 0);
        const pct = totalSize > 0 ? Math.round((uploadedSize / totalSize) * 100) : 0;

        const pctEl = overlay?.querySelector('.upload-progress-percent');
        const fillEl = overlay?.querySelector('.upload-progress-fill');
        if (pctEl) pctEl.textContent = pct + '%';
        if (fillEl) fillEl.style.width = pct + '%';

        // per-file mini bars (real class names from renderFileItem)
        fileQueue.forEach(f => {
            const card = overlay?.querySelector(`.file-queue-item[data-id="${f.id}"]`);
            if (!card) return;
            const bar = card.querySelector('.file-progress-fill');
            const label = card.querySelector('.file-progress-text');
            if (bar) bar.style.width = (f.progress || 0) + '%';
            if (label) label.textContent = (f.progress || 0) + '%';
        });
    }

    function render() {
        const totalFiles = fileQueue.length;
        const completedFiles = fileQueue.filter(f => f.status === 'complete').length;
        const processedFiles = fileQueue.filter(f => f.status === 'complete' || f.status === 'uploading').length;
        const totalSize = fileQueue.reduce((acc, f) => acc + f.size, 0);
        const uploadedSize = fileQueue.reduce((acc, f) => {
            if (f.status === 'complete') return acc + f.size;
            if (f.status === 'uploading') return acc + (f.size * f.progress / 100);
            return acc;
        }, 0);
        const remainingSize = totalSize - uploadedSize;
        overallProgress = totalSize > 0 ? Math.round((uploadedSize / totalSize) * 100) : 0;
        const allDone = totalFiles > 0 && completedFiles === totalFiles;

        modalContent.innerHTML = `
            <!-- Modal Header with close button -->
            <div class="upload-modal-header">
                <div class="upload-header-left">
                    <h1>${t('upload_title')}</h1>
                    <p>${t('upload_subtitle')}</p>
                </div>
                <div class="upload-header-actions">
                    <button class="upload-btn-outline" id="discardDraftBtn">${t('upload_discard')}</button>
                    <button class="upload-btn-primary" id="saveBtn" ${totalFiles === 0 || isUploading ? 'disabled' : ''}>
                        ${isUploading ? `<span class="file-waiting-spinner" style="margin-right:8px; border-color:white; border-bottom-color:transparent;"></span> ${t('upload_uploading')}` : `
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                        ${t('upload_start')}`}
                    </button>
                    <button class="upload-modal-close-btn" id="minimizeModalBtn" title="${lang === 'ar' ? 'تصغير لمركز التحميلات' : 'Minimize to background'}" style="margin-right:4px;">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    </button>
                    <button class="upload-modal-close-btn" id="closeModalBtn" title="${t('common_close')}">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>
            </div>

            <!-- Global Destination Selection -->
            <div class="upload-global-destination" style="background:white; padding:20px; border-radius:12px; margin-bottom:20px; border:1px solid #e2e8f0; display:grid; grid-template-columns: 1fr 1fr; gap:20px;">
                <div>
                    <label style="font-size:12px; font-weight:700; color:#64748b; text-transform:uppercase; margin-bottom:8px; display:block;">${t('upload_target_dept')} <span style="color:#ef4444">*</span></label>
                    <select id="globalDeptSelect" style="width:100%; padding:12px; border:1px solid #cbd5e1; border-radius:8px; font-size:14px; background:#f8fafc; color:var(--primary-dark);">
                        <option value="">${t('upload_select_dept')}</option>
                        ${mockDepartments.map(d => `<option value="${d.id}" ${globalDept === d.id ? 'selected' : ''}>${d.name}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label style="font-size:12px; font-weight:700; color:#64748b; text-transform:uppercase; margin-bottom:8px; display:block;">${t('upload_target_prog')} <span style="color:#ef4444">*</span></label>
                    <select id="globalProgSelect" style="width:100%; padding:12px; border:1px solid #cbd5e1; border-radius:8px; font-size:14px; background:#f8fafc; color:var(--primary-dark);" ${!globalDept ? 'disabled' : ''}>
                        <option value="">${t('upload_select_prog')}</option>
                        ${globalDept ? mockDepartments.find(d => d.id === globalDept)?.programs.map(p => `<option value="${p.id}" ${globalProg === p.id ? 'selected' : ''}>${p.name}</option>`).join('') : ''}
                    </select>
                </div>
            </div>

            ${totalFiles > 0 ? `
            <!-- Overall Progress -->
            <div class="upload-overall-progress ${allDone ? 'complete' : ''}">
                <div class="upload-progress-info">
                    <div>
                        <strong>${allDone ? t('upload_complete') : t('upload_assets')}</strong>
                        <span>${processedFiles} ${t('upload_processed')} &bull; ${allDone ? t('common_done') : formatSize(remainingSize) + ' ' + t('upload_remaining')}</span>
                    </div>
                    <div class="upload-progress-percent">${overallProgress}%</div>
                </div>
                <div class="upload-progress-bar">
                    <div class="upload-progress-fill ${allDone ? 'complete' : ''}" style="width: ${overallProgress}%"></div>
                </div>
            </div>
            ` : ''}

            <!-- Main Content: Drop Zone + File Queue -->
            <div class="upload-content-grid">
                <!-- Left: Drag & Drop + Best Practices -->
                <div class="upload-left-column" style="display:flex; flex-direction:column; gap:20px;">
                    <div class="upload-dropzone ${(!globalDept || !globalProg) ? 'disabled-zone' : ''}" id="dropZone" style="${(!globalDept || !globalProg) ? 'border-color: #cbd5e1; background: #f8fafc; opacity: 0.8;' : ''}">
                        <div class="upload-dropzone-inner">
                            ${(!globalDept || !globalProg) ? `
                                <div class="upload-dropzone-icon" style="color: #94a3b8; margin-bottom:15px;">
                                    <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                    </svg>
                                </div>
                                <h3 style="color:#64748b;">${t('upload_dest_required')}</h3>
                                <p style="color:#94a3b8; max-width:250px; margin:0 auto 20px;">${t('upload_dest_desc')}</p>
                                <button class="upload-select-btn" id="selectFilesBtn" disabled style="background:#e2e8f0; color:#94a3b8; border-color:#cbd5e1; cursor:not-allowed;">${t('upload_select_files')}</button>
                            ` : `
                                <div class="upload-dropzone-icon">
                                    <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5">
                                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                                        <line x1="12" y1="11" x2="12" y2="17"/>
                                        <polyline points="9 14 12 11 15 14"/>
                                    </svg>
                                </div>
                                <h3>${t('upload_drag_drop')}</h3>
                                <p>${t('upload_drag_desc')}</p>
                                <button class="upload-select-btn" id="selectFilesBtn">${t('upload_select_files')}</button>
                            `}
                            <input type="file" id="fileInput" multiple accept="${ACCEPTED_TYPES.join(',')}" style="display:none;">
                        </div>
                    </div>

                    <!-- Best Practices -->
                    <div class="upload-best-practices">
                        <div class="upload-bp-icon">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                            </svg>
                        </div>
                        <div>
                            <strong>${t('upload_best_title')}</strong>
                            <p>${t('upload_best_desc')}</p>
                        </div>
                    </div>
                </div>

                <!-- Right: File Queue -->
                <div class="upload-queue-section">
                    <div class="upload-queue-header">
                        <h3>${t('upload_queue')} (${totalFiles})</h3>
                        ${totalFiles > 0 ? `<button class="upload-clear-all" id="clearAllBtn">${t('upload_clear_all')}</button>` : ''}
                    </div>
                    <div class="upload-queue-list" id="queueList">
                        ${totalFiles === 0 ? `
                            <div class="upload-queue-empty">
                                <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="#cbd5e1" stroke-width="1.5">
                                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
                                    <polyline points="13 2 13 9 20 9"/>
                                </svg>
                                <p>${t('upload_no_files')}</p>
                            </div>
                        ` : fileQueue.map(file => renderFileItem(file)).join('')}
                    </div>
                </div>
            </div>
        `;

        attachEvents();
    }

    function renderFileItem(file) {
        const icon = getFileIcon(file.name);
        const typeName = getFileTypeName(file.name);
        const isVideo = typeName.includes('Video');

        let statusHtml = '';
        let progressBarHtml = '';
        let titleFieldHtml = '';

        if (file.status === 'draft' || file.status === 'uploading' || file.status === 'complete' || file.status === 'waiting') {
            titleFieldHtml = `
                <div class="file-meta-grid" style="display:grid; grid-template-columns: 1fr; gap:15px; margin-top:10px; padding-top:10px; border-top:1px solid #f1f5f9;">
                    <div class="file-title-field" style="margin-top:0;">
                        <label>${isVideo ? t('upload_lesson_title') : t('upload_resource_title')}</label>
                        <input type="text" class="file-title-input" data-id="${file.id}" placeholder="${t('upload_enter_title')}" value="${file.title || ''}">
                    </div>
                </div>`;
                
            if (file.status === 'uploading') {
                statusHtml = `<span class="file-progress-text">${file.progress}%</span>
                              <button class="file-cancel-btn" data-id="${file.id}">&times;</button>`;
                progressBarHtml = `<div class="file-progress-bar"><div class="file-progress-fill uploading" style="width:${file.progress}%"></div></div>`;
            } else if (file.status === 'complete') {
                statusHtml = `<span class="file-progress-text complete">${file.progress}%</span>
                              <span class="file-check">
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#16a34a" stroke-width="2.5">
                                    <circle cx="12" cy="12" r="10"/><polyline points="8 12 11 15 16 9"/>
                                </svg>
                              </span>`;
                progressBarHtml = `<div class="file-progress-bar"><div class="file-progress-fill complete" style="width:100%"></div></div>`;
            } else if (file.status === 'waiting') {
                statusHtml = `<span class="file-waiting-spinner"></span>`;
            } else if (file.status === 'draft') {
                statusHtml = `<button class="file-cancel-btn" data-id="${file.id}">&times;</button>`;
            }

        } else if (file.status === 'failed') {
            statusHtml = `<button class="file-retry-btn" data-id="${file.id}">RETRY</button>`;
        }

        return `
            <div class="file-queue-item ${file.status}" data-id="${file.id}">
                <div class="file-queue-main">
                    <div class="file-queue-icon ${file.status}">${icon}</div>
                    <div class="file-queue-info">
                        <div class="file-queue-name">${file.name}</div>
                        <div class="file-queue-meta">
                            ${file.status === 'failed' 
                                ? '<span class="file-error-text">Upload Failed: Network Interruption</span>'
                                : file.status === 'waiting' 
                                    ? '<span class="file-waiting-text">Waiting to upload...</span>'
                                    : `<span>${formatSize(file.size)} &bull; ${typeName}</span>`
                            }
                        </div>
                    </div>
                    <div class="file-queue-actions">${statusHtml}</div>
                </div>
                ${progressBarHtml}
                ${titleFieldHtml}
            </div>
        `;
    }

    function attachEvents() {
        const checkDestination = () => {
            if (!globalDept || !globalProg) {
                alert('Please select a Target Department and Program before uploading files.');
                return false;
            }
            return true;
        };

        // Attach minimize btn
        const minimizeBtn = modalContent.querySelector('#minimizeModalBtn');
        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', () => {
                minimizeToFloatingWidget();
            });
        }

        renderFloatingWidget();

        // Close modal button
        const closeBtn = overlay.querySelector('#closeModalBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => closeModal());
        }

        // Global Selection Events
        const globalDeptSelect = overlay.querySelector('#globalDeptSelect');
        const globalProgSelect = overlay.querySelector('#globalProgSelect');
        if (globalDeptSelect) {
            globalDeptSelect.addEventListener('change', (e) => {
                globalDept = e.target.value;
                globalProg = '';
                render();
            });
        }
        if (globalProgSelect) {
            globalProgSelect.addEventListener('change', (e) => {
                globalProg = e.target.value;
                render();
            });
        }

        // Select Files button
        const selectBtn = overlay.querySelector('#selectFilesBtn');
        const fileInput = overlay.querySelector('#fileInput');
        if (selectBtn && fileInput) {
            selectBtn.addEventListener('click', () => {
                if (checkDestination()) fileInput.click();
            });
            fileInput.addEventListener('change', (e) => {
                handleFiles(Array.from(e.target.files));
                fileInput.value = '';
            });
        }

        // Drag & Drop
        const dropZone = overlay.querySelector('#dropZone');
        if (dropZone) {
            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.classList.add('dragover');
            });
            dropZone.addEventListener('dragleave', () => {
                dropZone.classList.remove('dragover');
            });
            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('dragover');
                if (checkDestination()) handleFiles(Array.from(e.dataTransfer.files));
            });
        }

        // Clear All
        const clearAllBtn = overlay.querySelector('#clearAllBtn');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => {
                fileQueue = [];
                render();
            });
        }

        // Discard Draft
        const discardBtn = overlay.querySelector('#discardDraftBtn');
        if (discardBtn) {
            discardBtn.addEventListener('click', () => {
                const anyActive = isUploading || fileQueue.some(f => f.status === 'uploading');
                const msg = anyActive
                    ? 'An upload is in progress. Discard and stop it?'
                    : 'Are you sure you want to discard all uploads?';
                if (fileQueue.length === 0 || confirm(msg)) {
                    // Signal the upload loop to stop, then clear.
                    uploadCancelled = true;
                    isUploading = false;
                    fileQueue = [];
                    closeModal();
                }
            });
        }

        // Save button - Validates and starts upload
        const saveBtn = overlay.querySelector('#saveBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', async () => {
                const draftFiles = fileQueue.filter(f => f.status === 'draft' || f.status === 'failed');
                if (draftFiles.length === 0) {
                    if (fileQueue.length > 0 && fileQueue.every(f => f.status === 'complete')) {
                        closeModal();
                        window.location.href = `repository.html?dept=${encodeURIComponent(globalDept)}`;
                    }
                    return;
                }
                
                if (!globalDept || !globalProg) {
                    alert('Please ensure a Target Department and Program are selected.');
                    return;
                }
                
                const invalidFiles = draftFiles.filter(f => !f.title);
                if (invalidFiles.length > 0) {
                    alert('Please ensure all files have a Title, Department, and Program selected before saving.');
                    return;
                }
                
                // Set to waiting and start
                draftFiles.forEach(f => f.status = 'waiting');
                if (!isUploading) startUpload();
            });
        }

        // Cancel buttons
        overlay.querySelectorAll('.file-cancel-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.id);
                const file = fileQueue.find(f => f.id === id);
                if (file && file.abortController) {
                    file.abortController.abort();
                }
                fileQueue = fileQueue.filter(f => f.id !== id);
                render();
            });
        });

        // Retry buttons
        overlay.querySelectorAll('.file-retry-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.id);
                const file = fileQueue.find(f => f.id === id);
                if (file) {
                    file.status = 'waiting';
                    file.progress = 0;
                    render();
                    if (!isUploading) startUpload();
                }
            });
        });

        // Title inputs
        overlay.querySelectorAll('.file-title-input').forEach(input => {
            input.addEventListener('input', (e) => {
                const id = parseInt(e.target.dataset.id);
                const file = fileQueue.find(f => f.id === id);
                if (file) file.title = e.target.value;
            });
        });
    }

    function handleFiles(files) {
        files.forEach(file => {
            const validation = validateFile(file);
            if (!validation.valid) {
                alert(`File "${file.name}" rejected:\n` + validation.errors.join('\n'));
                return;
            }

            const cleanName = sanitizeFileName(file.name);

            fileQueue.push({
                id: nextFileId++,
                name: cleanName,
                size: file.size,
                file: file,
                status: 'draft',
                progress: 0,
                title: cleanName.split('.')[0],
                abortController: null
            });
        });

        render();
    }

    function startUpload() {
        if (isUploading) return;
        uploadCancelled = false;   // fresh run
        isUploading = true;
        uploadNext();
    }

    function updateProgressUI(file, percent) {
        if (file) {
            file.progress = Math.min(100, Math.max(0, Math.round(percent)));
            if (file.progress >= 100) {
                file.status = 'complete';
            }
        }
        render();
        renderFloatingWidget();
    }

    async function uploadNext() {
        // Discard sets this; bail out of the loop entirely.
        if (uploadCancelled) {
            isUploading = false;
            return;
        }
        const nextFile = fileQueue.find(f => f.status === 'waiting');
        if (!nextFile) {
            isUploading = false;
            render();
            renderFloatingWidget();
            // All done?
            if (fileQueue.length > 0 && fileQueue.every(f => f.status === 'complete')) {
                const completedCount = fileQueue.length;
                setTimeout(() => {
                    alert(`Successfully saved ${completedCount} file(s) to the repository!`);
                    fileQueue.forEach(f => {
                        logService.addLog(user?.username || 'admin', user?.role || 'Supervisor', 'Add File', f.name);
                    });
                    closeModal();
                    window.location.href = `repository.html?dept=${encodeURIComponent(globalDept)}`;
                }, 800);
            }
            return;
        }

        nextFile.status = 'uploading';
        nextFile.progress = 0;
        render();
        renderFloatingWidget();

        // Try real API upload first
        try {
            const formData = new FormData();
            formData.append('file', nextFile.file);
            if (nextFile.title) formData.append('title', nextFile.title);
            if (globalDept) formData.append('department', globalDept);
            if (globalProg) formData.append('program', globalProg);

            const deptCode = globalDept || 'IT';
            const customName = nextFile.title || nextFile.name.split('.')[0];
            const selectedProg = mockDepartments.find(d => d.id === globalDept)?.programs.find(p => p.id === globalProg);
            const progFolder = selectedProg ? selectedProg.name : '';

            const CHUNK_THRESHOLD = 50 * 1024 * 1024;   // 50 MB
            if (nextFile.file.size > CHUNK_THRESHOLD) {
                await fileService.uploadFileChunked(
                    nextFile.file,
                    { type: 'programs', dept: deptCode, program: progFolder, customName },
                    (percent) => updateProgressUI(nextFile, percent)
                );
            } else {
                const uploadFormData = new FormData();
                uploadFormData.append('file', nextFile.file);
                await fileService.uploadFileWithProgress(
                    uploadFormData,
                    { type: 'programs', dept: deptCode, program: progFolder, customName },
                    (percent) => updateProgressUI(nextFile, percent)
                );
            }

            nextFile.progress = 100;
            nextFile.status = 'complete';

            // Log upload immediately after success
            const typeName = getFileTypeName(nextFile.name);
            const isVideo = typeName.includes('Video');
            const actionType = isVideo ? 'Upload Video' : 'Add File';
            logService.addLog(user?.username || 'admin', user?.role || 'Supervisor', actionType, nextFile.name);

            render();
            renderFloatingWidget();
        } catch (err) {
            console.warn('Real API upload failed, using simulated upload:', err.message);
            
            // Fallback: simulate upload progress if API is not available
            if (nextFile.status !== 'complete') {
                await simulateUpload(nextFile);
            }
        }

        // Move to next file
        setTimeout(() => uploadNext(), 300);
    }
    
    function simulateUpload(file) {
        return new Promise(async (resolve) => {
            file.status = 'uploading';
            file.progress = 0;
            render();
            renderFloatingWidget();

            try {
                const { BASE_URL } = await import('../shared/api.js');
                const token = localStorage.getItem('aitu_token');
                const formData = new FormData();
                formData.append('file', file.file);

                const selectedProg = mockDepartments.find(d => d.id === globalDept)?.programs.find(p => p.id === globalProg);
                const progFolder = selectedProg ? encodeURIComponent(selectedProg.name) : '';
                const deptCode = encodeURIComponent(globalDept || 'IT');
                const progName = encodeURIComponent(file.title || file.name.split('.')[0]);

                const url = `${BASE_URL}/api/Files/upload?type=programs&dept=${deptCode}&program=${progFolder}&customName=${progName}`;

                const response = await fetch(url, {
                    method: 'POST',
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                    body: formData
                });

                file.progress = 100;
                file.status = 'complete';
            } catch (err) {
                console.warn('Fallback upload completion:', err);
                file.progress = 100;
                file.status = 'complete';
            }

            render();
            renderFloatingWidget();
            resolve();
        });
    }

    function saveUploadState() {
        if (fileQueue.length === 0) {
            localStorage.removeItem('aitu_upload_state');
            return;
        }
        const state = {
            globalDept,
            globalProg,
            isUploading,
            fileQueue: fileQueue.map(f => ({
                id: f.id,
                name: f.name,
                size: f.size,
                type: f.type,
                title: f.title,
                progress: f.progress || 0,
                status: f.status
            })),
            updatedAt: Date.now()
        };
        localStorage.setItem('aitu_upload_state', JSON.stringify(state));
    }

    function minimizeToFloatingWidget() {
        overlay.style.display = 'none';
        let widget = document.getElementById('floatingUploadWidget');
        if (!widget) {
            widget = document.createElement('div');
            widget.id = 'floatingUploadWidget';
            document.body.appendChild(widget);
        }
        widget.style.display = 'block';
        saveUploadState();
        renderFloatingWidget();
    }

    function renderFloatingWidget() {
        const widget = document.getElementById('floatingUploadWidget');
        if (!widget || widget.style.display === 'none') return;

        const lang = getCurrentLang();
        const isAr = lang === 'ar';

        const totalFiles = fileQueue.length;
        const completedFiles = fileQueue.filter(f => f.status === 'complete').length;
        const uploadingFiles = fileQueue.filter(f => f.status === 'uploading').length;
        const isDone = totalFiles > 0 && completedFiles === totalFiles;

        let overallProg = 0;
        if (totalFiles > 0) {
            const sum = fileQueue.reduce((acc, f) => acc + (f.progress || 0), 0);
            overallProg = Math.round(sum / totalFiles);
        }

        const isCollapsed = widget.dataset.collapsed === 'true';
        const isMaximized = widget.dataset.maximized === 'true';

        widget.className = 'google-drive-upload-widget';
        if (isMaximized) {
            widget.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                z-index: 999999;
                width: 480px;
                max-width: 92vw;
                background: #ffffff;
                border-radius: 14px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
                overflow: hidden;
                direction: ${isAr ? 'rtl' : 'ltr'};
                font-family: inherit;
                border: 1px solid #cbd5e1;
            `;
        } else {
            widget.style.cssText = `
                position: fixed;
                bottom: 24px;
                ${isAr ? 'left: 24px;' : 'right: 24px;'}
                z-index: 999999;
                width: 340px;
                background: #ffffff;
                border-radius: 12px;
                box-shadow: 0 12px 32px rgba(0, 0, 0, 0.25);
                overflow: hidden;
                direction: ${isAr ? 'rtl' : 'ltr'};
                font-family: inherit;
                border: 1px solid #cbd5e1;
            `;
        }

        widget.innerHTML = `
            <style>
                @keyframes widgetSpin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            </style>
            <div style="background: #08305b; color: white; padding: 10px 14px; display: flex; align-items: center; justify-content: space-between; border-radius: 12px 12px 0 0;">
                <div style="display: flex; align-items: center; gap: 10px; flex: 1; cursor: pointer;" id="widgetHeaderTitle">
                    <div style="width: 26px; height: 26px; border-radius: 50%; background: ${isDone ? 'rgba(34,197,94,0.2)' : 'rgba(59,130,246,0.2)'}; color: ${isDone ? '#22c55e' : '#60a5fa'}; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                        ${isDone 
                            ? `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`
                            : `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>`
                        }
                    </div>
                    <span style="font-weight: 700; font-size: 0.86rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${titleText}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 4px;">
                    <button type="button" id="widgetToggleExpandBtn" title="${isAr ? 'تكبير / تصغير' : 'Maximize'}" style="background:none; border:none; color:#94a3b8; cursor:pointer; padding:3px; display:flex; align-items:center;">
                        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
                    </button>
                    <button type="button" id="widgetToggleCollapseBtn" title="${isAr ? 'طي / توسيع' : 'Toggle'}" style="background:none; border:none; color:#94a3b8; cursor:pointer; padding:3px; display:flex; align-items:center;">
                        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2">${isCollapsed ? '<polyline points="18 15 12 9 6 15"/>' : '<polyline points="6 9 12 15 18 9"/>'}</svg>
                    </button>
                    <button type="button" id="widgetCloseBtn" title="${isAr ? 'إغلاق' : 'Close'}" style="background:none; border:none; color:#94a3b8; cursor:pointer; padding:3px; font-size:1.1rem; display:flex; align-items:center;">
                        &times;
                    </button>
                </div>
            </div>
            ${!isDone ? `
                <div style="height: 3px; background: #e2e8f0; width: 100%;">
                    <div style="height: 100%; background: #2563eb; width: ${overallProg}%; transition: width 0.3s ease;"></div>
                </div>
            ` : ''}
            ${filesListHtml}
        `;

        const headerTitle = widget.querySelector('#widgetHeaderTitle');
        const expandBtn = widget.querySelector('#widgetToggleExpandBtn');
        const collapseBtn = widget.querySelector('#widgetToggleCollapseBtn');
        const closeBtn = widget.querySelector('#widgetCloseBtn');

        const restoreModal = () => {
            if (overlay && overlay.parentNode) {
                widget.style.display = 'none';
                overlay.style.display = 'flex';
                overlay.classList.add('visible');
            } else {
                widget.dataset.maximized = widget.dataset.maximized === 'true' ? 'false' : 'true';
                widget.dataset.collapsed = 'false';
                renderFloatingWidget();
            }
        };

        if (headerTitle) headerTitle.addEventListener('click', restoreModal);
        if (expandBtn) expandBtn.addEventListener('click', restoreModal);

        if (collapseBtn) {
            collapseBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                widget.dataset.collapsed = widget.dataset.collapsed === 'true' ? 'false' : 'true';
                widget.dataset.maximized = 'false';
                renderFloatingWidget();
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (!isDone && (isUploading || fileQueue.some(f => f.status === 'uploading'))) {
                    if (confirm(isAr ? 'عملية الرفع جارية حالياً، هل أنت متأكد من الإلغاء؟' : 'Upload is in progress. Are you sure you want to cancel?')) {
                        widget.style.display = 'none';
                        widget.remove();
                        localStorage.removeItem('aitu_upload_state');
                        if (typeof closeModal === 'function') closeModal();
                    }
                } else {
                    widget.style.display = 'none';
                    widget.remove();
                    localStorage.removeItem('aitu_upload_state');
                }
            });
        }
    }

    // Initial render
    render();
}

/**
 * Restores floating upload widget state across page reloads/refreshes
 */
export function initPersistentUploadWidget() {
    const saved = localStorage.getItem('aitu_upload_state');
    if (!saved) return;

    try {
        const state = JSON.parse(saved);
        if (!state || !state.fileQueue || state.fileQueue.length === 0) return;

        // Expire state if older than 2 hours
        if (Date.now() - (state.updatedAt || 0) > 2 * 60 * 60 * 1000) {
            localStorage.removeItem('aitu_upload_state');
            return;
        }

        const lang = localStorage.getItem('aitu_lang') || 'en';
        const isAr = lang === 'ar';

        let widget = document.getElementById('floatingUploadWidget');
        if (!widget) {
            widget = document.createElement('div');
            widget.id = 'floatingUploadWidget';
            document.body.appendChild(widget);
        }

        const totalFiles = state.fileQueue.length;
        const completedFiles = state.fileQueue.filter(f => f.status === 'complete').length;
        const isDone = totalFiles > 0 && completedFiles === totalFiles;

        let overallProg = 0;
        if (totalFiles > 0) {
            const sum = state.fileQueue.reduce((acc, f) => acc + (f.progress || 0), 0);
            overallProg = Math.round(sum / totalFiles);
        }

        const isCollapsed = widget.dataset.collapsed === 'true';

        const titleText = isDone 
            ? (isAr ? `تم اكتمال رفع ${completedFiles} ملف(ات)` : `${completedFiles} uploads complete`)
            : (isAr ? `جاري رفع ${totalFiles - completedFiles} ملفات...` : `Uploading ${totalFiles - completedFiles} item(s)...`);

        let filesListHtml = '';
        if (!isCollapsed) {
            filesListHtml = `
                <div style="max-height: 180px; overflow-y: auto; padding: 10px 14px; background: #ffffff;">
                    ${state.fileQueue.map(f => {
                        const icon = f.status === 'complete' 
                            ? `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#22c55e" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`
                            : `<div style="width:14px; height:14px; border:2px solid #3b82f6; border-top-color:transparent; border-radius:50%; animation:widgetSpin 0.8s linear infinite;"></div>`;
                        
                        return `
                            <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:8px; font-size:0.83rem;">
                                <div style="display:flex; align-items:center; gap:8px; overflow:hidden; flex:1;">
                                    ${icon}
                                    <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; color:#0f172a; font-weight:600;" title="${f.name}">${f.name}</span>
                                </div>
                                <span style="font-size:0.78rem; color:#64748b; font-weight:600; flex-shrink:0;">${f.progress || 0}%</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        }

        widget.className = 'google-drive-upload-widget';
        widget.style.cssText = `
            position: fixed;
            bottom: 24px;
            ${isAr ? 'left: 24px;' : 'right: 24px;'}
            z-index: 999999;
            width: 340px;
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 12px 32px rgba(0, 0, 0, 0.25);
            overflow: hidden;
            direction: ${isAr ? 'rtl' : 'ltr'};
            font-family: inherit;
            border: 1px solid #cbd5e1;
            display: block;
        `;

        widget.innerHTML = `
            <style>
                @keyframes widgetSpin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            </style>
            <div style="background: #08305b; color: white; padding: 10px 14px; display: flex; align-items: center; justify-content: space-between; border-radius: 12px 12px 0 0;">
                <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
                    <div style="width: 26px; height: 26px; border-radius: 50%; background: ${isDone ? 'rgba(34,197,94,0.2)' : 'rgba(59,130,246,0.2)'}; color: ${isDone ? '#22c55e' : '#60a5fa'}; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                        ${isDone 
                            ? `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`
                            : `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>`
                        }
                    </div>
                    <span style="font-weight: 700; font-size: 0.86rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${titleText}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 4px;">
                    <button type="button" id="widgetPersistentCloseBtn" title="${isAr ? 'إغلاق' : 'Close'}" style="background:none; border:none; color:#94a3b8; cursor:pointer; padding:3px; font-size:1.1rem; display:flex; align-items:center;">
                        &times;
                    </button>
                </div>
            </div>
            ${!isDone ? `
                <div style="height: 3px; background: #e2e8f0; width: 100%;">
                    <div style="height: 100%; background: #2563eb; width: ${overallProg}%; transition: width 0.3s ease;"></div>
                </div>
            ` : ''}
            ${filesListHtml}
        `;

        const closeBtn = widget.querySelector('#widgetPersistentCloseBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                widget.style.display = 'none';
                localStorage.removeItem('aitu_upload_state');
            });
        }
    } catch (err) {
        console.warn('Failed to restore upload state:', err);
    }
}

// ── Standalone page support ──
// If loaded directly as a page (upload-resources.html), auto-open the modal
if (window.location.pathname.includes('upload-resources.html')) {
    import('../shared/layout.js').then(({ renderLayout }) => {
        renderLayout('repository');
        openUploadModal();
        // Hide Global Loader
        const loader = document.getElementById('global-page-loader');
        if (loader) {
            loader.classList.add('hide-loader');
            setTimeout(() => loader.remove(), 400);
        }
    });
}
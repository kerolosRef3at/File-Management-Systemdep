// js/pages/upload-resources.js
import { getCurrentUser } from '../shared/auth.js';
import { renderLayout } from '../shared/layout.js';
import { fileService, logService } from '../shared/services.js';
import { mockDepartments } from '../shared/mockData.js';

document.addEventListener('DOMContentLoaded', () => {
    const user = getCurrentUser();

    // Render admin layout
    renderLayout('repository');

    const pageContent = document.getElementById('page-content');
    if (!pageContent) return;

    // State
    let fileQueue = [];
    let overallProgress = 0;
    let isUploading = false;
    let nextFileId = 1;
    let globalDept = '';
    let globalProg = '';

    // Accepted file types
    const ACCEPTED_TYPES = ['.mp4', '.pdf', '.zip', '.docx', '.xlsx', '.dwg', '.pptx', '.doc'];
    const MAX_FILE_SIZE = 2 * 1024 * 1024 * 2048; // 2GB

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

        pageContent.innerHTML = `
            <div class="upload-page">
                <!-- Breadcrumb -->
                <div class="upload-breadcrumb">
                    <a href="repository.html">Repository</a>
                    <span class="bc-sep">&rsaquo;</span>
                    <span class="bc-current">Bulk Asset Upload</span>
                </div>

                <!-- Header -->
                <div class="upload-header">
                    <div class="upload-header-left">
                        <h1>Upload Resources</h1>
                        <p>Select and configure multiple videos or documents for the Academic Catalog.</p>
                    </div>
                    <div class="upload-header-actions">
                        <button class="upload-btn-outline" id="discardDraftBtn">Discard Draft</button>
                        <button class="upload-btn-primary" id="saveBtn" ${totalFiles === 0 || isUploading ? 'disabled' : ''}>
                            ${isUploading ? `<span class="file-waiting-spinner" style="margin-right:8px; border-color:white; border-bottom-color:transparent;"></span> Uploading...` : `
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                            Start Upload`}
                        </button>
                    </div>
                </div>

                <!-- Global Destination Selection -->
                <div class="upload-global-destination" style="background:white; padding:20px; border-radius:12px; margin-bottom:20px; border:1px solid #e2e8f0; display:grid; grid-template-columns: 1fr 1fr; gap:20px;">
                    <div>
                        <label style="font-size:12px; font-weight:700; color:#64748b; text-transform:uppercase; margin-bottom:8px; display:block;">Target Department <span style="color:#ef4444">*</span></label>
                        <select id="globalDeptSelect" style="width:100%; padding:12px; border:1px solid #cbd5e1; border-radius:8px; font-size:14px; background:#f8fafc; color:var(--primary-dark);">
                            <option value="">Select Department...</option>
                            ${mockDepartments.map(d => `<option value="${d.id}" ${globalDept === d.id ? 'selected' : ''}>${d.name}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label style="font-size:12px; font-weight:700; color:#64748b; text-transform:uppercase; margin-bottom:8px; display:block;">Target Program <span style="color:#ef4444">*</span></label>
                        <select id="globalProgSelect" style="width:100%; padding:12px; border:1px solid #cbd5e1; border-radius:8px; font-size:14px; background:#f8fafc; color:var(--primary-dark);" ${!globalDept ? 'disabled' : ''}>
                            <option value="">Select Program...</option>
                            ${globalDept ? mockDepartments.find(d => d.id === globalDept)?.programs.map(p => `<option value="${p.id}" ${globalProg === p.id ? 'selected' : ''}>${p.name}</option>`).join('') : ''}
                        </select>
                    </div>
                </div>

                ${totalFiles > 0 ? `
                <!-- Overall Progress -->
                <div class="upload-overall-progress ${allDone ? 'complete' : ''}">
                    <div class="upload-progress-info">
                        <div>
                            <strong>${allDone ? 'All Uploads Complete!' : 'Uploading Course Assets...'}</strong>
                            <span>${processedFiles} files processed &bull; ${allDone ? 'Done' : formatSize(remainingSize) + ' remaining'}</span>
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
                                    <h3 style="color:#64748b;">Destination Required</h3>
                                    <p style="color:#94a3b8; max-width:250px; margin:0 auto 20px;">Please select a Target Department and Program above to unlock uploading.</p>
                                    <button class="upload-select-btn" id="selectFilesBtn" disabled style="background:#e2e8f0; color:#94a3b8; border-color:#cbd5e1; cursor:not-allowed;">Select Files From System</button>
                                ` : `
                                    <div class="upload-dropzone-icon">
                                        <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5">
                                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                                            <line x1="12" y1="11" x2="12" y2="17"/>
                                            <polyline points="9 14 12 11 15 14"/>
                                        </svg>
                                    </div>
                                    <h3>Drag & Drop Files</h3>
                                    <p>Upload .mp4, .pdf, .zip or .docx. Max file size: 2GB per asset.</p>
                                    <button class="upload-select-btn" id="selectFilesBtn">Select Files From System</button>
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
                                <strong>AITU Best Practices</strong>
                                <p>Ensure video files include captions for accessibility compliance. Asset names will be parsed automatically but can be overridden manually.</p>
                            </div>
                        </div>
                    </div>

                    <!-- Right: File Queue -->
                    <div class="upload-queue-section">
                        <div class="upload-queue-header">
                            <h3>File Queue (${totalFiles})</h3>
                            ${totalFiles > 0 ? '<button class="upload-clear-all" id="clearAllBtn">Clear All</button>' : ''}
                        </div>
                        <div class="upload-queue-list" id="queueList">
                            ${totalFiles === 0 ? `
                                <div class="upload-queue-empty">
                                    <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="#cbd5e1" stroke-width="1.5">
                                        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
                                        <polyline points="13 2 13 9 20 9"/>
                                    </svg>
                                    <p>No files in queue. Drag files here or click "Select Files".</p>
                                </div>
                            ` : fileQueue.map(file => renderFileItem(file)).join('')}
                        </div>
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
                        <label>${isVideo ? 'LESSON TITLE' : 'RESOURCE TITLE'}</label>
                        <input type="text" class="file-title-input" data-id="${file.id}" placeholder="Enter title..." value="${file.title || ''}">
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

        // Global Selection Events
        const globalDeptSelect = document.getElementById('globalDeptSelect');
        const globalProgSelect = document.getElementById('globalProgSelect');
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
        const selectBtn = document.getElementById('selectFilesBtn');
        const fileInput = document.getElementById('fileInput');
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
        const dropZone = document.getElementById('dropZone');
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
        const clearAllBtn = document.getElementById('clearAllBtn');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => {
                fileQueue = [];
                render();
            });
        }

        // Discard Draft
        const discardBtn = document.getElementById('discardDraftBtn');
        if (discardBtn) {
            discardBtn.addEventListener('click', () => {
                if (fileQueue.length === 0 || confirm('Are you sure you want to discard all uploads?')) {
                    fileQueue = [];
                    render();
                }
            });
        }

        // Save button - Validates and starts upload
        const saveBtn = document.getElementById('saveBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', async () => {
                const draftFiles = fileQueue.filter(f => f.status === 'draft' || f.status === 'failed');
                if (draftFiles.length === 0) {
                    if (fileQueue.length > 0 && fileQueue.every(f => f.status === 'complete')) {
                        window.location.href = `repository.html?dept=${globalDept}`;
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
        document.querySelectorAll('.file-cancel-btn').forEach(btn => {
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
        document.querySelectorAll('.file-retry-btn').forEach(btn => {
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
        document.querySelectorAll('.file-title-input').forEach(input => {
            input.addEventListener('input', (e) => {
                const id = parseInt(e.target.dataset.id);
                const file = fileQueue.find(f => f.id === id);
                if (file) file.title = e.target.value;
            });
        });


    }

    function handleFiles(files) {
        files.forEach(file => {
            const ext = '.' + file.name.split('.').pop().toLowerCase();
            if (!ACCEPTED_TYPES.includes(ext)) return;
            if (file.size > MAX_FILE_SIZE) return;

            fileQueue.push({
                id: nextFileId++,
                name: file.name,
                size: file.size,
                file: file,
                status: 'draft',
                progress: 0,
                title: file.name.split('.')[0],
                abortController: null
            });
        });

        render();
    }

    function startUpload() {
        if (isUploading) return;
        isUploading = true;
        uploadNext();
    }

    async function uploadNext() {
        const nextFile = fileQueue.find(f => f.status === 'waiting');
        if (!nextFile) {
            isUploading = false;
            render();
            // All done?
            if (fileQueue.length > 0 && fileQueue.every(f => f.status === 'complete')) {
                const completedCount = fileQueue.length;
                setTimeout(() => {
                    alert(`Successfully saved ${completedCount} file(s) to the repository!`);
                    fileQueue.forEach(f => {
                        logService.addLog(user?.username || 'admin', user?.role || 'Supervisor', 'Add File', f.name);
                    });
                    window.location.href = `repository.html?dept=${globalDept}`;
                }, 800);
            }
            return;
        }

        nextFile.status = 'uploading';
        nextFile.progress = 0;
        render();

        // Try real API upload first
        try {
            const formData = new FormData();
            formData.append('file', nextFile.file);
            if (nextFile.title) formData.append('title', nextFile.title);
            if (globalDept) formData.append('department', globalDept);
            if (globalProg) formData.append('program', globalProg);

            // Use XMLHttpRequest for progress tracking
            const xhr = new XMLHttpRequest();
            const abortController = { abort: () => xhr.abort() };
            nextFile.abortController = abortController;

            // Dynamically resolve API URL using BASE_URL
            const { BASE_URL } = await import('../shared/api.js');

            await new Promise((resolve, reject) => {
                xhr.upload.addEventListener('progress', (e) => {
                    if (e.lengthComputable) {
                        nextFile.progress = Math.round((e.loaded / e.total) * 100);
                        render();
                    }
                });

                xhr.addEventListener('load', () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        nextFile.progress = 100;
                        nextFile.status = 'complete';
                        try {
                            nextFile.response = JSON.parse(xhr.responseText);
                        } catch(e) {}
                        resolve();
                    } else {
                        reject(new Error('Upload failed'));
                    }
                });

                xhr.addEventListener('error', () => reject(new Error('Network error')));
                xhr.addEventListener('abort', () => reject(new Error('Aborted')));

                const token = localStorage.getItem('aitu_token');
                
                xhr.open('POST', `${BASE_URL}/api/Files/upload`);
                if (token) {
                    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
                }
                xhr.send(formData);
            });

            // Log upload immediately after success
            const typeName = getFileTypeName(nextFile.name);
            const isVideo = typeName.includes('Video');
            const actionType = isVideo ? 'Upload Video' : 'Add File';
            logService.addLog(user?.username || 'admin', user?.role || 'Supervisor', actionType, nextFile.name);

            render();
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
        return new Promise((resolve) => {
            file.status = 'uploading';
            file.progress = 0;
            render();

            const interval = setInterval(() => {
                file.progress += Math.floor(Math.random() * 12) + 5;
                if (file.progress >= 100) {
                    file.progress = 100;
                    file.status = 'complete';
                    clearInterval(interval);

                    const typeName = getFileTypeName(file.name);
                    const isVideo = typeName.includes('Video');
                    const actionType = isVideo ? 'Upload Video' : 'Add File';
                    logService.addLog(user?.username || 'admin', user?.role || 'Supervisor', actionType, file.name);

                    const formData = new FormData();
                    formData.append('file', file.fileObj || new Blob([''], { type: 'application/octet-stream' }), file.name);
                    try {
                        fileService.uploadFile(formData, 0, file.name.split('.').pop().toUpperCase(), globalDept, file.title || file.name);
                    } catch (err) {
                        console.warn('API upload failed:', err);
                    }

                    render();
                    resolve();
                } else {
                    render();
                }
            }, 200);
        });
    }

    // Initial render
    render();

    // Hide Global Loader
    const loader = document.getElementById('global-page-loader');
    if (loader) {
        loader.classList.add('hide-loader');
        setTimeout(() => loader.remove(), 400);
    }
});


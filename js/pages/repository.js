import { renderLayout } from '../shared/layout.js';
import { fetchAPI } from '../shared/api.js';

document.addEventListener('DOMContentLoaded', async () => {
    renderLayout('repository');

    const contentArea = document.getElementById('page-content');
    let selectedFiles = new Set();
    
    // الداتا الوهمية هنخليها Global في الملف عشان نستخدمها في البحث والفلاتر
    let allFiles = []; 

    contentArea.innerHTML = `
        <h1 style="color: var(--primary-dark); font-size: 2.2rem; margin-bottom: 5px;">EduVault Central Repository</h1>
        <p style="color: var(--text-gray); margin-bottom: 30px;">The official AITU file management system for academic and administrative record keeping.</p>
        
        <div style="background: var(--white); border: 1px solid var(--border-color); padding: 15px; border-radius: 8px; margin-bottom: 30px; display: flex; gap: 15px;">
            <button class="btn-outline filter-btn" data-filter="all" style="background: var(--primary-dark); color: white;">All Types</button>
            <button class="btn-outline filter-btn" data-filter="PDF">PDF Only</button>
            <button class="btn-outline filter-btn" data-filter="XLSX">Excel Only</button>
        </div>

        <div class="file-grid" id="filesGrid">
            <p>Loading files...</p>
        </div>
    `;

    const filesGrid = document.getElementById('filesGrid');
    const searchInput = document.getElementById('globalSearchInput'); // جبنا مربع البحث من الـ Header

    async function loadFiles() {
        try {
            const response = await fetchAPI('/api/Files');
            allFiles = response.data || generateMockData();
        } catch (error) {
            console.warn("Using Mock Data since API failed.");
            allFiles = generateMockData();
        }
        renderFiles(allFiles);
    }

    function generateMockData() {
        return [
            { id: 1, name: "IT_Syllabus_2024.pdf", type: "PDF", version: "v1.2", size: "2.4 MB", dept: "IT DEPT", downloads: 142 },
            { id: 2, name: "Lab_Equipment_Inv.xlsx", type: "XLSX", version: "v3.0", size: "1.1 MB", dept: "EL DEPT", downloads: 56 },
            { id: 3, name: "Thermo_CAD_Specs.dwg", type: "DWG", version: "v1.0", size: "15.4 MB", dept: "ME DEPT", downloads: 8 },
            { id: 4, name: "Network_Basics.pdf", type: "PDF", version: "v2.0", size: "5.2 MB", dept: "IT DEPT", downloads: 300 }
        ];
    }

    function renderFiles(filesToRender) {
        filesGrid.innerHTML = '';
        if(filesToRender.length === 0) {
            filesGrid.innerHTML = '<p>No files found.</p>';
            return;
        }

        filesToRender.forEach(file => {
            const card = document.createElement('div');
            card.className = `file-card ${selectedFiles.has(file.id.toString()) ? 'selected' : ''}`;
            card.innerHTML = `
                <input type="checkbox" class="file-checkbox" data-id="${file.id}" ${selectedFiles.has(file.id.toString()) ? 'checked' : ''}>
                <div class="file-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg></div>
                <div class="file-info">
                    <h4>${file.name}</h4>
                    <span class="file-version">${file.version}</span>
                </div>
                <div class="file-meta">
                    <span>${file.size} <strong style="background:#1e3a8a; color:white; padding:2px 4px; border-radius:4px; font-size:10px;">${file.dept}</strong></span>
                    <span>📥 ${file.downloads}</span>
                </div>
            `;
            filesGrid.appendChild(card);
        });

        attachCheckboxListeners();
    }

    // --- تشغيل البحث (Search Logic) ---
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const filteredFiles = allFiles.filter(file => 
                file.name.toLowerCase().includes(term) || file.dept.toLowerCase().includes(term)
            );
            renderFiles(filteredFiles);
        });
    }

    // --- تشغيل الفلاتر (Filters Logic) ---
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // تظبيط شكل الأزرار
            filterButtons.forEach(b => { b.style.background = 'transparent'; b.style.color = 'var(--text-dark)'; });
            e.target.style.background = 'var(--primary-dark)'; e.target.style.color = 'white';

            // فلترة الداتا
            const filterType = e.target.getAttribute('data-filter');
            if (filterType === 'all') {
                renderFiles(allFiles);
            } else {
                const filteredFiles = allFiles.filter(file => file.type === filterType);
                renderFiles(filteredFiles);
            }
        });
    });

    // --- تشغيل مربعات التحديد ---
    function attachCheckboxListeners() {
        const checkboxes = document.querySelectorAll('.file-checkbox');
        const selectionBar = document.getElementById('selectionBar');
        const selectedCountEl = document.getElementById('selectedCount');

        checkboxes.forEach(box => {
            box.addEventListener('change', (e) => {
                const id = e.target.getAttribute('data-id');
                const card = e.target.closest('.file-card');
                if (e.target.checked) { selectedFiles.add(id); card.classList.add('selected'); } 
                else { selectedFiles.delete(id); card.classList.remove('selected'); }

                selectedCountEl.innerText = selectedFiles.size;
                if (selectedFiles.size > 0) selectionBar.classList.add('visible');
                else selectionBar.classList.remove('visible');
            });
        });
    }

    loadFiles();
});
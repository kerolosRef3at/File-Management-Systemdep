// js/shared/components.js

/**
 * Generates and inserts skeleton loaders into the DOM.
 */
export function renderSkeleton(container, type, count = 3) {
    const el = typeof container === 'string' ? document.getElementById(container) : container;
    if (!el) return;

    let html = '';
    if (type === 'metrics') {
        html = `<div class="metrics-grid">` + Array(count).fill(0).map(() => `
            <div class="metric-card skeleton-loading" style="min-height: 120px; position: relative; overflow: hidden; background: #e2e8f0; border-radius: 10px;">
                <div style="height: 14px; background: #cbd5e1; width: 40%; margin-bottom: 20px; border-radius: 4px;"></div>
                <div style="height: 32px; background: #cbd5e1; width: 60%; margin-bottom: 10px; border-radius: 6px;"></div>
                <div style="height: 12px; background: #cbd5e1; width: 80%; border-radius: 4px;"></div>
            </div>
        `).join('') + `</div>`;
    } 
    else if (type === 'table') {
        html = Array(count).fill(0).map(() => `
            <tr class="skeleton-loading">
                <td style="padding: 15px 20px;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="width: 32px; height: 32px; border-radius: 50%; background: #e2e8f0;"></div>
                        <div style="flex: 1;">
                            <div style="height: 12px; background: #e2e8f0; width: 80px; margin-bottom: 6px; border-radius: 3px;"></div>
                            <div style="height: 10px; background: #e2e8f0; width: 120px; border-radius: 3px;"></div>
                        </div>
                    </div>
                </td>
                <td><div style="height: 20px; background: #e2e8f0; width: 70px; border-radius: 10px;"></div></td>
                <td><div style="height: 12px; background: #e2e8f0; width: 90px; border-radius: 3px;"></div></td>
                <td><div style="height: 12px; background: #e2e8f0; width: 70px; border-radius: 3px;"></div></td>
                <td><div style="height: 24px; background: #e2e8f0; width: 24px; border-radius: 4px;"></div></td>
            </tr>
        `).join('');
    } 
    else if (type === 'grid') {
        html = Array(count).fill(0).map(() => `
            <div class="file-card skeleton-loading" style="min-height: 180px; display: flex; flex-direction: column; justify-content: space-between; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px;">
                <div style="width: 18px; height: 18px; background: #e2e8f0; border-radius: 4px;"></div>
                <div style="align-self: center; width: 50px; height: 50px; background: #e2e8f0; border-radius: 6px; margin: 10px 0;"></div>
                <div style="height: 14px; background: #e2e8f0; width: 80%; margin: 0 auto 5px auto; border-radius: 3px;"></div>
                <div style="height: 10px; background: #e2e8f0; width: 40%; margin: 0 auto 15px auto; border-radius: 3px;"></div>
                <div style="display: flex; justify-content: space-between; border-top: 1px solid #f1f5f9; padding-top: 10px;">
                    <div style="width: 50px; height: 10px; background: #e2e8f0; border-radius: 2px;"></div>
                    <div style="width: 30px; height: 10px; background: #e2e8f0; border-radius: 2px;"></div>
                </div>
            </div>
        `).join('');
    }
    else if (type === 'course-grid') {
        html = Array(count).fill(0).map(() => `
            <div class="course-card skeleton-loading" style="min-height: 250px; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                <div style="height: 150px; background: #e2e8f0;"></div>
                <div style="padding: 15px;">
                    <div style="height: 14px; background: #e2e8f0; width: 90%; margin-bottom: 10px; border-radius: 3px;"></div>
                    <div style="height: 14px; background: #e2e8f0; width: 70%; margin-bottom: 20px; border-radius: 3px;"></div>
                    <div style="display: flex; justify-content: space-between;">
                        <div style="width: 60px; height: 10px; background: #e2e8f0; border-radius: 2px;"></div>
                        <div style="width: 60px; height: 10px; background: #e2e8f0; border-radius: 2px;"></div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    el.innerHTML = html;

    // Inject skeleton CSS dynamic keyframes if not existing
    if (!document.getElementById('skeleton-keyframe-style')) {
        const style = document.createElement('style');
        style.id = 'skeleton-keyframe-style';
        style.innerHTML = `
            @keyframes skeletonShimmer {
                0% { background-position: -200% 0; }
                100% { background-position: 200% 0; }
            }
            .skeleton-loading {
                background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 37%, #f1f5f9 63%) !important;
                background-size: 200% 100% !important;
                animation: skeletonShimmer 1.5s infinite linear !important;
            }
            .skeleton-loading * {
                opacity: 0.4 !important;
            }
        `;
        document.head.appendChild(style);
    }
}

/**
 * Renders an accessible alert notification message banner.
 */
export function showAlert(container, message, type = 'success') {
    const el = typeof container === 'string' ? document.getElementById(container) : container;
    if (!el) return;

    el.className = `form-alert ${type}`;
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'space-between';
    el.style.padding = '12px 16px';
    el.style.borderRadius = '8px';
    el.style.marginBottom = '20px';
    el.style.fontSize = '0.95rem';
    el.style.fontWeight = '500';

    // Set colors according to alert type
    let bg = '#eff6ff', color = '#1e3a8a', border = '1px solid #bfdbfe';
    if (type === 'error') { bg = '#fef2f2'; color = '#991b1b'; border = '1px solid #fecaca'; }
    if (type === 'warning') { bg = '#fffbeb'; color = '#92400e'; border = '1px solid #fde68a'; }
    if (type === 'success') { bg = '#f0fdf4'; color = '#166534'; border = '1px solid #bbf7d0'; }

    el.style.backgroundColor = bg;
    el.style.color = color;
    el.style.border = border;

    el.innerHTML = `
        <div style="display:flex; align-items:center; gap:10px;">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            <span>${message}</span>
        </div>
        <button type="button" class="alert-close-btn" style="background:none; border:none; color:inherit; font-size:1.2rem; cursor:pointer; font-weight:bold; line-height:1;">&times;</button>
    `;

    el.querySelector('.alert-close-btn').addEventListener('click', () => {
        el.style.display = 'none';
    });
}

/**
 * Renders an empty state view with an optional action button.
 */
export function renderEmptyState(container, message, actionText = '', actionCallback = null) {
    const el = typeof container === 'string' ? document.getElementById(container) : container;
    if (!el) return;

    el.innerHTML = `
        <div class="empty-state" style="text-align: center; padding: 40px 20px; color: var(--text-gray);">
            <div style="margin-bottom: 20px; display: inline-flex; justify-content: center; align-items: center; width: 64px; height: 64px; border-radius: 50%; background: #e2e8f0; color: var(--primary-dark);">
                <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
            </div>
            <h3 style="color: var(--primary-dark); font-size: 1.2rem; margin-bottom: 8px; font-weight: 600;">No items found</h3>
            <p style="font-size: 0.95rem; max-width: 320px; margin: 0 auto 20px auto;">${message}</p>
            ${actionText ? `<button class="btn-primary" id="emptyStateActionBtn">${actionText}</button>` : ''}
        </div>
    `;

    if (actionText && actionCallback) {
        document.getElementById('emptyStateActionBtn').addEventListener('click', actionCallback);
    }
}

/**
 * Renders pagination UI controls.
 */
export function renderPagination(container, totalItems, itemsPerPage, currentPage, onPageChange) {
    const el = typeof container === 'string' ? document.getElementById(container) : container;
    if (!el) return;

    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) {
        el.innerHTML = '';
        return;
    }

    let buttonsHTML = `
        <button class="btn-outline page-prev" ${currentPage === 1 ? 'disabled' : ''} style="padding: 6px 12px; font-size: 0.85rem;">Prev</button>
    `;

    for (let i = 1; i <= totalPages; i++) {
        buttonsHTML += `
            <button class="page-num ${i === currentPage ? 'active' : ''}" data-page="${i}" style="
                border: 1px solid var(--border-color);
                background: ${i === currentPage ? 'var(--primary-dark)' : 'white'};
                color: ${i === currentPage ? 'white' : 'var(--text-dark)'};
                font-weight: 600;
                padding: 6px 12px;
                cursor: pointer;
                border-radius: 4px;
                font-size: 0.85rem;
                transition: 0.2s;
            ">${i}</button>
        `;
    }

    buttonsHTML += `
        <button class="btn-outline page-next" ${currentPage === totalPages ? 'disabled' : ''} style="padding: 6px 12px; font-size: 0.85rem;">Next</button>
    `;

    el.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; gap: 8px; margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--border-color);">
            ${buttonsHTML}
        </div>
    `;

    // Click events
    el.querySelector('.page-prev').addEventListener('click', () => {
        if (currentPage > 1) onPageChange(currentPage - 1);
    });

    el.querySelector('.page-next').addEventListener('click', () => {
        if (currentPage < totalPages) onPageChange(currentPage + 1);
    });

    el.querySelectorAll('.page-num').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const page = parseInt(e.target.getAttribute('data-page'));
            onPageChange(page);
        });
    });
}

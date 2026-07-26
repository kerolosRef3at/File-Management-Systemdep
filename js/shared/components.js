import { authService } from './services.js';
import { escapeHTML } from './utils.js';

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

    const isArabic = /[\u0600-\u06FF]/.test(message);

    el.className = `form-alert ${type}`;
    el.style.display = 'flex';
    el.style.alignItems = 'flex-start';
    el.style.justifyContent = 'space-between';
    el.style.padding = '14px 16px';
    el.style.borderRadius = '10px';
    el.style.marginBottom = '20px';
    el.style.fontSize = '0.95rem';
    el.style.fontWeight = '500';
    el.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.05)';
    el.style.direction = isArabic ? 'rtl' : 'ltr';

    // Set colors according to alert type
    let bg = '#eff6ff', color = '#1e3a8a', border = '1px solid #bfdbfe';
    if (type === 'error') { bg = '#fef2f2'; color = '#991b1b'; border = '1px solid #fecaca'; }
    if (type === 'warning') { bg = '#fffbeb'; color = '#92400e'; border = '1px solid #fde68a'; }
    if (type === 'success') { bg = '#f0fdf4'; color = '#166534'; border = '1px solid #bbf7d0'; }

    el.style.backgroundColor = bg;
    el.style.color = color;
    el.style.border = border;

    const safeMessage = escapeHTML(message);

    el.innerHTML = `
        <div style="display:flex; align-items:flex-start; gap:12px; flex:1; text-align: ${isArabic ? 'right' : 'left'};">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0; margin-top:2px;">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            <div style="flex:1; line-height: 1.6;">${safeMessage}</div>
        </div>
        <button type="button" class="alert-close-btn" style="background:none; border:none; color:inherit; font-size:1.4rem; cursor:pointer; font-weight:bold; line-height:1; padding: 0 6px; flex-shrink:0; margin-${isArabic ? 'right' : 'left'}: 8px;">&times;</button>
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

/**
 * Shows a custom 2-step password-protected confirmation modal.
 * Step 1: Confirm action ("Are you sure?")
 * Step 2: Request Password verification before deletion.
 */
export function showConfirmModal({ title, message, confirmText, cancelText, type = 'danger', requirePassword = true, onConfirm }) {
    let overlay = document.getElementById('aituConfirmModalOverlay');
    if (overlay) overlay.remove();

    const isAr = (localStorage.getItem('aitu_lang') || 'ar') === 'ar';
    confirmText = confirmText || (isAr ? 'متابعة الحذف' : 'Proceed to Delete');
    cancelText = cancelText || (isAr ? 'إلغاء' : 'Cancel');

    overlay = document.createElement('div');
    overlay.id = 'aituConfirmModalOverlay';
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px);
        z-index: 999999; display: flex; align-items: center; justify-content: center;
        padding: 20px; animation: fadeInModal 0.2s ease forwards;
    `;

    const isDanger = type === 'danger';
    const btnColor = isDanger ? '#ef4444' : '#1e40af';

    function renderStep1() {
        overlay.innerHTML = `
            <style>
                @keyframes fadeInModal { from { opacity: 0; } to { opacity: 1; } }
                @keyframes popInModal { from { transform: scale(0.92); opacity: 0; } to { transform: scale(1); opacity: 1; } }
            </style>
            <div style="
                background: #ffffff; border-radius: 16px; max-width: 440px; width: 100%;
                padding: 28px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                animation: popInModal 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; text-align: center; font-family: inherit;
            ">
                <div style="
                    width: 56px; height: 56px; border-radius: 50%;
                    background: ${isDanger ? '#fef2f2' : '#eff6ff'};
                    color: ${isDanger ? '#ef4444' : '#2563eb'};
                    display: flex; align-items: center; justify-content: center;
                    margin: 0 auto 18px; font-size: 28px;
                ">
                    ${isDanger ? '⚠️' : 'ℹ️'}
                </div>
                <h3 style="font-size: 1.25rem; font-weight: 700; color: #0f172a; margin: 0 0 10px; line-height: 1.3;">
                    ${title}
                </h3>
                <p style="font-size: 0.95rem; color: #475569; margin: 0 0 24px; line-height: 1.6;">
                    ${message}
                </p>
                <div style="display: flex; gap: 12px; justify-content: center;">
                    <button id="aituConfirmCancelBtn" style="
                        flex: 1; padding: 11px 18px; border: 1px solid #cbd5e1; background: #ffffff;
                        color: #475569; border-radius: 8px; font-weight: 600; font-size: 0.95rem;
                        cursor: pointer; transition: background 0.2s;
                    ">${cancelText}</button>
                    <button id="aituConfirmActionBtn" style="
                        flex: 1; padding: 11px 18px; border: none; background: ${btnColor};
                        color: #ffffff; border-radius: 8px; font-weight: 600; font-size: 0.95rem;
                        cursor: pointer; transition: background 0.2s; box-shadow: 0 4px 12px ${isDanger ? 'rgba(239, 68, 68, 0.25)' : 'rgba(37, 99, 235, 0.25)'};
                    ">${confirmText}</button>
                </div>
            </div>
        `;

        overlay.querySelector('#aituConfirmCancelBtn').addEventListener('click', () => overlay.remove());
        overlay.querySelector('#aituConfirmActionBtn').addEventListener('click', () => {
            if (requirePassword) {
                renderStep2();
            } else {
                executeAction();
            }
        });
    }

    function renderStep2() {
        overlay.innerHTML = `
            <div style="
                background: #ffffff; border-radius: 16px; max-width: 440px; width: 100%;
                padding: 28px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                animation: popInModal 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; text-align: center; font-family: inherit;
            ">
                <div style="
                    width: 56px; height: 56px; border-radius: 50%; background: #fef2f2;
                    color: #dc2626; display: flex; align-items: center; justify-content: center;
                    margin: 0 auto 18px; font-size: 26px;
                ">
                    🔒
                </div>
                <h3 style="font-size: 1.25rem; font-weight: 700; color: #0f172a; margin: 0 0 8px; line-height: 1.3;">
                    ${isAr ? 'تأكيد الأمان بكلمة المرور' : 'Security Password Verification'}
                </h3>
                <p style="font-size: 0.9rem; color: #475569; margin: 0 0 18px; line-height: 1.5;">
                    ${isAr ? 'الرجاء إدخال كلمة المرور الخاصة بحسابك لتأكيد إتمام الحذف.' : 'Please enter your account password to confirm permanent deletion.'}
                </p>
                <div style="text-align: right; margin-bottom: 6px;">
                    <label style="font-size: 0.85rem; font-weight: 600; color: #334155; ${isAr ? 'text-align: right;' : 'text-align: left;'} display: block;">${isAr ? 'كلمة المرور:' : 'Password:'}</label>
                    <input type="password" id="aituConfirmPasswordInput" name="confirm_password_no_autofill" placeholder="${isAr ? 'أدخل كلمة المرور الحالية' : 'Enter your password'}" style="
                        width: 100%; padding: 11px 14px; border: 1px solid #cbd5e1; border-radius: 8px;
                        margin-top: 4px; font-size: 0.95rem; outline: none; box-sizing: border-box;
                    " autocomplete="new-password" readonly onfocus="this.removeAttribute('readonly');">
                </div>
                <div id="aituConfirmPasswordError" style="color: #ef4444; font-size: 0.85rem; text-align: ${isAr ? 'right' : 'left'}; margin-bottom: 16px; display: none;"></div>

                <div style="display: flex; gap: 12px; justify-content: center; margin-top: 10px;">
                    <button id="aituConfirmCancelBtn2" style="
                        flex: 1; padding: 11px 18px; border: 1px solid #cbd5e1; background: #ffffff;
                        color: #475569; border-radius: 8px; font-weight: 600; font-size: 0.95rem;
                        cursor: pointer;
                    ">${cancelText}</button>
                    <button id="aituConfirmFinalBtn" style="
                        flex: 1; padding: 11px 18px; border: none; background: #dc2626;
                        color: #ffffff; border-radius: 8px; font-weight: 600; font-size: 0.95rem;
                        cursor: pointer; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.25);
                    ">${isAr ? 'تأكيد وإتمام الحذف' : 'Confirm & Delete'}</button>
                </div>
            </div>
        `;

        const pwInput = overlay.querySelector('#aituConfirmPasswordInput');
        const errDiv = overlay.querySelector('#aituConfirmPasswordError');
        const finalBtn = overlay.querySelector('#aituConfirmFinalBtn');
        const cancelBtn2 = overlay.querySelector('#aituConfirmCancelBtn2');

        if (pwInput) pwInput.value = '';
        setTimeout(() => {
            if (pwInput) {
                pwInput.value = '';
                pwInput.focus();
            }
        }, 100);

        cancelBtn2.addEventListener('click', () => overlay.remove());

        async function submitVerification() {
            const password = pwInput.value.trim();
            if (!password) {
                errDiv.textContent = isAr ? 'يرجى إدخال كلمة المرور لتأكيد الحذف.' : 'Please enter your password.';
                errDiv.style.display = 'block';
                pwInput.focus();
                return;
            }

            finalBtn.disabled = true;
            finalBtn.innerText = isAr ? 'جاري التحقق...' : 'Verifying...';

            const isValid = await authService.verifyPassword(password);
            if (!isValid) {
                errDiv.textContent = isAr ? 'كلمة المرور غير صحيحة، يرجى المحاولة مرة أخرى.' : 'Incorrect password. Please try again.';
                errDiv.style.display = 'block';
                finalBtn.disabled = false;
                finalBtn.innerText = isAr ? 'تأكيد وإتمام الحذف' : 'Confirm & Delete';
                pwInput.focus();
                return;
            }

            executeAction(password);
        }

        finalBtn.addEventListener('click', submitVerification);
        pwInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') submitVerification();
        });
    }

    async function executeAction(password) {
        try {
            if (onConfirm) await onConfirm(password);
        } catch (e) {
            console.error('Confirm action error:', e);
        } finally {
            if (overlay && overlay.parentNode) overlay.remove();
        }
    }

    renderStep1();
    document.body.appendChild(overlay);

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });
}

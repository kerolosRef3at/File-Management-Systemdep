// js/shared/custom-select.js
/**
 * Executive Custom Dropdown Controller for AITU Academic Portal
 * Replaces native OS select popups with executive, glassmorphic, Cairo-styled dropdown menus.
 */

let activeDropdownMenu = null;
let activeTriggerWrap = null;

export function closeActiveDropdown() {
    if (activeDropdownMenu) {
        activeDropdownMenu.classList.remove('open');
        const menuToRemove = activeDropdownMenu;
        setTimeout(() => {
            if (menuToRemove && menuToRemove.parentNode) {
                menuToRemove.parentNode.removeChild(menuToRemove);
            }
        }, 150);
        activeDropdownMenu = null;
    }
    if (activeTriggerWrap) {
        activeTriggerWrap.classList.remove('dropdown-open');
        activeTriggerWrap = null;
    }
}

// Global click listener to close dropdown when clicking outside
if (typeof document !== 'undefined') {
    document.addEventListener('click', (e) => {
        if (activeDropdownMenu && !activeDropdownMenu.contains(e.target) && (!activeTriggerWrap || !activeTriggerWrap.contains(e.target))) {
            closeActiveDropdown();
        }
    });

    // ESC key closes dropdown
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && activeDropdownMenu) {
            closeActiveDropdown();
        }
    });

    // Window resize or scroll closes floating menu
    window.addEventListener('resize', closeActiveDropdown);
    window.addEventListener('scroll', (e) => {
        if (activeDropdownMenu && !activeDropdownMenu.contains(e.target)) {
            closeActiveDropdown();
        }
    }, true);
}

/**
 * Enhances a native <select> element with the executive custom floating dropdown menu.
 */
export function enhanceSelect(selectEl) {
    if (!selectEl || selectEl.dataset.customSelectEnhanced === 'true') return;
    selectEl.dataset.customSelectEnhanced = 'true';

    // Find or create wrapper
    let wrap = selectEl.closest('.repo-chip-select-wrap, .executive-select-wrap, .logs-action-select-wrap, .dash-year-select-wrap, .custom-select-wrap');
    
    if (!wrap) {
        wrap = document.createElement('div');
        wrap.className = 'executive-select-wrap';
        selectEl.parentNode.insertBefore(wrap, selectEl);
        wrap.appendChild(selectEl);
    }

    // Add display text label span if not present
    let labelSpan = wrap.querySelector('.custom-select-label-text');
    if (!labelSpan) {
        labelSpan = document.createElement('span');
        labelSpan.className = 'custom-select-label-text';
        // Insert right after prefix icon if exists, else at start
        const prefix = wrap.querySelector('.select-prefix-icon, svg:not(.select-chevron-icon)');
        if (prefix && prefix.nextSibling) {
            wrap.insertBefore(labelSpan, prefix.nextSibling);
        } else {
            wrap.insertBefore(labelSpan, wrap.firstChild);
        }
    }

    // Add chevron icon if not present
    let chevron = wrap.querySelector('.select-chevron-icon');
    if (!chevron) {
        chevron = document.createElement('span');
        chevron.className = 'select-chevron-icon';
        chevron.innerHTML = `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>`;
        wrap.appendChild(chevron);
    }

    // Update label text
    const updateLabel = () => {
        const selectedOpt = selectEl.options[selectEl.selectedIndex];
        if (selectedOpt) {
            labelSpan.textContent = selectedOpt.text;
        }
    };
    updateLabel();

    // Prevent default native dropdown from opening
    selectEl.addEventListener('mousedown', (e) => {
        e.preventDefault();
        toggleDropdown(wrap, selectEl, updateLabel);
    });

    // Also handle click on the wrapper itself
    wrap.addEventListener('click', (e) => {
        if (e.target.closest('.custom-select-menu')) return;
        toggleDropdown(wrap, selectEl, updateLabel);
    });

    // Listen to programmatic or external value changes
    selectEl.addEventListener('change', updateLabel);

    // Observe changes to <select> children (options added dynamically)
    const observer = new MutationObserver(() => {
        updateLabel();
    });
    observer.observe(selectEl, { childList: true, subtree: true });
}

function toggleDropdown(wrap, selectEl, updateLabel) {
    if (activeTriggerWrap === wrap) {
        closeActiveDropdown();
        return;
    }

    closeActiveDropdown();

    const options = Array.from(selectEl.options);
    if (options.length === 0) return;

    const isRtl = document.documentElement.getAttribute('dir') === 'rtl' || document.body.getAttribute('dir') === 'rtl';

    // Create custom floating menu
    const menu = document.createElement('div');
    menu.className = 'custom-select-menu';
    if (isRtl) menu.setAttribute('dir', 'rtl');

    // Build items
    options.forEach((opt, idx) => {
        const isSelected = opt.value === selectEl.value;
        const item = document.createElement('div');
        item.className = `custom-select-item ${isSelected ? 'selected' : ''}`;
        item.dataset.value = opt.value;
        item.dataset.index = idx;

        item.innerHTML = `
            <span class="custom-select-item-text">${opt.text}</span>
            ${isSelected ? `
                <svg class="custom-select-check" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#1565C0" stroke-width="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>
            ` : '<span style="width:15px;"></span>'}
        `;

        item.addEventListener('click', (e) => {
            e.stopPropagation();
            if (selectEl.value !== opt.value) {
                selectEl.value = opt.value;
                selectEl.dispatchEvent(new Event('change', { bubbles: true }));
                selectEl.dispatchEvent(new Event('input', { bubbles: true }));
            }
            updateLabel();
            closeActiveDropdown();
        });

        menu.appendChild(item);
    });

    document.body.appendChild(menu);

    // Calculate position
    const rect = wrap.getBoundingClientRect();
    const menuWidth = Math.max(rect.width, 190);
    menu.style.minWidth = `${menuWidth}px`;

    let top = rect.bottom + 6;
    let left = isRtl ? (rect.right - menuWidth) : rect.left;

    // Check if overflows window bottom
    const menuHeight = Math.min(options.length * 40 + 16, 320);
    if (top + menuHeight > window.innerHeight && rect.top > menuHeight) {
        top = rect.top - menuHeight - 6;
    }

    // Keep within screen edges
    if (left < 10) left = 10;
    if (left + menuWidth > window.innerWidth - 10) {
        left = window.innerWidth - menuWidth - 10;
    }

    menu.style.top = `${top}px`;
    menu.style.left = `${left}px`;

    // Animate open
    requestAnimationFrame(() => {
        menu.classList.add('open');
        wrap.classList.add('dropdown-open');
    });

    activeDropdownMenu = menu;
    activeTriggerWrap = wrap;
}

/**
 * Scans the page (or container) and automatically enhances all eligible selects.
 */
export function initAllCustomSelects(root = document) {
    if (!root || !root.querySelectorAll) return;
    const selects = root.querySelectorAll(`
        .repo-chip-select,
        .filter-select,
        .executive-select,
        .logs-select,
        .dash-banner-select,
        .dash-year-select,
        .cc-select
    `);
    selects.forEach(enhanceSelect);
}

// Auto-run on DOM ready and listen to layout updates
if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => initAllCustomSelects());
    } else {
        initAllCustomSelects();
    }
}

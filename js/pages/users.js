// js/pages/users.js
import { protectPage, getCurrentUser } from '../shared/auth.js';
import { userService, logService } from '../shared/services.js';
import { renderLayout } from '../shared/layout.js';
import { renderSkeleton, showAlert, showConfirmModal } from '../shared/components.js';
import { translations, getCurrentLang } from '../shared/jssharedi18n.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Guards access: Users Page is strictly restricted to Supervisor role
    if (!protectPage(['Supervisor'])) {
        return;
    }
    const currentUser = getCurrentUser();

    // Render shared layouts menu context
    renderLayout('users');

    const contentArea = document.getElementById('page-content');
    if (!contentArea) return;

    let allUsers = [];
    let currentRoleFilter = 'all';

    const lang = getCurrentLang();
    const t = (key) => (translations[lang] || translations.en)[key] || translations.en[key] || key;

    // Departments and roles come from the server. Both used to be typed into
    // this file by hand -- three <option> tags, a name->id map, and a fixed set
    // of role cards -- so a department created in the Repository had no entry
    // anywhere here. Picking it was impossible; the code fell through to
    // deptId = 1 (IT) and role "Mechanical Manager".
    //   GET /api/Admin/departments -> [{ id, name, code, icon, managerRole }]
    //   GET /api/Admin/roles       -> [{ role, deptCode, description }]
    let departments = [];
    let roles = [];

    async function loadOrgData() {
        try {
            [departments, roles] = await Promise.all([
                userService.getDepartments(),
                userService.getRoles()
            ]);
        } catch (e) {
            console.warn('Could not load departments/roles:', e);
            departments = [];
            roles = [];
        }
    }

    /** "DESIGN Manager" -> "DESIGN". Null for Supervisor/Faculty. Mirrors RoleHelper.cs. */
    function deptCodeFromRole(role) {
        const r = String(role || '').trim();
        const m = r.match(/^(.+)\s+Manager$/i);
        return m ? m[1].trim().toUpperCase() : null;
    }

    const isManagerRole = role => deptCodeFromRole(role) !== null;

    function initUsersList() {
        contentArea.innerHTML = `
            <div class="page-header-actions" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px; flex-wrap:wrap; gap:15px;">
                <div>
                    <h1 style="color: var(--primary-dark); font-size: 2rem;">${t('users_title')}</h1>
                    <p style="color: var(--text-gray);">${t('sidebar_sub_users')}</p>
                </div>
                <button class="btn-primary" id="openAddUserBtn">+ ${t('users_add')}</button>
            </div>

            <div id="usersPageAlerts"></div>

            <div class="filters-bar" style="display:flex; gap:15px; margin-bottom:25px; flex-wrap:wrap;">
                <div class="search-bar" style="width: 300px; background: var(--white);">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <input type="text" id="userSearch" placeholder="${t('users_search')}">
                </div>
                <select class="filter-select" id="roleFilter">
                    <option value="all">${t('users_all_roles')}</option>
                    ${roles.map(r => `<option value="${r.role}">${r.role}</option>`).join('')}
                </select>
            </div>

            <div class="metrics-grid" style="margin-bottom:25px;">
                <div class="metric-card stat-btn active-stat" data-role="all" style="padding: 15px; cursor:pointer;" id="cardStatTotal">
                    <div class="metric-value" style="font-size: 1.8rem;" id="statTotal">0</div>
                    <div class="metric-card-header" style="margin:0;">${t('users_stat_total')}</div>
                </div>
                <div class="metric-card stat-btn" data-role="Supervisor" style="padding: 15px; border-bottom: 4px solid #9333ea; cursor:pointer;" id="cardStatSup">
                    <div class="metric-value" style="font-size: 1.8rem;" id="statSup">0</div>
                    <div class="metric-card-header" style="margin:0;">${t('users_stat_supervisors')}</div>
                </div>
                <div class="metric-card stat-btn" data-role="managers" style="padding: 15px; border-bottom: 4px solid #0284c7; cursor:pointer;" id="cardStatManagers">
                    <div class="metric-value" style="font-size: 1.8rem;" id="statManagers">0</div>
                    <div class="metric-card-header" style="margin:0;">${t('users_stat_managers')}</div>
                </div>
                <div class="metric-card stat-btn" data-role="Faculty" style="padding: 15px; border-bottom: 4px solid #16a34a; cursor:pointer;" id="cardStatFaculty">
                    <div class="metric-value" style="font-size: 1.8rem;" id="statFaculty">0</div>
                    <div class="metric-card-header" style="margin:0;">${t('users_stat_faculty')}</div>
                </div>
            </div>

            <div class="dashboard-panel" style="padding: 0; overflow-x: auto; -webkit-overflow-scrolling: touch; background:white; border: 1px solid var(--border-color); border-radius:10px;">
                <table class="data-table" style="width: 100%;">
                    <thead style="background: #f8fafc;">
                        <tr>
                            <th style="padding: 15px 20px;">${t('users_col_user')}</th>
                            <th>${t('users_col_role')}</th>
                            <th>${t('users_col_phone')}</th>
                            <th>${t('users_col_joined')}</th>
                            <th>${t('users_col_actions')}</th>
                        </tr>
                    </thead>
                    <tbody id="usersTableBody">
                        <tr><td colspan="5" style="text-align: center; padding: 20px;">${t('loader_text')}</td></tr>
                    </tbody>
                </table>
            </div>
        `;

        const openAddUserBtn = document.getElementById('openAddUserBtn');
        if (openAddUserBtn) {
            openAddUserBtn.addEventListener('click', showCreateUserPage);
        }

        const searchEl = document.getElementById('userSearch');
        if (searchEl) searchEl.addEventListener('input', applyFilters);

        const dropdownFilter = document.getElementById('roleFilter');
        if (dropdownFilter) {
            dropdownFilter.addEventListener('change', (e) => {
                document.querySelectorAll('.stat-btn').forEach(b => b.classList.remove('active-stat'));
                document.getElementById('cardStatTotal').classList.add('active-stat');
                currentRoleFilter = e.target.value;
                applyFilters();
            });
        }

        document.querySelectorAll('.stat-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.stat-btn').forEach(b => b.classList.remove('active-stat'));
                e.currentTarget.classList.add('active-stat');

                const selectedRole = e.currentTarget.getAttribute('data-role');
                const roleDropdown = document.getElementById('roleFilter');
                
                if (selectedRole === 'Field') {
                    if (roleDropdown) roleDropdown.value = 'all'; 
                } else {
                    if (roleDropdown) roleDropdown.value = selectedRole;
                }

                currentRoleFilter = selectedRole;
                applyFilters();
            });
        });

        loadUsers();
    }

    function normalizeUsers(list) {
        if (!Array.isArray(list)) return [];
        return list.map((u, index) => {
            const username = String(u.username || u.name || u.user || (u.email ? u.email.split('@')[0] : `user_${index + 1}`));
            const email = String(u.email || u.mail || `${username}@aitu.edu`);
            const role = String(u.role || u.userRole || 'Public User');
            const phone = String(u.phone || u.mobile || 'N/A');
            const joined = String(u.joined || u.created_at || u.date || new Date().toISOString().slice(0, 10));
            return {
                ...u,
                id: u.id || u.userId || index + 1,
                username,
                email,
                role,
                phone,
                joined,
                isProtected: Boolean(u.isProtected || username.toLowerCase() === 'admin')
            };
        });
    }

    function applyFilters() {
        const searchInput = document.getElementById('userSearch');
        const term = searchInput ? searchInput.value.toLowerCase().trim() : '';

        let filtered = [...allUsers];

        if (currentRoleFilter === 'Field') {
            filtered = filtered.filter(u => {
                const r = String(u.role || '').toLowerCase();
                return r.includes('el') || r.includes('mechanical') || r.includes('mechanic');
            });
        } else if (currentRoleFilter !== 'all') {
            filtered = filtered.filter(u => String(u.role || '').toLowerCase().includes(currentRoleFilter.toLowerCase()));
        }

        if (term) {
            filtered = filtered.filter(u => 
                String(u.username || '').toLowerCase().includes(term) || 
                String(u.email || '').toLowerCase().includes(term) ||
                String(u.phone || '').toLowerCase().includes(term)
            );
        }

        renderUsers(filtered);
    }

    async function loadUsers() {
        const usersTableBody = document.getElementById('usersTableBody');
        const alertsContainer = document.getElementById('usersPageAlerts');
        if (!usersTableBody) return;

        renderSkeleton(usersTableBody, 'table', 4);
        try {
            const rawUsers = await userService.getUsers();
            allUsers = normalizeUsers(rawUsers);
            applyFilters();
            updateStats();
        } catch (error) {
            showAlert(alertsContainer, error.message || 'Failed to fetch user accounts.', 'error');
            usersTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color:var(--text-gray);">Failed to load users from server.</td></tr>';
        } finally {
            // Hide Global Loader
            const loader = document.getElementById('global-page-loader');
            if (loader) {
                loader.classList.add('hide-loader');
                setTimeout(() => loader.remove(), 400);
            }
        }
    }

    function updateStats() {
        const statTotal = document.getElementById('statTotal');
        const statSup = document.getElementById('statSup');
        const statManagers = document.getElementById('statManagers');
        const statFaculty = document.getElementById('statFaculty');

        // Exact matches. The old code used .includes('it') / .includes('el'),
        // which is why counts drifted: any role whose text happened to contain
        // those letters was tallied, and new departments were counted nowhere.
        if (statTotal) statTotal.innerText = allUsers.length;
        if (statSup) statSup.innerText = allUsers.filter(u => u.role === 'Supervisor').length;
        if (statManagers) statManagers.innerText = allUsers.filter(u => isManagerRole(u.role)).length;
        if (statFaculty) statFaculty.innerText = allUsers.filter(u => u.role === 'Faculty').length;
    }

    // Only these three department codes have a badge colour in the stylesheet.
    // Anything else gets the neutral default instead of being painted as ME,
    // which is what `return 'role-me'` did to every new department.
    // Substring tests are gone: .includes('it') also matched "Security ...",
    // .includes('el') matched "Field ...".
    function getRoleBadgeClass(role) {
        if (role === 'Supervisor') return 'role-supervisor';
        const code = deptCodeFromRole(role);
        if (code === 'IT') return 'role-it';
        if (code === 'EL') return 'role-el';
        if (code === 'ME') return 'role-me';
        return '';
    }

    function getRoleDisplay(role) {
        const isAr = getCurrentLang() === 'ar';
        let r = role || '';
        if (r === 'Mechanic Manager' || r === 'Mechanical Manager') r = 'ME Manager';

        if (!isAr) return r;

        if (r === 'Supervisor') return 'مشرف عام';
        if (r === 'Faculty') return 'عضو هيئة تدريس';
        if (r === 'Public User') return 'مستخدم عام';
        if (r.endsWith(' Manager')) {
            const code = r.replace(/\s+Manager$/i, '');
            return code && code !== 'Department' ? `مدير قسم (${code})` : 'مدير قسم';
        }
        return r;
    }

    function renderUsers(usersToRender) {
        const usersTableBody = document.getElementById('usersTableBody');
        if (!usersTableBody) return;

        const isAr = getCurrentLang() === 'ar';
        usersTableBody.innerHTML = '';

        if (!Array.isArray(usersToRender) || usersToRender.length === 0) {
            usersTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color:var(--text-gray);">' + t('users_no_found') + '</td></tr>';
            return;
        }

        const loggedInUser = getCurrentUser();
        const loggedInUsername = String(loggedInUser?.username || '').toLowerCase();
        const isPrimaryAdmin = loggedInUsername === 'admin';

        usersToRender.forEach(user => {
            const initial = (user.username || 'U').charAt(0).toUpperCase();
            const protectedBadge = user.isProtected ? '<span class="badge-protected">Protected</span>' : '';
            const isTargetSupervisor = user.role === 'Supervisor';
            const isSelf = String(user.username || '').toLowerCase() === loggedInUsername;

            let canDelete = true;
            let deleteReason = '';

            if (user.isProtected) {
                canDelete = false;
                deleteReason = isAr ? 'حساب محمي لا يمكن حذفه' : 'Protected Account';
            } else if (isSelf) {
                canDelete = false;
                deleteReason = isAr ? 'لا يمكنك حذف حسابك الحالي' : 'Cannot delete your own account';
            } else if (isTargetSupervisor && !isPrimaryAdmin) {
                canDelete = false;
                deleteReason = isAr ? 'حساب الأدمن الرئيسي (admin) فقط هو من يقدر على حذف المشرفين' : 'Only primary admin can delete another Supervisor';
            }

            const deleteDisabled = !canDelete ? 'disabled style="opacity:0.25; cursor:not-allowed;"' : '';
            const deleteTitle = canDelete ? t('users_delete') : deleteReason;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="padding: 15px 20px;">
                    <div class="user-cell" style="display:flex; align-items:center; gap:12px;">
                        <div class="user-avatar" style="
                            width: 36px; height: 36px; border-radius: 50%; background-color: var(--primary-dark); color: var(--white); display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.9rem;
                        ">${initial}</div>
                        <div class="user-details">
                            <h5 style="font-size:0.95rem; color:var(--primary-dark); margin:0; display:flex; align-items:center; gap:8px;">
                                ${user.username} ${protectedBadge}
                            </h5>
                            <span style="font-size:0.8rem; color:var(--text-gray);">${user.email}</span>
                        </div>
                    </div>
                </td>
                <td><span class="role-badge ${getRoleBadgeClass(user.role)}" style="padding:4px 12px; border-radius:12px; font-size:0.75rem; font-weight:600; display:inline-block;">${getRoleDisplay(user.role)}</span></td>
                <td style="color: var(--text-gray); font-size: 0.9rem;">${user.phone || 'N/A'}</td>
                <td style="color: var(--text-gray); font-size: 0.9rem;">${user.joined}</td>
                <td>
                    <button class="action-btn delete-user-btn" data-id="${user.id}" title="${deleteTitle}" ${deleteDisabled} style="background:none; border:none; cursor:${canDelete ? 'pointer' : 'not-allowed'}; color:var(--text-gray); transition:0.3s;">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                </td>
            `;
            usersTableBody.appendChild(tr);
        });

        document.querySelectorAll('.delete-user-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const loggedInUser = getCurrentUser();
                const loggedInUsername = String(loggedInUser?.username || '').toLowerCase();
                const isPrimaryAdmin = loggedInUsername === 'admin';
                const isAr = getCurrentLang() === 'ar';

                const id = e.currentTarget.getAttribute('data-id');
                const targetUser = allUsers.find(u => u.id == id);
                if (!targetUser) return;

                if (targetUser.isProtected) {
                    showAlert(alertsContainer, isAr ? 'لا يمكن حذف الحسابات المحمية.' : 'Protected accounts cannot be deleted.', 'error');
                    return;
                }
                if (String(targetUser.username || '').toLowerCase() === loggedInUsername) {
                    showAlert(alertsContainer, isAr ? 'لا يمكنك حذف حسابك الحالي المسجل به.' : 'You cannot delete your current account.', 'error');
                    return;
                }
                if (targetUser.role === 'Supervisor' && !isPrimaryAdmin) {
                    showAlert(alertsContainer, isAr ? 'عفواً، حساب الأدمن الرئيسي (admin) فقط هو من يقدر على حذف المشرفين العموم.' : 'Only the primary admin (admin) can delete another Supervisor account.', 'error');
                    return;
                }

                showConfirmModal({
                    title: isAr ? 'تأكيد حذف المستخدم' : 'Confirm User Deletion',
                    message: isAr 
                        ? `هل أنت متأكد من رغبتك في حذف حساب المستخدم "${targetUser.username}" نهائياً من النظام؟` 
                        : `Are you sure you want to delete user account "${targetUser.username}"?`,
                    confirmText: isAr ? 'متابعة الحذف' : 'Proceed to Delete',
                    cancelText: isAr ? 'إلغاء' : 'Cancel',
                    type: 'danger',
                    requirePassword: true,
                    onConfirm: async () => {
                        try {
                            await userService.deleteUser(id, targetUser);
                            logService.addLog(loggedInUser?.username || 'admin', loggedInUser?.role || 'Supervisor', 'Delete User', targetUser.username);
                            showAlert(alertsContainer, `User account "${targetUser.username}" successfully deleted.`, 'success');
                            await loadUsers();
                        } catch (err) {
                            showAlert(alertsContainer, err.message || 'Failed to delete user account.', 'error');
                        }
                    }
                });
            });
        });
    }

    function showCreateUserPage() {
        let selectedRole = 'Faculty';

        contentArea.innerHTML = `
            <div class="create-user-page" style="animation: fadeIn 0.3s ease-in-out;">
                <!-- Breadcrumbs and Action Buttons Header -->
                <div class="create-user-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:30px;">
                    <div>
                        <div class="create-user-breadcrumb" style="font-size:0.85rem; color:var(--text-gray); margin-bottom:4px;">
                            ${t('users_title')} &gt; <span style="color:var(--primary-dark); font-weight:600;">${t('users_add')}</span>
                        </div>
                        <h1 style="color:var(--primary-dark); font-size:2.2rem; font-weight:700; margin:0;">${t('users_create_title')}</h1>
                    </div>
                    <div style="display:flex; gap:12px;">
                        <button class="btn-outline" id="btnCancelCreate" style="height:46px; padding:0 24px;">${t('users_cancel')}</button>
                        <button class="btn-primary" id="btnSubmitCreate" style="height:46px; padding:0 24px; background-color:#0b3b70; border:none; color:#fff; border-radius:6px; font-weight:600; cursor:pointer;">${t('users_create_btn')}</button>
                    </div>
                </div>

                <div id="createPageAlerts" style="margin-bottom:20px;"></div>

                <!-- Main Content Split Layout -->
                <div class="create-user-layout" style="display:grid; grid-template-columns: 2fr 1fr; gap:30px; align-items:start;">
                    <!-- Left Side: Forms (65% width) -->
                    <div class="create-user-left" style="display:flex; flex-direction:column; gap:25px;">
                        
                        <!-- Card 1: Personal Information -->
                        <div class="form-card" style="background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:30px;">
                            <h3 style="display:flex; align-items:center; gap:10px; color:var(--primary-dark); font-size:1.15rem; font-weight:700; margin-top:0; margin-bottom:25px; border-bottom:1px solid #f1f5f9; padding-bottom:15px;">
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" style="color:#0b3b70;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                ${t('users_personal_info')}
                            </h3>
                            
                            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; margin-bottom:20px;">
                                <div class="form-group" style="margin:0;">
                                    <label style="font-weight:600; font-size:0.9rem; color:var(--primary-dark); display:block; margin-bottom:8px;">${t('users_full_name')}</label>
                                    <input type="text" id="addFullName" class="form-control" placeholder="${t('users_full_name_ph')}" style="background:#f8fafc; border:1px solid #e2e8f0; height:46px; border-radius:8px;" required>
                                </div>
                                <div class="form-group" style="margin:0;">
                                    <label style="font-weight:600; font-size:0.9rem; color:var(--primary-dark); display:block; margin-bottom:8px;">${t('users_email')}</label>
                                    <input type="email" id="addEmail" class="form-control" placeholder="john.smith@aitu.edu" style="background:#f8fafc; border:1px solid #e2e8f0; height:46px; border-radius:8px;" required>
                                </div>
                            </div>

                            <div style="display:grid; grid-template-columns: 1.2fr 1fr; gap:20px; align-items:center;">
                                <div class="form-group" style="margin:0;">
                                    <label style="font-weight:600; font-size:0.9rem; color:var(--primary-dark); display:block; margin-bottom:8px;">${t('users_phone')}</label>
                                    <input type="tel" id="addPhone" class="form-control" placeholder="01xxxxxxxxx" maxlength="11" pattern="01[0-9]{9}" style="background:#f8fafc; border:1px solid #e2e8f0; height:46px; border-radius:8px;">
                                </div>
                                
                                <!-- Profile Picture Upload Area -->
                                <div class="profile-pic-upload" id="profilePicUploadArea" style="display:flex; align-items:center; gap:12px; border:2px dashed #cbd5e1; border-radius:10px; padding:10px 14px; background:#f8fafc; cursor:pointer; height:76px; margin-top:28px; box-sizing:border-box; position:relative; transition:all 0.2s;">
                                    <div id="profilePicPreviewBox" style="width:48px; height:48px; border-radius:50%; background:#e2e8f0; display:flex; align-items:center; justify-content:center; color:var(--text-gray); overflow:hidden; flex-shrink:0; border:2px solid #cbd5e1;">
                                        <svg id="profilePicIcon" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                                        <img id="profilePicImg" src="" alt="Preview" style="width:100%; height:100%; object-fit:cover; display:none;">
                                    </div>
                                    <div style="flex:1; min-width:0; line-height:1.3;">
                                        <div id="profilePicName" style="font-size:0.85rem; font-weight:700; color:var(--primary-dark); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${t('users_profile_pic')}</div>
                                        <div id="profilePicSub" style="font-size:0.75rem; color:var(--text-gray);">${t('users_profile_pic_sub')}</div>
                                    </div>
                                    <button type="button" id="btnRemovePic" style="display:none; background:#fee2e2; border:none; color:#ef4444; border-radius:50%; width:24px; height:24px; cursor:pointer; font-weight:bold; font-size:12px; line-height:24px; padding:0; text-align:center; flex-shrink:0;" title="Remove picture">✕</button>
                                    <input type="file" id="addProfilePic" style="display:none;" accept="image/*">
                                </div>
                            </div>
                        </div>

                        <!-- Card 2: Organizational Details -->
                        <div class="form-card" style="background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:30px;">
                            <h3 style="display:flex; align-items:center; gap:10px; color:var(--primary-dark); font-size:1.15rem; font-weight:700; margin-top:0; margin-bottom:25px; border-bottom:1px solid #f1f5f9; padding-bottom:15px;">
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" style="color:#0b3b70;"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                                ${t('users_org_details')}
                            </h3>
                            
                            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px;">
                                <div class="form-group" style="margin:0;">
                                    <label style="font-weight:600; font-size:0.9rem; color:var(--primary-dark); display:block; margin-bottom:8px;">${t('users_dept')}</label>
                                    <select id="addDepartment" class="form-control" style="background:#f8fafc; border:1px solid #e2e8f0; height:46px; border-radius:8px;" required>
                                        <option value="" disabled selected>${t('users_select_dept')}</option>
                                        ${departments.map(d => `<option value="${d.id}">${d.name} (${d.code})</option>`).join('')}
                                    </select>
                                    ${departments.length === 0 ? `
                                        <div style="font-size:0.75rem; color:#dc2626; margin-top:6px;">
                                            No departments found. Create one in the Repository first.
                                        </div>` : ''}
                                </div>
                                <div class="form-group" style="margin:0;">
                                    <label style="font-weight:600; font-size:0.9rem; color:var(--primary-dark); display:block; margin-bottom:8px;">${t('users_designation')}</label>
                                    <input type="text" id="addDesignation" class="form-control" placeholder="${t('users_designation_ph')}" style="background:#f8fafc; border:1px solid #e2e8f0; height:46px; border-radius:8px;">
                                </div>
                            </div>
                        </div>

                        <!-- Card 3: Security Settings -->
                        <div class="form-card" style="background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:30px;">
                            <h3 style="display:flex; align-items:center; gap:10px; color:var(--primary-dark); font-size:1.15rem; font-weight:700; margin-top:0; margin-bottom:25px; border-bottom:1px solid #f1f5f9; padding-bottom:15px;">
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" style="color:#0b3b70;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                                ${t('users_security_settings')}
                            </h3>
                            
                            <div style="display:grid; grid-template-columns: 1fr 1.2fr; gap:20px; align-items:center;">
                                <div class="form-group" style="margin:0;">
                                    <label style="font-weight:600; font-size:0.9rem; color:var(--primary-dark); display:block; margin-bottom:8px;">${t('users_expiry_date')}</label>
                                    <input type="date" id="addExpiryDate" class="form-control" style="background:#f8fafc; border:1px solid #e2e8f0; height:46px; border-radius:8px;">
                                </div>
                                
                                <!-- Toggle Switch for Force Password Change -->
                                <div style="display:flex; align-items:center; gap:12px; margin-top:28px;">
                                    <label class="switch" style="position:relative; display:inline-block; width:50px; height:26px; flex-shrink:0;">
                                        <input type="checkbox" id="addForcePassword" checked style="opacity:0; width:0; height:0;">
                                        <span class="slider round" style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:#ccc; transition:.4s; border-radius:34px;"></span>
                                    </label>
                                    <span style="font-weight:600; font-size:0.9rem; color:var(--primary-dark); line-height:1.2;">${t('users_force_pw')}</span>
                                </div>
                            </div>
                        </div>

                    </div>

                    <!-- Right Side: Access & Permissions (35% width) -->
                    <div class="create-user-right" style="background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:30px; display:flex; flex-direction:column; gap:20px;">
                        <h3 style="display:flex; align-items:center; gap:10px; color:var(--primary-dark); font-size:1.15rem; font-weight:700; margin-top:0; margin-bottom:5px;">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" style="color:#0b3b70;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                            ${t('users_access_permissions')}
                        </h3>
                        
                        <p style="font-size:0.85rem; color:var(--text-gray); margin:0 0 10px 0; line-height:1.5;">
                            ${t('users_access_sub')}
                        </p>

                        <!-- Role Selector Cards -->
                        <div class="role-selector-group" style="display:flex; flex-direction:column; gap:15px;">

                            <div class="role-option-card active" data-role="Faculty" style="border:2px solid #0b3b70; background:#eff6ff; border-radius:8px; padding:15px; cursor:pointer; transition:all 0.2s;">
                                <div style="font-weight:700; color:#0b3b70; font-size:0.95rem; margin-bottom:5px;">${t('users_role_faculty')}</div>
                                <div style="font-size:0.8rem; color:#475569; line-height:1.4;">${t('users_role_faculty_desc')}</div>
                            </div>

                            <div class="role-option-card" data-role="Department Manager" style="border:1px solid #e2e8f0; background:#fff; border-radius:8px; padding:15px; cursor:pointer; transition:all 0.2s;">
                                <div style="font-weight:700; color:var(--primary-dark); font-size:0.95rem; margin-bottom:5px;">${t('users_role_dept_mgr')}</div>
                                <div style="font-size:0.8rem; color:#475569; line-height:1.4;">
                                    ${t('users_role_dept_mgr_desc')}
                                    &mdash; <strong id="roleManagerPreview">${t('users_select_dept_first')}</strong>.
                                </div>
                            </div>

                            <div class="role-option-card" data-role="Supervisor" style="border:1px solid #e2e8f0; background:#fff; border-radius:8px; padding:15px; cursor:pointer; transition:all 0.2s;">
                                <div style="font-weight:700; color:var(--primary-dark); font-size:0.95rem; margin-bottom:5px;">${t('users_role_supervisor')}</div>
                                <div style="font-size:0.8rem; color:#475569; line-height:1.4;">${t('users_role_supervisor_desc')}</div>
                            </div>

                        </div>

                        <!-- System Note -->
                        <div style="display:flex; gap:10px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:15px; margin-top:15px;">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#64748b" stroke-width="2" style="flex-shrink:0;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                            <div style="line-height:1.4;">
                                <div style="font-size:0.75rem; font-weight:700; color:#475569; letter-spacing:0.05em;">${t('users_system_note')}</div>
                                <div style="font-size:0.75rem; color:#64748b; font-style:italic;">${t('users_system_note_sub')}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Bind cancel button
        const btnCancel = document.getElementById('btnCancelCreate');
        if (btnCancel) {
            btnCancel.addEventListener('click', initUsersList);
        }

        // Bind role selector options
        const optionCards = document.querySelectorAll('.role-option-card');
        optionCards.forEach(card => {
            card.addEventListener('click', (e) => {
                optionCards.forEach(c => {
                    c.classList.remove('active');
                    c.style.border = '1px solid #e2e8f0';
                    c.style.background = '#fff';
                    const title = c.querySelector('div:first-child');
                    if (title) title.style.color = 'var(--primary-dark)';
                });
                
                const activeCard = e.currentTarget;
                activeCard.classList.add('active');
                activeCard.style.border = '2px solid #0b3b70';
                activeCard.style.background = '#eff6ff';
                const title = activeCard.querySelector('div:first-child');
                if (title) title.style.color = '#0b3b70';

                selectedRole = activeCard.getAttribute('data-role');
            });
        });

        // Show the role the chosen department will actually produce, so the
        // admin sees "DESIGN Manager" before saving rather than after.
        const deptSelect = document.getElementById('addDepartment');
        const rolePreview = document.getElementById('roleManagerPreview');
        if (deptSelect && rolePreview) {
            const syncPreview = () => {
                const d = departments.find(x => String(x.id) === String(deptSelect.value));
                rolePreview.textContent = d && d.code
                    ? `${d.code} Manager`
                    : t('users_select_dept_first');
            };
            deptSelect.addEventListener('change', syncPreview);
            syncPreview();
        }

        // Trigger profile picture upload click & preview
        const uploadArea = document.getElementById('profilePicUploadArea');
        const fileInput = document.getElementById('addProfilePic');
        const previewImg = document.getElementById('profilePicImg');
        const iconSvg = document.getElementById('profilePicIcon');
        const picNameEl = document.getElementById('profilePicName');
        const picSubEl = document.getElementById('profilePicSub');
        const removeBtn = document.getElementById('btnRemovePic');

        if (uploadArea && fileInput) {
            uploadArea.addEventListener('click', (e) => {
                if (e.target !== removeBtn && !removeBtn.contains(e.target)) {
                    fileInput.click();
                }
            });

            fileInput.addEventListener('change', () => {
                if (fileInput.files && fileInput.files[0]) {
                    const file = fileInput.files[0];
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        if (previewImg) {
                            previewImg.src = event.target.result;
                            previewImg.style.display = 'block';
                        }
                        if (iconSvg) iconSvg.style.display = 'none';
                    };
                    reader.readAsDataURL(file);

                    if (picNameEl) picNameEl.textContent = file.name;
                    if (picSubEl) {
                        const sizeMB = (file.size / 1024 / 1024).toFixed(2);
                        picSubEl.innerHTML = `<span style="direction:ltr; unicode-bidi:embed; display:inline-block;">${sizeMB} MB</span>`;
                    }
                    if (removeBtn) removeBtn.style.display = 'block';
                }
            });

            if (removeBtn) {
                removeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    fileInput.value = '';
                    if (previewImg) {
                        previewImg.src = '';
                        previewImg.style.display = 'none';
                    }
                    if (iconSvg) iconSvg.style.display = 'block';
                    if (picNameEl) picNameEl.textContent = t('users_profile_pic');
                    if (picSubEl) picSubEl.textContent = t('users_profile_pic_sub');
                    removeBtn.style.display = 'none';
                });
            }
        }

        // Real-time Input Sanitization & Formatting
        const addPhoneInput = document.getElementById('addPhone');
        if (addPhoneInput) {
            addPhoneInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/\D/g, '').slice(0, 11);
            });
        }
        const addEmailInput = document.getElementById('addEmail');
        if (addEmailInput) {
            addEmailInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/\s/g, '');
            });
        }

        // Bind submit button
        const btnSubmit = document.getElementById('btnSubmitCreate');
        const alertBox = document.getElementById('createPageAlerts');
        if (btnSubmit) {
            btnSubmit.addEventListener('click', async () => {
                const isAr = getCurrentLang() === 'ar';
                const fullName = document.getElementById('addFullName').value.trim();
                const email = document.getElementById('addEmail').value.trim();
                const phone = document.getElementById('addPhone').value.trim();
                const department = document.getElementById('addDepartment').value;
                const designation = document.getElementById('addDesignation').value.trim();
                
                // 1. Full Name Validation
                const nameRegex = /^[a-zA-Z\u0600-\u06FF\s.'-]{2,60}$/;
                if (!fullName || !nameRegex.test(fullName)) {
                    showAlert(alertBox, isAr ? 'يرجى إدخال اسم كامل صحيح (حروف فقط بدون أرقام أو رموز غريبة).' : 'Please enter a valid full name (letters only).', 'error');
                    return;
                }

                // 2. Strict Email Validation (with TLD extension)
                const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                if (!email || !emailRegex.test(email)) {
                    showAlert(alertBox, isAr ? 'يرجى إدخال بريد إلكتروني صحيح يحتوي على نطاق كامل (مثال: name@domain.com).' : 'Please enter a valid email address with a complete domain (e.g. name@domain.com).', 'error');
                    return;
                }

                // 3. Egyptian Phone Validation (11 digits, starting with 01)
                const phoneRegex = /^01[0-9]{9}$/;
                if (phone && !phoneRegex.test(phone)) {
                    showAlert(alertBox, isAr ? 'يرجى إدخال رقم هاتف مصري صحيح مكون من 11 رقم يبدأ بـ 01 (مثال: 01012345678).' : 'Please enter a valid 11-digit Egyptian phone number starting with 01 (e.g., 01012345678).', 'error');
                    return;
                }

                const chosenDept = departments.find(d => String(d.id) === String(department));
                if (!chosenDept) {
                    showAlert(alertBox, isAr ? 'يرجى اختيار القسم.' : 'Please select a department.', 'error');
                    return;
                }

                if (selectedRole === 'Department Manager' && !chosenDept.code) {
                    showAlert(alertBox, isAr ? `القسم "${chosenDept.name}" لا يملك كود قسم، لذا لا يمكن تعيين مدير له.` : `"${chosenDept.name}" has no department code, so it cannot have a manager. Set a code for it in the Repository.`, 'error');
                    return;
                }

                btnSubmit.disabled = true;
                btnSubmit.innerText = isAr ? 'جاري الإنشاء...' : 'Creating...';

                try {
                    const username = email.split('@')[0];

                    // department is already the real Folders.Id.
                    const deptId = parseInt(department, 10);
                    const dept = departments.find(d => String(d.id) === String(department));

                    let resolvedRole = selectedRole;
                    if (selectedRole === 'Department Manager') {
                        resolvedRole = `${dept.code} Manager`;
                    }

                    const mustChangePassword = document.getElementById('addForcePassword')?.checked ?? true;
                    await userService.createUser(username, email, phone, resolvedRole, deptId, mustChangePassword);
                    logService.addLog(currentUser?.username || 'admin', currentUser?.role || 'Supervisor', 'Add User', username);

                    initUsersList();
                    const listAlert = document.getElementById('usersPageAlerts');
                    if (listAlert) {
                        showAlert(listAlert, isAr ? `تم إنشاء حساب المستخدم "${fullName}" بنجاح.` : `User account "${fullName}" successfully created.`, 'success');
                    }
                } catch (err) {
                    showAlert(alertBox, err.message || (isAr ? 'فشل إنشاء حساب المستخدم.' : 'Failed to create user account.'), 'error');
                    btnSubmit.disabled = false;
                    btnSubmit.innerText = 'Create User';
                }
            });
        }
    }

    // Departments and roles must be in hand before anything renders: both the
    // list filter and the create form are built from them.
    await loadOrgData();
    initUsersList();
});
// js/pages/users.js
import { protectPage, getCurrentUser } from '../shared/auth.js';
import { userService, logService } from '../shared/services.js';
import { renderLayout } from '../shared/layout.js';
import { renderSkeleton, showAlert } from '../shared/components.js';

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

    function initUsersList() {
        contentArea.innerHTML = `
            <div class="page-header-actions" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px; flex-wrap:wrap; gap:15px;">
                <div>
                    <h1 style="color: var(--primary-dark); font-size: 2rem;">User Management & Access Control</h1>
                    <p style="color: var(--text-gray);">Manage system access, roles, and administrative privileges.</p>
                </div>
                <button class="btn-primary" id="openAddUserBtn">+ Add New User</button>
            </div>

            <div id="usersPageAlerts"></div>

            <div class="filters-bar" style="display:flex; gap:15px; margin-bottom:25px; flex-wrap:wrap;">
                <div class="search-bar" style="width: 300px; background: var(--white);">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <input type="text" id="userSearch" placeholder="Search by email or username...">
                </div>
                <select class="filter-select" id="roleFilter">
                    <option value="all">All Roles</option>
                    <option value="Supervisor">Supervisor</option>
                    <option value="IT Manager">IT Manager</option>
                    <option value="EL Manager">EL Manager</option>
                    <option value="Mechanical Manager">Mechanical Manager</option>
                </select>
            </div>

            <div class="metrics-grid" style="margin-bottom:25px;">
                <div class="metric-card stat-btn active-stat" data-role="all" style="padding: 15px; cursor:pointer;" id="cardStatTotal">
                    <div class="metric-value" style="font-size: 1.8rem;" id="statTotal">0</div>
                    <div class="metric-card-header" style="margin:0;">Total Users</div>
                </div>
                <div class="metric-card stat-btn" data-role="Supervisor" style="padding: 15px; border-bottom: 4px solid #9333ea; cursor:pointer;" id="cardStatSup">
                    <div class="metric-value" style="font-size: 1.8rem;" id="statSup">0</div>
                    <div class="metric-card-header" style="margin:0;">Supervisors</div>
                </div>
                <div class="metric-card stat-btn" data-role="IT Manager" style="padding: 15px; border-bottom: 4px solid #0284c7; cursor:pointer;" id="cardStatIT">
                    <div class="metric-value" style="font-size: 1.8rem;" id="statIT">0</div>
                    <div class="metric-card-header" style="margin:0;">IT Managers</div>
                </div>
                <div class="metric-card stat-btn" data-role="Field" style="padding: 15px; border-bottom: 4px solid #16a34a; cursor:pointer;" id="cardStatField">
                    <div class="metric-value" style="font-size: 1.8rem;" id="statField">0</div>
                    <div class="metric-card-header" style="margin:0;">Field Managers</div>
                </div>
            </div>

            <div class="dashboard-panel" style="padding: 0; overflow-x: auto; -webkit-overflow-scrolling: touch; background:white; border: 1px solid var(--border-color); border-radius:10px;">
                <table class="data-table" style="width: 100%;">
                    <thead style="background: #f8fafc;">
                        <tr>
                            <th style="padding: 15px 20px;">User</th>
                            <th>Role</th>
                            <th>Phone</th>
                            <th>Joined</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="usersTableBody">
                        <tr><td colspan="5" style="text-align: center; padding: 20px;">Loading users...</td></tr>
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

    function applyFilters() {
        const searchInput = document.getElementById('userSearch');
        const term = searchInput ? searchInput.value.toLowerCase().trim() : '';

        let filtered = allUsers;

        if (currentRoleFilter === 'Field') {
            filtered = filtered.filter(u => u.role === 'EL Manager' || u.role === 'Mechanical Manager' || u.role === 'Mechanic Manager');
        } else if (currentRoleFilter !== 'all') {
            filtered = filtered.filter(u => u.role === currentRoleFilter);
        }

        if (term) {
            filtered = filtered.filter(u => 
                u.username.toLowerCase().includes(term) || 
                u.email.toLowerCase().includes(term)
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
            allUsers = await userService.getUsers();
            applyFilters();
            updateStats();
        } catch (error) {
            showAlert(alertsContainer, error.message || 'Failed to fetch user accounts.', 'error');
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
        const statIT = document.getElementById('statIT');
        const statField = document.getElementById('statField');

        if (statTotal) statTotal.innerText = allUsers.length;
        if (statSup) statSup.innerText = allUsers.filter(u => u.role === 'Supervisor').length;
        if (statIT) statIT.innerText = allUsers.filter(u => u.role === 'IT Manager').length;
        if (statField) statField.innerText = allUsers.filter(u => u.role === 'EL Manager' || u.role === 'Mechanical Manager' || u.role === 'Mechanic Manager').length;
    }

    function getRoleBadgeClass(role) {
        const r = role.toLowerCase();
        if (r === 'supervisor') return 'role-supervisor';
        if (r === 'it manager') return 'role-it';
        if (r === 'el manager') return 'role-el';
        return 'role-me';
    }

    function getRoleDisplay(role) {
        if (role === 'Mechanic Manager') return 'Mechanical Manager';
        return role;
    }

    function renderUsers(usersToRender) {
        const usersTableBody = document.getElementById('usersTableBody');
        const alertsContainer = document.getElementById('usersPageAlerts');
        if (!usersTableBody) return;

        usersTableBody.innerHTML = '';

        if (usersToRender.length === 0) {
            usersTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color:var(--text-gray);">No users found.</td></tr>';
            return;
        }

        usersToRender.forEach(user => {
            const initial = user.username.charAt(0).toUpperCase();
            const protectedBadge = user.isProtected ? '<span class="badge-protected">Protected</span>' : '';
            const deleteDisabled = user.isProtected ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : '';

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
                    <button class="action-btn delete-user-btn" data-id="${user.id}" title="Delete User" ${deleteDisabled} style="background:none; border:none; cursor:pointer; color:var(--text-gray); transition:0.3s;">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                </td>
            `;
            usersTableBody.appendChild(tr);
        });

        document.querySelectorAll('.delete-user-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                const targetUser = allUsers.find(u => u.id == id);
                if (!targetUser) return;

                if (confirm(`Are you sure you want to permanently delete user account "${targetUser.username}"?`)) {
                    try {
                        await userService.deleteUser(id);
                        logService.addLog(currentUser?.username || 'admin', currentUser?.role || 'Supervisor', 'Delete User', targetUser.username);
                        showAlert(alertsContainer, `User account "${targetUser.username}" successfully deleted.`, 'success');
                        await loadUsers();
                    } catch (err) {
                        showAlert(alertsContainer, err.message || 'Failed to delete user account.', 'error');
                    }
                }
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
                            User Management &gt; <span style="color:var(--primary-dark); font-weight:600;">Add New User</span>
                        </div>
                        <h1 style="color:var(--primary-dark); font-size:2.2rem; font-weight:700; margin:0;">Create New User</h1>
                    </div>
                    <div style="display:flex; gap:12px;">
                        <button class="btn-outline" id="btnCancelCreate" style="height:46px; padding:0 24px;">Cancel</button>
                        <button class="btn-primary" id="btnSubmitCreate" style="height:46px; padding:0 24px; background-color:#0b3b70; border:none; color:#fff; border-radius:6px; font-weight:600; cursor:pointer;">Create User</button>
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
                                Personal Information
                            </h3>
                            
                            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; margin-bottom:20px;">
                                <div class="form-group" style="margin:0;">
                                    <label style="font-weight:600; font-size:0.9rem; color:var(--primary-dark); display:block; margin-bottom:8px;">Full Name</label>
                                    <input type="text" id="addFullName" class="form-control" placeholder="e.g. Dr. John Smith" style="background:#f8fafc; border:1px solid #e2e8f0; height:46px; border-radius:8px;" required>
                                </div>
                                <div class="form-group" style="margin:0;">
                                    <label style="font-weight:600; font-size:0.9rem; color:var(--primary-dark); display:block; margin-bottom:8px;">Email Address</label>
                                    <input type="email" id="addEmail" class="form-control" placeholder="john.smith@aitu.edu" style="background:#f8fafc; border:1px solid #e2e8f0; height:46px; border-radius:8px;" required>
                                </div>
                            </div>

                            <div style="display:grid; grid-template-columns: 1.2fr 1fr; gap:20px; align-items:center;">
                                <div class="form-group" style="margin:0;">
                                    <label style="font-weight:600; font-size:0.9rem; color:var(--primary-dark); display:block; margin-bottom:8px;">Phone Number</label>
                                    <input type="text" id="addPhone" class="form-control" placeholder="+20 (1__) ___-____" style="background:#f8fafc; border:1px solid #e2e8f0; height:46px; border-radius:8px;">
                                </div>
                                
                                <!-- Profile Picture Upload Area -->
                                <div class="profile-pic-upload" style="display:flex; align-items:center; gap:15px; border:2px dashed #cbd5e1; border-radius:10px; padding:15px; background:#f8fafc; cursor:pointer; height:76px; margin-top:28px;">
                                    <div style="width:40px; height:40px; border-radius:8px; background:#e2e8f0; display:flex; align-items:center; justify-content:center; color:var(--text-gray);">
                                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                                    </div>
                                    <div style="line-height:1.2;">
                                        <div style="font-size:0.85rem; font-weight:700; color:var(--primary-dark);">Profile Picture</div>
                                        <div style="font-size:0.75rem; color:var(--text-gray);">PNG, JPG up to 5MB</div>
                                    </div>
                                    <input type="file" id="addProfilePic" style="display:none;" accept="image/*">
                                </div>
                            </div>
                        </div>

                        <!-- Card 2: Organizational Details -->
                        <div class="form-card" style="background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:30px;">
                            <h3 style="display:flex; align-items:center; gap:10px; color:var(--primary-dark); font-size:1.15rem; font-weight:700; margin-top:0; margin-bottom:25px; border-bottom:1px solid #f1f5f9; padding-bottom:15px;">
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" style="color:#0b3b70;"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                                Organizational Details
                            </h3>
                            
                            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px;">
                                <div class="form-group" style="margin:0;">
                                    <label style="font-weight:600; font-size:0.9rem; color:var(--primary-dark); display:block; margin-bottom:8px;">Department</label>
                                    <select id="addDepartment" class="form-control" style="background:#f8fafc; border:1px solid #e2e8f0; height:46px; border-radius:8px;" required>
                                        <option value="" disabled selected>Select Department</option>
                                        <option value="Information Tech">Information Tech (IT)</option>
                                        <option value="Electrical Eng">Electrical Eng. (EL)</option>
                                        <option value="Mechanical Eng">Mechanical Eng. (ME)</option>
                                    </select>
                                </div>
                                <div class="form-group" style="margin:0;">
                                    <label style="font-weight:600; font-size:0.9rem; color:var(--primary-dark); display:block; margin-bottom:8px;">Designation / Job Title</label>
                                    <input type="text" id="addDesignation" class="form-control" placeholder="e.g. Senior Researcher" style="background:#f8fafc; border:1px solid #e2e8f0; height:46px; border-radius:8px;">
                                </div>
                            </div>
                        </div>

                        <!-- Card 3: Security Settings -->
                        <div class="form-card" style="background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:30px;">
                            <h3 style="display:flex; align-items:center; gap:10px; color:var(--primary-dark); font-size:1.15rem; font-weight:700; margin-top:0; margin-bottom:25px; border-bottom:1px solid #f1f5f9; padding-bottom:15px;">
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" style="color:#0b3b70;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                                Security Settings
                            </h3>
                            
                            <div style="display:grid; grid-template-columns: 1fr 1.2fr; gap:20px; align-items:center;">
                                <div class="form-group" style="margin:0;">
                                    <label style="font-weight:600; font-size:0.9rem; color:var(--primary-dark); display:block; margin-bottom:8px;">Account Expiry Date (Optional)</label>
                                    <input type="date" id="addExpiryDate" class="form-control" style="background:#f8fafc; border:1px solid #e2e8f0; height:46px; border-radius:8px;">
                                </div>
                                
                                <!-- Toggle Switch for Force Password Change -->
                                <div style="display:flex; align-items:center; gap:12px; margin-top:28px;">
                                    <label class="switch" style="position:relative; display:inline-block; width:50px; height:26px; flex-shrink:0;">
                                        <input type="checkbox" id="addForcePassword" style="opacity:0; width:0; height:0;">
                                        <span class="slider round" style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:#ccc; transition:.4s; border-radius:34px;"></span>
                                    </label>
                                    <span style="font-weight:600; font-size:0.9rem; color:var(--primary-dark); line-height:1.2;">Force password change on first login</span>
                                </div>
                            </div>
                        </div>

                    </div>

                    <!-- Right Side: Access & Permissions (35% width) -->
                    <div class="create-user-right" style="background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:30px; display:flex; flex-direction:column; gap:20px;">
                        <h3 style="display:flex; align-items:center; gap:10px; color:var(--primary-dark); font-size:1.15rem; font-weight:700; margin-top:0; margin-bottom:5px;">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" style="color:#0b3b70;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                            Access & Permissions
                        </h3>
                        
                        <p style="font-size:0.85rem; color:var(--text-gray); margin:0 0 10px 0; line-height:1.5;">
                            Select the appropriate access level for this user. Permissions are additive based on the role.
                        </p>

                        <!-- Role Selector Cards -->
                        <div class="role-selector-group" style="display:flex; flex-direction:column; gap:15px;">
                            
                            <!-- Faculty -->
                            <div class="role-option-card active" data-role="Faculty" style="border:2px solid #0b3b70; background:#eff6ff; border-radius:8px; padding:15px; cursor:pointer; transition:all 0.2s;">
                                <div style="font-weight:700; color:#0b3b70; font-size:0.95rem; margin-bottom:5px;">Faculty</div>
                                <div style="font-size:0.8rem; color:#475569; line-height:1.4;">Basic access to upload course materials, manage own student lists, and view personal research repository.</div>
                            </div>

                            <!-- Department Head -->
                            <div class="role-option-card" data-role="Department Head" style="border:1px solid #e2e8f0; background:#fff; border-radius:8px; padding:15px; cursor:pointer; transition:all 0.2s;">
                                <div style="font-weight:700; color:var(--primary-dark); font-size:0.95rem; margin-bottom:5px;">Department Head</div>
                                <div style="font-size:0.8rem; color:#475569; line-height:1.4;">Full access to department-wide repositories, curriculum approval tools, and staff performance metrics.</div>
                            </div>

                            <!-- IT Manager -->
                            <div class="role-option-card" data-role="IT Manager" style="border:1px solid #e2e8f0; background:#fff; border-radius:8px; padding:15px; cursor:pointer; transition:all 0.2s;">
                                <div style="font-weight:700; color:var(--primary-dark); font-size:0.95rem; margin-bottom:5px;">IT Manager</div>
                                <div style="font-size:0.8rem; color:#475569; line-height:1.4;">Infrastructure management, user account provisioning (limited), and system configuration access.</div>
                            </div>

                            <!-- Super Admin -->
                            <div class="role-option-card" data-role="Supervisor" style="border:1px solid #e2e8f0; background:#fff; border-radius:8px; padding:15px; cursor:pointer; transition:all 0.2s;">
                                <div style="font-weight:700; color:var(--primary-dark); font-size:0.95rem; margin-bottom:5px;">Super Admin</div>
                                <div style="font-size:0.8rem; color:#475569; line-height:1.4;">Unrestricted access to all system modules, global settings, audit logs, and security protocols.</div>
                            </div>

                        </div>

                        <!-- System Note -->
                        <div style="display:flex; gap:10px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:15px; margin-top:15px;">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#64748b" stroke-width="2" style="flex-shrink:0;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                            <div style="line-height:1.4;">
                                <div style="font-size:0.75rem; font-weight:700; color:#475569; letter-spacing:0.05em;">SYSTEM NOTE</div>
                                <div style="font-size:0.75rem; color:#64748b; font-style:italic;">User will receive an automated invitation email once the profile is created.</div>
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

        // Trigger profile picture upload click
        const uploadArea = document.querySelector('.profile-pic-upload');
        const fileInput = document.getElementById('addProfilePic');
        if (uploadArea && fileInput) {
            uploadArea.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', () => {
                if (fileInput.files.length) {
                    const picName = uploadArea.querySelector('div:nth-child(2) div:first-child');
                    const picSize = uploadArea.querySelector('div:nth-child(2) div:last-child');
                    if (picName) picName.textContent = fileInput.files[0].name;
                    if (picSize) picSize.textContent = (fileInput.files[0].size / 1024 / 1024).toFixed(2) + ' MB';
                }
            });
        }

        // Bind submit button
        const btnSubmit = document.getElementById('btnSubmitCreate');
        const alertBox = document.getElementById('createPageAlerts');
        if (btnSubmit) {
            btnSubmit.addEventListener('click', async () => {
                const fullName = document.getElementById('addFullName').value.trim();
                const email = document.getElementById('addEmail').value.trim();
                const phone = document.getElementById('addPhone').value.trim();
                const department = document.getElementById('addDepartment').value;
                const designation = document.getElementById('addDesignation').value.trim();
                
                if (!fullName || !email) {
                    showAlert(alertBox, 'Full Name and Email Address are required.', 'error');
                    return;
                }

                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    showAlert(alertBox, 'Please enter a valid email address.', 'error');
                    return;
                }

                btnSubmit.disabled = true;
                btnSubmit.innerText = 'Creating...';

                try {
                    const username = email.split('@')[0];

                    let resolvedRole = 'Public User';
                    if (selectedRole === 'Supervisor') resolvedRole = 'Supervisor';
                    else if (selectedRole === 'IT Manager') resolvedRole = 'IT Manager';
                    else if (selectedRole === 'Department Head') {
                        if (department === 'Information Tech') resolvedRole = 'IT Manager';
                        else if (department === 'Electrical Eng') resolvedRole = 'EL Manager';
                        else resolvedRole = 'Mechanical Manager';
                    }

                    await userService.createUser(username, email, phone, resolvedRole);
                    logService.addLog(currentUser?.username || 'admin', currentUser?.role || 'Supervisor', 'Add User', username);

                    initUsersList();
                    const listAlert = document.getElementById('usersPageAlerts');
                    if (listAlert) {
                        showAlert(listAlert, `User account "${fullName}" successfully created.`, 'success');
                    }
                } catch (err) {
                    showAlert(alertBox, err.message || 'Failed to create user account.', 'error');
                    btnSubmit.disabled = false;
                    btnSubmit.innerText = 'Create User';
                }
            });
        }
    }

    // Initialize list view on load
    initUsersList();
});
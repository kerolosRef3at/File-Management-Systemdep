// js/pages/profile.js
import { protectPage, getCurrentUser } from '../shared/auth.js';
import { profileService, logService } from '../shared/services.js';
import { renderLayout } from '../shared/layout.js';
import { showAlert } from '../shared/components.js';

document.addEventListener('DOMContentLoaded', () => {
    // Guards access: requires authenticated active admin session
    if (!protectPage(['Supervisor', 'IT Manager', 'EL Manager', 'Mechanical Manager', 'Mechanic Manager'])) {
        return;
    }

    // Render shared layouts
    renderLayout('profile');

    const contentArea = document.getElementById('page-content');
    if (!contentArea) return;

    const user = getCurrentUser();

    // Standardize role presentation label
    function getRoleDisplay(role) {
        if (role === 'Mechanic Manager') return 'Mechanical Manager';
        return role;
    }

    // Inject outer layout framework
    contentArea.innerHTML = `
        <div class="page-header-actions" style="margin-bottom: 30px;">
            <div>
                <h1 style="color: var(--primary-dark); font-size: 2rem;">Profile & Account Settings</h1>
                <p style="color: var(--text-gray);">Manage your AITU administrative credentials and security preferences.</p>
            </div>
        </div>

        <div class="profile-grid">
            <div class="profile-card" style="background:white; border:1px solid var(--border-color); border-radius:10px; overflow:hidden;">
                <div class="profile-card-header" style="padding:20px 25px; border-bottom:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center; color:var(--primary-dark); font-weight:600; font-size:1.1rem;">
                    Account Information
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
                <div class="profile-card-body" style="padding:25px;">
                    
                    <div class="photo-upload-section" style="display:flex; align-items:center; gap:20px; margin-bottom:30px;">
                        <img src="https://ui-avatars.com/api/?name=${user.username}&background=072247&color=fff" alt="Profile avatar" class="profile-img-preview" id="profileImagePreview" style="width:80px; height:80px; border-radius:50%; object-fit:cover; border:2px solid var(--border-color);">
                        <div>
                            <div class="photo-upload-actions" style="display:flex; gap:15px; margin-bottom:5px;">
                                <button type="button" class="btn-text-primary" id="changePhotoBtn" style="background:none; border:none; color:var(--primary-blue); font-weight:600; cursor:pointer;">Change Photo</button>
                                <button type="button" class="btn-text-danger" id="removePhotoBtn" style="background:none; border:none; color:#ef4444; font-weight:600; cursor:pointer;">Remove</button>
                            </div>
                            <p style="font-size: 0.8rem; color: var(--text-gray); margin:0;">JPG, GIF or PNG. Max size of 800K</p>
                        </div>
                    </div>

                    <form id="profileForm">
                        <div class="profile-form-row">
                            <div class="form-group" style="margin-bottom:0;">
                                <label style="display:block; margin-bottom:5px; font-weight:600; font-size:0.95rem;">Username (Read-only)</label>
                                <input type="text" class="form-control" value="${user.username}" style="background-color: #f1f5f9; color: var(--text-gray); cursor: not-allowed;" readonly>
                            </div>
                            <div class="form-group" style="margin-bottom:0;">
                                <label style="display:block; margin-bottom:5px; font-weight:600; font-size:0.95rem;">Full Name</label>
                                <input type="text" id="fullName" class="form-control" value="${user.name || user.username}" required>
                            </div>
                        </div>

                        <div class="profile-form-row">
                            <div class="form-group" style="margin-bottom:0;">
                                <label style="display:block; margin-bottom:5px; font-weight:600; font-size:0.95rem;">Role / Designation</label>
                                <input type="text" class="form-control" value="${getRoleDisplay(user.role)}" style="background-color: #f1f5f9; color: var(--text-gray); cursor: not-allowed;" readonly>
                            </div>
                            <div class="form-group" style="margin-bottom:0;">
                                <label style="display:block; margin-bottom:5px; font-weight:600; font-size:0.95rem;">Date Joined</label>
                                <input type="text" class="form-control" value="${user.joined}" style="background-color: #f1f5f9; color: var(--text-gray); cursor: not-allowed;" readonly>
                            </div>
                        </div>

                        <div class="form-group" style="margin-bottom:15px;">
                            <label style="display:block; margin-bottom:5px; font-weight:600; font-size:0.95rem;">Email Address</label>
                            <div style="position: relative;">
                                <svg style="position:absolute; left:12px; top:14px; color:var(--text-gray);" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                                <input type="email" id="email" class="form-control" value="${user.email || (user.username ? user.username + '@aitu.edu.eg' : '')}" style="padding-left: 40px;" required>
                            </div>
                        </div>

                        <div class="form-group" style="margin-bottom:15px;">
                            <label style="display:block; margin-bottom:5px; font-weight:600; font-size:0.95rem;">Phone Number</label>
                            <div style="position: relative;">
                                <svg style="position:absolute; left:12px; top:14px; color:var(--text-gray);" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                                <input type="text" id="mobile" class="form-control" placeholder="+20 (1__) ___-____" value="${user.phone || ''}" style="padding-left: 40px;" required>
                            </div>
                        </div>

                        <div style="text-align: right; margin-top: 25px;">
                            <button type="submit" class="btn-primary" id="saveProfileBtn">Save Changes</button>
                        </div>
                        <div class="form-alert" id="profileAlert" style="margin-top:15px; display:none;"></div>
                    </form>
                </div>
            </div>

            <div>
                <div class="profile-card" style="background:white; border:1px solid var(--border-color); border-radius:10px; overflow:hidden; margin-bottom:25px;">
                    <div class="profile-card-header" style="padding:20px 25px; border-bottom:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center; color:var(--primary-dark); font-weight:600; font-size:1.1rem;">
                        Security
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </div>
                    <div class="profile-card-body" style="padding:25px;">
                        <form id="securityForm">
                            <div class="form-group" style="margin-bottom:15px;">
                                <label style="display:block; margin-bottom:5px; font-weight:600; font-size:0.95rem;">Current Password</label>
                                <input type="password" id="oldPassword" class="form-control" placeholder="********" required>
                            </div>
                            <div class="form-group" style="margin-bottom:15px;">
                                <label style="display:block; margin-bottom:5px; font-weight:600; font-size:0.95rem;">New Password</label>
                                <input type="password" id="newPassword" class="form-control" placeholder="Create new password" required>
                            </div>
                            <div class="form-group" style="margin-bottom:15px;">
                                <label style="display:block; margin-bottom:5px; font-weight:600; font-size:0.95rem;">Confirm New Password</label>
                                <input type="password" id="repeatPassword" class="form-control" placeholder="Confirm new password" required>
                            </div>
                            <button type="submit" class="btn-outline" style="width: 100%; border-color: var(--primary-blue); color: var(--primary-blue);" id="updatePasswordBtn">Update Password</button>
                            <div class="form-alert" id="securityAlert" style="margin-top:15px; display:none;"></div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;

    // 1. Submit Profile Settings form
    const profileForm = document.getElementById('profileForm');
    const profileAlert = document.getElementById('profileAlert');
    const saveProfileBtn = document.getElementById('saveProfileBtn');

    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value.trim();
            const mobile = document.getElementById('mobile').value.trim();
            const fullName = document.getElementById('fullName').value.trim();

            saveProfileBtn.disabled = true;
            saveProfileBtn.innerText = 'Saving...';
            profileAlert.style.display = 'none';

            try {
                // TODO: PUT /api/Admin/profile
                await profileService.updateProfile(email, mobile, fullName);
                
                showAlert(profileAlert, 'Profile information updated successfully.', 'success');
                logService.addLog(user.username, user.role, 'Update Profile', `Updated contact info`);
                
                // Update header displays in-place instead of reloading layout (which clears forms)
                const freshUser = getCurrentUser();
                if (freshUser) {
                    const newInitial = (freshUser.name || freshUser.username).charAt(0).toUpperCase();
                    const newName = freshUser.name || freshUser.username;
                    
                    const initialEl = document.querySelector('#userAvatarBtn span:first-child');
                    if (initialEl) initialEl.textContent = newInitial;
                    
                    const nameSpan = document.querySelector('#userAvatarBtn div span:first-child');
                    if (nameSpan) nameSpan.textContent = newName;
                    
                    const dropdownInitial = document.querySelector('#userDropdown .avatar-lg');
                    if (dropdownInitial) dropdownInitial.textContent = newInitial;
                    
                    const dropdownName = document.querySelector('#userDropdown .name');
                    if (dropdownName) dropdownName.textContent = newName;
                    
                    const dropdownEmail = document.querySelector('#userDropdown .email');
                    if (dropdownEmail) dropdownEmail.textContent = freshUser.email;
                }
            } catch (err) {
                showAlert(profileAlert, err.message || 'Failed to update profile.', 'error');
            } finally {
                saveProfileBtn.disabled = false;
                saveProfileBtn.innerText = 'Save Changes';
            }
        });
    }

    // 2. Submit Security Password form
    const securityForm = document.getElementById('securityForm');
    const securityAlert = document.getElementById('securityAlert');
    const updatePasswordBtn = document.getElementById('updatePasswordBtn');

    if (securityForm) {
        securityForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const oldPassword = document.getElementById('oldPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const repeatPassword = document.getElementById('repeatPassword').value;

            if (newPassword !== repeatPassword) {
                showAlert(securityAlert, 'New passwords do not match.', 'error');
                return;
            }

            if (newPassword.length < 8) {
                showAlert(securityAlert, 'New password must be at least 8 characters long.', 'error');
                return;
            }

            updatePasswordBtn.disabled = true;
            updatePasswordBtn.innerText = 'Updating...';
            securityAlert.style.display = 'none';

            try {
                // TODO: POST /api/Auth/change-password
                await profileService.changePassword(oldPassword, newPassword);
                showAlert(securityAlert, 'Password updated successfully.', 'success');
                logService.addLog(user.username, user.role, 'Change Password', `Updated account password`);
                securityForm.reset();
            } catch (err) {
                showAlert(securityAlert, err.message || 'Failed to update password.', 'error');
            } finally {
                updatePasswordBtn.disabled = false;
                updatePasswordBtn.innerText = 'Update Password';
            }
        });
    }

    // Mock buttons triggers
    document.getElementById('changePhotoBtn').addEventListener('click', () => {
        alert('Selecting profile photo from local files...');
    });
    document.getElementById('removePhotoBtn').addEventListener('click', () => {
        const preview = document.getElementById('profileImagePreview');
        if (preview) {
            preview.src = `https://ui-avatars.com/api/?name=${user.username}&background=072247&color=fff`;
        }
    });

    // Hide Global Loader
    const loader = document.getElementById('global-page-loader');
    if (loader) {
        loader.classList.add('hide-loader');
        setTimeout(() => loader.remove(), 400);
    }
});
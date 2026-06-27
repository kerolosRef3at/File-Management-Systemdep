// js/pages/profile.js
import { renderLayout } from '../shared/layout.js';
import { fetchAPI } from '../shared/api.js';

document.addEventListener('DOMContentLoaded', () => {
    // رسم الـ Layout وتحديد الصفحة النشطة كـ profile
    renderLayout('profile');

    const contentArea = document.getElementById('page-content');

    // حقن محتوى الصفحة
    contentArea.innerHTML = `
        <div class="page-header-actions" style="margin-bottom: 30px;">
            <div>
                <h1 style="color: var(--primary-dark); font-size: 2rem;">Profile & Account Settings</h1>
                <p style="color: var(--text-gray);">Manage your AITU administrative credentials and security preferences.</p>
            </div>
        </div>

        <div class="profile-grid">
            <div class="profile-card">
                <div class="profile-card-header">
                    Account Information
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                </div>
                <div class="profile-card-body">
                    
                    <div class="photo-upload-section">
                        <img src="avatar-placeholder.png" alt="Profile" class="profile-img-preview" id="profileImagePreview" onerror="this.src='https://ui-avatars.com/api/?name=Admin&background=072247&color=fff'">
                        <div>
                            <div class="photo-upload-actions">
                                <button type="button" class="btn-text-primary">Change Photo</button>
                                <button type="button" class="btn-text-danger">Remove</button>
                            </div>
                            <p style="font-size: 0.8rem; color: var(--text-gray);">JPG, GIF or PNG. Max size of 800K</p>
                        </div>
                    </div>

                    <form id="profileForm">
                        <div class="form-group">
                            <label>Username (Read-only)</label>
                            <input type="text" class="form-control" value="admin_jsmith23" style="background-color: #f1f5f9; color: var(--text-gray); cursor: not-allowed;" readonly>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label>First Name</label>
                                <input type="text" id="firstName" class="form-control" value="John">
                            </div>
                            <div class="form-group">
                                <label>Last Name</label>
                                <input type="text" id="lastName" class="form-control" value="Smith">
                            </div>
                        </div>

                        <div class="form-group">
                            <label>Email Address</label>
                            <div style="position: relative;">
                                <svg style="position:absolute; left:12px; top:14px; color:var(--text-gray);" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                                <input type="email" id="email" class="form-control" value="jsmith23@university.edu" style="padding-left: 40px;" required>
                            </div>
                        </div>

                        <div class="form-group">
                            <label>Phone Number</label>
                            <div style="position: relative;">
                                <svg style="position:absolute; left:12px; top:14px; color:var(--text-gray);" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                                <input type="text" id="mobile" class="form-control" value="+1 (555) 123-4567" style="padding-left: 40px;" required>
                            </div>
                        </div>

                        <div style="text-align: right; margin-top: 20px;">
                            <button type="submit" class="btn-primary" id="saveProfileBtn">Save Changes</button>
                        </div>
                        <div class="form-alert" id="profileAlert"></div>
                    </form>
                </div>
            </div>

            <div>
                <div class="profile-card">
                    <div class="profile-card-header">
                        Security
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </div>
                    <div class="profile-card-body">
                        <form id="securityForm">
                            <div class="form-group">
                                <label>Current Password</label>
                                <input type="password" id="oldPassword" class="form-control" placeholder="********" required>
                            </div>
                            <div class="form-group">
                                <label>New Password</label>
                                <input type="password" id="newPassword" class="form-control" placeholder="Create new password" required>
                            </div>
                            <div class="form-group">
                                <label>Confirm New Password</label>
                                <input type="password" id="repeatPassword" class="form-control" placeholder="Confirm new password" required>
                            </div>
                            <button type="submit" class="btn-outline" style="width: 100%; border-color: var(--primary-blue); color: var(--primary-blue);" id="updatePasswordBtn">Update Password</button>
                            <div class="form-alert" id="securityAlert"></div>
                        </form>
                    </div>
                </div>

                <div class="profile-card">
                    <div class="profile-card-header">
                        Activity Summary
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                    </div>
                    <div class="profile-card-body">
                        <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.9rem; margin-bottom:15px; padding-bottom:15px; border-bottom:1px solid var(--border-color);">
                            <span style="color:var(--text-gray); display:flex; align-items:center; gap:8px;">
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/></svg>
                                Last Login
                            </span>
                            <span style="color:var(--primary-dark); font-weight:600;">Oct 24, 09:41 AM</span>
                        </div>
                        
                        <div class="activity-summary">
                            <div class="activity-box">
                                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                                <h4>1,248</h4>
                                <span>Uploads</span>
                            </div>
                            <div class="activity-box">
                                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                                <h4>8,932</h4>
                                <span>Downloads</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // دالة مساعدة لإظهار التنبيهات
    function showAlert(elementId, message, type) {
        const alertBox = document.getElementById(elementId);
        alertBox.innerText = message;
        alertBox.className = `form-alert ${type}`;
        alertBox.style.display = 'block';
        setTimeout(() => alertBox.style.display = 'none', 5000);
    }

    // 1. معالجة تحديث البيانات (Profile Info)
    document.getElementById('profileForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('saveProfileBtn');
        const email = document.getElementById('email').value;
        const mobile = document.getElementById('mobile').value;
        
        btn.disabled = true;
        btn.innerText = 'Saving...';

        try {
            // حسب ملف Swagger، الـ DTO يقبل email و mobile فقط
            // await fetchAPI('/api/Admin/profile', {
            //     method: 'PUT',
            //     body: JSON.stringify({ email, mobile })
            // });
            
            // محاكاة نجاح العملية
            setTimeout(() => {
                showAlert('profileAlert', 'Profile information updated successfully.', 'success');
                btn.disabled = false;
                btn.innerText = 'Save Changes';
            }, 800);
        } catch (error) {
            showAlert('profileAlert', error.message || 'Failed to update profile.', 'error');
            btn.disabled = false;
            btn.innerText = 'Save Changes';
        }
    });

    // 2. معالجة تغيير كلمة المرور (Security Form)
    document.getElementById('securityForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('updatePasswordBtn');
        const oldPassword = document.getElementById('oldPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const repeatPassword = document.getElementById('repeatPassword').value;

        // التحقق من تطابق كلمتي المرور
        if (newPassword !== repeatPassword) {
            showAlert('securityAlert', 'New passwords do not match.', 'error');
            return;
        }

        btn.disabled = true;
        btn.innerText = 'Updating...';

        try {
            // حسب ملف Swagger
            // await fetchAPI('/api/Auth/change-password', {
            //     method: 'POST',
            //     body: JSON.stringify({ oldPassword, newPassword, repeatPassword })
            // });

            // محاكاة نجاح العملية
            setTimeout(() => {
                showAlert('securityAlert', 'Password changed successfully.', 'success');
                e.target.reset(); // تفريغ الحقول
                btn.disabled = false;
                btn.innerText = 'Update Password';
            }, 800);
        } catch (error) {
            showAlert('securityAlert', error.message || 'Failed to change password.', 'error');
            btn.disabled = false;
            btn.innerText = 'Update Password';
        }
    });
});
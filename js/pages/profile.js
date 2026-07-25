// js/pages/profile.js
import { protectPage, getCurrentUser } from '../shared/auth.js';
import { profileService, logService } from '../shared/services.js';
import { renderLayout } from '../shared/layout.js';
import { showAlert } from '../shared/components.js';
import { translations, getCurrentLang } from '../shared/jssharedi18n.js';

document.addEventListener('DOMContentLoaded', () => {
    // Guards access: requires authenticated active session
    if (!protectPage()) {
        const loader = document.getElementById('global-page-loader');
        if (loader) loader.remove();
        return;
    }

    // Render shared layouts
    renderLayout('profile');

    const contentArea = document.getElementById('page-content');
    if (!contentArea) return;

    const user = getCurrentUser();
    const lang = getCurrentLang();
    const t = (key) => (translations[lang] || translations.en)[key] || translations.en[key] || key;

    let currentAvatarDataUrl = user ? (user.avatar || '') : '';
    const defaultAvatarUrl = user ? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=072247&color=fff` : '';
    const initialAvatarSrc = (user && user.avatar) ? user.avatar : defaultAvatarUrl;

    // Standardize role presentation label
    function getRoleDisplay(role) {
        if (role === 'Mechanic Manager') return 'Mechanical Manager';
        return role;
    }

    // Inject outer layout framework
    contentArea.innerHTML = `
        <div class="page-header-actions" style="margin-bottom: 30px;">
            <div>
                <h1 style="color: var(--primary-dark); font-size: 2rem;">${t('profile_title')}</h1>
                <p style="color: var(--text-gray);">${t('profile_subtitle')}</p>
            </div>
        </div>

        <div class="profile-grid">
            <div class="profile-card" style="background:white; border:1px solid var(--border-color); border-radius:10px; overflow:hidden;">
                <div class="profile-card-header" style="padding:20px 25px; border-bottom:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center; color:var(--primary-dark); font-weight:600; font-size:1.1rem;">
                    ${t('profile_account_info')}
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
                <div class="profile-card-body" style="padding:25px;">
                    
                    <div class="photo-upload-section" style="display:flex; align-items:center; gap:20px; margin-bottom:30px;">
                        <img src="${initialAvatarSrc}" alt="Profile avatar" class="profile-img-preview" id="profileImagePreview" style="width:80px; height:80px; border-radius:50%; object-fit:cover; border:2px solid var(--border-color);">
                        <div>
                            <div class="photo-upload-actions" style="display:flex; gap:15px; margin-bottom:5px;">
                                <button type="button" class="btn-text-primary" id="changePhotoBtn" style="background:none; border:none; color:var(--primary-blue); font-weight:600; cursor:pointer;">${t('profile_change_photo')}</button>
                                <button type="button" class="btn-text-danger" id="removePhotoBtn" style="background:none; border:none; color:#ef4444; font-weight:600; cursor:pointer;">${t('profile_remove_photo')}</button>
                                <input type="file" id="profileFileInput" style="display:none;" accept="image/*">
                            </div>
                            <p style="font-size: 0.8rem; color: var(--text-gray); margin:0;">${t('profile_photo_help')}</p>
                        </div>
                    </div>

                    <form id="profileForm">
                        <div class="profile-form-row">
                            <div class="form-group" style="margin-bottom:0;">
                                <label style="display:block; margin-bottom:5px; font-weight:600; font-size:0.95rem;">${t('profile_username')}</label>
                                <input type="text" class="form-control" value="${user.username}" style="background-color: #f1f5f9; color: var(--text-gray); cursor: not-allowed;" readonly>
                            </div>
                            <div class="form-group" style="margin-bottom:0;">
                                <label style="display:block; margin-bottom:5px; font-weight:600; font-size:0.95rem;">${t('profile_full_name')}</label>
                                <input type="text" id="fullName" class="form-control" placeholder="${t('profile_full_name_ph')}" value="${user.name || user.username}" required>
                            </div>
                        </div>

                        <div class="profile-form-row">
                            <div class="form-group" style="margin-bottom:0;">
                                <label style="display:block; margin-bottom:5px; font-weight:600; font-size:0.95rem;">${t('profile_role')}</label>
                                <input type="text" class="form-control" value="${getRoleDisplay(user.role)}" style="background-color: #f1f5f9; color: var(--text-gray); cursor: not-allowed;" readonly>
                            </div>
                            <div class="form-group" style="margin-bottom:0;">
                                <label style="display:block; margin-bottom:5px; font-weight:600; font-size:0.95rem;">${t('profile_since')}</label>
                                <input type="text" class="form-control" value="${user.joined}" style="background-color: #f1f5f9; color: var(--text-gray); cursor: not-allowed;" readonly>
                            </div>
                        </div>

                        <div class="form-group" style="margin-bottom:15px;">
                                <label style="display:block; margin-bottom:5px; font-weight:600; font-size:0.95rem;">${t('profile_email')}</label>
                            <div style="position: relative;">
                                <svg style="position:absolute; left:12px; top:14px; color:var(--text-gray);" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                                <input type="email" id="email" class="form-control" value="${user.email || (user.username ? user.username + '@aitu.edu.eg' : '')}" style="padding-left: 40px;" placeholder="${t('profile_email_ph')}" required>
                            </div>
                        </div>

                        <div class="form-group" style="margin-bottom:15px;">
                                <label style="display:block; margin-bottom:5px; font-weight:600; font-size:0.95rem;">${t('profile_phone')}</label>
                            <div style="position: relative;">
                                <svg style="position:absolute; left:12px; top:14px; color:var(--text-gray);" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                                <input type="tel" id="mobile" class="form-control" placeholder="01xxxxxxxxx" value="${user.phone || ''}" style="padding-left: 40px;" maxlength="11" pattern="01[0-9]{9}" required>
                            </div>
                        </div>

                        <div style="text-align: right; margin-top: 25px;">
                            <button type="submit" class="btn-primary" id="saveProfileBtn">${t('profile_save')}</button>
                        </div>
                        <div class="form-alert" id="profileAlert" style="margin-top:15px; display:none;"></div>
                    </form>
                </div>
            </div>

            <div>
                <div class="profile-card" style="background:white; border:1px solid var(--border-color); border-radius:10px; overflow:hidden; margin-bottom:25px;">
                    <div class="profile-card-header" style="padding:20px 25px; border-bottom:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center; color:var(--primary-dark); font-weight:600; font-size:1.1rem;">
                        ${t('profile_security')}
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </div>
                    <div class="profile-card-body" style="padding:25px;">
                        <form id="securityForm">
                            <div class="form-group" style="margin-bottom:15px;">
                                <label style="display:block; margin-bottom:5px; font-weight:600; font-size:0.95rem;">${t('profile_current_pw')}</label>
                                <input type="password" id="oldPassword" class="form-control" placeholder="${t('profile_current_pw')}" required>
                            </div>
                            <div class="form-group" style="margin-bottom:15px;">
                                <label style="display:block; margin-bottom:5px; font-weight:600; font-size:0.95rem;">${t('profile_new_pw')}</label>
                                <input type="password" id="newPassword" class="form-control" placeholder="${t('profile_new_pw_ph')}" required>
                            </div>
                            <div class="form-group" style="margin-bottom:15px;">
                                <label style="display:block; margin-bottom:5px; font-weight:600; font-size:0.95rem;">${t('profile_confirm_pw')}</label>
                                <input type="password" id="repeatPassword" class="form-control" placeholder="${t('profile_confirm_pw_ph')}" required>
                            </div>
                            <button type="submit" class="btn-outline" style="width: 100%; border-color: var(--primary-blue); color: var(--primary-blue);" id="updatePasswordBtn">${t('profile_update_pw')}</button>
                            <div class="form-alert" id="securityAlert" style="margin-top:15px; display:none;"></div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Real-time Input Sanitization & Formatting
    const mobileInput = document.getElementById('mobile');
    if (mobileInput) {
        mobileInput.addEventListener('input', (e) => {
            // Instantly strip any non-digit character and cap at 11 digits
            e.target.value = e.target.value.replace(/\D/g, '').slice(0, 11);
        });
    }

    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\s/g, '');
        });
    }

    // 1. Submit Profile Settings form
    const profileForm = document.getElementById('profileForm');
    const profileAlert = document.getElementById('profileAlert');
    const saveProfileBtn = document.getElementById('saveProfileBtn');

    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const isAr = getCurrentLang() === 'ar';
            const email = document.getElementById('email').value.trim();
            const mobile = document.getElementById('mobile').value.trim();
            const fullName = document.getElementById('fullName').value.trim();

            // Strict Validation
            const nameRegex = /^[a-zA-Z\u0600-\u06FF\s.'-]{2,60}$/;
            if (!fullName || !nameRegex.test(fullName)) {
                showAlert(profileAlert, isAr ? 'يرجى إدخال اسم كامل صحيح (حروف فقط بدون أرقام أو رموز غريبة).' : 'Please enter a valid full name (letters only).', 'error');
                return;
            }

            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (!email || !emailRegex.test(email)) {
                showAlert(profileAlert, isAr ? 'يرجى إدخال بريد إلكتروني صحيح يحتوي على نطاق كامل (مثال: name@domain.com).' : 'Please enter a valid email address with a complete domain (e.g. name@domain.com).', 'error');
                return;
            }

            const phoneRegex = /^01[0-9]{9}$/;
            if (!mobile || !phoneRegex.test(mobile)) {
                showAlert(profileAlert, isAr ? 'يرجى إدخال رقم هاتف مصري صحيح مكون من 11 رقم يبدأ بـ 01 (مثال: 01012345678).' : 'Please enter a valid 11-digit Egyptian phone number starting with 01 (e.g., 01012345678).', 'error');
                return;
            }

            saveProfileBtn.disabled = true;
            saveProfileBtn.innerText = isAr ? 'جاري الحفظ...' : 'Saving...';
            profileAlert.style.display = 'none';

            try {
                // PUT /api/Admin/profile
                await profileService.updateProfile(email, mobile, fullName, currentAvatarDataUrl);
                
                showAlert(profileAlert, isAr ? 'تم تحديث معلومات الحساب والصورة الشخصية بنجاح.' : 'Profile information updated successfully.', 'success');
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
                saveProfileBtn.innerText = isAr ? 'حفظ التغييرات' : 'Save Changes';
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
                // POST /api/Auth/change-password
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

    // Profile photo upload preview & remove
    const changePhotoBtn = document.getElementById('changePhotoBtn');
    const profileFileInput = document.getElementById('profileFileInput');
    const preview = document.getElementById('profileImagePreview');
    const removePhotoBtn = document.getElementById('removePhotoBtn');

    if (changePhotoBtn && profileFileInput) {
        changePhotoBtn.addEventListener('click', () => {
            profileFileInput.click();
        });

        profileFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const isAr = getCurrentLang() === 'ar';
                if (file.size > 4 * 1024 * 1024) {
                    showAlert(profileAlert, isAr ? 'حجم الصورة يتجاوز الحد الأقصى (4 ميجابايت).' : 'Image size exceeds maximum limit (4 MB).', 'error');
                    return;
                }
                const reader = new FileReader();
                reader.onload = (evt) => {
                    currentAvatarDataUrl = evt.target.result;
                    if (preview) {
                        preview.src = currentAvatarDataUrl;
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (removePhotoBtn) {
        removePhotoBtn.addEventListener('click', () => {
            if (profileFileInput) profileFileInput.value = '';
            currentAvatarDataUrl = '';
            if (preview) {
                preview.src = defaultAvatarUrl;
            }
        });
    }

    // Hide Global Loader
    const loader = document.getElementById('global-page-loader');
    if (loader) {
        loader.classList.add('hide-loader');
        setTimeout(() => loader.remove(), 400);
    }
});
import api from './api';

export const profileService = {
  // 1. Get the current authenticated user's profile
  getProfile: async () => {
    return await api.get('/profile');
  },

  // 2. Update personal info + optional signature image (multipart/form-data)
  updateProfile: async ({ fullName, email, phone, jobTitle, signature }) => {
    const formData = new FormData();
    formData.append('FullName', fullName || '');
    if (email) formData.append('Email', email);
    if (phone) formData.append('PhoneNumber', phone);
    if (jobTitle) formData.append('JobTitle', jobTitle);
    if (signature instanceof File) formData.append('Signature', signature);

    return await api.put('/profile', formData);
  },

  // 3. Change the current user's password
  changePassword: async ({ currentPassword, newPassword }) => {
    return await api.put('/profile/change-password', {
      currentPassword,
      newPassword,
    });
  },
};

export default profileService;

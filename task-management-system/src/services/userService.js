import api from './api';

export const userService = {
  // 1. Get all directory users
  getAllUsers: async () => {
    return await api.get('/users');
  },

  // 2. Get user by ID
  getUserById: async (id) => {
    return await api.get(`/users/${id}`);
  },

  // 3. Create a new user (multipart/form-data — supports signature image upload)
  createUser: async (payload) => {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (key === 'phone') {
          formData.append('PhoneNumber', value);
        }
        formData.append(key, value);
      }
    });
    return await api.post('/users', formData);
  },

  // 4. Update an existing user (name, email, phone, jobTitle, role, status)
  updateUser: async (id, payload) => {
    const dataToSend = { ...payload };
    
    // مطابقة رقم الهاتف
    if (dataToSend.phone && !dataToSend.PhoneNumber) {
      dataToSend.PhoneNumber = dataToSend.phone;
    }

    // تحويل الـ role من نص إلى رقم (Enum Mapping) بناءً على النظام لديك
    // تأكد من تطابق الأرقام مع الـ Enum في C# (مثلاً: admin: 0, manager: 1, member: 2)
    if (typeof dataToSend.role === 'string') {
      const roleMap = { admin: 0, manager: 1, member: 2 };
      dataToSend.role = roleMap[dataToSend.role.toLowerCase()] ?? 2;
    }

    // تحويل الـ status أيضاً إلى رقم لو كان الـ Backend يتوقعه كـ Enum
    if (typeof dataToSend.status === 'string') {
      const statusMap = { active: 0, blocked: 1, deleted: 2 };
      dataToSend.status = statusMap[dataToSend.status.toLowerCase()] ?? 0;
    }

    return await api.put(`/users/${id}`, dataToSend);
  },

  // 5. Toggle block/unblock — nextStatus: 0 = Active, 1 = Blocked
  //
  // IMPORTANT: PUT /api/users/{id} binds to UpdateUserDto on the backend,
  // where FullName and Role are [Required]. A partial { status } body used
  // to get silently rejected with a 400 (and UsersPage's catch-and-fake-it
  // fallback hid that from the UI). We now send the full record — same
  // shape as updateUser() — and only override `status`.
  toggleBlockUser: async (user, nextStatus) => {
    return await userService.updateUser(user.id, {
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      jobTitle: user.jobTitle,
      role: user.role,
      status: nextStatus,
    });
  },

  // 6. Soft delete a user
  deleteUser: async (id) => {
    return await api.delete(`/users/${id}`);
  },
};

export default userService;
import React, { useEffect, useMemo, useState } from 'react';
import {
  PageHeader,
  Table,
  Button,
  Modal,
  Avatar,
  Badge,
  Input,
  FilterBar,
  Select,
  Spinner,
} from '../components/shared';
import userService from '../services/userService';


const ROLE_META = {
  admin: { label: 'مدير النظام', labelEn: 'Admin', color: 'purple' },
  manager: { label: 'مدير', labelEn: 'Manager', color: 'blue' },
  member: { label: 'عضو فريق', labelEn: 'Member', color: 'green' },
};

const STATUS_META = {
  active: { label: 'نشط', labelEn: 'Active', color: 'green' },
  blocked: { label: 'محظور', labelEn: 'Blocked', color: 'red' },
};

// Tries several likely shapes a real backend might use for the role field:
// u.role, u.roleName, u.userRole (string or number), or a nested object
// like u.role.name / u.role.value. Falls through until one is non-empty.
function extractRawRole(u) {
  const candidates = [
    u.role,
    u.roleName,
    u.userRole,
    u.role?.name,
    u.role?.value,
    u.roleId,
  ];
  return candidates.find((v) => v !== undefined && v !== null && v !== '');
}

function extractRawStatus(u) {
  const candidates = [
    u.status,
    u.statusName,
    u.userStatus,
    u.status?.name,
    u.status?.value,
    u.isBlocked === true ? 'blocked' : u.isBlocked === false ? 'active' : undefined,
    u.isActive === true ? 'active' : u.isActive === false ? 'blocked' : undefined,
  ];
  return candidates.find((v) => v !== undefined && v !== null && v !== '');
}

// Normalizes a raw enum value from the API (number OR string, any case)
// against a known lowercase key list. Falls back to `fallback` if nothing
// matches — e.g. real backend sends role as "Admin"/"MANAGER" while our
// UI keys are lowercase 'admin'/'manager'/'member'.
function normalizeEnum(rawValue, keys, fallback) {
  if (typeof rawValue === 'number') {
    return keys[rawValue] || fallback;
  }
  const asString = String(rawValue ?? '').trim().toLowerCase();
  return keys.includes(asString) ? asString : fallback;
}

// Maps a raw /api/users record onto the shape this page renders.
function mapApiUser(u) {
  return {
    id: u.id != null ? String(u.id) : String(u.userId ?? ''),
    fullName: u.fullName || u.name || '',
    fullNameEn: u.fullNameEn || u.fullName || u.name || '',
    username: u.username || '',
    email: u.email || '',
    phone: u.phone || u.phoneNumber || '',
    jobTitle: u.jobTitle || '',
    jobTitleEn: u.jobTitleEn || u.jobTitle || '',
    role: normalizeEnum(extractRawRole(u), ['admin', 'manager', 'member'], 'member'),
    status: normalizeEnum(extractRawStatus(u), ['active', 'blocked', 'deleted'], 'active'),
    signatureUrl: u.signatureUrl || null,
    createdAt: u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '',
  };
}

const selectStyle = {
  padding: '9px 12px',
  fontSize: '13px',
  fontWeight: '600',
  color: '#334155',
  background: '#FFFFFF',
  border: '1px solid #E2E8F0',
  borderRadius: '8px',
  outline: 'none',
  cursor: 'pointer',
  minWidth: '150px',
};

const emptyForm = {
  fullName: '',
  username: '',
  email: '',
  phone: '',
  password: '',
  jobTitle: '',
  role: 'member',
  status: 'active',
  signatureFile: null,
};

export default function UsersPage({ lang = 'ar', user }) {
  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';

  const [liveUsers, setLiveUsers] = useState(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // View mode: 'table' | 'grid' | 'grouped' — same multi-view pattern used
  // on the Tickets page, persisted per-page like there too.
  const [viewMode, setViewMode] = useState(() => {
    try {
      const saved = localStorage.getItem('usersViewMode');
      if (saved && ['table', 'grid', 'grouped'].includes(saved)) return saved;
    } catch {
      /* ignore */
    }
    return 'table';
  });
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    try {
      localStorage.setItem('usersViewMode', mode);
    } catch {
      /* ignore */
    }
  };

  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState(emptyForm);
  const [addError, setAddError] = useState('');
  const [addSaving, setAddSaving] = useState(false);

  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editSaving, setEditSaving] = useState(false);

  // GET /api/users — falls back to mock users on failure.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await userService.getAllUsers();
        const list = Array.isArray(res) ? res : res?.data;
        if (!cancelled && Array.isArray(list)) {
          // TEMP DEBUG — remove once role/status field names are confirmed.
          console.log('RAW /api/users record:', list[0]);
          setLiveUsers(list.map(mapApiUser));
        }
      } catch (err) {
        console.warn('userService.getAllUsers failed, using mock users:', err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

 const [localUsers, setLocalUsers] = useState([]);
  const usersSource = liveUsers || localUsers;

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return usersSource
      .filter((u) => u.status !== 'deleted')
      .filter((u) => {
        if (!q) return true;
        return (
          u.fullName.toLowerCase().includes(q) ||
          u.fullNameEn.toLowerCase().includes(q) ||
          u.username.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.jobTitle.toLowerCase().includes(q)
        );
      })
      .filter((u) => roleFilter === 'all' || u.role === roleFilter)
      .filter((u) => statusFilter === 'all' || u.status === statusFilter);
  }, [usersSource, search, roleFilter, statusFilter]);

  function updateUserInState(id, patch) {
    if (liveUsers) {
      setLiveUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)));
    } else {
      setLocalUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)));
    }
  }

  function removeUserFromState(id) {
    if (liveUsers) {
      setLiveUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status: 'deleted' } : u)));
    } else {
      setLocalUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status: 'deleted' } : u)));
    }
  }

  function addUserToState(newUser) {
    if (liveUsers) {
      setLiveUsers((prev) => [newUser, ...prev]);
    } else {
      setLocalUsers((prev) => [newUser, ...prev]);
    }
  }

  // ---- Add User -----------------------------------------------------
  function openAddModal() {
    setAddForm({ ...emptyForm, role: isManager ? 'member' : 'member' });
    setAddError('');
    setAddOpen(true);
  }

  async function handleAddUser() {
    setAddError('');
    if (!addForm.fullName || !addForm.username || !addForm.email || !addForm.password) {
      setAddError(lang === 'ar' ? 'يرجى تعبئة كل الحقول المطلوبة' : 'Please fill in all required fields');
      return;
    }
    if (addForm.password.length < 6) {
      setAddError(lang === 'ar' ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters');
      return;
    }

    setAddSaving(true);
    const role = isManager ? 'member' : addForm.role;

    try {
      const created = await userService.createUser({
        fullName: addForm.fullName,
        username: addForm.username,
        email: addForm.email,
        phone: addForm.phone,
        password: addForm.password,
        jobTitle: addForm.jobTitle,
        role,
        signature: addForm.signatureFile,
      });
      addUserToState(mapApiUser(created?.data || created));
    } catch (err) {
      console.warn('userService.createUser failed, adding locally:', err.message);
      addUserToState({
        id: `local-${Date.now()}`,
        fullName: addForm.fullName,
        fullNameEn: addForm.fullName,
        username: addForm.username,
        email: addForm.email,
        phone: addForm.phone,
        jobTitle: addForm.jobTitle,
        jobTitleEn: addForm.jobTitle,
        role,
        status: 'active',
        signatureUrl: addForm.signatureFile ? URL.createObjectURL(addForm.signatureFile) : null,
        createdAt: new Date().toLocaleDateString(),
      });
    } finally {
      setAddSaving(false);
      setAddOpen(false);
    }
  }

  // ---- Edit User ------------------------------------------------------
  function openEditModal(u) {
    setEditingUser(u);
    setEditForm({
      fullName: u.fullName,
      email: u.email,
      phone: u.phone,
      jobTitle: u.jobTitle,
      role: u.role,
      status: u.status,
    });
  }

  async function handleSaveEdit() {
    if (!editingUser || !editForm) return;
    setEditSaving(true);
    try {
      await userService.updateUser(editingUser.id, editForm);
    } catch (err) {
      console.warn('userService.updateUser failed, updating locally:', err.message);
    } finally {
      updateUserInState(editingUser.id, editForm);
      setEditSaving(false);
      setEditingUser(null);
      setEditForm(null);
    }
  }

  // ---- Toggle Block / Soft Delete --------------------------------------
  async function handleToggleBlock(u) {
    const nextStatus = u.status === 'active' ? 'blocked' : 'active';
    const confirmMsg =
      nextStatus === 'blocked'
        ? (lang === 'ar' ? `هل تريد حظر ${u.fullName}؟` : `Block ${u.fullNameEn}?`)
        : (lang === 'ar' ? `هل تريد تفعيل ${u.fullName}؟` : `Unblock ${u.fullNameEn}?`);
    if (!window.confirm(confirmMsg)) return;

    try {
      await userService.toggleBlockUser(u, nextStatus === 'blocked' ? 1 : 0);
    } catch (err) {
      console.warn('userService.toggleBlockUser failed, updating locally:', err.message);
    } finally {
      updateUserInState(u.id, { status: nextStatus });
    }
  }

  async function handleDelete(u) {
    const confirmMsg =
      lang === 'ar'
        ? `هل تريد حذف ${u.fullName}؟ سيتم إخفاؤه من الدليل مع الاحتفاظ بسجل العمليات.`
        : `Delete ${u.fullNameEn}? They will be hidden from the directory but the audit trail is kept.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await userService.deleteUser(u.id);
    } catch (err) {
      console.warn('userService.deleteUser failed, removing locally:', err.message);
    } finally {
      removeUserFromState(u.id);
    }
  }

  const canManageRole = (targetRole) => {
    if (isAdmin) return true;
    if (isManager) return targetRole === 'member';
    return false;
  };

  const columns = [
    {
      key: 'fullName',
      title: lang === 'ar' ? 'المستخدم' : 'User',
      render: (val, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'start' }}>
          <Avatar name={lang === 'ar' ? val : row.fullNameEn} size="sm" />
          <div>
            <div style={{ fontWeight: '700', color: '#0F172A', fontSize: '13.5px' }}>
              {lang === 'ar' ? val : row.fullNameEn}
            </div>
            <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px', textAlign: 'start' }}>@{row.username}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'jobTitle',
      title: lang === 'ar' ? 'الوظيفة' : 'Job Title',
      render: (val, row) => (
        <span style={{ fontSize: '12.5px', color: '#334155' }}>
          {lang === 'ar' ? val : row.jobTitleEn}
        </span>
      ),
    },
    {
      key: 'email',
      title: lang === 'ar' ? 'البريد الإلكتروني' : 'Email',
      render: (val) => (
        <span style={{ fontSize: '12.5px', color: '#334155' }} dir="ltr">
          {val || '—'}
        </span>
      ),
    },
    {
      key: 'phone',
      title: lang === 'ar' ? 'رقم الهاتف' : 'Phone',
      render: (val) => (
        <span style={{ fontSize: '12.5px', color: '#334155' }} dir="ltr">
          {val || '—'}
        </span>
      ),
    },
    {
      key: 'role',
      title: lang === 'ar' ? 'الصلاحية' : 'Role',
      render: (val) => {
        const meta = ROLE_META[val] || ROLE_META.member;
        return <Badge variant={meta.color} size="sm">{lang === 'ar' ? meta.label : meta.labelEn}</Badge>;
      },
    },
    {
      key: 'status',
      title: lang === 'ar' ? 'الحالة' : 'Status',
      render: (val) => {
        const meta = STATUS_META[val] || STATUS_META.active;
        return <Badge variant={meta.color} size="sm" dot>{lang === 'ar' ? meta.label : meta.labelEn}</Badge>;
      },
    },
    {
      key: 'signatureUrl',
      title: lang === 'ar' ? 'التوقيع' : 'Signature',
      render: (val) =>
        val ? (
          <img
            src={val}
            alt="signature"
            style={{ width: '44px', height: '28px', objectFit: 'contain', border: '1px solid #E2E8F0', borderRadius: '6px', background: '#FAFBFD' }}
          />
        ) : (
          <span style={{ fontSize: '12px', color: '#CBD5E1' }}>—</span>
        ),
    },
    {
      key: 'actions',
      title: lang === 'ar' ? 'إجراءات' : 'Actions',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button variant="outline" size="sm" disabled={!canManageRole(row.role)} onClick={() => openEditModal(row)}>
            {lang === 'ar' ? 'تعديل' : 'Edit'}
          </Button>
          <Button
            variant={row.status === 'active' ? 'secondary' : 'primary'}
            size="sm"
            disabled={!canManageRole(row.role)}
            onClick={() => handleToggleBlock(row)}
          >
            {row.status === 'active' ? (lang === 'ar' ? 'حظر' : 'Block') : (lang === 'ar' ? 'تفعيل' : 'Unblock')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={!isAdmin}
            onClick={() => handleDelete(row)}
            style={{ color: '#DC2626' }}
          >
            {lang === 'ar' ? 'حذف' : 'Delete'}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={lang === 'ar' ? 'دليل المستخدمين والصلاحيات' : 'Users & Access Directory'}
        subtitle={
          lang === 'ar'
            ? `${filteredUsers.length} مستخدم مطابق للفلاتر الحالية`
            : `${filteredUsers.length} users match the current filters`
        }
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* View mode toggle — same multi-design pattern as the Tickets page */}
            <div
              style={{
                display: 'inline-flex',
                background: '#F1F5F9',
                padding: '3px',
                borderRadius: '10px',
                border: '1px solid #E2E8F0',
                gap: '2px',
              }}
            >
              {[
                { id: 'table', icon: '📋', label: lang === 'ar' ? 'قائمة جدولية' : 'Table' },
                { id: 'grid', icon: '🪟', label: lang === 'ar' ? 'شبكة البطاقات' : 'Card Grid' },
                { id: 'grouped', icon: '📁', label: lang === 'ar' ? 'مجمعة بالصلاحية' : 'Grouped by Role' },
              ].map((vm) => {
                const isActive = viewMode === vm.id;
                return (
                  <button
                    key={vm.id}
                    onClick={() => handleViewModeChange(vm.id)}
                    title={vm.label}
                    style={{
                      border: 'none',
                      padding: '5px 10px',
                      borderRadius: '7px',
                      fontSize: '12px',
                      fontWeight: isActive ? '700' : '500',
                      background: isActive ? '#FFFFFF' : 'transparent',
                      color: isActive ? '#1565C0' : '#64748B',
                      cursor: 'pointer',
                      boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      transition: 'all 0.15s ease',
                      fontFamily: 'Cairo, sans-serif',
                    }}
                  >
                    <span>{vm.icon}</span>
                    <span>{vm.label}</span>
                  </button>
                );
              })}
            </div>

            <Button variant="primary" size="md" onClick={openAddModal}>
              + {lang === 'ar' ? 'إضافة مستخدم جديد' : 'Add User'}
            </Button>
          </div>
        }
      />

      {/* Filter & Search Bar — same pattern used across all other pages */}
      <FilterBar>
        <div style={{ flex: '1 1 220px', minWidth: '200px' }}>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={lang === 'ar' ? 'بحث بالاسم، اسم المستخدم، البريد، أو الوظيفة...' : 'Search name, username, email, or job title...'}
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
          />
        </div>

        <div style={{ width: '170px' }}>
          <Select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            placeholder={lang === 'ar' ? 'كل الصلاحيات' : 'All Roles'}
            options={[
              { value: 'all', label: lang === 'ar' ? 'كل الصلاحيات' : 'All Roles' },
              { value: 'admin', label: lang === 'ar' ? 'مدير النظام' : 'Admin' },
              { value: 'manager', label: lang === 'ar' ? 'مدير' : 'Manager' },
              { value: 'member', label: lang === 'ar' ? 'عضو فريق' : 'Member' },
            ]}
          />
        </div>

        <div style={{ width: '170px' }}>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            placeholder={lang === 'ar' ? 'كل الحالات' : 'All Statuses'}
            options={[
              { value: 'all', label: lang === 'ar' ? 'كل الحالات' : 'All Statuses' },
              { value: 'active', label: lang === 'ar' ? 'نشط' : 'Active' },
              { value: 'blocked', label: lang === 'ar' ? 'محظور' : 'Blocked' },
            ]}
          />
        </div>

        {(roleFilter !== 'all' || statusFilter !== 'all' || search) && (
          <Button
            variant="ghost"
            size="md"
            onClick={() => {
              setRoleFilter('all');
              setStatusFilter('all');
              setSearch('');
            }}
          >
            {lang === 'ar' ? 'إعادة ضبط' : 'Reset'}
          </Button>
        )}
      </FilterBar>

      {viewMode === 'grid' ? (
        <UserGridView
          users={filteredUsers}
          lang={lang}
          loading={loading}
          canManageRole={canManageRole}
          isAdmin={isAdmin}
          onEdit={openEditModal}
          onToggleBlock={handleToggleBlock}
          onDelete={handleDelete}
        />
      ) : viewMode === 'grouped' ? (
        <UserGroupedView
          users={filteredUsers}
          lang={lang}
          canManageRole={canManageRole}
          isAdmin={isAdmin}
          onEdit={openEditModal}
          onToggleBlock={handleToggleBlock}
          onDelete={handleDelete}
        />
      ) : (
        <Table
          columns={columns}
          data={filteredUsers}
          loading={loading}
          emptyMessage={lang === 'ar' ? 'لا يوجد مستخدمون مطابقون' : 'No matching users found'}
        />
      )}

      {/* Add User Modal */}
      {addOpen && (
        <Modal
          open={addOpen}
          onClose={() => setAddOpen(false)}
          title={lang === 'ar' ? 'إضافة مستخدم جديد' : 'Add New User'}
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
          maxWidth="560px"
          footer={
            <>
              <Button variant="secondary" onClick={() => setAddOpen(false)}>
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button variant="primary" loading={addSaving} onClick={handleAddUser}>
                {lang === 'ar' ? 'إضافة المستخدم' : 'Add User'}
              </Button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'start' }}>
            <Input
              label={lang === 'ar' ? 'الاسم الكامل' : 'Full Name'}
              value={addForm.fullName}
              onChange={(e) => setAddForm({ ...addForm, fullName: e.target.value })}
            />
            <Input
              label={lang === 'ar' ? 'اسم المستخدم' : 'Username'}
              value={addForm.username}
              onChange={(e) => setAddForm({ ...addForm, username: e.target.value })}
              dir="ltr"
            />
            <Input
              label={lang === 'ar' ? 'البريد الإلكتروني' : 'Email'}
              type="email"
              value={addForm.email}
              onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
              dir="ltr"
            />
            <Input
              label={lang === 'ar' ? 'رقم الهاتف' : 'Phone'}
              value={addForm.phone}
              onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
              dir="ltr"
            />
            <Input
              label={lang === 'ar' ? 'كلمة مرور مؤقتة' : 'Temporary Password'}
              type="password"
              value={addForm.password}
              onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
              placeholder={lang === 'ar' ? '6 أحرف على الأقل' : 'Min 6 characters'}
              dir="ltr"
              showText={lang === 'ar' ? 'إظهار' : 'Show'}
              hideText={lang === 'ar' ? 'إخفاء' : 'Hide'}
            />
            <Input
              label={lang === 'ar' ? 'المسمى الوظيفي' : 'Job Title'}
              value={addForm.jobTitle}
              onChange={(e) => setAddForm({ ...addForm, jobTitle: e.target.value })}
            />

            <div>
              <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>
                {lang === 'ar' ? 'الصلاحية' : 'Role'}
              </label>
              <select
                value={isManager ? 'member' : addForm.role}
                onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                disabled={isManager}
                style={{ ...selectStyle, width: '100%' }}
              >
                <option value="admin">{lang === 'ar' ? 'مدير النظام' : 'Admin'}</option>
                <option value="manager">{lang === 'ar' ? 'مدير' : 'Manager'}</option>
                <option value="member">{lang === 'ar' ? 'عضو فريق' : 'Member'}</option>
              </select>
              {isManager && (
                <p style={{ fontSize: '11.5px', color: '#94A3B8', margin: '6px 0 0' }}>
                  {lang === 'ar' ? 'المديرون يمكنهم إضافة أعضاء فريق فقط' : 'Managers can only add Members'}
                </p>
              )}
            </div>

            <div>
              <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>
                {lang === 'ar' ? 'صورة التوقيع' : 'Signature Image'}
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setAddForm({ ...addForm, signatureFile: e.target.files?.[0] || null })}
                style={{ fontSize: '12.5px' }}
              />
            </div>

            {addError && (
              <div style={{ color: '#DC2626', fontSize: '13px', fontWeight: '700', textAlign: 'center' }}>
                {addError}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Edit User Modal */}
      {editingUser && editForm && (
        <Modal
          open={Boolean(editingUser)}
          onClose={() => { setEditingUser(null); setEditForm(null); }}
          title={`${lang === 'ar' ? 'تعديل المستخدم' : 'Edit User'} — ${lang === 'ar' ? editingUser.fullName : editingUser.fullNameEn}`}
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
          maxWidth="560px"
          footer={
            <>
              <Button variant="secondary" onClick={() => { setEditingUser(null); setEditForm(null); }}>
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button variant="primary" loading={editSaving} onClick={handleSaveEdit}>
                {lang === 'ar' ? 'حفظ التعديلات' : 'Save Changes'}
              </Button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'start' }}>
            <Input
              label={lang === 'ar' ? 'الاسم الكامل' : 'Full Name'}
              value={editForm.fullName}
              onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
            />
            <Input
              label={lang === 'ar' ? 'البريد الإلكتروني' : 'Email'}
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              dir="ltr"
            />
            <Input
              label={lang === 'ar' ? 'رقم الهاتف' : 'Phone'}
              value={editForm.phone}
              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              dir="ltr"
            />
            <Input
              label={lang === 'ar' ? 'المسمى الوظيفي' : 'Job Title'}
              value={editForm.jobTitle}
              onChange={(e) => setEditForm({ ...editForm, jobTitle: e.target.value })}
            />

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 140px' }}>
                <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>
                  {lang === 'ar' ? 'الصلاحية' : 'Role'}
                </label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  disabled={!isAdmin}
                  style={{ ...selectStyle, width: '100%' }}
                >
                  <option value="admin">{lang === 'ar' ? 'مدير النظام' : 'Admin'}</option>
                  <option value="manager">{lang === 'ar' ? 'مدير' : 'Manager'}</option>
                  <option value="member">{lang === 'ar' ? 'عضو فريق' : 'Member'}</option>
                </select>
              </div>

              <div style={{ flex: '1 1 140px' }}>
                <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>
                  {lang === 'ar' ? 'الحالة' : 'Status'}
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  style={{ ...selectStyle, width: '100%' }}
                >
                  <option value="active">{lang === 'ar' ? 'نشط' : 'Active'}</option>
                  <option value="blocked">{lang === 'ar' ? 'محظور' : 'Blocked'}</option>
                </select>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Alternate view #1: Card Grid ──
// A visual, avatar-forward alternative to the table — same data, laid out
// as a responsive grid of user cards (mirrors the Tickets page's Card
// Grid view).
function UserGridView({ users, lang, loading, canManageRole, isAdmin, onEdit, onToggleBlock, onDelete }) {
  if (loading) {
    return (
      <div style={{ padding: '50px', display: 'flex', justifyContent: 'center' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div
        style={{
          padding: '48px 20px',
          textAlign: 'center',
          background: '#FFFFFF',
          borderRadius: '14px',
          border: '1px dashed #CBD5E1',
          color: '#64748B',
          fontSize: '14px',
          fontWeight: '600',
        }}
      >
        {lang === 'ar' ? 'لا يوجد مستخدمون مطابقون' : 'No matching users found'}
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: '16px',
      }}
    >
      {users.map((u) => {
        const roleMeta = ROLE_META[u.role] || ROLE_META.member;
        const statusMeta = STATUS_META[u.status] || STATUS_META.active;
        const displayName = lang === 'ar' ? u.fullName : u.fullNameEn;
        return (
          <div
            key={u.id}
            style={{
              background: '#FFFFFF',
              border: '1px solid #E8EDF5',
              borderRadius: '16px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              boxShadow: '0 2px 8px rgba(0,0,0,.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Avatar name={displayName} size="md" />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: '800', fontSize: '14px', color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {displayName}
                </div>
                <div style={{ fontSize: '11.5px', color: '#64748B' }}>@{u.username}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <Badge variant={roleMeta.color} size="sm">{lang === 'ar' ? roleMeta.label : roleMeta.labelEn}</Badge>
              <Badge variant={statusMeta.color} size="sm" dot>{lang === 'ar' ? statusMeta.label : statusMeta.labelEn}</Badge>
            </div>

            <div style={{ fontSize: '12px', color: '#64748B', lineHeight: 1.6 }}>
              <div>{lang === 'ar' ? u.jobTitle : u.jobTitleEn}</div>
              <div dir="ltr" style={{ textAlign: 'start' }}>{u.email || '—'}</div>
            </div>

            <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
              <Button variant="outline" size="sm" disabled={!canManageRole(u.role)} onClick={() => onEdit(u)}>
                {lang === 'ar' ? 'تعديل' : 'Edit'}
              </Button>
              <Button
                variant={u.status === 'active' ? 'secondary' : 'primary'}
                size="sm"
                disabled={!canManageRole(u.role)}
                onClick={() => onToggleBlock(u)}
              >
                {u.status === 'active' ? (lang === 'ar' ? 'حظر' : 'Block') : (lang === 'ar' ? 'تفعيل' : 'Unblock')}
              </Button>
              <Button variant="ghost" size="sm" disabled={!isAdmin} onClick={() => onDelete(u)} style={{ color: '#DC2626' }}>
                {lang === 'ar' ? 'حذف' : 'Delete'}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Alternate view #2: Grouped by Role ──
// Same cards as the grid view, but organized into Admin / Manager / Member
// sections (mirrors the Tickets page's "Grouped by Team" view).
function UserGroupedView({ users, lang, canManageRole, isAdmin, onEdit, onToggleBlock, onDelete }) {
  const groups = ['admin', 'manager', 'member'].map((roleKey) => ({
    roleKey,
    meta: ROLE_META[roleKey],
    members: (users || []).filter((u) => u.role === roleKey),
  }));

  const anyMembers = groups.some((g) => g.members.length > 0);
  if (!anyMembers) {
    return (
      <div
        style={{
          padding: '48px 20px',
          textAlign: 'center',
          background: '#FFFFFF',
          borderRadius: '14px',
          border: '1px dashed #CBD5E1',
          color: '#64748B',
          fontSize: '14px',
          fontWeight: '600',
        }}
      >
        {lang === 'ar' ? 'لا يوجد مستخدمون مطابقون' : 'No matching users found'}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {groups.map(
        (group) =>
          group.members.length > 0 && (
            <div key={group.roleKey}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <Badge variant={group.meta.color} size="md">
                  {lang === 'ar' ? group.meta.label : group.meta.labelEn}
                </Badge>
                <span style={{ fontSize: '12.5px', color: '#94A3B8', fontWeight: '700' }}>
                  {group.members.length} {lang === 'ar' ? 'مستخدم' : 'user(s)'}
                </span>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                  gap: '12px',
                }}
              >
                {group.members.map((u) => {
                  const statusMeta = STATUS_META[u.status] || STATUS_META.active;
                  const displayName = lang === 'ar' ? u.fullName : u.fullNameEn;
                  return (
                    <div
                      key={u.id}
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid #E8EDF5',
                        borderRadius: '14px',
                        padding: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                      }}
                    >
                      <Avatar name={displayName} size="sm" />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: '700', fontSize: '13px', color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {displayName}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>@{u.username}</div>
                      </div>
                      <Badge variant={statusMeta.color} size="sm" dot>{lang === 'ar' ? statusMeta.label : statusMeta.labelEn}</Badge>
                      <Button variant="outline" size="sm" disabled={!canManageRole(u.role)} onClick={() => onEdit(u)}>
                        {lang === 'ar' ? 'تعديل' : 'Edit'}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )
      )}
    </div>
  );
}


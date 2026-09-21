import React, { useState, useEffect } from 'react';
import { translations, normalizeTeamStatus } from '../../../utils/constants';
import { Modal, Button, Input, Textarea, Select, Avatar } from '../../shared';
import userService from '../../../services/userService';

export default function NewTeamModal({
  open,
  onClose,
  onSubmit,
  teamToEdit = null,
  lang = 'ar',
}) {
  const t = translations[lang] || translations.ar;
  const isRtl = lang === 'ar';

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('0'); // Active
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [leaderId, setLeaderId] = useState('');

  const [allUsers, setAllUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      loadDirectoryUsers();

      if (teamToEdit) {
        setName(teamToEdit.name || '');
        setDescription(teamToEdit.description || '');
        const norm = normalizeTeamStatus(teamToEdit.status);
        setStatus(norm === 'Finished' ? '2' : norm === 'Pending' ? '1' : '0');

        const existingMemberIds = (teamToEdit.members || []).map((m) => m.memberId);
        setSelectedMemberIds(existingMemberIds);

        const currentLeader = (teamToEdit.members || []).find((m) => m.isTeamLeader);
        setLeaderId(currentLeader ? String(currentLeader.memberId) : '');
      } else {
        setName('');
        setDescription('');
        setStatus('0');
        setSelectedMemberIds([]);
        setLeaderId('');
      }
    }
  }, [teamToEdit, open]);

  const loadDirectoryUsers = async () => {
    setLoadingUsers(true);
    try {
      const data = await userService.getAllUsers();
      setAllUsers(Array.isArray(data) ? data : []);
    } catch {
      setAllUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleToggleMember = (userId) => {
    const isSelected = selectedMemberIds.includes(userId);
    let next;
    if (isSelected) {
      next = selectedMemberIds.filter((id) => id !== userId);
      // If removed member was the leader, clear leaderId
      if (String(leaderId) === String(userId)) {
        setLeaderId('');
      }
    } else {
      next = [...selectedMemberIds, userId];
      // If this is the first member selected, auto-set as leader suggestion
      if (!leaderId) {
        setLeaderId(String(userId));
      }
    }
    setSelectedMemberIds(next);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || null,
        status: Number(status),
        memberIds: selectedMemberIds,
        leaderId: leaderId ? Number(leaderId) : null,
      });
      onClose();
    } catch (err) {
      alert(err.message || t.errorOccurred);
    } finally {
      setSubmitting(false);
    }
  };

  const statusOptions = [
    { value: '0', label: t.teamStatusActive },
    { value: '1', label: t.teamStatusPending },
    { value: '2', label: t.teamStatusFinished },
  ];

  const filteredUsers = allUsers.filter((u) => {
    if (!userSearch.trim()) return true;
    const q = userSearch.toLowerCase();
    return (
      (u.fullName && u.fullName.toLowerCase().includes(q)) ||
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.jobTitle && u.jobTitle.toLowerCase().includes(q))
    );
  });

  // Selected users objects
  const selectedUsers = allUsers.filter((u) => selectedMemberIds.includes(u.id));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={teamToEdit ? t.editTeamTitle : t.createTeamTitle}
      subtitle={lang === 'ar' ? 'تحديد اسم الفريق، الوصف، الأعضاء وقائد الفريق' : 'Set team name, description, members and team leader'}
      lang={lang}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            {t.cancel}
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? t.saving : t.save}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', direction: isRtl ? 'rtl' : 'ltr' }}>
        {/* Team Name */}
        <Input
          label={t.teamNameLabel}
          placeholder={t.teamNamePlaceholder}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        {/* Status */}
        <Select
          label={t.teamStatusLabel}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          options={statusOptions}
          required
        />

        {/* Description */}
        <Textarea
          label={t.teamDescLabel}
          placeholder={t.teamDescPlaceholder}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          maxLength={500}
        />

        {/* ── Section: Assign Members & Assign Team Leader ── */}
        <div
          style={{
            padding: '14px',
            background: '#F8FAFC',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13.5px', fontWeight: '800', color: '#0F172A' }}>
              👥 {lang === 'ar' ? 'تعيين أعضاء الفريق' : 'Assign Team Members'} ({selectedMemberIds.length})
            </span>
          </div>

          {/* Leader Designation Dropdown (from selected members) */}
          {selectedUsers.length > 0 && (
            <div style={{ padding: '10px 12px', background: '#FFFBEB', borderRadius: '8px', border: '1px solid #FDE68A' }}>
              <Select
                label={`⭐ ${t.teamLeaderBadge}`}
                value={leaderId}
                onChange={(e) => setLeaderId(e.target.value)}
                options={[
                  { value: '', label: lang === 'ar' ? 'اختر قائد الفريق من الأعضاء المحددين...' : 'Select team leader...' },
                  ...selectedUsers.map((u) => ({
                    value: String(u.id),
                    label: `${u.fullName || u.username} (${u.jobTitle || 'عضو'})`,
                  })),
                ]}
              />
            </div>
          )}

          {/* User Search Input */}
          <Input
            placeholder={lang === 'ar' ? 'بحث في دليل المستخدمين لإضافة أعضاء...' : 'Search directory users...'}
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
          />

          {/* Users List Container */}
          <div
            style={{
              maxHeight: '160px',
              overflowY: 'auto',
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              background: '#FFFFFF',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {loadingUsers ? (
              <div style={{ padding: '16px', textAlign: 'center', color: '#94A3B8', fontSize: '12px' }}>
                {t.loading}
              </div>
            ) : filteredUsers.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: '#94A3B8', fontSize: '12px' }}>
                {lang === 'ar' ? 'لا يوجد مستخدمين مطابقين' : 'No users found'}
              </div>
            ) : (
              filteredUsers.map((userItem) => {
                const isChecked = selectedMemberIds.includes(userItem.id);
                const isLeader = String(leaderId) === String(userItem.id);
                return (
                  <div
                    key={userItem.id}
                    onClick={() => handleToggleMember(userItem.id)}
                    style={{
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottom: '1px solid #F1F5F9',
                      cursor: 'pointer',
                      background: isChecked ? '#EFF6FF' : 'transparent',
                      transition: 'background 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // handled by parent div onClick
                        style={{ cursor: 'pointer' }}
                      />
                      <Avatar name={userItem.fullName} size="xs" />
                      <div>
                        <div style={{ fontSize: '12.5px', fontWeight: isChecked ? '700' : '500', color: '#0F172A' }}>
                          {userItem.fullName || userItem.username}
                        </div>
                        <div style={{ fontSize: '10.5px', color: '#64748B' }}>
                          {userItem.jobTitle || userItem.email}
                        </div>
                      </div>
                    </div>

                    {isLeader && (
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: '800',
                          padding: '2px 6px',
                          borderRadius: '6px',
                          background: '#FEF3C7',
                          color: '#B45309',
                          border: '1px solid #FDE68A',
                        }}
                      >
                        ⭐ {t.roleLeader}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
}

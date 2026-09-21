import React, { useState, useEffect } from 'react';
import { translations } from '../../../utils/constants';
import { Modal, Button, Avatar, Select, Table, ConfirmDeleteModal } from '../../shared';
import teamService from '../../../services/teamService';
import userService from '../../../services/userService';

export default function TeamMembersModal({
  team,
  open,
  onClose,
  onTeamUpdated,
  lang = 'ar',
}) {
  const t = translations[lang] || translations.ar;
  const isRtl = lang === 'ar';

  const [allUsers, setAllUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    if (open) {
      loadDirectoryUsers();
    }
  }, [open]);

  const loadDirectoryUsers = async () => {
    setLoadingUsers(true);
    try {
      const users = await userService.getAllUsers();
      setAllUsers(Array.isArray(users) ? users : []);
    } catch {
      setAllUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  if (!team) return null;

  const members = team.members || [];
  const currentMemberIds = new Set(members.map((m) => m.memberId));

  // Users eligible to be added to this team (not already members)
  const availableUsers = allUsers.filter((u) => !currentMemberIds.has(u.id));

  const handleSetLeader = async (memberId) => {
    try {
      await teamService.setTeamLeader(team.id, memberId);
      if (onTeamUpdated) onTeamUpdated();
    } catch (err) {
      alert(err.message || t.errorOccurred);
    }
  };

  const handleRemoveMember = (member) => {
    setMemberToRemove(member);
  };

  const confirmRemoveMember = async () => {
    if (!memberToRemove) return;
    setRemoving(true);
    try {
      await teamService.removeMemberFromTeam(team.id, memberToRemove.memberId);
      setMemberToRemove(null);
      if (onTeamUpdated) onTeamUpdated();
    } catch (err) {
      alert(err.message || t.errorOccurred);
    } finally {
      setRemoving(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!selectedUserId) return;
    setSubmitting(true);
    try {
      await teamService.addMemberToTeam(team.id, selectedUserId);
      setSelectedUserId('');
      if (onTeamUpdated) onTeamUpdated();
    } catch (err) {
      alert(err.message || t.errorOccurred);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${t.teamMembersTitle}: ${team.name}`}
      subtitle={`${members.length} ${t.membersCount}`}
      lang={lang}
      footer={
        <Button variant="secondary" onClick={onClose}>
          {t.close}
        </Button>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', direction: isRtl ? 'rtl' : 'ltr' }}>
        {/* Add New Member Section */}
        <div
          style={{
            padding: '16px',
            background: '#F8FAFC',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
          }}
        >
          <div style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A', marginBottom: '10px' }}>
            ➕ {t.addNewMemberTitle}
          </div>

          <form onSubmit={handleAddMember} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 240px' }}>
              <Select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                disabled={loadingUsers || availableUsers.length === 0}
                options={[
                  {
                    value: '',
                    label: loadingUsers
                      ? t.loading
                      : availableUsers.length === 0
                      ? t.noAvailableUsers
                      : t.selectUserPrompt,
                  },
                  ...availableUsers.map((u) => ({
                    value: String(u.id),
                    label: `${u.fullName || u.username} (${u.jobTitle || u.role || 'عضو'})`,
                  })),
                ]}
              />
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={handleAddMember}
              disabled={!selectedUserId || submitting}
            >
              {submitting ? t.saving : t.addMemberBtn}
            </Button>
          </form>
        </div>

        {/* Current Members List Table */}
        <div>
          <div style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A', marginBottom: '12px' }}>
            👥 {t.teamMembersTitle} ({members.length})
          </div>

          {members.length === 0 ? (
            <div
              style={{
                padding: '30px',
                textAlign: 'center',
                color: '#94A3B8',
                background: '#F8FAFC',
                borderRadius: '10px',
                border: '1px dashed #CBD5E1',
                fontSize: '13px',
              }}
            >
              {t.noData}
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="members-desktop-table" style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: '10px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: isRtl ? 'right' : 'left' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                      <th style={{ padding: '10px 14px', fontWeight: '700', color: '#475569' }}>{t.memberName}</th>
                      <th style={{ padding: '10px 14px', fontWeight: '700', color: '#475569' }}>{t.memberRoleInTeam}</th>
                      <th style={{ padding: '10px 14px', fontWeight: '700', color: '#475569' }}>{t.dateJoined}</th>
                      <th style={{ padding: '10px 14px', fontWeight: '700', color: '#475569', textAlign: 'center' }}>{t.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m) => (
                      <tr key={m.memberId} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        {/* Name & Avatar */}
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Avatar name={m.fullName} size="sm" />
                            <div>
                              <div style={{ fontWeight: '700', color: '#0F172A' }}>{m.fullName}</div>
                              <div style={{ fontSize: '11px', color: '#64748B' }}>{m.email}</div>
                            </div>
                          </div>
                        </td>

                        {/* Role in Team */}
                        <td style={{ padding: '12px 14px' }}>
                          <span
                            style={{
                              fontSize: '11.5px',
                              fontWeight: '700',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              background: m.isTeamLeader ? '#FFFBEB' : '#F1F5F9',
                              color: m.isTeamLeader ? '#B45309' : '#475569',
                              border: `1px solid ${m.isTeamLeader ? '#FDE68A' : '#CBD5E1'}`,
                            }}
                          >
                            {m.isTeamLeader ? t.roleLeader : t.roleMember}
                          </span>
                        </td>

                        {/* Joined Date */}
                        <td style={{ padding: '12px 14px', color: '#64748B', fontSize: '12px' }}>
                          {m.joinedAt ? new Date(m.joinedAt).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US') : '—'}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            {!m.isTeamLeader && (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleSetLeader(m.memberId)}
                              >
                                ⭐ {t.setAsLeader}
                              </Button>
                            )}

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveMember(m)}
                              style={{ color: '#DC2626' }}
                            >
                              ✕ {t.removeFromTeam}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Awesome Cards View */}
              <div className="members-mobile-cards" style={{ display: 'none', flexDirection: 'column', gap: '10px' }}>
                {members.map((m) => (
                  <div
                    key={m.memberId}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '12px',
                      padding: '12px 14px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Avatar name={m.fullName} size="sm" />
                        <div>
                          <div style={{ fontWeight: '700', color: '#0F172A', fontSize: '13.5px' }}>{m.fullName}</div>
                          <div style={{ fontSize: '11px', color: '#64748B' }}>{m.email}</div>
                        </div>
                      </div>

                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: m.isTeamLeader ? '#FFFBEB' : '#F1F5F9',
                          color: m.isTeamLeader ? '#B45309' : '#475569',
                          border: `1px solid ${m.isTeamLeader ? '#FDE68A' : '#CBD5E1'}`,
                        }}
                      >
                        {m.isTeamLeader ? t.roleLeader : t.roleMember}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #F1F5F9' }}>
                      <span style={{ fontSize: '11.5px', color: '#94A3B8' }}>
                        📅 {m.joinedAt ? new Date(m.joinedAt).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US') : '—'}
                      </span>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {!m.isTeamLeader && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleSetLeader(m.memberId)}
                          >
                            ⭐ {t.setAsLeader}
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(m)}
                          style={{ color: '#DC2626' }}
                        >
                          ✕ {t.removeFromTeam}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Remove Member Confirmation Modal */}
      <ConfirmDeleteModal
        open={!!memberToRemove}
        onClose={() => setMemberToRemove(null)}
        onConfirm={confirmRemoveMember}
        title={t.removeFromTeam}
        message={t.removeConfirm}
        itemName={memberToRemove?.fullName}
        loading={removing}
        lang={lang}
      />
    </Modal>
  );
}

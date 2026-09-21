import React, { useState, useEffect } from 'react';
import {
  translations,
  normalizeTicketStatus,
  normalizeTicketPriority,
} from '../../../utils/constants';
import { Modal, Button, Input, Select, Textarea } from '../../shared';
import teamService from '../../../services/teamService';

export default function EditTicketModal({
  ticket,
  teams = [],
  open,
  onClose,
  onSubmit,
  lang = 'ar',
}) {
  const t = translations[lang] || translations.ar;
  const isRtl = lang === 'ar';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [memberId, setMemberId] = useState('');
  const [priority, setPriority] = useState('1');
  const [status, setStatus] = useState('1');
  const [teamMembers, setTeamMembers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);

  useEffect(() => {
    if (ticket && open) {
      setTitle(ticket.title || '');
      setDescription(ticket.description || '');

      if (ticket.deadline) {
        // Format ISO to datetime-local (YYYY-MM-DDTHH:mm)
        try {
          const d = new Date(ticket.deadline);
          const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);
          setDeadline(iso);
        } catch {
          setDeadline('');
        }
      } else {
        setDeadline('');
      }

      setMemberId(ticket.memberId ? String(ticket.memberId) : '');

      const normP = normalizeTicketPriority(ticket.priority);
      setPriority(normP === 'Urgent' ? '3' : normP === 'High' ? '2' : normP === 'Medium' ? '1' : '0');

      const normS = normalizeTicketStatus(ticket.status);
      setStatus(normS === 'Completed' ? '3' : normS === 'OnProgress' ? '2' : normS === 'Pending' ? '1' : '0');

      // Fetch or find team members for this ticket's team
      loadTeamMembers(ticket.teamId);
    }
  }, [ticket, open]);

  const loadTeamMembers = async (teamId) => {
    if (!teamId) return;

    // Check if team is in teams prop
    const foundTeam = teams.find((tm) => String(tm.id) === String(teamId));
    if (foundTeam && foundTeam.members && foundTeam.members.length > 0) {
      setTeamMembers(foundTeam.members);
      return;
    }

    setLoadingMembers(true);
    try {
      const data = await teamService.getTeamById(teamId);
      if (data && data.members) {
        setTeamMembers(data.members);
      }
    } catch {
      setTeamMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || null,
        deadline: deadline || null,
        memberId: memberId ? Number(memberId) : null,
        priority: Number(priority),
        status: Number(status),
      });
      onClose();
    } catch (err) {
      alert(err.message || t.errorOccurred);
    } finally {
      setSubmitting(false);
    }
  };

  const priorityOptions = [
    { value: '0', label: t.priorityLow },
    { value: '1', label: t.priorityMedium },
    { value: '2', label: t.priorityHigh },
    { value: '3', label: t.priorityUrgent },
  ];

  const statusOptions = [
    { value: '0', label: t.statusNotAssigned },
    { value: '1', label: t.statusPending },
    { value: '2', label: t.statusOnProgress },
    { value: '3', label: t.statusCompleted },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${t.editTicket} #${ticket?.id || ''}`}
      subtitle={t.editTicketSubtitle}
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
        {/* Title */}
        <Input
          label={t.titleLabel}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        {/* Assignee Selection (Changing who assigned to) */}
        <div>
          <Select
            label={`👤 ${t.ticketAssignee} (${ticket?.teamName || ''})`}
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            disabled={loadingMembers}
            options={[
              { value: '', label: loadingMembers ? t.loading : t.unassignedMember },
              ...teamMembers.map((m) => ({
                value: String(m.memberId || m.id),
                label: `${m.fullName || m.username} ${m.isTeamLeader ? `⭐ (${lang === 'ar' ? 'قائد الفريق' : 'Team Leader'})` : ''}`,
              })),
            ]}
          />
          {memberId && (
            <div style={{ fontSize: '11.5px', color: '#1565C0', marginTop: '4px', fontWeight: '600' }}>
              ✓ {lang === 'ar' ? 'تم تعيين العضو المكلف بنجاح' : 'Assignee selected'}
            </div>
          )}
        </div>

        {/* Status & Priority Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          <Select
            label={t.ticketStatus}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={statusOptions}
            required
          />

          <Select
            label={t.ticketPriority}
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            options={priorityOptions}
            required
          />
        </div>

        {/* Deadline */}
        <Input
          label={t.deadlineLabel}
          type="datetime-local"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
        />

        {/* Description */}
        <Textarea
          label={t.descriptionLabel}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          maxLength={1000}
          showCount
        />
      </form>
    </Modal>
  );
}

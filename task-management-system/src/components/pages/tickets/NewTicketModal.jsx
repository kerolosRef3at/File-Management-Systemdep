import React, { useState, useEffect } from 'react';
import { translations } from '../../../utils/constants';
import { Modal, Button, Input, Select, Textarea } from '../../shared';

export default function NewTicketModal({
  open,
  onClose,
  onSubmit,
  teams = [],
  lang = 'ar',
}) {
  const t = translations[lang] || translations.ar;
  const isRtl = lang === 'ar';

  const [teamId, setTeamId] = useState('');
  const [memberId, setMemberId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState('1'); // Medium
  const [submitting, setSubmitting] = useState(false);

  // Available members filtered by selected team
  const [availableMembers, setAvailableMembers] = useState([]);

  useEffect(() => {
    if (teamId) {
      const selectedTeam = teams.find((tm) => String(tm.id) === String(teamId));
      if (selectedTeam && selectedTeam.members) {
        setAvailableMembers(selectedTeam.members);
      } else {
        setAvailableMembers([]);
      }
      setMemberId('');
    } else {
      setAvailableMembers([]);
      setMemberId('');
    }
  }, [teamId, teams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!teamId || !title.trim()) {
      alert(lang === 'ar' ? 'يرجى اختيار الفريق وإدخال عنوان التذكرة' : 'Please select a team and enter ticket title');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        teamId: Number(teamId),
        memberId: memberId ? Number(memberId) : null,
        title: title.trim(),
        description: description.trim() || null,
        deadline: deadline || null,
        priority: Number(priority),
      });

      // Reset form
      setTeamId('');
      setMemberId('');
      setTitle('');
      setDescription('');
      setDeadline('');
      setPriority('1');
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

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t.createTicketTitle}
      subtitle={t.createTicketSubtitle}
      lang={lang}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            {t.cancel}
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? t.saving : t.create}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', direction: isRtl ? 'rtl' : 'ltr' }}>
        {/* Team Selection */}
        <Select
          label={t.ticketTeam}
          value={teamId}
          onChange={(e) => setTeamId(e.target.value)}
          required
          options={[
            { value: '', label: t.selectTeamPrompt },
            ...teams.map((tm) => ({
              value: String(tm.id),
              label: `${tm.name} (${tm.members?.length || 0} ${t.membersCount})`,
            })),
          ]}
        />

        {/* Member Selection (Filtered by Team) */}
        <Select
          label={t.ticketAssignee}
          value={memberId}
          onChange={(e) => setMemberId(e.target.value)}
          disabled={!teamId || availableMembers.length === 0}
          options={[
            { value: '', label: t.selectMemberPrompt },
            ...availableMembers.map((m) => ({
              value: String(m.memberId || m.id),
              label: `${m.fullName || m.username} ${m.isTeamLeader ? '⭐' : ''}`,
            })),
          ]}
        />

        {/* Title */}
        <Input
          label={t.titleLabel}
          placeholder={t.titlePlaceholder}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        {/* Priority & Deadline Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          <Select
            label={t.priorityLabel}
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            options={priorityOptions}
            required
          />

          <Input
            label={t.deadlineLabel}
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </div>

        {/* Description */}
        <Textarea
          label={t.descriptionLabel}
          placeholder={t.descriptionPlaceholder}
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

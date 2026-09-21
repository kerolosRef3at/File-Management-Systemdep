import React, { useState } from 'react';
import { translations } from '../../../utils/constants';
import { Modal, Button, Input, Select, Textarea } from '../../shared';

export default function NewTaskModal({
  open,
  onClose,
  onSubmit,
  teamMembers = [],
  lang = 'ar',
}) {
  const t = translations[lang] || translations.ar;
  const isRtl = lang === 'ar';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [memberId, setMemberId] = useState('');
  const [priority, setPriority] = useState('1'); // Medium
  const [submitting, setSubmitting] = useState(false);

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
      });
      setTitle('');
      setDescription('');
      setDeadline('');
      setMemberId('');
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
      title={t.createSubtaskTitle}
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
        <Input
          label={t.subtaskTitleLabel}
          placeholder={t.titlePlaceholder}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <Textarea
          label={t.descriptionLabel}
          placeholder={t.descriptionPlaceholder}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          <Input
            label={t.deadlineLabel}
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />

          <Select
            label={t.priorityLabel}
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            options={priorityOptions}
          />
        </div>

        <div>
          <Select
            label={`👤 ${t.subtaskAssigneeLabel}`}
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            options={[
              { value: '', label: t.unassignedMember },
              ...teamMembers.map((m) => ({
                value: String(m.memberId || m.id),
                label: `${m.fullName || m.username} ${m.isTeamLeader ? `⭐ (${lang === 'ar' ? 'قائد الفريق' : 'Team Leader'})` : ''}`,
              })),
            ]}
          />
          {memberId && (
            <div style={{ fontSize: '11.5px', color: '#1565C0', marginTop: '4px', fontWeight: '600' }}>
              ✓ {lang === 'ar' ? 'تم تعيين العضو للمهمة' : 'Assignee designated'}
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
}

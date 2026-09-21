import React, { useState, useEffect } from 'react';
import {
  translations,
  normalizeTicketPriority,
  TicketTaskStatus,
} from '../../../utils/constants';
import { Modal, Button, Input, Select, Textarea } from '../../shared';

export default function EditTaskModal({
  task,
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
  const [priority, setPriority] = useState('1');
  const [status, setStatus] = useState('1');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (task && open) {
      setTitle(task.title || '');
      setDescription(task.description || '');

      if (task.deadline) {
        try {
          const d = new Date(task.deadline);
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

      setMemberId(task.memberId ? String(task.memberId) : '');

      const normP = normalizeTicketPriority(task.priority);
      setPriority(normP === 'Urgent' ? '3' : normP === 'High' ? '2' : normP === 'Medium' ? '1' : '0');

      // Status
      let s = '1';
      if (task.status === 'Approved' || task.status === 4) s = '4';
      else if (task.status === 'Completed' || task.status === 3) s = '3';
      else if (task.status === 'OnProgress' || task.status === 2) s = '2';
      else if (task.status === 'Pending' || task.status === 1) s = '1';
      else if (task.status === 'NotAssigned' || task.status === 0) s = '0';
      setStatus(s);
    }
  }, [task, open]);

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
    { value: '0', label: t.taskStatusNotAssigned },
    { value: '1', label: t.taskStatusPending },
    { value: '2', label: t.taskStatusOnProgress },
    { value: '3', label: t.taskStatusCompleted },
    { value: '4', label: t.taskStatusApproved },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t.editSubtaskTitle}
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
          label={t.subtaskTitleLabel}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        {/* Assignee selection */}
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
        />
      </form>
    </Modal>
  );
}

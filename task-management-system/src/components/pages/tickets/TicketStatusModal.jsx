import React, { useState } from 'react';
import { translations, TicketPriority } from '../../../utils/constants';
import { Modal, Button, Select, Textarea, Input, Toggle } from '../../shared';

export default function TicketStatusModal({
  open,
  onClose,
  currentStatus = 'Pending',
  onSubmit,
  teamMembers = [],
  lang = 'ar',
  isTask = false,
}) {
  const t = translations[lang] || translations.ar;
  const isRtl = lang === 'ar';

  const [status, setStatus] = useState('2'); // default to 2 (OnProgress)
  const [comment, setComment] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Follow-up task states
  const [addAnotherTask, setAddAnotherTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskDeadline, setNewTaskDeadline] = useState('');
  const [newTaskMemberId, setNewTaskMemberId] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('1'); // Medium

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      if (selected.size > 5 * 1024 * 1024) {
        setFileError(t.fileSizeExceeded);
        setFile(null);
      } else {
        setFileError('');
        setFile(selected);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        status: Number(status),
        comment: comment.trim() || null,
        linkUrl: linkUrl.trim() || null,
        file: file || null,
        addAnotherTask: !isTask && addAnotherTask,
        newTaskTitle: addAnotherTask ? newTaskTitle : null,
        newTaskDescription: addAnotherTask ? newTaskDescription : null,
        newTaskDeadline: addAnotherTask ? newTaskDeadline : null,
        newTaskMemberId: addAnotherTask && newTaskMemberId ? Number(newTaskMemberId) : null,
        newTaskPriority: addAnotherTask ? Number(newTaskPriority) : null,
      });
      onClose();
    } catch (err) {
      alert(err.message || t.errorOccurred);
    } finally {
      setSubmitting(false);
    }
  };

  const statusOptions = isTask
    ? [
        { value: '1', label: t.taskStatusPending },
        { value: '2', label: t.taskStatusOnProgress },
        { value: '3', label: t.taskStatusCompleted },
        { value: '4', label: t.taskStatusApproved },
      ]
    : [
        { value: '0', label: t.statusNotAssigned },
        { value: '1', label: t.statusPending },
        { value: '2', label: t.statusOnProgress },
        { value: '3', label: t.statusCompleted },
      ];

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
      title={isTask ? t.changeTaskStatus : t.updateStatusTitle}
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
        {/* Status selection */}
        <Select
          label={t.newStatusLabel}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          options={statusOptions}
          required
        />

        {/* Comment textarea */}
        <Textarea
          label={t.commentLabel}
          placeholder={t.commentPlaceholder}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          maxLength={1000}
          showCount
        />

        {/* External Link URL */}
        <Input
          label={t.linkUrlLabel}
          placeholder="https://..."
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          type="url"
        />

        {/* File Attachment Upload */}
        <div>
          <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
            📎 {t.fileUploadLabel}
          </label>
          <input
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xlsx"
            style={{
              display: 'block',
              width: '100%',
              fontSize: '13px',
              padding: '8px',
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              background: '#F8FAFC',
              cursor: 'pointer',
            }}
          />
          {file && (
            <div style={{ fontSize: '11.5px', color: '#16A34A', marginTop: '4px', fontWeight: '600' }}>
              ✓ {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </div>
          )}
          {fileError && (
            <div style={{ fontSize: '12px', color: '#DC2626', marginTop: '4px', fontWeight: '600' }}>
              ⚠️ {fileError}
            </div>
          )}
        </div>

        {/* Follow-up task toggle (Tickets only) */}
        {!isTask && (
          <div
            style={{
              padding: '12px',
              background: '#F8FAFC',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              marginTop: '4px',
            }}
          >
            <Toggle
              checked={addAnotherTask}
              onChange={setAddAnotherTask}
              label={t.addAnotherTaskToggle}
            />

            {addAnotherTask && (
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '10px', borderTop: '1px solid #E2E8F0' }}>
                <Input
                  label={t.followUpTaskTitle}
                  placeholder={t.followUpTaskTitle}
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  required={addAnotherTask}
                />

                <Textarea
                  label={t.followUpTaskDesc}
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  rows={2}
                />

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                  <Input
                    label={t.followUpTaskDeadline}
                    type="datetime-local"
                    value={newTaskDeadline}
                    onChange={(e) => setNewTaskDeadline(e.target.value)}
                  />

                  <Select
                    label={t.followUpTaskPriority}
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value)}
                    options={priorityOptions}
                  />
                </div>

                {teamMembers.length > 0 && (
                  <Select
                    label={t.followUpTaskMember}
                    value={newTaskMemberId}
                    onChange={(e) => setNewTaskMemberId(e.target.value)}
                    options={[
                      { value: '', label: t.unassignedMember },
                      ...teamMembers.map((m) => ({
                        value: String(m.memberId || m.id),
                        label: `${m.fullName || m.username} ${m.isTeamLeader ? '⭐' : ''}`,
                      })),
                    ]}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </form>
    </Modal>
  );
}

import React, { useState, useEffect } from 'react';
import {
  translations,
  normalizeTicketPriority,
  normalizeTaskStatus,
  getPriorityColor,
  getPriorityText,
  getTaskStatusText,
  formatMemberName,
  formatDateTime,
  formatDate,
  formatAuditComment,
  getDeadlineUrgency,
} from '../../../utils/constants';
import { Modal, Button, Avatar, Badge, Spinner } from '../../shared';
import EditTaskModal from './EditTaskModal';
import TicketStatusModal from './TicketStatusModal';
import ticketService from '../../../services/ticketService';
import teamService from '../../../services/teamService';

export default function SubtaskDetailsModal({
  task,
  ticket,
  open,
  onClose,
  teamMembers = [],
  onSubtaskUpdated,
  lang = 'ar',
}) {
  const t = translations[lang] || translations.ar;
  const isRtl = lang === 'ar';
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'history'

  // Current task state (updated in-place when edited or status changed)
  const [currentTask, setCurrentTask] = useState(task);

  // In-modal Edit & Status Change modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [teamMembersList, setTeamMembersList] = useState(teamMembers || []);
  const [loadingFresh, setLoadingFresh] = useState(false);

  useEffect(() => {
    setCurrentTask(task);
  }, [task]);

  // If team members not provided, fetch them using ticket's teamId
  useEffect(() => {
    if (open && (!teamMembersList || teamMembersList.length === 0)) {
      const teamId = ticket?.teamId || currentTask?.teamId;
      if (teamId) {
        teamService.getTeamById(teamId)
          .then((res) => {
            if (res && res.members) {
              setTeamMembersList(res.members);
            }
          })
          .catch(() => {});
      }
    }
  }, [open, ticket?.teamId, currentTask?.teamId, teamMembersList]);

  if (!currentTask || !open) return null;

  const priority = normalizeTicketPriority(currentTask.priority);
  const pColor = getPriorityColor(priority);
  const normStatus = normalizeTaskStatus(currentTask.status);
  const taskUrgency = currentTask.deadline
    ? getDeadlineUrgency(currentTask.deadline, currentTask.completedAt, currentTask.status, lang)
    : null;

  const isCompleted = normStatus === 'Completed' || normStatus === 'Approved';
  const histories = currentTask.statusHistories || [];
  const ticketId = currentTask.ticketId || ticket?.id;

  // Direct In-Modal Edit Handler (No need to open the parent ticket!)
  const handleSaveTaskEdit = async (formData) => {
    if (!ticketId) return;
    setLoadingFresh(true);
    try {
      await ticketService.updateTicketTask(ticketId, currentTask.id, formData);
      // Fetch fresh ticket data to update currentTask in-place
      const freshTicket = await ticketService.getTicketById(ticketId);
      if (freshTicket && freshTicket.ticketTasks) {
        const freshTask = freshTicket.ticketTasks.find((t) => t.id === currentTask.id);
        if (freshTask) {
          setCurrentTask(freshTask);
        }
      }
      setIsEditModalOpen(false);
      if (onSubtaskUpdated) {
        onSubtaskUpdated(freshTicket);
      }
    } catch (err) {
      console.error('Failed to update subtask', err);
      alert(err.message || t.errorOccurred);
    } finally {
      setLoadingFresh(false);
    }
  };

  // Direct In-Modal Status Change Handler (No need to open the parent ticket!)
  const handleSaveTaskStatus = async (formData) => {
    if (!ticketId) return;
    setLoadingFresh(true);
    try {
      await ticketService.changeTicketTaskStatus(ticketId, currentTask.id, formData);
      // Fetch fresh ticket data to update currentTask in-place with new audit history
      const freshTicket = await ticketService.getTicketById(ticketId);
      if (freshTicket && freshTicket.ticketTasks) {
        const freshTask = freshTicket.ticketTasks.find((t) => t.id === currentTask.id);
        if (freshTask) {
          setCurrentTask(freshTask);
        }
      }
      setIsStatusModalOpen(false);
      if (onSubtaskUpdated) {
        onSubtaskUpdated(freshTicket);
      }
    } catch (err) {
      console.error('Failed to change subtask status', err);
      alert(err.message || t.errorOccurred);
    } finally {
      setLoadingFresh(false);
    }
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={`📋 #${currentTask.id} - ${currentTask.title}`}
        subtitle={t.subtaskDetailsSubtitle}
        maxWidth="650px"
        dir={isRtl ? 'rtl' : 'ltr'}
        footer={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsEditModalOpen(true)}
              >
                ✏️ {t.edit}
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsStatusModalOpen(true)}
              >
                ⚡ {t.changeTaskStatus}
              </Button>

              {loadingFresh && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Spinner size="sm" />
                  <span style={{ fontSize: '11.5px', color: '#64748B' }}>{t.loading}</span>
                </div>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              {t.close}
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Badges Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '12px',
                fontWeight: '700',
                padding: '3px 10px',
                borderRadius: '6px',
                background: isCompleted ? '#DCFCE7' : '#EFF6FF',
                color: isCompleted ? '#15803D' : '#1D4ED8',
                border: isCompleted ? '1px solid #BBF7D0' : '1px solid #BFDBFE',
              }}
            >
              {getTaskStatusText(normStatus, lang)}
            </span>

            <span
              style={{
                fontSize: '12px',
                fontWeight: '700',
                padding: '3px 10px',
                borderRadius: '6px',
                background: pColor.bg,
                color: pColor.text,
                border: `1px solid ${pColor.border}`,
              }}
            >
              {getPriorityText(priority, lang)}
            </span>

            {taskUrgency && (
              <Badge variant={taskUrgency.variant} size="md">
                ⏱️ {taskUrgency.label}
              </Badge>
            )}
          </div>

          {/* Navigation Tabs */}
          <div
            style={{
              display: 'flex',
              borderBottom: '1px solid #E2E8F0',
              gap: '8px',
            }}
          >
            <button
              onClick={() => setActiveTab('details')}
              style={{
                padding: '8px 16px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'details' ? '2.5px solid #1565C0' : '2.5px solid transparent',
                color: activeTab === 'details' ? '#1565C0' : '#64748B',
                fontWeight: activeTab === 'details' ? '800' : '600',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              📋 {t.tabsOverview || 'البيانات والتفاصيل'}
            </button>
            <button
              onClick={() => setActiveTab('history')}
              style={{
                padding: '8px 16px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'history' ? '2.5px solid #1565C0' : '2.5px solid transparent',
                color: activeTab === 'history' ? '#1565C0' : '#64748B',
                fontWeight: activeTab === 'history' ? '800' : '600',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              📜 {t.subtaskHistoryTitle} ({histories.length})
            </button>
          </div>

          {/* Tab 1: Details & Metadata */}
          {activeTab === 'details' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Description */}
              <div>
                <div style={{ fontSize: '11.5px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                  {t.descriptionLabel}
                </div>
                <div
                  style={{
                    padding: '12px 14px',
                    background: '#F8FAFC',
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0',
                    fontSize: '13px',
                    color: currentTask.description ? '#1E293B' : '#94A3B8',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {currentTask.description || (lang === 'ar' ? 'لا يوجد وصف تفصيلي لهذه المهمة' : 'No description provided')}
                </div>
              </div>

              {/* Metadata Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                  gap: '10px',
                  padding: '12px',
                  background: '#F8FAFC',
                  borderRadius: '10px',
                  border: '1px solid #E2E8F0',
                }}
              >
                {/* Assignee */}
                <div>
                  <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>
                    {t.subtaskAssigneeLabel || t.assignedToLabel}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                    <Avatar name={formatMemberName(currentTask.memberName, lang)} size="xs" />
                    <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#1E293B' }}>
                      {formatMemberName(currentTask.memberName, lang)}
                    </span>
                  </div>
                </div>

                {/* Creator */}
                <div>
                  <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>
                    {t.createdBy}
                  </div>
                  <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#334155', marginTop: '4px' }}>
                    👤 {currentTask.createdByName || ticket?.createdByName || '—'}
                  </div>
                </div>

                {/* Created At */}
                <div>
                  <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>
                    {t.createdAt}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#334155', marginTop: '4px' }}>
                    📅 {formatDateTime(currentTask.createdAt, lang)}
                  </div>
                </div>

                {/* Deadline */}
                <div>
                  <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>
                    {t.deadlineLabel}
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: taskUrgency?.isOverdue ? '700' : '600',
                      color: taskUrgency?.isOverdue ? '#DC2626' : '#334155',
                      marginTop: '4px',
                    }}
                  >
                    ⏱️ {currentTask.deadline ? formatDate(currentTask.deadline, lang) : '—'}
                  </div>
                </div>

                {/* Completed At if any */}
                {currentTask.completedAt && (
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>
                      {t.completedAt}
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#16A34A', marginTop: '4px' }}>
                      ✓ {formatDateTime(currentTask.completedAt, lang)}
                    </div>
                  </div>
                )}

                {/* Associated Ticket */}
                {(ticket || currentTask.ticketId) && (
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>
                      {t.parentTicket}
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#1565C0', marginTop: '4px' }}>
                      🏷️ #{ticket?.id || currentTask.ticketId} {ticket?.title ? `(${ticket.title})` : ''}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Subtask History & Audit Log */}
          {activeTab === 'history' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {histories.length === 0 ? (
                <div
                  style={{
                    padding: '24px',
                    textAlign: 'center',
                    color: '#94A3B8',
                    background: '#F8FAFC',
                    borderRadius: '10px',
                    border: '1px dashed #CBD5E1',
                    fontSize: '13px',
                  }}
                >
                  {t.noSubtaskHistory}
                </div>
              ) : (
                histories.map((h, idx) => {
                  const isSameStatus = normalizeTaskStatus(h.oldStatus) === normalizeTaskStatus(h.newStatus);

                  return (
                    <div
                      key={h.id || idx}
                      style={{
                        padding: '12px 14px',
                        background: '#FFFFFF',
                        borderRadius: '10px',
                        border: '1px solid #E2E8F0',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                        {isSameStatus ? (
                          <span
                            style={{
                              fontSize: '12px',
                              fontWeight: '700',
                              color: '#2563EB',
                              background: '#EFF6FF',
                              border: '1px solid #BFDBFE',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            📝 {t.auditNoteAction || (lang === 'ar' ? 'ملاحظة وتحديث' : 'Note & Update')}
                          </span>
                        ) : (
                          <span style={{ fontSize: '12.5px', fontWeight: '800', color: '#1565C0', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <span>{getTaskStatusText(h.oldStatus, lang)}</span>
                            <span style={{ color: '#94A3B8' }}>➔</span>
                            <span style={{ color: '#0F172A' }}>{getTaskStatusText(h.newStatus, lang)}</span>
                          </span>
                        )}

                        <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                          {formatDateTime(h.changedAt, lang)}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#334155' }}>
                        <Avatar name={h.changedByName} size="xs" />
                        <span>
                          {t.changedBy}: <strong style={{ color: '#0F172A' }}>{h.changedByName}</strong>
                        </span>
                      </div>

                      {h.comment && (
                        <div
                          style={{
                            marginTop: '4px',
                            padding: '6px 10px',
                            background: '#F8FAFC',
                            borderRadius: '6px',
                            fontSize: '12px',
                            color: '#475569',
                            borderInlineStart: '3px solid #CBD5E1',
                          }}
                        >
                          {formatAuditComment(h.comment, lang)}
                        </div>
                      )}

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '4px' }}>
                        {h.fileUrl && (
                          <a
                            href={h.fileUrl.startsWith('http') ? h.fileUrl : `http://localhost:5051${h.fileUrl}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              fontSize: '11.5px',
                              color: '#1565C0',
                              textDecoration: 'none',
                              fontWeight: '700',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            📎 {t.downloadFile}
                          </a>
                        )}
                        {h.linkUrl && (
                          <a
                            href={h.linkUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              fontSize: '11.5px',
                              color: '#0284C7',
                              textDecoration: 'none',
                              fontWeight: '700',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            🔗 {t.externalLink}
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* Direct In-Modal Edit Task Modal */}
      {isEditModalOpen && (
        <EditTaskModal
          task={currentTask}
          open={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={handleSaveTaskEdit}
          teamMembers={teamMembersList}
          lang={lang}
        />
      )}

      {/* Direct In-Modal Change Status Modal */}
      {isStatusModalOpen && (
        <TicketStatusModal
          open={isStatusModalOpen}
          onClose={() => setIsStatusModalOpen(false)}
          currentStatus={currentTask.status}
          onSubmit={handleSaveTaskStatus}
          teamMembers={teamMembersList}
          lang={lang}
          isTask={true}
        />
      )}
    </>
  );
}

import React, { useState, useEffect } from 'react';
import {
  translations,
  normalizeTicketStatus,
  normalizeTicketPriority,
  normalizeTaskStatus,
  getPriorityColor,
  getStatusColor,
  getPriorityText,
  getStatusText,
  getTaskStatusText,
  formatMemberName,
  formatAuditComment,
  parseUtcDate,
  formatDateTime,
  formatDate,
  getDeadlineUrgency,
} from '../../../utils/constants';
import { Avatar, Badge, Button, Spinner, ConfirmDeleteModal } from '../../shared';
import TicketStatusModal from './TicketStatusModal';
import NewTaskModal from './NewTaskModal';
import EditTaskModal from './EditTaskModal';
import EditTicketModal from './EditTicketModal';
import SubtaskDetailsModal from './SubtaskDetailsModal';
import ticketService from '../../../services/ticketService';
import teamService from '../../../services/teamService';

export default function TicketDetailsDrawer({
  ticketId,
  open,
  onClose,
  onTicketUpdated,
  lang = 'ar',
  user,
}) {
  const t = translations[lang] || translations.ar;
  const isRtl = lang === 'ar';

  const [ticket, setTicket] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'history'

  // Modals state
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [isEditTicketModalOpen, setIsEditTicketModalOpen] = useState(false);
  const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false);
  const [selectedTaskForStatus, setSelectedTaskForStatus] = useState(null);
  const [selectedTaskForEdit, setSelectedTaskForEdit] = useState(null);
  const [selectedTaskForDetails, setSelectedTaskForDetails] = useState(null);

  // Delete modal state (replaces window.confirm)
  const [isDeleteTicketModalOpen, setIsDeleteTicketModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchTicketDetails = async () => {
    if (!ticketId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await ticketService.getTicketById(ticketId);
      setTicket(data);

      // Fetch team members to allow assigning tasks and editing ticket assignee
      if (data && data.teamId) {
        const tData = await teamService.getTeamById(data.teamId).catch(() => null);
        if (tData && tData.members) {
          setTeamMembers(tData.members);
        } else {
          setTeamMembers([]);
        }
      }
    } catch (err) {
      setError(err.message || t.errorOccurred);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && ticketId) {
      fetchTicketDetails();
    } else {
      setTicket(null);
      setTeamMembers([]);
      setError(null);
      setIsExpanded(false);
    }
  }, [open, ticketId]);

  if (!open) return null;

  // Deadline countdown & urgency calculation (shows red overdue badge even if completed)
  const getDeadlineDetails = (deadlineStr) => {
    return getDeadlineUrgency(deadlineStr, ticket?.completedAt, ticket?.status, lang);
  };

  const handleQuickStatusChange = async (targetStatus) => {
    try {
      let arComment = '';
      let enComment = '';
      if (targetStatus === 2 || targetStatus === '2' || targetStatus === 'OnProgress') {
        arComment = 'بدء العمل على التذكرة (قيد التنفيذ)';
        enComment = 'Started work on ticket (In Progress)';
      } else if (targetStatus === 3 || targetStatus === '3' || targetStatus === 'Completed') {
        arComment = 'إكمال التذكرة بنجاح';
        enComment = 'Ticket completed successfully';
      } else {
        arComment = `تحديث سريع للحالة إلى ${getStatusText(targetStatus, 'ar')}`;
        enComment = `Quick status update to ${getStatusText(targetStatus, 'en')}`;
      }
      const comment = `${arComment} / ${enComment}`;

      await ticketService.changeTicketStatus(ticket.id, {
        status: targetStatus,
        comment,
      });
      await fetchTicketDetails();
      if (onTicketUpdated) onTicketUpdated();
    } catch (err) {
      alert(err.message || t.errorOccurred);
    }
  };

  // Status modal submit
  const handleStatusModalSubmit = async (formData) => {
    if (selectedTaskForStatus) {
      await ticketService.changeTicketTaskStatus(ticket.id, selectedTaskForStatus.id, formData);
      setSelectedTaskForStatus(null);
    } else {
      await ticketService.changeTicketStatus(ticket.id, formData);
      if (onTicketUpdated) onTicketUpdated();
    }
    await fetchTicketDetails();
  };

  // Edit ticket submit (including changing who assigned to)
  const handleEditTicketSubmit = async (updateData) => {
    await ticketService.updateTicket(ticket.id, updateData);
    await fetchTicketDetails();
    if (onTicketUpdated) onTicketUpdated();
  };

  // Delete ticket confirmation handler (using custom modal)
  const confirmDeleteTicket = async () => {
    if (!ticket) return;
    setDeleting(true);
    try {
      await ticketService.deleteTicket(ticket.id);
      setIsDeleteTicketModalOpen(false);
      onClose();
      if (onTicketUpdated) onTicketUpdated();
    } catch (err) {
      alert(err.message || t.errorOccurred);
    } finally {
      setDeleting(false);
    }
  };

  // Delete task confirmation handler (using custom modal)
  const confirmDeleteTask = async () => {
    if (!taskToDelete || !ticket) return;
    setDeleting(true);
    try {
      await ticketService.deleteTicketTask(ticket.id, taskToDelete.id);
      setTaskToDelete(null);
      await fetchTicketDetails();
      if (onTicketUpdated) onTicketUpdated();
    } catch (err) {
      alert(err.message || t.errorOccurred);
    } finally {
      setDeleting(false);
    }
  };

  // Create subtask submit
  const handleCreateSubtask = async (taskData) => {
    await ticketService.createTicketTask(ticket.id, taskData);
    await fetchTicketDetails();
    if (onTicketUpdated) onTicketUpdated();
  };

  // Edit subtask submit (including changing who assigned to)
  const handleEditTaskSubmit = async (taskData) => {
    if (!selectedTaskForEdit) return;
    await ticketService.updateTicketTask(ticket.id, selectedTaskForEdit.id, taskData);
    setSelectedTaskForEdit(null);
    await fetchTicketDetails();
    if (onTicketUpdated) onTicketUpdated();
  };

  const priority = ticket ? normalizeTicketPriority(ticket.priority) : 'Medium';
  const pColor = getPriorityColor(priority);
  const normStatus = ticket ? normalizeTicketStatus(ticket.status) : 'Pending';
  const sColor = getStatusColor(normStatus);
  const deadlineDetails = ticket ? getDeadlineDetails(ticket.deadline) : null;

  // Filter out soft-deleted tasks so they are hidden from the Associated Subtasks section
  const activeTasks = (ticket?.ticketTasks || []).filter(
    (task) =>
      task.status !== 'Deleted' &&
      task.status !== 5 &&
      normalizeTaskStatus(task.status) !== 'Deleted'
  );

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(3px)',
          zIndex: 998,
          transition: 'opacity 0.2s ease',
        }}
      />

      {/* Drawer Container */}
      <div
        className="ticket-details-drawer"
        style={{
          position: 'fixed',
          top: 0,
          bottom: 0,
          [isRtl ? 'right' : 'left']: 0,
          width: isExpanded ? '92vw' : 'min(760px, 100vw)',
          background: '#FFFFFF',
          zIndex: 999,
          boxShadow: isRtl ? '-10px 0 30px rgba(0,0,0,0.15)' : '10px 0 30px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
          direction: isRtl ? 'rtl' : 'ltr',
          transition: 'width 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <style>{`
          @media (max-width: 639px) {
            .ticket-details-drawer {
              width: 100vw !important;
            }
            .drawer-hdr-toolbar {
              padding: 12px 14px !important;
            }
            .drawer-hero-pad {
              padding: 16px 14px !important;
            }
            .drawer-body-pad {
              padding: 16px 14px !important;
            }
            .subtask-card-row {
              flex-direction: column !important;
              align-items: stretch !important;
            }
            .subtask-card-actions {
              width: 100% !important;
              justify-content: flex-end !important;
              margin-top: 8px !important;
              padding-top: 8px !important;
              border-top: 1px dashed #E2E8F0 !important;
            }
          }
        `}</style>

        {/* Drawer Header Toolbar */}
        <div
          className="drawer-hdr-toolbar"
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#F8FAFC',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '14px', fontWeight: '800', color: '#1565C0', fontFamily: 'monospace' }}>
              {ticket ? `#${ticket.id}` : ''}
            </span>
            <span style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A' }}>
              {t.ticketDetails}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {ticket && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsEditTicketModalOpen(true)}
                >
                  ✏️ {t.editTicket}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  title={t.delete}
                  onClick={() => setIsDeleteTicketModalOpen(true)}
                  style={{ color: '#DC2626' }}
                >
                  🗑️
                </Button>
              </>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              style={{ display: window.innerWidth < 768 ? 'none' : 'inline-flex' }}
            >
              {isExpanded ? t.collapse : t.expand}
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>
        </div>

        {/* Drawer Content */}
        {loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px' }}>
            <Spinner size="lg" />
            <span style={{ fontSize: '13px', color: '#64748B' }}>{t.loading}</span>
          </div>
        ) : error ? (
          <div style={{ padding: '30px', textAlign: 'center' }}>
            <div style={{ color: '#DC2626', fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>
              ⚠️ {error}
            </div>
            <Button variant="secondary" size="sm" onClick={fetchTicketDetails}>
              {t.retry}
            </Button>
          </div>
        ) : ticket ? (
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            {/* Hero Header Card */}
            <div
              className="drawer-hero-pad"
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid #E2E8F0',
                background: '#FFFFFF',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
            >
              {/* Badges Row */}
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: '700',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    background: sColor.bg,
                    color: sColor.text,
                    border: `1px solid ${sColor.border}`,
                  }}
                >
                  {getStatusText(normStatus, lang)}
                </span>

                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: '700',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    background: pColor.bg,
                    color: pColor.text,
                    border: `1px solid ${pColor.border}`,
                  }}
                >
                  {getPriorityText(priority, lang)}
                </span>

                {deadlineDetails && (
                  <Badge variant={deadlineDetails.variant} size="md">
                    ⏱️ {deadlineDetails.text}
                  </Badge>
                )}
              </div>

              {/* Title & Edit Trigger */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', margin: 0, lineHeight: 1.4, flex: 1 }}>
                  {ticket.title}
                </h2>

              </div>

              {/* Metadata Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '12px',
                  padding: '12px',
                  background: '#F8FAFC',
                  borderRadius: '10px',
                  border: '1px solid #E2E8F0',
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>{t.ticketTeam}</div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B', marginTop: '2px' }}>
                    📁 {ticket.teamName || '—'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>
                    {t.ticketAssignee}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', flexWrap: 'wrap' }}>
                    <Avatar name={formatMemberName(ticket.memberName, lang)} size="xs" />
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B' }}>
                      {formatMemberName(ticket.memberName, lang)}
                    </span>
                    <button
                      onClick={() => setIsEditTicketModalOpen(true)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#1565C0',
                        fontSize: '11px',
                        cursor: 'pointer',
                        fontWeight: '700',
                        padding: '0 4px',
                      }}
                    >
                      ({t.change || (lang === 'ar' ? 'تغيير' : 'Change')})
                    </button>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>{t.createdBy}</div>
                  <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#334155', marginTop: '2px' }}>
                    👤 {ticket.createdByName || '—'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>{t.createdAt}</div>
                  <div style={{ fontSize: '12.5px', fontWeight: '600', color: '#334155', marginTop: '2px' }}>
                    📅 {ticket.createdAt ? formatDate(ticket.createdAt, lang) : '—'}
                  </div>
                </div>

                {ticket.completedAt && (
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>{t.completedAt}</div>
                    <div style={{ fontSize: '12.5px', fontWeight: '600', color: '#16A34A', marginTop: '2px' }}>
                      ✓ {formatDate(ticket.completedAt, lang)}
                    </div>
                  </div>
                )}
              </div>

              {/* Status Transition Action Bar */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: '8px',
                  paddingTop: '6px',
                }}
              >
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>
                  {t.quickStatusTransition}
                </span>

                {normStatus !== 'OnProgress' && normStatus !== 'Completed' && (
                  <Button variant="secondary" size="sm" onClick={() => handleQuickStatusChange(2)}>
                    ▶ {t.startWork}
                  </Button>
                )}

                {normStatus !== 'Completed' && (
                  <Button variant="secondary" size="sm" onClick={() => handleQuickStatusChange(3)}>
                    ✓ {t.completeTicket}
                  </Button>
                )}

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setSelectedTaskForStatus(null);
                    setIsStatusModalOpen(true);
                  }}
                >
                  📝 {t.customStatusChange}
                </Button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div
              style={{
                display: 'flex',
                borderBottom: '1px solid #E2E8F0',
                background: '#FFFFFF',
                padding: '0 20px',
                flexShrink: 0,
              }}
            >
              <button
                onClick={() => setActiveTab('overview')}
                style={{
                  padding: '12px 18px',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === 'overview' ? '3px solid #1565C0' : '3px solid transparent',
                  color: activeTab === 'overview' ? '#1565C0' : '#64748B',
                  fontWeight: activeTab === 'overview' ? '800' : '600',
                  fontSize: '13.5px',
                  cursor: 'pointer',
                }}
              >
                {t.tabsOverview} ({activeTasks.length})
              </button>

              <button
                onClick={() => setActiveTab('history')}
                style={{
                  padding: '12px 18px',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === 'history' ? '3px solid #1565C0' : '3px solid transparent',
                  color: activeTab === 'history' ? '#1565C0' : '#64748B',
                  fontWeight: activeTab === 'history' ? '800' : '600',
                  fontSize: '13.5px',
                  cursor: 'pointer',
                }}
              >
                📜 {t.tabsHistory} ({ticket.statusHistories?.length || 0})
              </button>
            </div>

            {/* Tab 1: Overview & Subtasks */}
            {activeTab === 'overview' && (
              <div className="drawer-body-pad" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Description Box */}
                {ticket.description && (
                  <div>
                    <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>
                      {t.descriptionLabel}
                    </h3>
                    <div
                      style={{
                        padding: '14px 16px',
                        background: '#F8FAFC',
                        borderRadius: '10px',
                        border: '1px solid #E2E8F0',
                        fontSize: '13.5px',
                        color: '#1E293B',
                        lineHeight: 1.6,
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {ticket.description}
                    </div>
                  </div>
                )}

                {/* Subtasks Section */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                      📋 {t.subtasksSectionTitle} ({activeTasks.length})
                    </h3>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setIsNewTaskModalOpen(true)}
                    >
                      + {t.addSubtask}
                    </Button>
                  </div>

                  {activeTasks.length === 0 ? (
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
                      {t.noSubtasks}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {activeTasks.map((task) => {
                        const taskUrgency = task.deadline ? getDeadlineUrgency(task.deadline, task.completedAt, task.status, lang) : null;
                        const isTaskOverdue = taskUrgency?.isOverdue;

                        return (
                          <div
                            key={task.id}
                            className="subtask-card-item"
                            onClick={() => setSelectedTaskForDetails(task)}
                            title={lang === 'ar' ? 'انقر لعرض تفاصيل وسجل المهمة' : 'Click to view subtask details & audit history'}
                            style={{
                              padding: '12px 14px',
                              background: isTaskOverdue ? '#FFFDFD' : '#FFFFFF',
                              borderRadius: '10px',
                              border: isTaskOverdue ? '1.5px solid #FCA5A5' : '1px solid #E2E8F0',
                              borderInlineStart: isTaskOverdue ? '4px solid #DC2626' : undefined,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '12px',
                              boxShadow: isTaskOverdue ? '0 1px 4px rgba(220, 38, 38, 0.08)' : '0 1px 2px rgba(0,0,0,0.04)',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '13.5px', fontWeight: '700', color: '#0F172A' }}>
                                  {task.title}
                                </span>
                                <span
                                  style={{
                                    fontSize: '10.5px',
                                    fontWeight: '700',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    background: task.status === 'Completed' || task.status === 'Approved' ? '#DCFCE7' : '#EFF6FF',
                                    color: task.status === 'Completed' || task.status === 'Approved' ? '#15803D' : '#1D4ED8',
                                  }}
                                >
                                  {getTaskStatusText(task.status, lang)}
                                </span>
                                {taskUrgency && (
                                  <Badge variant={taskUrgency.variant} size="sm">
                                    ⏱️ {taskUrgency.label}
                                  </Badge>
                                )}
                              </div>

                              {task.description && (
                                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '3px' }}>
                                  {task.description}
                                </div>
                              )}

                              {/* Assignee & Creator Highlight */}
                              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                                {/* Assignee */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#F1F5F9', padding: '2px 8px', borderRadius: '6px' }}>
                                  <Avatar name={formatMemberName(task.memberName, lang)} size="xs" />
                                  <span style={{ fontSize: '11.5px', color: '#1E293B', fontWeight: '700' }}>
                                    {t.assignedToLabel} {formatMemberName(task.memberName, lang)}
                                  </span>
                                </div>

                                {/* Creator */}
                                <span style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '500' }}>
                                  {t.createdByLabel} <strong style={{ color: '#334155' }}>{task.createdByName || ticket.createdByName || '—'}</strong>
                                </span>

                                {task.deadline && (
                                  <span style={{ fontSize: '11px', color: isTaskOverdue ? '#DC2626' : '#64748B', fontWeight: isTaskOverdue ? '700' : '500' }}>
                                    ⏱️ {formatDate(task.deadline, lang)}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="subtask-card-actions" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }} onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTaskForDetails(task);
                                }}
                              >
                                👁️ {t.viewDetails || (lang === 'ar' ? 'التفاصيل' : 'Details')}
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTaskForEdit(task);
                                  setIsEditTaskModalOpen(true);
                                }}
                              >
                                ✏️ {t.edit}
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTaskForStatus(task);
                                  setIsStatusModalOpen(true);
                                }}
                              >
                                ⚡ {t.ticketStatus}
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                title={t.delete}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTaskToDelete(task);
                                }}
                                style={{ color: '#DC2626' }}
                              >
                                🗑️
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab 2: Audit History Timeline */}
            {activeTab === 'history' && (
              <div className="drawer-body-pad" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
                {/* ── Section A: Origin & Creation Audit (Who created ticket & tasks) ── */}
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A', marginBottom: '12px' }}>
                    🌟 {t.ticketCreatedLog}
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {/* Ticket Creation Card */}
                    <div
                      style={{
                        padding: '14px 16px',
                        background: '#EFF6FF',
                        borderRadius: '12px',
                        border: '1px solid #BFDBFE',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '13px', fontWeight: '800', color: '#1E40AF' }}>
                          🏷️ {t.ticketCreatedEvent}: #{ticket.id} ({ticket.title})
                        </span>
                        <span style={{ fontSize: '11.5px', color: '#64748B' }}>
                          📅 {formatDateTime(ticket.createdAt, lang)}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#1E293B', marginTop: '2px' }}>
                        <Avatar name={ticket.createdByName} size="xs" />
                        <span>
                          {t.createdByLabel} <strong style={{ color: '#0F172A' }}>{ticket.createdByName || '—'}</strong>
                        </span>
                        <span style={{ color: '#94A3B8' }}>•</span>
                        <span>
                          {t.assignedToLabel} <strong>{formatMemberName(ticket.memberName, lang)}</strong>
                        </span>
                        <span style={{ color: '#94A3B8' }}>•</span>
                        <span>📁 {ticket.teamName || '—'}</span>
                      </div>
                    </div>

                    {/* Subtasks Creation Cards */}
                    {(ticket.ticketTasks || []).map((task) => (
                      <div
                        key={`task-create-${task.id}`}
                        style={{
                          padding: '12px 14px',
                          background: '#F8FAFC',
                          borderRadius: '10px',
                          border: '1px solid #E2E8F0',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#0F172A' }}>
                            📋 {t.taskCreatedEvent}: {task.title}
                          </span>
                          <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                            {formatDateTime(task.createdAt, lang)}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#475569', flexWrap: 'wrap' }}>
                          <Avatar name={task.createdByName || ticket.createdByName} size="xs" />
                          <span>
                            {t.createdByLabel} <strong style={{ color: '#1E293B' }}>{task.createdByName || ticket.createdByName || '—'}</strong>
                          </span>
                          <span style={{ color: '#CBD5E1' }}>•</span>
                          <span>
                            {t.assignedToLabel} <strong style={{ color: '#1565C0' }}>{formatMemberName(task.memberName, lang)}</strong>
                          </span>
                          <span style={{ color: '#CBD5E1' }}>•</span>
                          <span>{lang === 'ar' ? 'الحالة:' : 'Status:'} <strong>{getTaskStatusText(task.status, lang)}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Section B: Status Transitions & History Log ── */}
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A', marginBottom: '12px' }}>
                    📜 {t.auditTimelineTitle}
                  </h3>

                  {(!ticket.statusHistories || ticket.statusHistories.length === 0) ? (
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
                      {t.noHistory}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {ticket.statusHistories.map((h, idx) => {
                        const isSameStatus = normalizeTicketStatus(h.oldStatus) === normalizeTicketStatus(h.newStatus);
                        const isSubtaskDeleted = h.comment && (h.comment.includes('تم حذف المهمة الفرعية') || /subtask.*deleted/i.test(h.comment));

                        return (
                          <div
                            key={h.id || idx}
                            style={{
                              padding: '14px 16px',
                              background: '#FFFFFF',
                              borderRadius: '10px',
                              border: isSubtaskDeleted ? '1px solid #FECACA' : '1px solid #E2E8F0',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
                              {isSameStatus ? (
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                  {isSubtaskDeleted ? (
                                    <span
                                      style={{
                                        fontSize: '12px',
                                        fontWeight: '700',
                                        color: '#DC2626',
                                        background: '#FEF2F2',
                                        border: '1px solid #FECACA',
                                        padding: '2px 8px',
                                        borderRadius: '6px',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                      }}
                                    >
                                      🗑️ {t.subtaskDeletedAction || (lang === 'ar' ? 'حذف مهمة فرعية' : 'Subtask Deleted')}
                                    </span>
                                  ) : (
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
                                  )}
                                  <span style={{ fontSize: '11.5px', color: '#64748B' }}>
                                    ({lang === 'ar' ? 'الحالة الحالية:' : 'Current Status:'} <strong style={{ color: '#0F172A' }}>{getStatusText(h.newStatus, lang)}</strong>)
                                  </span>
                                </div>
                              ) : (
                                <span style={{ fontSize: '12.5px', fontWeight: '800', color: '#1565C0', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                  <span>{getStatusText(h.oldStatus, lang)}</span>
                                  <span style={{ color: '#94A3B8' }}>➔</span>
                                  <span style={{ color: '#0F172A' }}>{getStatusText(h.newStatus, lang)}</span>
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
                                  marginTop: '8px',
                                  padding: '8px 10px',
                                  background: isSubtaskDeleted ? '#FFF5F5' : '#F8FAFC',
                                  borderRadius: '6px',
                                  fontSize: '12.5px',
                                  color: isSubtaskDeleted ? '#991B1B' : '#475569',
                                  borderInlineStart: isSubtaskDeleted ? '3px solid #EF4444' : '3px solid #CBD5E1',
                                }}
                              >
                                {formatAuditComment(h.comment, lang)}
                              </div>
                            )}

                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '8px' }}>
                            {h.fileUrl && (
                              <a
                                href={h.fileUrl.startsWith('http') ? h.fileUrl : `http://localhost:5051${h.fileUrl}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  fontSize: '12px',
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
                                  fontSize: '12px',
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
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Edit Ticket Modal (includes changing who assigned to) */}
      {isEditTicketModalOpen && (
        <EditTicketModal
          ticket={ticket}
          teams={[]}
          open={isEditTicketModalOpen}
          onClose={() => setIsEditTicketModalOpen(false)}
          onSubmit={handleEditTicketSubmit}
          lang={lang}
        />
      )}

      {/* Edit Subtask Modal (includes changing who assigned to) */}
      {isEditTaskModalOpen && (
        <EditTaskModal
          task={selectedTaskForEdit}
          open={isEditTaskModalOpen}
          onClose={() => {
            setIsEditTaskModalOpen(false);
            setSelectedTaskForEdit(null);
          }}
          onSubmit={handleEditTaskSubmit}
          teamMembers={teamMembers}
          lang={lang}
        />
      )}

      {/* Status Modal */}
      {isStatusModalOpen && (
        <TicketStatusModal
          open={isStatusModalOpen}
          onClose={() => {
            setIsStatusModalOpen(false);
            setSelectedTaskForStatus(null);
          }}
          currentStatus={selectedTaskForStatus ? selectedTaskForStatus.status : (ticket ? ticket.status : 'Pending')}
          onSubmit={handleStatusModalSubmit}
          teamMembers={teamMembers}
          lang={lang}
          isTask={!!selectedTaskForStatus}
        />
      )}

      {/* New Subtask Modal */}
      {isNewTaskModalOpen && (
        <NewTaskModal
          open={isNewTaskModalOpen}
          onClose={() => setIsNewTaskModalOpen(false)}
          onSubmit={handleCreateSubtask}
          teamMembers={teamMembers}
          lang={lang}
        />
      )}

      {/* Delete Ticket Custom Modal */}
      <ConfirmDeleteModal
        open={isDeleteTicketModalOpen}
        onClose={() => setIsDeleteTicketModalOpen(false)}
        onConfirm={confirmDeleteTicket}
        title={t.deleteTicketTitle}
        message={t.deleteTicketConfirm}
        itemName={ticket ? `#${ticket.id} - ${ticket.title}` : ''}
        loading={deleting}
        lang={lang}
      />

      {/* Delete Subtask Custom Modal */}
      <ConfirmDeleteModal
        open={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        onConfirm={confirmDeleteTask}
        title={t.deleteTaskTitle}
        message={t.deleteTaskConfirm}
        itemName={taskToDelete ? `#${taskToDelete.id} - ${taskToDelete.title}` : ''}
        loading={deleting}
        lang={lang}
      />

      {/* Subtask Details & History Modal */}
      {selectedTaskForDetails && (
        <SubtaskDetailsModal
          task={selectedTaskForDetails}
          ticket={ticket}
          open={!!selectedTaskForDetails}
          onClose={() => setSelectedTaskForDetails(null)}
          teamMembers={teamMembers}
          onSubtaskUpdated={async () => {
            await fetchTicketDetails();
            if (onTicketUpdated) onTicketUpdated();
          }}
          lang={lang}
        />
      )}
    </>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import {
  translations,
  normalizeTicketStatus,
  normalizeTicketPriority,
  getPriorityColor,
  getStatusColor,
  getPriorityText,
  getStatusText,
  formatMemberName,
  parseUtcDate,
  formatDateTime,
  formatDate,
  isTicketOrTaskOverdue,
  getDeadlineUrgency,
} from '../utils/constants';
import {
  PageHeader,
  Badge,
  Avatar,
  Button,
  Spinner,
  ConfirmDeleteModal,
} from '../components/shared';

// Modular Ticket View & Filter Components
import TicketFilterToolbar from '../components/pages/tickets/TicketFilterToolbar';
import TicketTableView from '../components/pages/tickets/TicketTableView';
import TicketGridView from '../components/pages/tickets/TicketGridView';
import TicketListView from '../components/pages/tickets/TicketListView';
import TicketGroupedView from '../components/pages/tickets/TicketGroupedView';
import TicketKanban from '../components/pages/tickets/TicketKanban';
import TicketCalendarView from '../components/pages/tickets/TicketCalendarView';
import TicketDetailsDrawer from '../components/pages/tickets/TicketDetailsDrawer';
import SubtaskDetailsModal from '../components/pages/tickets/SubtaskDetailsModal';
import NewTicketModal from '../components/pages/tickets/NewTicketModal';
import EditTicketModal from '../components/pages/tickets/EditTicketModal';

import ticketService from '../services/ticketService';
import teamService from '../services/teamService';

export default function TicketsPage({ lang = 'ar', user }) {
  const t = translations[lang] || translations.ar;
  const isRtl = lang === 'ar';

  // Data state
  const [tickets, setTickets] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // View mode: 'table' | 'kanban' | 'grid' | 'list' | 'grouped' | 'calendar' (persisted in localStorage)
  const [viewMode, setViewMode] = useState(() => {
    try {
      const saved = localStorage.getItem('tickets_view_mode');
      if (saved && ['table', 'kanban', 'grid', 'list', 'grouped', 'calendar'].includes(saved)) {
        return saved;
      }
    } catch (e) {
      console.warn('Failed to read tickets_view_mode from localStorage', e);
    }
    return 'table';
  });

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    try {
      localStorage.setItem('tickets_view_mode', mode);
    } catch (e) {
      console.warn('Failed to save tickets_view_mode to localStorage', e);
    }
  };

  // Filter and Sort states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [teamFilter, setTeamFilter] = useState('all');
  const [quickFilter, setQuickFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Modals & Drawer state
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [ticketToEdit, setTicketToEdit] = useState(null);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Calendar subtask detail modal state
  const [calendarSelectedSubtask, setCalendarSelectedSubtask] = useState(null);
  const [calendarSubtaskParent, setCalendarSubtaskParent] = useState(null);

  // Fetch live tickets and teams
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ticketsData, teamsData] = await Promise.all([
        ticketService.getAllTickets(),
        teamService.getAllTeams().catch(() => []),
      ]);
      setTickets(Array.isArray(ticketsData) ? ticketsData : []);
      setTeams(Array.isArray(teamsData) ? teamsData : []);
    } catch (err) {
      setError(err.message || t.errorOccurred);
    } finally {
      setLoading(false);
    }
  }, [t.errorOccurred]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handlers
  const handleOpenTicket = (ticketOrId) => {
    const id = ticketOrId && typeof ticketOrId === 'object' ? ticketOrId.id : ticketOrId;
    if (id) {
      setSelectedTicketId(id);
      setIsDrawerOpen(true);
    }
  };

  const handleEditTicket = (ticket) => {
    setTicketToEdit(ticket);
    setIsEditModalOpen(true);
  };

  const handleDeleteTicket = (ticket) => {
    setTicketToDelete(ticket);
  };

  const handleCreateTicketSubmit = async (formData) => {
    await ticketService.createTicket(formData);
    await loadData();
  };

  const confirmDeleteTicket = async () => {
    if (!ticketToDelete) return;
    setDeleting(true);
    try {
      await ticketService.deleteTicket(ticketToDelete.id);
      if (selectedTicketId === ticketToDelete.id) {
        setIsDrawerOpen(false);
        setSelectedTicketId(null);
      }
      setTicketToDelete(null);
      await loadData();
    } catch (err) {
      alert(err.message || t.errorOccurred);
    } finally {
      setDeleting(false);
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setTeamFilter('all');
    setPriorityFilter('all');
    setStatusFilter('all');
    setQuickFilter('all');
    setSortBy('newest');
  };

  // Quick Filter Live Counts
  const quickCounts = {
    all: tickets.length,
    mine: tickets.filter((tk) => {
      const curName = (user?.name || '').toLowerCase();
      const curNameEn = (user?.nameEn || '').toLowerCase();
      const mName = (tk.memberName || '').toLowerCase();
      return (
        (tk.memberId && user?.id && String(tk.memberId) === String(user.id)) ||
        (curName && mName.includes(curName)) ||
        (curNameEn && mName.includes(curNameEn))
      );
    }).length,
    unassigned: tickets.filter((tk) => {
      const mName = (tk.memberName || '').toLowerCase();
      return (
        !tk.memberId &&
        (!tk.memberName || mName.includes('unassigned') || mName.includes('notassigned'))
      );
    }).length,
    urgent: tickets.filter((tk) => {
      const normPriority = normalizeTicketPriority(tk.priority);
      const isUrgent = normPriority === 'Urgent';
      const isOverdue = isTicketOrTaskOverdue(tk.deadline, tk.completedAt);
      return isUrgent || isOverdue;
    }).length,
    active: tickets.filter((tk) => {
      const s = normalizeTicketStatus(tk.status);
      return s === 'OnProgress' || s === 'Pending';
    }).length,
    completed: tickets.filter((tk) => normalizeTicketStatus(tk.status) === 'Completed').length,
  };

  // Multi-criteria Filtering
  const filteredTickets = tickets.filter((ticket) => {
    const term = searchTerm.toLowerCase().trim();
    const cleanId = String(ticket.id).replace('#', '').toLowerCase();
    const matchesSearch =
      !term ||
      cleanId.includes(term.replace('#', '')) ||
      (ticket.title && ticket.title.toLowerCase().includes(term)) ||
      (ticket.description && ticket.description.toLowerCase().includes(term)) ||
      (ticket.memberName && ticket.memberName.toLowerCase().includes(term)) ||
      (ticket.teamName && ticket.teamName.toLowerCase().includes(term)) ||
      (ticket.createdByName && ticket.createdByName.toLowerCase().includes(term));

    const matchesTeam = teamFilter === 'all' || String(ticket.teamId) === String(teamFilter);
    const normPriority = normalizeTicketPriority(ticket.priority);
    const matchesPriority = priorityFilter === 'all' || normPriority === priorityFilter;
    const normStatus = normalizeTicketStatus(ticket.status);
    const matchesStatus = statusFilter === 'all' || normStatus === statusFilter;

    let matchesQuick = true;
    if (quickFilter === 'mine') {
      const curName = (user?.name || '').toLowerCase();
      const curNameEn = (user?.nameEn || '').toLowerCase();
      const mName = (ticket.memberName || '').toLowerCase();
      matchesQuick =
        (ticket.memberId && user?.id && String(ticket.memberId) === String(user.id)) ||
        (curName && mName.includes(curName)) ||
        (curNameEn && mName.includes(curNameEn));
    } else if (quickFilter === 'unassigned') {
      const mName = (ticket.memberName || '').toLowerCase();
      matchesQuick =
        !ticket.memberId &&
        (!ticket.memberName || mName.includes('unassigned') || mName.includes('notassigned'));
    } else if (quickFilter === 'urgent') {
      const isUrgent = normPriority === 'Urgent';
      const isOverdue = isTicketOrTaskOverdue(ticket.deadline, ticket.completedAt);
      matchesQuick = isUrgent || isOverdue;
    } else if (quickFilter === 'active') {
      matchesQuick = normStatus === 'OnProgress' || normStatus === 'Pending';
    } else if (quickFilter === 'completed') {
      matchesQuick = normStatus === 'Completed';
    }

    return matchesSearch && matchesTeam && matchesPriority && matchesStatus && matchesQuick;
  });

  // Sorting
  const sortedTickets = [...filteredTickets].sort((a, b) => {
    if (sortBy === 'newest') {
      const diff = (parseUtcDate(b.createdAt) || 0) - (parseUtcDate(a.createdAt) || 0);
      return diff !== 0 ? diff : b.id - a.id;
    }
    if (sortBy === 'oldest') {
      const diff = (parseUtcDate(a.createdAt) || 0) - (parseUtcDate(b.createdAt) || 0);
      return diff !== 0 ? diff : a.id - b.id;
    }
    if (sortBy === 'priority') {
      const priorityOrder = { Urgent: 4, High: 3, Medium: 2, Low: 1 };
      const pA = priorityOrder[normalizeTicketPriority(a.priority)] || 0;
      const pB = priorityOrder[normalizeTicketPriority(b.priority)] || 0;
      return pB - pA;
    }
    if (sortBy === 'deadline') {
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return (parseUtcDate(a.deadline) || 0) - (parseUtcDate(b.deadline) || 0);
    }
    if (sortBy === 'title') {
      return (a.title || '').localeCompare(b.title || '');
    }
    return 0;
  });

  // Deadline urgency helper that delegates to global helper with full parameters
  const getTicketDeadlineUrgency = (deadlineStr, completedAt = null, status = null) => {
    return getDeadlineUrgency(deadlineStr, completedAt, status, lang);
  };

  // Grouped by Team structure
  const groupedTeams = teams.map((team) => ({
    teamId: team.id,
    teamName: team.name,
    tickets: sortedTickets.filter((tk) => String(tk.teamId) === String(team.id)),
  }));

  const unassignedTeamTickets = sortedTickets.filter(
    (tk) => !tk.teamId || !teams.some((team) => String(team.id) === String(tk.teamId))
  );

  if (unassignedTeamTickets.length > 0) {
    groupedTeams.push({
      teamId: 'unassigned-team',
      teamName: lang === 'ar' ? 'تذاكر بدون فريق محدد (عامة)' : 'Unassigned / General Tickets',
      tickets: unassignedTeamTickets,
    });
  }

  // Table Columns Definition
  const columns = [
    {
      key: 'id',
      title: t.ticketId,
      render: (val) => (
        <span style={{ fontWeight: '800', color: '#1565C0', fontFamily: 'monospace', fontSize: '13px' }}>
          #{val}
        </span>
      ),
    },
    {
      key: 'title',
      title: t.ticketSubject,
      render: (val, row) => (
        <div style={{ textAlign: isRtl ? 'right' : 'left', maxWidth: '300px' }}>
          <div style={{ fontWeight: '700', color: '#0F172A', fontSize: '13.5px', lineHeight: 1.3 }}>
            {val}
          </div>
          <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '3px' }}>
            {row.teamName ? `📁 ${row.teamName}` : ''} • {row.createdByName || ''}
          </div>
        </div>
      ),
    },
    {
      key: 'priority',
      title: t.ticketPriority,
      render: (val) => {
        const norm = normalizeTicketPriority(val);
        const col = getPriorityColor(norm);
        return (
          <span
            style={{
              fontSize: '11.5px',
              fontWeight: '700',
              padding: '3px 8px',
              borderRadius: '6px',
              background: col.bg,
              color: col.text,
              border: `1px solid ${col.border}`,
            }}
          >
            {getPriorityText(norm, lang)}
          </span>
        );
      },
    },
    {
      key: 'status',
      title: t.ticketStatus,
      render: (val) => {
        const norm = normalizeTicketStatus(val);
        const col = getStatusColor(norm);
        return (
          <span
            style={{
              fontSize: '11.5px',
              fontWeight: '700',
              padding: '3px 8px',
              borderRadius: '6px',
              background: col.bg,
              color: col.text,
              border: `1px solid ${col.border}`,
            }}
          >
            {getStatusText(norm, lang)}
          </span>
        );
      },
    },
    {
      key: 'memberName',
      title: t.ticketAssignee,
      render: (val) => {
        const displayName = formatMemberName(val, lang);
        const isUnassigned = !val || val === 'Unassigned' || val === 'NotAssigned';
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Avatar name={val || '?'} size="sm" />
            <span
              style={{
                fontSize: '12.5px',
                fontWeight: isUnassigned ? '500' : '600',
                color: isUnassigned ? '#94A3B8' : '#1E293B',
                fontStyle: isUnassigned ? 'italic' : 'normal',
              }}
            >
              {displayName}
            </span>
          </div>
        );
      },
    },
    {
      key: 'deadline',
      title: t.ticketDeadline,
      render: (val, ticket) => {
        const urgency = getTicketDeadlineUrgency(val, ticket?.completedAt, ticket?.status);
        if (!val) return <span style={{ color: '#94A3B8', fontSize: '12px' }}>—</span>;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
            <span style={{ fontSize: '12px', color: urgency?.isOverdue ? '#DC2626' : '#475569', fontWeight: urgency?.isOverdue ? '700' : '500' }}>
              {formatDate(val, lang)}
            </span>
            {urgency && (
              <Badge variant={urgency.variant} size="sm">
                {urgency.label}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      key: 'actions',
      title: t.actions,
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenTicket(row);
            }}
          >
            {t.viewDetails}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleEditTicket(row);
            }}
          >
            ✏️
          </Button>

          <Button
            variant="ghost"
            size="sm"
            title={t.delete}
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteTicket(row);
            }}
            style={{ color: '#DC2626' }}
          >
            🗑️
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
      {/* Page Header with Multi-View Segmented Switcher */}
      <PageHeader
        title={t.ticketsTitle}
        subtitle={t.ticketsSubtitle}
        badge={
          <Badge variant="blue" size="md">
            {sortedTickets.length} / {tickets.length} {t.ticketsCount}
          </Badge>
        }
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* 6 View Modes Switcher */}
            <div
              style={{
                display: 'inline-flex',
                background: '#F1F5F9',
                padding: '3px',
                borderRadius: '10px',
                border: '1px solid #E2E8F0',
                gap: '2px',
                flexWrap: 'wrap',
              }}
            >
              {[
                { id: 'table', icon: '📋', label: t.viewTable },
                { id: 'kanban', icon: '☷', label: t.viewKanban },
                { id: 'grid', icon: '🪟', label: t.viewGrid },
                { id: 'list', icon: '☰', label: t.viewList },
                { id: 'grouped', icon: '📁', label: t.viewGrouped },
                { id: 'calendar', icon: '📅', label: t.viewCalendar || (lang === 'ar' ? 'التقويم' : 'Calendar') },
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
                    }}
                  >
                    <span>{vm.icon}</span>
                    <span className="view-mode-text">{vm.label}</span>
                  </button>
                );
              })}
            </div>

            {/* New Ticket Button */}
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsNewTicketModalOpen(true)}
            >
              + {t.newTicket}
            </Button>
          </div>
        }
      />

      {/* Filter and Search Toolbar */}
      <TicketFilterToolbar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        teamFilter={teamFilter}
        setTeamFilter={setTeamFilter}
        priorityFilter={priorityFilter}
        setPriorityFilter={setPriorityFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
        quickFilter={quickFilter}
        setQuickFilter={setQuickFilter}
        quickCounts={quickCounts}
        teams={teams}
        onReset={handleResetFilters}
        lang={lang}
        t={t}
        isRtl={isRtl}
      />

      {/* Main View Area */}
      {loading ? (
        <div style={{ padding: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
          <Spinner size="lg" />
          <span style={{ fontSize: '13.5px', color: '#64748B', fontWeight: '600' }}>{t.loading}</span>
        </div>
      ) : error ? (
        <div
          style={{
            padding: '36px',
            textAlign: 'center',
            background: '#FEF2F2',
            borderRadius: '12px',
            border: '1px solid #FCA5A5',
            margin: '20px 0',
          }}
        >
          <div style={{ fontSize: '14px', color: '#DC2626', fontWeight: '700', marginBottom: '12px' }}>
            ⚠️ {error}
          </div>
          <Button variant="secondary" size="sm" onClick={loadData}>
            {t.retry}
          </Button>
        </div>
      ) : sortedTickets.length === 0 ? (
        <div
          style={{
            padding: '60px 20px',
            textAlign: 'center',
            background: '#FFFFFF',
            borderRadius: '16px',
            border: '1px dashed #CBD5E1',
            color: '#64748B',
            fontSize: '14px',
            fontWeight: '600',
            margin: '10px 0',
          }}
        >
          {t.noTicketsFound}
        </div>
      ) : viewMode === 'calendar' ? (
        <TicketCalendarView
          tickets={sortedTickets}
          onTicketClick={handleOpenTicket}
          onSubtaskClick={(subtask, parentTicket) => {
            setCalendarSelectedSubtask(subtask);
            setCalendarSubtaskParent(parentTicket);
          }}
          getDeadlineUrgency={getTicketDeadlineUrgency}
          lang={lang}
          t={t}
        />
      ) : viewMode === 'kanban' ? (
        <TicketKanban
          tickets={sortedTickets}
          onTicketClick={handleOpenTicket}
          lang={lang}
          user={user}
        />
      ) : viewMode === 'grid' ? (
        <TicketGridView
          tickets={sortedTickets}
          onTicketClick={handleOpenTicket}
          onEditTicket={handleEditTicket}
          onDeleteTicket={handleDeleteTicket}
          getDeadlineUrgency={getTicketDeadlineUrgency}
          lang={lang}
          t={t}
        />
      ) : viewMode === 'list' ? (
        <TicketListView
          tickets={sortedTickets}
          onTicketClick={handleOpenTicket}
          onEditTicket={handleEditTicket}
          onDeleteTicket={handleDeleteTicket}
          getDeadlineUrgency={getTicketDeadlineUrgency}
          lang={lang}
          t={t}
        />
      ) : viewMode === 'grouped' ? (
        <TicketGroupedView
          groupedTeams={groupedTeams}
          onTicketClick={handleOpenTicket}
          onEditTicket={handleEditTicket}
          onDeleteTicket={handleDeleteTicket}
          getDeadlineUrgency={getTicketDeadlineUrgency}
          lang={lang}
          t={t}
        />
      ) : (
        <TicketTableView
          tickets={sortedTickets}
          columns={columns}
          emptyMessage={t.noTicketsFound}
          onTicketClick={handleOpenTicket}
          onEditTicket={handleEditTicket}
          onDeleteTicket={handleDeleteTicket}
          getDeadlineUrgency={getTicketDeadlineUrgency}
          lang={lang}
          t={t}
        />
      )}

      {/* Ticket Details Drawer */}
      <TicketDetailsDrawer
        ticketId={selectedTicketId}
        open={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedTicketId(null);
        }}
        onTicketUpdated={loadData}
        lang={lang}
        user={user}
      />

      {/* New Ticket Modal */}
      {isNewTicketModalOpen && (
        <NewTicketModal
          open={isNewTicketModalOpen}
          onClose={() => setIsNewTicketModalOpen(false)}
          onSubmit={handleCreateTicketSubmit}
          teams={teams}
          lang={lang}
        />
      )}

      {/* Edit Ticket Modal */}
      {isEditModalOpen && ticketToEdit && (
        <EditTicketModal
          ticket={ticketToEdit}
          teams={teams}
          open={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setTicketToEdit(null);
          }}
          onSubmit={async (formData) => {
            await ticketService.updateTicket(ticketToEdit.id, formData);
            await loadData();
          }}
          lang={lang}
        />
      )}

      {/* Custom Delete Ticket Confirmation Modal */}
      <ConfirmDeleteModal
        open={!!ticketToDelete}
        onClose={() => setTicketToDelete(null)}
        onConfirm={confirmDeleteTicket}
        title={t.deleteTicketTitle}
        message={t.deleteTicketConfirm}
        itemName={ticketToDelete ? `#${ticketToDelete.id} - ${ticketToDelete.title}` : ''}
        loading={deleting}
        lang={lang}
      />

      {/* Subtask Details Modal (triggered from Calendar View) */}
      {calendarSelectedSubtask && (
        <SubtaskDetailsModal
          task={calendarSelectedSubtask}
          ticket={calendarSubtaskParent}
          open={!!calendarSelectedSubtask}
          onClose={() => {
            setCalendarSelectedSubtask(null);
            setCalendarSubtaskParent(null);
          }}
          onSubtaskUpdated={async () => {
            await loadData();
          }}
          lang={lang}
        />
      )}

      <style>{`
        @media (max-width: 580px) {
          .view-mode-text {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

import React, { useState } from 'react';
import {
  translations,
  normalizeTicketStatus,
  normalizeTicketPriority,
  getPriorityColor,
  getStatusColor,
  getPriorityText,
  formatMemberName,
  getDeadlineUrgency,
  formatDate,
} from '../../../utils/constants';
import { Avatar, Badge, Button } from '../../shared';

export default function TicketKanban({
  tickets = [],
  onTicketClick,
  onQuickAdvance,
  lang = 'ar',
  user,
}) {
  const t = translations[lang] || translations.ar;
  const isRtl = lang === 'ar';

  const columns = [
    { id: 'NotAssigned', label: t.statusNotAssigned, bg: '#F8FAFC', border: '#E2E8F0', countColor: '#64748B' },
    { id: 'Pending', label: t.statusPending, bg: '#FFFBEB', border: '#FDE68A', countColor: '#D97706' },
    { id: 'OnProgress', label: t.statusOnProgress, bg: '#EFF6FF', border: '#BFDBFE', countColor: '#2563EB' },
    { id: 'Completed', label: t.statusCompleted, bg: '#F0FDF4', border: '#BBF7D0', countColor: '#16A34A' },
  ];

  // Mobile active column selector state
  const [mobileActiveCol, setMobileActiveCol] = useState('OnProgress');

  // Group tickets by normalized status
  const groupedTickets = columns.reduce((acc, col) => {
    acc[col.id] = tickets.filter((ticket) => normalizeTicketStatus(ticket.status) === col.id);
    return acc;
  }, {});

  const renderCard = (ticket) => {
    const priority = normalizeTicketPriority(ticket.priority);
    const pColor = getPriorityColor(priority);
    const deadlineInfo = getDeadlineUrgency(ticket.deadline, ticket.completedAt, ticket.status, lang);
    const tasks = ticket.ticketTasks || [];
    const completedTasksCount = tasks.filter((task) => task.status === 'Completed' || task.status === 3).length;

    return (
      <div
        key={ticket.id}
        onClick={() => onTicketClick && onTicketClick(ticket)}
        style={{
          background: deadlineInfo?.isOverdue ? '#FFFDFD' : '#FFFFFF',
          borderRadius: '12px',
          border: deadlineInfo?.isOverdue ? '1.5px solid #FCA5A5' : '1px solid #E2E8F0',
          borderInlineStart: `4px solid ${pColor.text}`,
          padding: '14px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
        }}
      >
        {/* Card Header: Ticket ID & Priority */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: '800', color: '#1565C0', fontFamily: 'monospace' }}>
            #{ticket.id}
          </span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: '700',
              padding: '2px 8px',
              borderRadius: '6px',
              background: pColor.bg,
              color: pColor.text,
              border: `1px solid ${pColor.border}`,
            }}
          >
            {getPriorityText(priority, lang)}
          </span>
        </div>

        {/* Card Title & Team */}
        <div>
          <div
            style={{
              fontSize: '13.5px',
              fontWeight: '700',
              color: '#0F172A',
              lineHeight: 1.4,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {ticket.title}
          </div>
          {ticket.teamName && (
            <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '4px', fontWeight: '500' }}>
              📁 {ticket.teamName}
            </div>
          )}
        </div>

        {/* Card Footer: Member & Metadata */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '8px',
            borderTop: '1px solid #F1F5F9',
            marginTop: '2px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Avatar name={formatMemberName(ticket.memberName, lang)} size="xs" />
            <span style={{ fontSize: '11.5px', color: '#334155', fontWeight: '600', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {formatMemberName(ticket.memberName, lang)}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {tasks.length > 0 && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  color: completedTasksCount === tasks.length ? '#16A34A' : '#64748B',
                  background: completedTasksCount === tasks.length ? '#DCFCE7' : '#F1F5F9',
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}
              >
                ✓ {completedTasksCount}/{tasks.length}
              </span>
            )}
            {deadlineInfo && (
              <Badge variant={deadlineInfo.variant} size="sm">
                {deadlineInfo.label}
              </Badge>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
      {/* Mobile Column Switcher (Visible on small screens) */}
      <div className="kanban-mobile-tabs" style={{ display: 'none', marginBottom: '16px' }}>
        <div
          style={{
            display: 'flex',
            background: '#F1F5F9',
            padding: '4px',
            borderRadius: '10px',
            gap: '4px',
            overflowX: 'auto',
          }}
        >
          {columns.map((col) => {
            const count = groupedTickets[col.id]?.length || 0;
            const active = mobileActiveCol === col.id;
            return (
              <button
                key={col.id}
                onClick={() => setMobileActiveCol(col.id)}
                style={{
                  flex: '1 1 0',
                  minWidth: '85px',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: 'none',
                  background: active ? '#FFFFFF' : 'transparent',
                  color: active ? '#0F172A' : '#64748B',
                  fontWeight: active ? '700' : '600',
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  boxShadow: active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                }}
              >
                <span>{col.label}</span>
                <span
                  style={{
                    fontSize: '11px',
                    padding: '1px 5px',
                    borderRadius: '10px',
                    background: active ? col.bg : '#E2E8F0',
                    color: active ? col.countColor : '#64748B',
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Mobile Single Column Content */}
        <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {(groupedTickets[mobileActiveCol] || []).length === 0 ? (
            <div
              style={{
                padding: '36px 16px',
                textAlign: 'center',
                color: '#94A3B8',
                background: '#F8FAFC',
                borderRadius: '12px',
                border: '1px dashed #CBD5E1',
                fontSize: '13px',
              }}
            >
              {t.noTicketsFound}
            </div>
          ) : (
            groupedTickets[mobileActiveCol].map(renderCard)
          )}
        </div>
      </div>

      {/* Desktop / Tablet 4-Column Grid */}
      <div className="kanban-desktop-grid">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(250px, 1fr))',
            gap: '16px',
            alignItems: 'start',
          }}
        >
          {columns.map((col) => {
            const columnTickets = groupedTickets[col.id] || [];
            return (
              <div
                key={col.id}
                style={{
                  background: col.bg,
                  borderRadius: '14px',
                  border: `1px solid ${col.border}`,
                  display: 'flex',
                  flexDirection: 'column',
                  maxHeight: 'calc(100vh - 270px)',
                  minHeight: '380px',
                }}
              >
                {/* Column Header */}
                <div
                  style={{
                    padding: '14px 16px',
                    borderBottom: `1px solid ${col.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexShrink: 0,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13.5px', fontWeight: '800', color: '#0F172A' }}>
                      {col.label}
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: '700',
                        color: col.countColor,
                        background: '#FFFFFF',
                        padding: '2px 7px',
                        borderRadius: '12px',
                        border: `1px solid ${col.border}`,
                      }}
                    >
                      {columnTickets.length}
                    </span>
                  </div>
                </div>

                {/* Column Cards Container */}
                <div
                  style={{
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    overflowY: 'auto',
                    flex: 1,
                  }}
                >
                  {columnTickets.length === 0 ? (
                    <div
                      style={{
                        padding: '30px 12px',
                        textAlign: 'center',
                        color: '#94A3B8',
                        fontSize: '12.5px',
                        fontWeight: '500',
                        border: '1px dashed #E2E8F0',
                        borderRadius: '8px',
                        background: 'rgba(255,255,255,0.6)',
                      }}
                    >
                      {t.noTicketsFound}
                    </div>
                  ) : (
                    columnTickets.map(renderCard)
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Responsive Style to handle screen width */}
      <style>{`
        @media (max-width: 768px) {
          .kanban-desktop-grid {
            display: none !important;
          }
          .kanban-mobile-tabs {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
}

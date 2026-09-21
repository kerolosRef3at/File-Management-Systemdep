import React from 'react';
import {
  normalizeTicketPriority,
  normalizeTicketStatus,
  getPriorityColor,
  getStatusColor,
  getPriorityText,
  getStatusText,
  formatMemberName,
} from '../../../utils/constants';
import { Table, Avatar, Badge, Button } from '../../shared';

export default function TicketTableView({
  tickets = [],
  columns,
  emptyMessage,
  onTicketClick,
  onEditTicket,
  onDeleteTicket,
  getDeadlineUrgency,
  lang = 'ar',
  t,
}) {
  return (
    <>
      {/* Desktop Table View */}
      <div
        className="tickets-desktop-table"
        style={{
          background: '#FFFFFF',
          borderRadius: '14px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          border: '1px solid #E2E8F0',
          overflowX: 'auto',
        }}
      >
        <Table
          columns={columns}
          data={tickets}
          emptyMessage={emptyMessage}
          onRowClick={onTicketClick}
        />
      </div>

      {/* Mobile Awesome Cards View */}
      <div className="tickets-mobile-cards" style={{ flexDirection: 'column', gap: '12px' }}>
        {tickets.length === 0 ? (
          <div
            style={{
              padding: '36px 16px',
              textAlign: 'center',
              background: '#FFFFFF',
              borderRadius: '12px',
              border: '1px dashed #CBD5E1',
              color: '#64748B',
              fontSize: '13px',
            }}
          >
            {emptyMessage}
          </div>
        ) : (
          tickets.map((ticket) => {
            const normPriority = normalizeTicketPriority(ticket.priority);
            const pColor = getPriorityColor(normPriority);
            const normStatus = normalizeTicketStatus(ticket.status);
            const sColor = getStatusColor(normStatus);
            const urgency = getDeadlineUrgency ? getDeadlineUrgency(ticket.deadline, ticket.completedAt, ticket.status, lang) : null;
            const displayName = formatMemberName(ticket.memberName, lang);

            return (
              <div
                key={ticket.id}
                style={{
                  background: urgency?.isOverdue ? '#FFFDFD' : '#FFFFFF',
                  borderRadius: '14px',
                  border: urgency?.isOverdue ? '1.5px solid #FCA5A5' : '1px solid #E2E8F0',
                  borderInlineStart: `4px solid ${pColor.text}`,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                {/* Top: ID, Priority, Status */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#1565C0', fontFamily: 'monospace' }}>
                    #{ticket.id}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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
                      {getPriorityText(normPriority, lang)}
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: '700',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: sColor.bg,
                        color: sColor.text,
                        border: `1px solid ${sColor.border}`,
                      }}
                    >
                      {getStatusText(normStatus, lang)}
                    </span>
                  </div>
                </div>

                {/* Middle: Title & Team */}
                <div onClick={() => onTicketClick(ticket)} style={{ cursor: 'pointer' }}>
                  <h4 style={{ fontSize: '14.5px', fontWeight: '800', color: '#0F172A', margin: '0 0 4px', lineHeight: 1.4 }}>
                    {ticket.title}
                  </h4>
                  <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    {ticket.teamName && <span>📁 {ticket.teamName}</span>}
                    {ticket.createdByName && (
                      <>
                        <span>•</span>
                        <span>👤 {ticket.createdByName}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Assignee & Deadline Row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Avatar name={ticket.memberName || '?'} size="sm" />
                    <div>
                      <div style={{ fontSize: '10.5px', color: '#94A3B8', fontWeight: '600' }}>{t.ticketAssignee}</div>
                      <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#1E293B' }}>{displayName}</div>
                    </div>
                  </div>

                  {urgency && (
                    <Badge variant={urgency.variant} size="sm">
                      {urgency.label}
                    </Badge>
                  )}
                </div>

                {/* Action Row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', paddingTop: '4px', borderTop: '1px solid #F1F5F9' }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onTicketClick(ticket)}
                  >
                    👁️ {t.viewDetails}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditTicket(ticket)}
                  >
                    ✏️ {t.edit}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    title={t.delete}
                    onClick={() => onDeleteTicket(ticket)}
                    style={{ color: '#DC2626' }}
                  >
                    🗑️
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}

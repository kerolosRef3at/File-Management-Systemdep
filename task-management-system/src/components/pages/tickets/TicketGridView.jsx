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
import { Avatar, Badge, Button } from '../../shared';

export default function TicketGridView({
  tickets = [],
  onTicketClick,
  onEditTicket,
  onDeleteTicket,
  getDeadlineUrgency,
  lang = 'ar',
  t,
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
        gap: '16px',
      }}
    >
      {tickets.map((ticket) => {
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
              borderTop: `4px solid ${pColor.text}`,
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '12px',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            }}
          >
            {/* Header: ID, Priority, Status */}
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

            {/* Title & Description */}
            <div onClick={() => onTicketClick(ticket)} style={{ cursor: 'pointer' }}>
              <h4
                style={{
                  fontSize: '15px',
                  fontWeight: '800',
                  color: '#0F172A',
                  margin: '0 0 6px',
                  lineHeight: 1.35,
                }}
              >
                {ticket.title}
              </h4>
              {ticket.description && (
                <p
                  style={{
                    fontSize: '12.5px',
                    color: '#64748B',
                    margin: 0,
                    lineHeight: 1.4,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {ticket.description}
                </p>
              )}
            </div>

            {/* Team & Deadline Info */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px', color: '#64748B', flexWrap: 'wrap', gap: '6px' }}>
              {ticket.teamName && (
                <span style={{ fontWeight: '600', color: '#334155' }}>📁 {ticket.teamName}</span>
              )}
              {urgency && (
                <Badge variant={urgency.variant} size="sm">
                  {urgency.label}
                </Badge>
              )}
            </div>

            {/* Assignee & Actions Row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '10px',
                borderTop: '1px solid #F1F5F9',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <Avatar name={ticket.memberName || '?'} size="sm" />
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#334155',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {displayName}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Button variant="secondary" size="sm" onClick={() => onTicketClick(ticket)}>
                  {t.viewDetails}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditTicket(ticket)}
                >
                  ✏️
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteTicket(ticket)}
                  style={{ color: '#DC2626' }}
                >
                  🗑️
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

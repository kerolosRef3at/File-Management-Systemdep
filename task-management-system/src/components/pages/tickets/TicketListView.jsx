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

export default function TicketListView({
  tickets = [],
  onTicketClick,
  onEditTicket,
  onDeleteTicket,
  getDeadlineUrgency,
  lang = 'ar',
  t,
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
            onClick={() => onTicketClick(ticket)}
            style={{
              background: urgency?.isOverdue ? '#FFFDFD' : '#FFFFFF',
              borderRadius: '12px',
              border: urgency?.isOverdue ? '1.5px solid #FCA5A5' : '1px solid #E2E8F0',
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              cursor: 'pointer',
              flexWrap: 'wrap',
              transition: 'border-color 0.15s ease, background 0.15s ease',
            }}
          >
            {/* Left: Priority Dot, ID, Title, Team */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 300px', minWidth: '240px' }}>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: pColor.text,
                  flexShrink: 0,
                }}
                title={getPriorityText(normPriority, lang)}
              />

              <span style={{ fontSize: '13px', fontWeight: '800', color: '#1565C0', fontFamily: 'monospace', flexShrink: 0 }}>
                #{ticket.id}
              </span>

              <span
                style={{
                  fontSize: '13.5px',
                  fontWeight: '700',
                  color: '#0F172A',
                  lineHeight: 1.3,
                }}
              >
                {ticket.title}
              </span>

              {ticket.teamName && (
                <span
                  style={{
                    fontSize: '11px',
                    background: '#F1F5F9',
                    color: '#475569',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    whiteSpace: 'nowrap',
                    fontWeight: '600',
                  }}
                >
                  📁 {ticket.teamName}
                </span>
              )}
            </div>

            {/* Right: Assignee, Deadline, Status, Actions */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Avatar name={ticket.memberName || '?'} size="sm" />
                <span style={{ fontSize: '12px', color: '#475569', fontWeight: '600' }}>
                  {displayName}
                </span>
              </div>

              {urgency && (
                <Badge variant={urgency.variant} size="sm">
                  {urgency.label}
                </Badge>
              )}

              <span
                style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: sColor.bg,
                  color: sColor.text,
                  border: `1px solid ${sColor.border}`,
                  whiteSpace: 'nowrap',
                }}
              >
                {getStatusText(normStatus, lang)}
              </span>

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

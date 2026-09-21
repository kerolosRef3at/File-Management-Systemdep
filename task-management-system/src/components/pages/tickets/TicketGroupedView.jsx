import React from 'react';
import {
  normalizeTicketPriority,
  normalizeTicketStatus,
  getPriorityColor,
  getStatusColor,
  getStatusText,
  formatMemberName,
} from '../../../utils/constants';
import { Avatar, Badge, Button } from '../../shared';

export default function TicketGroupedView({
  groupedTeams = [],
  onTicketClick,
  onEditTicket,
  onDeleteTicket,
  getDeadlineUrgency,
  lang = 'ar',
  t,
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {groupedTeams.map((grp) => (
        <div
          key={grp.teamId}
          style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
            overflow: 'hidden',
          }}
        >
          {/* Group Header */}
          <div
            style={{
              background: '#F8FAFC',
              padding: '14px 20px',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '18px' }}>📁</span>
              <span style={{ fontSize: '15.5px', fontWeight: '800', color: '#0F172A' }}>
                {grp.teamName}
              </span>
              <Badge variant="blue" size="sm">
                {grp.tickets.length} {t.ticketsCount}
              </Badge>
            </div>
          </div>

          {/* Group Body: List of Tickets */}
          <div style={{ padding: '16px' }}>
            {grp.tickets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#94A3B8', fontSize: '13px' }}>
                {lang === 'ar' ? 'لا توجد تذاكر مسندة لهذا الفريق حالياً' : 'No tickets assigned to this team currently'}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                {grp.tickets.map((ticket) => {
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
                        background: urgency?.isOverdue ? '#FFFDFD' : '#F8FAFC',
                        borderRadius: '12px',
                        border: urgency?.isOverdue ? '1.5px solid #FCA5A5' : '1px solid #E2E8F0',
                        borderInlineStart: `4px solid ${pColor.text}`,
                        padding: '14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '13px', fontWeight: '800', color: '#1565C0', fontFamily: 'monospace' }}>
                          #{ticket.id}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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
                            }}
                          >
                            {getStatusText(normStatus, lang)}
                          </span>
                        </div>
                      </div>

                      <div
                        onClick={() => onTicketClick(ticket)}
                        style={{ cursor: 'pointer', fontWeight: '700', fontSize: '13.5px', color: '#0F172A', lineHeight: 1.3 }}
                      >
                        {ticket.title}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #EEF2F6' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Avatar name={ticket.memberName || '?'} size="sm" />
                          <span style={{ fontSize: '11.5px', color: '#475569', fontWeight: '600' }}>
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
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

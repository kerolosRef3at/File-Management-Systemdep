import React from 'react';
import { translations, normalizeTeamStatus } from '../../../utils/constants';
import { Badge, Button, Avatar } from '../../shared';

export default function TeamCard({
  team,
  onManageMembers,
  onEditTeam,
  onDeleteTeam,
  lang = 'ar',
  user,
}) {
  const t = translations[lang] || translations.ar;
  const isRtl = lang === 'ar';

  const members = team.members || [];
  const leader = members.find((m) => m.isTeamLeader);
  const status = normalizeTeamStatus(team.status);

  const getStatusBadge = () => {
    switch (status) {
      case 'Active':
        return <Badge variant="green" size="sm">{t.teamStatusActive}</Badge>;
      case 'Pending':
        return <Badge variant="yellow" size="sm">{t.teamStatusPending}</Badge>;
      case 'Finished':
        return <Badge variant="gray" size="sm">{t.teamStatusFinished}</Badge>;
      default:
        return <Badge variant="gray" size="sm">{status}</Badge>;
    }
  };

  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: '14px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        direction: isRtl ? 'rtl' : 'ltr',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.07)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
      }}
    >
      {/* Top Row: Name and Status Badge */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
            {team.name}
          </h3>
          <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
            ID #{team.id}
          </div>
        </div>
        {getStatusBadge()}
      </div>

      {/* Description Snippet */}
      <p
        style={{
          fontSize: '13px',
          color: '#475569',
          lineHeight: 1.5,
          margin: 0,
          minHeight: '38px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}
      >
        {team.description || (lang === 'ar' ? 'لا يوجد وصف متاح لهذا الفريق' : 'No description provided')}
      </p>

      {/* Team Leader Box */}
      <div
        style={{
          padding: '10px 12px',
          background: leader ? '#FFFBEB' : '#F8FAFC',
          borderRadius: '10px',
          border: `1px solid ${leader ? '#FDE68A' : '#E2E8F0'}`,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <span style={{ fontSize: '18px' }}>{leader ? '⭐' : '👤'}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '11px', color: leader ? '#B45309' : '#64748B', fontWeight: '700' }}>
            {t.teamLeaderBadge}
          </div>
          <div style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {leader ? leader.fullName : t.noTeamLeader}
          </div>
        </div>
      </div>

      {/* Stats row: Members count */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '6px',
          borderTop: '1px solid #F1F5F9',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>
            👥 {members.length} {t.membersCount}
          </span>
        </div>

        {/* Member Avatars Stack */}
        <div style={{ display: 'flex', alignItems: 'center', marginInlineStart: '-6px' }}>
          {members.slice(0, 4).map((m) => (
            <div key={m.memberId} style={{ marginInlineStart: '-8px' }}>
              <Avatar name={m.fullName} size="xs" />
            </div>
          ))}
          {members.length > 4 && (
            <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#64748B', marginInlineStart: '6px' }}>
              +{members.length - 4}
            </span>
          )}
        </div>
      </div>

      {/* Card Action Buttons */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto auto',
          gap: '8px',
          marginTop: '4px',
        }}
      >
        <Button
          variant="primary"
          size="sm"
          onClick={() => onManageMembers && onManageMembers(team)}
        >
          ⚙️ {t.manageMembers}
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => onEditTeam && onEditTeam(team)}
        >
          ✏️
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDeleteTeam && onDeleteTeam(team)}
          style={{ color: '#DC2626' }}
        >
          🗑️
        </Button>
      </div>
    </div>
  );
}

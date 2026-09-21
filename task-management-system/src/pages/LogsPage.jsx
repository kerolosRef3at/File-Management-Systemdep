import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { translations, formatDateTime } from '../utils/constants';
import { PageHeader, FilterBar, Select, Button, Badge, Spinner, DateRangePicker } from '../components/shared';
import LogDetailsModal from '../components/pages/logs/LogDetailsModal';
import { getActionBadgeVariant, getActionLabel, getEntityLabel, resolveEntityDisplay } from '../utils/logHelpers';
import logService from '../services/logService';
import userService from '../services/userService';
import teamService from '../services/teamService';
import ticketService from '../services/ticketService';

const PAGE_SIZE = 50;

// ═══════════════════════════════════════════════════════════════════════════
// Design tokens
// ═══════════════════════════════════════════════════════════════════════════
const T = {
  ink: '#0F172A',
  inkSoft: '#334155',
  muted: '#64748B',
  mutedSoft: '#94A3B8',
  border: '#E8EDF5',
  borderSoft: '#F1F5F9',
  surface: '#FFFFFF',
  surfaceAlt: '#F8FAFC',
  brand: '#0E2E63',
  brandLight: '#1565C0',
  brandSoft: '#EFF6FF',
  shadowSm: '0 1px 3px rgba(15,35,80,0.05), 0 1px 2px rgba(15,35,80,0.03)',
  shadowMd: '0 8px 24px rgba(15,35,80,0.08), 0 2px 6px rgba(15,35,80,0.04)',
  shadowLg: '0 20px 50px rgba(15,35,80,0.10), 0 4px 12px rgba(15,35,80,0.05)',
  radius: '14px',
  radiusSm: '10px',
};

// ═══════════════════════════════════════════════════════════════════════════
// Main page
// ═══════════════════════════════════════════════════════════════════════════
export default function LogsPage({ lang = 'ar' }) {
  const t = translations[lang] || translations.ar;
  const isRtl = lang === 'ar';

  const [logs, setLogs] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [selectedLogId, setSelectedLogId] = useState(null);

  const [viewMode, setViewMode] = useState(() => {
    try {
      const saved = localStorage.getItem('logsViewMode');
      if (saved && ['feed', 'table', 'grouped'].includes(saved)) return saved;
    } catch { /* ignore */ }
    return 'feed';
  });

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    try { localStorage.setItem('logsViewMode', mode); } catch { /* ignore */ }
  };

  const [lookups, setLookups] = useState({ users: new Map(), teams: new Map(), tickets: new Map() });

  useEffect(() => {
    Promise.all([
      userService.getAllUsers().catch(() => []),
      teamService.getAllTeams().catch(() => []),
      ticketService.getAllTickets().catch(() => []),
    ]).then(([users, teams, tickets]) => {
      setLookups({
        users: new Map((users || []).map((u) => [String(u.id), u.fullName || u.name])),
        teams: new Map((teams || []).map((tm) => [String(tm.id), tm.name])),
        tickets: new Map((tickets || []).map((tk) => [String(tk.id), tk.title])),
      });
    });
  }, []);

  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadLogs = useCallback(
    async (skip = 0, append = false) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);
      try {
        const res = await logService.getLogs({
          action: actionFilter || undefined,
          entityName: entityFilter || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          skip,
          limit: PAGE_SIZE,
        });
        const newLogs = Array.isArray(res?.logs) ? res.logs : Array.isArray(res) ? res : [];
        setTotalCount(res?.totalCount ?? newLogs.length);
        setLogs((prev) => (append ? [...prev, ...newLogs] : newLogs));
      } catch (err) {
        setError(err.message || t.errorOccurred);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [actionFilter, entityFilter, startDate, endDate, t.errorOccurred]
  );

  useEffect(() => {
    loadLogs(0, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionFilter, entityFilter, startDate, endDate]);

  const resetFilters = () => {
    setActionFilter('');
    setEntityFilter('');
    setStartDate('');
    setEndDate('');
  };

  const hasFilters = actionFilter || entityFilter || startDate || endDate;
  const canLoadMore = logs.length < totalCount;

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);
    let todayCount = 0;
    let weekCount = 0;
    for (const l of logs) {
      const d = new Date(l.createdAt);
      if (d >= today) todayCount++;
      if (d >= weekAgo) weekCount++;
    }
    return { todayCount, weekCount };
  }, [logs]);

  return (
    <div style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
      <PageHeader
        title={t.logsTitle}
        subtitle={t.logsSubtitle}
        badge={
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '999px',
              background: T.brandSoft,
              color: T.brand,
              fontSize: '12px',
              fontWeight: '800',
              border: `1px solid #DBEAFE`,
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: T.brandLight }} />
            {totalCount} {t.totalLogsCount}
          </span>
        }
        actions={<ViewSwitcher viewMode={viewMode} onChange={handleViewModeChange} lang={lang} />}
      />

      {/* Quick stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          marginBottom: '18px',
        }}
      >
        <StatCard icon="📊" label={lang === 'ar' ? 'إجمالي الأحداث' : 'Total Events'} value={totalCount} tint="blue" />
        <StatCard icon="🕐" label={lang === 'ar' ? 'اليوم' : 'Today'} value={stats.todayCount} tint="green" />
        <StatCard icon="📅" label={lang === 'ar' ? 'آخر 7 أيام' : 'Last 7 days'} value={stats.weekCount} tint="amber" />
        <StatCard icon="📥" label={lang === 'ar' ? 'المحمّلة الآن' : 'Currently Loaded'} value={logs.length} tint="gray" />
      </div>

      {/* Filters */}
      <FilterBar>
        <div style={{ width: '180px' }}>
          <Select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            placeholder={t.filterByAction}
            options={[
              { value: '', label: t.all },
              { value: 'Login', label: t.actionLogin },
              { value: 'Create', label: t.actionCreate },
              { value: 'Update', label: t.actionUpdate },
              { value: 'Delete', label: t.actionDelete },
              { value: 'StatusChange', label: t.actionStatusChange },
              { value: 'Approve', label: t.actionApprove },
            ]}
          />
        </div>

        <div style={{ width: '200px' }} title={t.entityFilterHint}>
          <Select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            placeholder={t.filterByEntity}
            options={[
              { value: '', label: t.all },
              { value: 'User', label: t.entityUser },
              { value: 'Team', label: t.entityTeam },
              { value: 'TeamMember', label: t.entityTeamMember },
              { value: 'Ticket', label: t.entityTicket },
              { value: 'TicketTask', label: t.entityTicketTask },
              { value: 'UserRate', label: t.entityUserRate },
            ]}
          />
        </div>

        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onChange={({ start, end }) => {
            setStartDate(start);
            setEndDate(end);
          }}
          lang={lang}
          placeholder={t.dateRangeLabel}
        />

        {hasFilters && (
          <Button variant="ghost" size="md" onClick={resetFilters}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span>↺</span>
              <span>{t.reset}</span>
            </span>
          </Button>
        )}
      </FilterBar>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginTop: '-6px',
          marginBottom: '16px',
          fontSize: '11.5px',
          color: T.mutedSoft,
        }}
      >
        <span>ℹ️</span>
        <span>{t.entityFilterHint}</span>
      </div>

      {/* Content */}
      {error ? (
        <ErrorState error={error} onRetry={() => loadLogs(0, false)} retryLabel={t.retry} />
      ) : loading ? (
        <LogsSkeleton viewMode={viewMode} />
      ) : logs.length === 0 ? (
        <EmptyState
          icon="🔍"
          title={t.noLogsFound}
          subtitle={lang === 'ar'
            ? 'جرّب تعديل الفلاتر أو مسحها لعرض المزيد من النتائج.'
            : 'Try adjusting the filters or clearing them to see more results.'}
          action={hasFilters ? { label: t.reset, onClick: resetFilters } : null}
        />
      ) : (
        <>
          {viewMode === 'table' ? (
            <LogsTableView logs={logs} lang={lang} t={t} lookups={lookups} onRowClick={setSelectedLogId} />
          ) : viewMode === 'grouped' ? (
            <LogsGroupedView logs={logs} lang={lang} t={t} lookups={lookups} onRowClick={setSelectedLogId} />
          ) : (
            <LogsFeedView logs={logs} lang={lang} t={t} lookups={lookups} onRowClick={setSelectedLogId} />
          )}

          {canLoadMore && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '24px', gap: '10px' }}>
              <div style={{ fontSize: '12px', color: T.mutedSoft, fontWeight: '600' }}>
                {lang === 'ar' ? `${logs.length} من ${totalCount}` : `${logs.length} of ${totalCount}`}
              </div>
              <div
                style={{
                  width: '180px',
                  height: '4px',
                  background: T.borderSoft,
                  borderRadius: '999px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${Math.min(100, (logs.length / Math.max(1, totalCount)) * 100)}%`,
                    height: '100%',
                    background: `linear-gradient(90deg, ${T.brandLight}, ${T.brand})`,
                    borderRadius: '999px',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
              <Button variant="secondary" onClick={() => loadLogs(logs.length, true)} loading={loadingMore}>
                {loadingMore ? t.loadingMore : t.loadMore}
              </Button>
            </div>
          )}
        </>
      )}

      {selectedLogId && (
        <LogDetailsModal
          logId={selectedLogId}
          onClose={() => setSelectedLogId(null)}
          lang={lang}
          lookups={lookups}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Layout components
// ═══════════════════════════════════════════════════════════════════════════
function ViewSwitcher({ viewMode, onChange, lang }) {
  const items = [
    { id: 'feed', icon: '🗞️', label: lang === 'ar' ? 'سجل نشاط' : 'Feed' },
    { id: 'table', icon: '📋', label: lang === 'ar' ? 'جدول' : 'Table' },
    { id: 'grouped', icon: '📅', label: lang === 'ar' ? 'مجمعة' : 'Grouped' },
  ];
  return (
    <div
      style={{
        display: 'inline-flex',
        background: T.surfaceAlt,
        padding: '4px',
        borderRadius: '12px',
        border: `1px solid ${T.border}`,
        gap: '2px',
        boxShadow: T.shadowSm,
      }}
    >
      {items.map((vm) => {
        const isActive = viewMode === vm.id;
        return (
          <button
            key={vm.id}
            onClick={() => onChange(vm.id)}
            title={vm.label}
            style={{
              border: 'none',
              padding: '7px 12px',
              borderRadius: '9px',
              fontSize: '12.5px',
              fontWeight: isActive ? '800' : '600',
              background: isActive ? T.surface : 'transparent',
              color: isActive ? T.brandLight : T.muted,
              cursor: 'pointer',
              boxShadow: isActive ? '0 1px 4px rgba(15,35,80,0.08)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
              fontFamily: 'Cairo, sans-serif',
            }}
          >
            <span style={{ fontSize: '14px' }}>{vm.icon}</span>
            <span>{vm.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function StatCard({ icon, label, value, tint = 'blue' }) {
  const tints = {
    blue: { bg: '#EFF6FF', color: '#1565C0', border: '#DBEAFE' },
    green: { bg: '#F0FDF4', color: '#166534', border: '#BBF7D0' },
    amber: { bg: '#FFFBEB', color: '#B45309', border: '#FDE68A' },
    gray: { bg: '#F8FAFC', color: '#475569', border: '#E2E8F0' },
  };
  const c = tints[tint] || tints.blue;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '14px 16px',
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: T.radius,
        boxShadow: T.shadowSm,
      }}
    >
      <div
        style={{
          width: '42px',
          height: '42px',
          borderRadius: '12px',
          background: c.bg,
          border: `1px solid ${c.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '11.5px', color: T.muted, fontWeight: '700', lineHeight: 1.3 }}>{label}</div>
        <div style={{ fontSize: '22px', fontWeight: '800', color: c.color, lineHeight: 1.15, marginTop: '2px' }}>
          {value}
        </div>
      </div>
    </div>
  );
}

function LogsSkeleton({ viewMode }) {
  const rows = viewMode === 'table' ? 8 : 6;
  return (
    <div
      style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: T.radius,
        overflow: 'hidden',
        boxShadow: T.shadowSm,
      }}
    >
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            padding: '16px 18px',
            borderTop: i === 0 ? 'none' : `1px solid ${T.borderSoft}`,
          }}
        >
          <div className="lp-skel" style={{ width: '38px', height: '38px', borderRadius: '50%' }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="lp-skel" style={{ height: '12px', width: '40%', borderRadius: '6px' }} />
            <div className="lp-skel" style={{ height: '10px', width: '60%', borderRadius: '6px' }} />
          </div>
          <div className="lp-skel" style={{ height: '10px', width: '80px', borderRadius: '6px' }} />
        </div>
      ))}
      <style>{`
        .lp-skel {
          background: linear-gradient(90deg, #F1F5F9 0%, #E2E8F0 50%, #F1F5F9 100%);
          background-size: 200% 100%;
          animation: lpShimmer 1.4s ease-in-out infinite;
        }
        @keyframes lpShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

function EmptyState({ icon, title, subtitle, action }) {
  return (
    <div
      style={{
        padding: '60px 20px',
        textAlign: 'center',
        background: T.surface,
        borderRadius: T.radius,
        border: `1px dashed ${T.border}`,
        boxShadow: T.shadowSm,
      }}
    >
      <div
        style={{
          width: '72px',
          height: '72px',
          margin: '0 auto 16px',
          borderRadius: '50%',
          background: T.brandSoft,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '32px',
        }}
      >
        {icon}
      </div>
      <div style={{ fontSize: '16px', fontWeight: '800', color: T.ink, marginBottom: '6px' }}>{title}</div>
      {subtitle && (
        <div style={{ fontSize: '13px', color: T.muted, maxWidth: '360px', margin: '0 auto 18px', lineHeight: 1.6 }}>
          {subtitle}
        </div>
      )}
      {action && (
        <Button variant="secondary" size="md" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

function ErrorState({ error, onRetry, retryLabel }) {
  return (
    <div
      style={{
        padding: '40px 24px',
        textAlign: 'center',
        background: 'linear-gradient(180deg, #FEF2F2 0%, #FFFFFF 100%)',
        borderRadius: T.radius,
        border: '1px solid #FCA5A5',
        boxShadow: T.shadowSm,
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          margin: '0 auto 12px',
          borderRadius: '50%',
          background: '#FEE2E2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
        }}
      >
        ⚠️
      </div>
      <div style={{ fontSize: '15px', color: '#B91C1C', fontWeight: '800', marginBottom: '16px' }}>{error}</div>
      <Button variant="secondary" size="md" onClick={onRetry}>
        {retryLabel}
      </Button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// View #1: Feed (with day headers, timeline rail, initials, copy-ID)
// ═══════════════════════════════════════════════════════════════════════════
function LogsFeedView({ logs, lang, t, lookups, onRowClick }) {
  // Group rows by calendar day for inline day headers
  const items = [];
  let lastDayKey = null;
  for (const row of logs) {
    const d = new Date(row.createdAt);
    const dayKey = d.toDateString();
    if (dayKey !== lastDayKey) {
      items.push({ type: 'day', key: `day-${dayKey}`, date: d });
      lastDayKey = dayKey;
    }
    items.push({ type: 'row', key: row.id, row });
  }

  return (
    <div
      style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: T.radius,
        overflow: 'hidden',
        boxShadow: T.shadowSm,
      }}
    >
      {/* Header strip */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px',
          background: T.surfaceAlt,
          borderBottom: `1px solid ${T.border}`,
          fontSize: '11.5px',
          color: T.muted,
          fontWeight: '700',
          letterSpacing: '0.3px',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#22C55E',
              boxShadow: '0 0 0 3px rgba(34,197,94,0.18)',
            }}
          />
          <span>{lang === 'ar' ? 'آخر الأحداث' : 'Latest Activity'}</span>
        </span>
        <span style={{ opacity: 0.75 }}>
          {lang === 'ar' ? `${logs.length} حدث` : `${logs.length} event${logs.length === 1 ? '' : 's'}`}
        </span>
      </div>

      {/* Timeline body */}
      <div style={{ position: 'relative' }}>
        {/* Vertical rail */}
        <div
          style={{
            position: 'absolute',
            insetInlineStart: '39px',
            top: '26px',
            bottom: '26px',
            width: '2px',
            background: `linear-gradient(180deg, ${T.border} 0%, ${T.borderSoft} 100%)`,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        {items.map((item, idx) => {
          if (item.type === 'day') {
            return <DayHeaderRow key={item.key} date={item.date} lang={lang} isFirst={idx === 0} />;
          }
          return (
            <LogRow
              key={item.key}
              row={item.row}
              lang={lang}
              t={t}
              lookups={lookups}
              onRowClick={onRowClick}
            />
          );
        })}
      </div>
    </div>
  );
}

function DayHeaderRow({ date, lang, isFirst }) {
  const label = date.toLocaleDateString(
    lang === 'ar' ? 'ar-EG' : 'en-GB',
    { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  );
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const isToday = d.getTime() === today.getTime();
  const isYesterday = d.getTime() === today.getTime() - 86400000;

  let prettyLabel = label;
  if (isToday) prettyLabel = lang === 'ar' ? 'اليوم' : 'Today';
  else if (isYesterday) prettyLabel = lang === 'ar' ? 'أمس' : 'Yesterday';

  return (
    <div
      style={{
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: isFirst ? '16px 20px 8px' : '22px 20px 8px',
        background: T.surface,
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 12px',
          background: T.brandSoft,
          border: '1px solid #DBEAFE',
          borderRadius: '999px',
          fontSize: '11.5px',
          fontWeight: '800',
          color: T.brand,
          letterSpacing: '0.3px',
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ fontSize: '11px' }}>📅</span>
        <span>{prettyLabel}</span>
      </span>
      <div style={{ flex: 1, height: '1px', background: `linear-gradient(90deg, ${T.border}, transparent)` }} />
    </div>
  );
}

function LogRow({ row, lang, t, lookups, onRowClick }) {
  const isRtl = lang === 'ar';
  const bubble = actionBubble(getActionBadgeVariant(row.action));
  const [copied, setCopied] = useState(false);

  const initials = (row.userFullName || t.systemUser || '?')
    .toString()
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p.charAt(0))
    .join('')
    .toUpperCase();

  const entityDisplay = resolveEntityDisplay(row.entityName, row.entityId, lookups, t);

  const handleCopyId = (e) => {
    e.stopPropagation();
    try {
      navigator.clipboard.writeText(String(row.id));
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch { /* ignore */ }
  };

  const timeLabel = new Date(row.createdAt).toLocaleTimeString(
    lang === 'ar' ? 'ar-EG' : 'en-GB',
    { hour: '2-digit', minute: '2-digit' }
  );

  return (
    <div
      onClick={() => onRowClick(row.id)}
      style={{
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        padding: '12px 20px',
        cursor: 'pointer',
        transition: 'background 0.15s, box-shadow 0.15s',
        flexWrap: 'wrap',
        background: 'transparent',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = T.brandSoft;
        e.currentTarget.style.boxShadow = `inset 3px 0 0 ${bubble.accent}`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div
        style={{
          flexShrink: 0,
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: bubble.bg,
          border: `2px solid ${bubble.ring}`,
          boxShadow: `0 0 0 4px ${T.surface}`,
          position: 'relative',
          zIndex: 2,
        }}
      >
        <span style={{ fontSize: '17px' }}>{actionEmoji(row.action)}</span>
      </div>

      <div style={{ flex: '1 1 340px', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span
            style={{
              flexShrink: 0,
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '9.5px',
              fontWeight: '800',
              color: T.brand,
              background: T.brandSoft,
              border: '1px solid #DBEAFE',
              letterSpacing: '0.3px',
            }}
          >
            {initials || '?'}
          </span>
          <span
            style={{
              fontSize: '13.5px',
              fontWeight: '800',
              color: T.ink,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '200px',
            }}
            title={row.userFullName || t.systemUser}
          >
            {row.userFullName || t.systemUser}
          </span>
          <Badge variant={getActionBadgeVariant(row.action)} size="sm">
            {getActionLabel(row.action, t)}
          </Badge>
          <button
            onClick={handleCopyId}
            title={copied ? 'Copied!' : `ID: ${row.id}`}
            style={{
              background: copied ? '#DCFCE7' : 'transparent',
              border: `1px solid ${copied ? '#BBF7D0' : T.border}`,
              color: copied ? '#166534' : T.mutedSoft,
              fontSize: '10.5px',
              fontWeight: '700',
              padding: '2px 8px',
              borderRadius: '999px',
              cursor: 'pointer',
              fontFamily: 'monospace',
              transition: 'all 0.15s',
              opacity: 0.9,
            }}
          >
            {copied ? '✓ copied' : `#${row.id}`}
          </button>
        </div>
        <div style={{ fontSize: '12.5px', color: T.muted, marginTop: '5px', lineHeight: 1.5 }}>
          <span style={{ color: T.mutedSoft, fontWeight: '600' }}>
            {getEntityLabel(row.entityName, t)}:{' '}
          </span>
          <span style={{ color: T.inkSoft, fontWeight: '600' }} title={entityDisplay}>
            {entityDisplay}
          </span>
        </div>
      </div>

      <div style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
        <span
          style={{
            fontSize: '11.5px',
            color: T.mutedSoft,
            whiteSpace: 'nowrap',
            fontWeight: '700',
            fontFamily: 'monospace',
            letterSpacing: '0.3px',
          }}
        >
          {timeLabel}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRowClick(row.id);
          }}
          title={t.viewDetails}
          aria-label={t.viewDetails}
          style={{
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            border: `1px solid ${T.border}`,
            background: T.surface,
            color: T.brandLight,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '13px',
            transition: 'all 0.15s',
            fontFamily: 'Cairo, sans-serif',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = T.brandSoft;
            e.currentTarget.style.borderColor = '#BFDBFE';
            e.currentTarget.style.transform = isRtl ? 'translateX(-2px)' : 'translateX(2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = T.surface;
            e.currentTarget.style.borderColor = T.border;
            e.currentTarget.style.transform = 'translateX(0)';
          }}
        >
          {isRtl ? '←' : '→'}
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// View #2: Table (sortable, zebra, avatars, sticky header)
// ═══════════════════════════════════════════════════════════════════════════
function LogsTableView({ logs, lang, t, lookups, onRowClick }) {
  const isRtl = lang === 'ar';

  const [sortKey, setSortKey] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'createdAt' ? 'desc' : 'asc');
    }
  };

  const sortedLogs = useMemo(() => {
    const arr = [...logs];
    const dir = sortDir === 'asc' ? 1 : -1;

    const getValue = (row) => {
      switch (sortKey) {
        case 'user':
          return (row.userFullName || t.systemUser || '').toString().toLowerCase();
        case 'action':
          return (getActionLabel(row.action, t) || '').toString().toLowerCase();
        case 'entity':
          return (
            (getEntityLabel(row.entityName, t) || '') + ' ' +
            (resolveEntityDisplay(row.entityName, row.entityId, lookups, t) || '')
          ).toString().toLowerCase();
        case 'createdAt':
        default:
          return new Date(row.createdAt).getTime() || 0;
      }
    };

    return arr.sort((a, b) => {
      const va = getValue(a);
      const vb = getValue(b);
      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });
  }, [logs, sortKey, sortDir, lookups, t]);

  const headerBase = {
    position: 'sticky',
    top: 0,
    zIndex: 2,
    padding: '13px 16px',
    fontSize: '11px',
    fontWeight: '800',
    color: T.muted,
    textAlign: 'start',
    background: T.surfaceAlt,
    borderBottom: `1.5px solid ${T.border}`,
    whiteSpace: 'nowrap',
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
    userSelect: 'none',
  };

  const headerButton = (key) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
    color: sortKey === key ? T.brandLight : T.muted,
    fontWeight: '800',
    transition: 'color 0.15s',
  });

  const td = {
    padding: '12px 16px',
    fontSize: '12.5px',
    color: T.inkSoft,
    borderBottom: `1px solid ${T.borderSoft}`,
    verticalAlign: 'middle',
  };

  const sortArrow = (key) => {
    if (sortKey !== key) {
      return <span style={{ opacity: 0.35, fontSize: '10px' }}>↕</span>;
    }
    return (
      <span style={{ color: T.brandLight, fontSize: '10px', fontWeight: '900' }}>
        {sortDir === 'asc' ? '▲' : '▼'}
      </span>
    );
  };

  return (
    <div
      style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: T.radius,
        overflow: 'hidden',
        boxShadow: T.shadowSm,
      }}
    >
      <div style={{ overflowX: 'auto', overflowY: 'visible' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            <tr>
              <th style={{ ...headerBase, width: '48px', textAlign: 'center', color: T.mutedSoft }}>#</th>

              <th style={headerBase}>
                <span
                  style={headerButton('user')}
                  onClick={() => handleSort('user')}
                  onMouseEnter={(e) => (e.currentTarget.style.color = T.brandLight)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = sortKey === 'user' ? T.brandLight : T.muted)}
                >
                  <span style={{ fontSize: '12px' }}>👤</span>
                  <span>{t.responsibleUser}</span>
                  {sortArrow('user')}
                </span>
              </th>

              <th style={headerBase}>
                <span
                  style={headerButton('action')}
                  onClick={() => handleSort('action')}
                  onMouseEnter={(e) => (e.currentTarget.style.color = T.brandLight)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = sortKey === 'action' ? T.brandLight : T.muted)}
                >
                  <span style={{ fontSize: '12px' }}>⚡</span>
                  <span>{t.filterByAction}</span>
                  {sortArrow('action')}
                </span>
              </th>

              <th style={headerBase}>
                <span
                  style={headerButton('entity')}
                  onClick={() => handleSort('entity')}
                  onMouseEnter={(e) => (e.currentTarget.style.color = T.brandLight)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = sortKey === 'entity' ? T.brandLight : T.muted)}
                >
                  <span style={{ fontSize: '12px' }}>🎯</span>
                  <span>{t.affectedEntity}</span>
                  {sortArrow('entity')}
                </span>
              </th>

              <th style={headerBase}>
                <span
                  style={headerButton('createdAt')}
                  onClick={() => handleSort('createdAt')}
                  onMouseEnter={(e) => (e.currentTarget.style.color = T.brandLight)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = sortKey === 'createdAt' ? T.brandLight : T.muted)}
                >
                  <span style={{ fontSize: '12px' }}>🕐</span>
                  <span>{t.timestamp}</span>
                  {sortArrow('createdAt')}
                </span>
              </th>

              <th style={{ ...headerBase, width: '90px', textAlign: 'end' }}></th>
            </tr>
          </thead>
          <tbody>
            {sortedLogs.map((row, idx) => {
              const isEven = idx % 2 === 0;
              const initials = (row.userFullName || t.systemUser || '?')
                .toString()
                .trim()
                .split(/\s+/)
                .slice(0, 2)
                .map((p) => p.charAt(0))
                .join('')
                .toUpperCase();

              const entityDisplay = resolveEntityDisplay(row.entityName, row.entityId, lookups, t);

              return (
                <tr
                  key={row.id}
                  onClick={() => onRowClick(row.id)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onRowClick(row.id);
                    }
                  }}
                  style={{
                    cursor: 'pointer',
                    background: isEven ? T.surface : '#FCFDFE',
                    transition: 'background 0.15s, box-shadow 0.15s',
                    outline: 'none',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = T.brandSoft;
                    e.currentTarget.style.boxShadow = 'inset 3px 0 0 ' + T.brandLight;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = isEven ? T.surface : '#FCFDFE';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.background = T.brandSoft;
                    e.currentTarget.style.boxShadow = 'inset 3px 0 0 ' + T.brandLight;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.background = isEven ? T.surface : '#FCFDFE';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <td
                    style={{
                      ...td,
                      textAlign: 'center',
                      color: T.mutedSoft,
                      fontWeight: '700',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                    }}
                  >
                    {idx + 1}
                  </td>

                  <td style={td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span
                        style={{
                          flexShrink: 0,
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10.5px',
                          fontWeight: '800',
                          color: T.brand,
                          background: T.brandSoft,
                          border: '1px solid #DBEAFE',
                          letterSpacing: '0.3px',
                        }}
                      >
                        {initials || '?'}
                      </span>
                      <span
                        style={{
                          fontWeight: '700',
                          color: T.ink,
                          fontSize: '12.5px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '180px',
                        }}
                        title={row.userFullName || t.systemUser}
                      >
                        {row.userFullName || t.systemUser}
                      </span>
                    </div>
                  </td>

                  <td style={td}>
                    <Badge variant={getActionBadgeVariant(row.action)} size="sm">
                      {getActionLabel(row.action, t)}
                    </Badge>
                  </td>

                  <td style={td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                      <span style={{ color: T.mutedSoft, fontWeight: '600', fontSize: '12px', flexShrink: 0 }}>
                        {getEntityLabel(row.entityName, t)}:
                      </span>
                      <span
                        style={{
                          color: T.inkSoft,
                          fontWeight: '600',
                          fontSize: '12.5px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '220px',
                        }}
                        title={entityDisplay}
                      >
                        {entityDisplay}
                      </span>
                    </div>
                  </td>

                  <td
                    style={{
                      ...td,
                      whiteSpace: 'nowrap',
                      color: T.mutedSoft,
                      fontWeight: '600',
                      fontSize: '11.5px',
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '11px', opacity: 0.7 }}>🕐</span>
                      {formatDateTime(row.createdAt, lang)}
                    </span>
                  </td>

                  <td style={{ ...td, textAlign: 'end' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRowClick(row.id);
                      }}
                      title={t.viewDetails}
                      aria-label={t.viewDetails}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        border: `1px solid ${T.border}`,
                        background: T.surface,
                        color: T.brandLight,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        transition: 'all 0.15s',
                        fontFamily: 'Cairo, sans-serif',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = T.brandSoft;
                        e.currentTarget.style.borderColor = '#BFDBFE';
                        e.currentTarget.style.transform = isRtl ? 'translateX(-2px)' : 'translateX(2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = T.surface;
                        e.currentTarget.style.borderColor = T.border;
                        e.currentTarget.style.transform = 'translateX(0)';
                      }}
                    >
                      {isRtl ? '←' : '→'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 18px',
          borderTop: `1px solid ${T.border}`,
          background: T.surfaceAlt,
          fontSize: '11.5px',
          color: T.muted,
          fontWeight: '600',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#22C55E',
              boxShadow: '0 0 0 3px rgba(34,197,94,0.2)',
            }}
          />
          <span>
            {lang === 'ar'
              ? `عرض ${sortedLogs.length} سجل`
              : `Showing ${sortedLogs.length} record${sortedLogs.length === 1 ? '' : 's'}`}
          </span>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', opacity: 0.85 }}>
          <span>↕</span>
          <span>{lang === 'ar' ? 'اضغط على العمود للترتيب' : 'Click a column to sort'}</span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// View #3: Grouped by Day (collapsible, summary chips, timeline rails)
// ═══════════════════════════════════════════════════════════════════════════
function LogsGroupedView({ logs, lang, t, lookups, onRowClick }) {
  const isRtl = lang === 'ar';
  const [collapsed, setCollapsed] = useState({});

  const toggleDay = (dayKey) => {
    setCollapsed((prev) => ({ ...prev, [dayKey]: !prev[dayKey] }));
  };

  const groups = [];
  const byDay = new Map();
  for (const row of logs) {
    const dayKey = new Date(row.createdAt).toDateString();
    if (!byDay.has(dayKey)) {
      byDay.set(dayKey, []);
      groups.push(dayKey);
    }
    byDay.get(dayKey).push(row);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {groups.map((dayKey) => {
        const dayLogs = byDay.get(dayKey);
        const dateObj = new Date(dayLogs[0].createdAt);
        const isCollapsed = !!collapsed[dayKey];

        const actionCounts = {};
        for (const r of dayLogs) {
          const emoji = actionEmoji(r.action);
          actionCounts[emoji] = (actionCounts[emoji] || 0) + 1;
        }

        const dayLabel = dateObj.toLocaleDateString(
          lang === 'ar' ? 'ar-EG' : 'en-GB',
          { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
        );

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const d = new Date(dateObj);
        d.setHours(0, 0, 0, 0);
        const isToday = d.getTime() === today.getTime();
        const isYesterday = d.getTime() === today.getTime() - 86400000;

        let prettyDate = dayLabel;
        if (isToday) prettyDate = lang === 'ar' ? 'اليوم' : 'Today';
        else if (isYesterday) prettyDate = lang === 'ar' ? 'أمس' : 'Yesterday';

        return (
          <div key={dayKey}>
            {/* Day header */}
            <button
              onClick={() => toggleDay(dayKey)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '10px 14px',
                background: T.surfaceAlt,
                border: `1px solid ${T.border}`,
                borderRadius: T.radius,
                cursor: 'pointer',
                textAlign: 'start',
                fontFamily: 'Cairo, sans-serif',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#EEF4FB')}
              onMouseLeave={(e) => (e.currentTarget.style.background = T.surfaceAlt)}
            >
              <span
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  background: T.brandSoft,
                  border: '1px solid #DBEAFE',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '15px',
                  flexShrink: 0,
                }}
              >
                📅
              </span>

              <span style={{ fontSize: '14px', fontWeight: '800', color: T.ink }}>{prettyDate}</span>

              {prettyDate !== dayLabel && (
                <span style={{ fontSize: '11.5px', color: T.muted, fontWeight: '600' }}>· {dayLabel}</span>
              )}

              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                {Object.entries(actionCounts).map(([emoji, count]) => (
                  <span
                    key={emoji}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '2px 9px',
                      fontSize: '11px',
                      fontWeight: '800',
                      background: T.surface,
                      border: `1px solid ${T.border}`,
                      borderRadius: '999px',
                      color: T.inkSoft,
                    }}
                  >
                    <span>{emoji}</span>
                    <span>{count}</span>
                  </span>
                ))}
              </span>

              <span style={{ flex: 1 }} />

              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '11.5px',
                  color: T.brand,
                  fontWeight: '800',
                  padding: '3px 10px',
                  background: T.brandSoft,
                  borderRadius: '999px',
                  border: '1px solid #DBEAFE',
                  whiteSpace: 'nowrap',
                }}
              >
                <span>
                  {dayLogs.length} {lang === 'ar' ? 'عملية' : 'event(s)'}
                </span>
              </span>

              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: T.surface,
                  border: `1px solid ${T.border}`,
                  fontSize: '11px',
                  color: T.muted,
                  transition: 'transform 0.2s',
                  transform: isCollapsed ? (isRtl ? 'rotate(90deg)' : 'rotate(-90deg)') : 'rotate(0)',
                }}
              >
                ▾
              </span>
            </button>

            {/* Day body */}
            {!isCollapsed && (
              <div
                style={{
                  marginTop: '8px',
                  background: T.surface,
                  border: `1px solid ${T.border}`,
                  borderRadius: T.radius,
                  overflow: 'hidden',
                  boxShadow: T.shadowSm,
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    insetInlineStart: '29px',
                    top: '18px',
                    bottom: '18px',
                    width: '2px',
                    background: `linear-gradient(180deg, ${T.borderSoft} 0%, ${T.border} 100%)`,
                    pointerEvents: 'none',
                  }}
                />

                {dayLogs.map((row, idx) => (
                  <GroupedLogRow
                    key={row.id}
                    row={row}
                    idx={idx}
                    lang={lang}
                    t={t}
                    lookups={lookups}
                    onRowClick={onRowClick}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function GroupedLogRow({ row, idx, lang, t, lookups, onRowClick }) {
  const isRtl = lang === 'ar';
  const bubble = actionBubble(getActionBadgeVariant(row.action));
  const timeLabel = new Date(row.createdAt).toLocaleTimeString(
    lang === 'ar' ? 'ar-EG' : 'en-GB',
    { hour: '2-digit', minute: '2-digit' }
  );
  const entityDisplay = resolveEntityDisplay(row.entityName, row.entityId, lookups, t);

  return (
    <div
      onClick={() => onRowClick(row.id)}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '11px 18px',
        borderTop: idx === 0 ? 'none' : `1px solid ${T.borderSoft}`,
        cursor: 'pointer',
        transition: 'background 0.12s, box-shadow 0.12s',
        flexWrap: 'wrap',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = T.brandSoft;
        e.currentTarget.style.boxShadow = `inset 3px 0 0 ${bubble.accent}`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <span
        style={{
          flexShrink: 0,
          width: '52px',
          fontSize: '11.5px',
          color: T.mutedSoft,
          fontWeight: '700',
          fontFamily: 'monospace',
          letterSpacing: '0.3px',
        }}
      >
        {timeLabel}
      </span>

      <span
        style={{
          flexShrink: 0,
          width: '26px',
          height: '26px',
          borderRadius: '50%',
          background: bubble.bg,
          border: `2px solid ${bubble.ring}`,
          boxShadow: `0 0 0 4px ${T.surface}`,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {actionEmoji(row.action)}
      </span>

      <Badge variant={getActionBadgeVariant(row.action)} size="sm">
        {getActionLabel(row.action, t)}
      </Badge>

      <span
        style={{
          fontSize: '12.5px',
          fontWeight: '800',
          color: T.ink,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '180px',
        }}
        title={row.userFullName || t.systemUser}
      >
        {row.userFullName || t.systemUser}
      </span>

      <span
        style={{
          fontSize: '12px',
          color: T.muted,
          flex: 1,
          minWidth: 0,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
        title={entityDisplay}
      >
        <span style={{ color: T.mutedSoft, fontWeight: '600' }}>
          {getEntityLabel(row.entityName, t)}:{' '}
        </span>
        {entityDisplay}
      </span>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onRowClick(row.id);
        }}
        title={t.viewDetails}
        aria-label={t.viewDetails}
        style={{
          flexShrink: 0,
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          border: `1px solid ${T.border}`,
          background: T.surface,
          color: T.brandLight,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          transition: 'all 0.15s',
          fontFamily: 'Cairo, sans-serif',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = T.brandSoft;
          e.currentTarget.style.borderColor = '#BFDBFE';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = T.surface;
          e.currentTarget.style.borderColor = T.border;
        }}
      >
        {isRtl ? '←' : '→'}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════════
function actionEmoji(action) {
  const a = (action || '').toLowerCase();
  if (a.includes('login')) return '🔑';
  if (a.includes('delete') || a.includes('reject')) return '🗑️';
  if (a.includes('approve')) return '✅';
  if (a.includes('status')) return '🔄';
  if (a.includes('create') || a.includes('add')) return '➕';
  if (a.includes('update') || a.includes('change') || a.includes('edit')) return '✏️';
  return '📋';
}

function actionBubble(variant) {
  const map = {
    purple: { bg: '#F3E8FF', ring: '#E9D5FF', accent: '#A855F7' },
    red:    { bg: '#FEE2E2', ring: '#FECACA', accent: '#EF4444' },
    green:  { bg: '#DCFCE7', ring: '#BBF7D0', accent: '#22C55E' },
    blue:   { bg: '#DBEAFE', ring: '#BFDBFE', accent: '#3B82F6' },
    amber:  { bg: '#FEF3C7', ring: '#FDE68A', accent: '#F59E0B' },
    gray:   { bg: '#F1F5F9', ring: '#E2E8F0', accent: '#94A3B8' },
  };
  return map[variant] || map.gray;
}
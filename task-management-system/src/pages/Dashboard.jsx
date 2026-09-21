import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import {
  PageHeader,
  StatCard,
  Table,
  Button,
  Modal,
  Avatar,
  Badge,
  Spinner,
} from '../components/shared';
import TicketStatusBadge from '../components/pages/tickets/TicketStatusBadge';
import TicketPriorityBadge from '../components/pages/tickets/TicketPriorityBadge';
import ticketService from '../services/ticketService';
import analysisService from '../services/analysisService';
import teamService from '../services/teamService';
import userService from '../services/userService';

const ROLE_META = {
  admin: { label: 'مدير النظام', labelEn: 'Admin', color: 'purple' },
  manager: { label: 'مدير', labelEn: 'Manager', color: 'blue' },
  member: { label: 'عضو فريق', labelEn: 'Member', color: 'green' },
  agent: { label: 'عضو فريق', labelEn: 'Member', color: 'green' },
};

const PRIORITY_WEIGHT = { critical: 4, urgent: 4, high: 3, medium: 2, low: 1 };

// TicketPriority numeric enum (Plan §1.2) -> TicketPriorityBadge.jsx normalizes
// input itself (normalizeTicketPriority), so lowercase keys are safe here —
// confirmed by reading the component.
const PRIORITY_KEY_BY_ENUM = ['low', 'medium', 'high', 'urgent'];

// TicketStatus numeric enum (Plan §1.2: 0=NotAssigned,1=Pending,2=OnProgress,
// 3=Completed,4=Deleted). TicketStatusBadge.jsx was updated to natively support
// these exact keys, so this is now a direct 1:1 mapping (no approximation).
const STATUS_KEY_BY_ENUM = ['notAssigned', 'pending', 'onProgress', 'completed', 'deleted'];

// Maps a raw /api/tickets record onto the shape this page renders.
// Falls back gracefully field-by-field so partial/unexpected API shapes
// don't crash the page — worst case a field renders as '—' or empty.
function mapApiTicket(t, lang) {
  const priority =
    typeof t.priority === 'number' ? (PRIORITY_KEY_BY_ENUM[t.priority] || 'medium') : (t.priority || 'medium');
  const status =
    typeof t.status === 'number' ? (STATUS_KEY_BY_ENUM[t.status] || 'notAssigned') : (t.status || 'notAssigned');

  return {
    id: t.id != null ? String(t.id) : (t.ticketId != null ? String(t.ticketId) : ''),
    title: t.title || '',
    titleEn: t.titleEn || t.title || '',
    teamId: t.teamId != null ? String(t.teamId) : undefined,
    department: t.teamName || t.team?.name || '',
    departmentEn: t.teamNameEn || t.team?.nameEn || t.teamName || '',
    priority,
    status,
    requester: t.requesterName || t.createdByName || '—',
    assignedTo: t.memberName || t.assignedToName || '—',
    createdAt: t.createdAt
      ? new Date(t.createdAt).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US')
      : (t.deadline || ''),
    createdAtRaw: t.createdAt || null,
    description: t.description || '',
  };
}

// Maps the REAL backend AnalysisResponseDto (TotalTickets, TicketsPending,
// TeamSummaries, HighestRatedMember, etc.) onto the shape this page renders.
function mapApiAnalysis(res) {
  if (!res) return null;
  const toEntry = (u) => (u ? { name: u.fullName, nameEn: u.fullName, rating: u.averageRate } : null);
  return {
    totalTeams: res.totalTeams ?? 0,
    stats: {
      total: res.totalTickets ?? 0,
      notAssigned: res.ticketsNotAssigned ?? 0,
      pending: res.ticketsPending ?? 0,
      inProgress: res.ticketsOnProgress ?? 0,
      completed: res.ticketsCompleted ?? 0,
      critical: res.ticketsCritical ?? 0,
      engineersWorking: res.engineersWorkingCount ?? 0,
      slaCompliance: res.slaCompliancePercentage ?? null,
      completedLast7Days: res.completedLast7Days ?? 0,
      completedTrend: res.completedTrendPercentage ?? null,
    },
    teams: (res.teamSummaries || []).map((ts) => ({
      id: String(ts.teamId),
      name: ts.teamName,
      nameEn: ts.teamName,
      completed: ts.completedTickets ?? 0,
      total: ts.totalTickets ?? 0,
    })),
    leaderboard: {
      topMember: toEntry(res.highestRatedMember),
      topLeader: toEntry(res.highestRatedLeader),
      topManager: toEntry(res.highestRatedManager),
      mostTasks: res.mostTasksDoneMember
        ? { name: res.mostTasksDoneMember.fullName, nameEn: res.mostTasksDoneMember.fullName, count: res.mostTasksDoneMember.tasksDoneCount }
        : null,
    },
  };
}

const selectStyle = {
  padding: '10px 14px',
  fontSize: '13px',
  fontWeight: '700',
  color: '#1E293B',
  background: '#FFFFFF',
  border: '1.5px solid #E2E8F0',
  borderRadius: '12px',
  outline: 'none',
  cursor: 'pointer',
  minWidth: '170px',
  fontFamily: 'Cairo, sans-serif',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};

export default function Dashboard({ lang = 'ar', user, setActivePage }) {
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [selectedManager, setSelectedManager] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Live data from the backend — Dashboard is now fully backend-driven,
  // with no mock/fake fallback data. null = not loaded yet; [] = loaded
  // but empty; an `Error` message string = the request failed.
  const [liveTickets, setLiveTickets] = useState(null);
  const [ticketsError, setTicketsError] = useState(null);

  const [liveAnalysis, setLiveAnalysis] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(true);
  const [analysisError, setAnalysisError] = useState(null);

  const [teamsList, setTeamsList] = useState([]);
  const [managersList, setManagersList] = useState([]);

  const isAdmin = user?.role === 'admin';
  const roleMeta = ROLE_META[user?.role] || ROLE_META.member;

  const currentDate = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, [lang]);

  // Live clock for the welcome banner — ticks every minute.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);
  const currentTime = useMemo(
    () => now.toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' }),
    [now, lang]
  );

  // GET /api/teams and GET /api/users (managers only) — populate the Team /
  // Manager filter dropdowns with real records instead of hardcoded names.
  useEffect(() => {
    teamService
      .getAllTeams()
      .then((res) => {
        const list = Array.isArray(res) ? res : res?.data;
        setTeamsList(Array.isArray(list) ? list : []);
      })
      .catch((err) => console.warn('teamService.getAllTeams failed:', err.message));

    userService
      .getAllUsers()
      .then((res) => {
        const list = Array.isArray(res) ? res : res?.data;
        const managers = (Array.isArray(list) ? list : []).filter(
          (u) => String(u.role).toLowerCase() === 'manager'
        );
        setManagersList(managers);
      })
      .catch((err) => console.warn('userService.getAllUsers failed:', err.message));
  }, []);

  // GET /api/tickets — used for the "Recent & Urgent Tickets" table.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await ticketService.getAllTickets();
        const list = Array.isArray(res) ? res : res?.data;
        if (!cancelled) {
          setLiveTickets(Array.isArray(list) ? list.map((t) => mapApiTicket(t, lang)) : []);
          setTicketsError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setLiveTickets([]);
          setTicketsError(err.message || (lang === 'ar' ? 'تعذّر تحميل التذاكر' : 'Failed to load tickets'));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  // GET /api/analysis?teamId=&managerId= — re-fetched whenever the Team or
  // Manager filter changes, and on manual refresh.
  const fetchAnalysis = useCallback(async () => {
    setAnalysisLoading(true);
    try {
      const res = await analysisService.getAnalysis({
        teamId: selectedTeam === 'all' ? undefined : selectedTeam,
        managerId: selectedManager === 'all' ? undefined : selectedManager,
      });
      setLiveAnalysis(mapApiAnalysis(res));
      setAnalysisError(null);
    } catch (err) {
      setLiveAnalysis(null);
      setAnalysisError(err.message || (lang === 'ar' ? 'تعذّر تحميل الإحصائيات' : 'Failed to load analytics'));
    } finally {
      setAnalysisLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTeam, selectedManager]);

  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAnalysis();
    setIsRefreshing(false);
  };

  // Teams currently "in scope" — comes straight from the backend's own
  // teamId/managerId-scoped analysis response, no client-side mock filtering.
  const scopedTeams = liveAnalysis?.teams || [];
  const scopedTeamIds = useMemo(() => scopedTeams.map((t) => String(t.id)), [scopedTeams]);

  // Aggregate KPI numbers straight from the backend's analysis response.
  const scopedStats = liveAnalysis?.stats || {
    total: 0,
    notAssigned: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    critical: 0,
    engineersWorking: 0,
    slaCompliance: null,
    completedLast7Days: 0,
    completedTrend: null,
  };

  // Leaderboard straight from the backend's analysis response. Entries may
  // individually be null (e.g. no rated managers yet) — LeaderboardCard
  // handles that by showing a "no data yet" placeholder.
  const leaderboard = liveAnalysis?.leaderboard || {};

  // Ticket source: live /api/tickets data only (no mock fallback).
  const ticketsSource = liveTickets || [];

  // Filter by the selected team AND manager scope.
  const filteredTickets = useMemo(() => {
    return ticketsSource.filter((t) => scopedTeamIds.includes(t.teamId));
  }, [ticketsSource, scopedTeamIds]);

  // Top 5 most urgent tickets: sort by priority weight, keep only the 5 highest.
  const urgentTickets = useMemo(() => {
    return [...filteredTickets]
      .sort((a, b) => (PRIORITY_WEIGHT[b.priority] || 0) - (PRIORITY_WEIGHT[a.priority] || 0))
      .slice(0, 5);
  }, [filteredTickets]);

  // Critical/urgent count and SLA compliance now come straight from the
  // backend (computed from real Priority/Deadline/CompletedAt fields on
  // Ticket) and are shown as extra StatCards below — not in a separate
  // duplicate stats stripe.
  const criticalCount = scopedStats.critical;
  const slaText = scopedStats.slaCompliance != null ? `${scopedStats.slaCompliance}%` : (lang === 'ar' ? '—' : 'N/A');

  // Bar chart data: tickets created per day, for the last 7 days — computed
  // client-side from the real ticket list's createdAtRaw timestamps.
  const last7DaysData = useMemo(() => {
    const dayLabelsAr = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
    const dayLabelsEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      days.push(d);
    }
    return days.map((d) => {
      const count = filteredTickets.filter((t) => {
        if (!t.createdAtRaw) return false;
        const td = new Date(t.createdAtRaw);
        return td.toDateString() === d.toDateString();
      }).length;
      return { name: lang === 'ar' ? dayLabelsAr[d.getDay()] : dayLabelsEn[d.getDay()], count };
    });
  }, [filteredTickets, lang]);

  // Donut chart data: current ticket status distribution.
  const statusDistributionData = useMemo(
    () => [
      { name: lang === 'ar' ? 'غير مسندة' : 'Not Assigned', value: scopedStats.notAssigned, color: '#0EA5E9' },
      { name: lang === 'ar' ? 'قيد الانتظار' : 'Pending', value: scopedStats.pending, color: '#F59E0B' },
      { name: lang === 'ar' ? 'قيد التنفيذ' : 'In Progress', value: scopedStats.inProgress, color: '#8B5CF6' },
      { name: lang === 'ar' ? 'مكتملة' : 'Completed', value: scopedStats.completed, color: '#22C55E' },
    ].filter((d) => d.value > 0),
    [scopedStats, lang]
  );

  const columns = [
    {
      key: 'id',
      title: lang === 'ar' ? 'رقم التذكرة' : 'Ticket ID',
      render: (val, row) => (
        <span
          onClick={() => setSelectedTicket(row)}
          style={{
            fontWeight: '800',
            color: '#1565C0',
            cursor: 'pointer',
            textDecoration: 'underline',
            textUnderlineOffset: '3px',
          }}
        >
          #{val}
        </span>
      ),
    },
    {
      key: 'title',
      title: lang === 'ar' ? 'عنوان المشكلة والطلب' : 'Subject',
      render: (val, row) => (
        <div style={{ textAlign: 'start' }}>
          <div style={{ fontWeight: '700', color: '#0F172A', fontSize: '13.5px' }}>
            {lang === 'ar' ? val : row.titleEn}
          </div>
          <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
            {lang === 'ar' ? row.department : row.departmentEn}
          </div>
        </div>
      ),
    },
    {
      key: 'priority',
      title: lang === 'ar' ? 'الأولوية' : 'Priority',
      render: (val) => <TicketPriorityBadge priority={val} lang={lang} />,
    },
    {
      key: 'status',
      title: lang === 'ar' ? 'الحالة' : 'Status',
      render: (val) => <TicketStatusBadge status={val} lang={lang} />,
    },
    {
      key: 'assignedTo',
      title: lang === 'ar' ? 'المكلف بالحل' : 'Assigned To',
      render: (val) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <Avatar name={val} size="sm" />
          <span style={{ fontSize: '12.5px', fontWeight: '600' }}>{val}</span>
        </div>
      ),
    },
    {
      key: 'createdAt',
      title: lang === 'ar' ? 'تاريخ الإنشاء' : 'Created At',
      render: (val) => <span style={{ fontSize: '12px', color: '#64748B' }}>{val}</span>,
    },
    {
      key: 'actions',
      title: lang === 'ar' ? 'إجراءات' : 'Actions',
      render: (_, row) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedTicket(row)}
        >
          {lang === 'ar' ? 'عرض التفاصيل' : 'View Details'}
        </Button>
      ),
    },
  ];

  return (
    <div className="dash-root">
      <style>{`
        .dash-root { animation: dashFadeIn 0.5s ease both; }

        /* ── Welcome banner ── */
        .banner {
          position: relative;
          overflow: hidden;
          border-radius: 20px;
          padding: 30px 34px;
          margin-bottom: 22px;
          background: linear-gradient(120deg, #081B45 0%, #0F2E6B 30%, #1565C0 70%, #3B82F6 100%);
          background-size: 200% 200%;
          animation: bannerShift 12s ease infinite, dashFadeIn 0.6s ease both;
          color: #fff;
          display: flex;
          alignItems: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 18px;
          box-shadow: 0 18px 45px rgba(15,46,107,0.35);
        }
        @keyframes bannerShift { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        .banner::before {
          content: ''; position: absolute; top: -80px; inset-inline-end: -60px;
          width: 300px; height: 300px; border-radius: 50%;
          background: radial-gradient(circle, rgba(96,165,250,0.35), transparent 70%);
          pointer-events: none;
        }
        .banner-ring { position: absolute; pointer-events: none; opacity: 0.16; }
        .banner-chip {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 7px 14px; border-radius: 999px;
          background: rgba(255,255,255,0.14);
          border: 1px solid rgba(255,255,255,0.22);
          backdrop-filter: blur(8px);
          font-size: '12px'; font-weight: 700;
          transition: background 0.2s, transform 0.2s;
        }
        .banner-chip:hover { background: rgba(255,255,255,0.24); transform: translateY(-2px); }
        .banner-float { position: absolute; pointer-events: none; filter: drop-shadow(0 6px 12px rgba(0,0,0,0.3)); animation: bannerFloat 5s ease-in-out infinite; }
        @keyframes bannerFloat { 0%,100% { transform: translateY(0) rotate(-6deg); } 50% { transform: translateY(-14px) rotate(6deg); } }

        /* ── Filter bar ── */
        .filter-bar {
          display: flex; flex-wrap: wrap; align-items: center; gap: 10px;
          margin-bottom: 18px;
          animation: dashFadeIn 0.55s ease both;
        }
        .filter-bar select:hover, .filter-bar select:focus {
          border-color: #93C5FD;
          box-shadow: 0 0 0 4px rgba(59,130,246,0.12);
        }

        /* ── Stats grid ── */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(215px, 1fr));
          gap: 14px;
          animation: dashFadeIn 0.6s ease both;
        }
        .stat-wrap {
          animation: dashPop 0.5s cubic-bezier(0.22,1,0.36,1) both;
          transition: transform 0.22s ease;
        }
        .stat-wrap:hover { transform: translateY(-4px); }

        /* ── Section cards ── */
        .section-card {
          background: #fff;
          border: 1px solid #E9EEF6;
          border-radius: 18px;
          padding: 20px 22px;
          box-shadow: 0 4px 18px rgba(15,23,42,0.04);
          transition: box-shadow 0.25s, transform 0.25s;
          animation: dashFadeIn 0.6s ease both;
        }
        .section-card:hover { box-shadow: 0 12px 32px rgba(15,23,42,0.09); }
        .section-title { font-size: 15px; font-weight: 800; color: #0F172A; margin: 0 0 4px; display: flex; align-items: center; gap: 8px; }
        .section-title::before {
          content: ''; width: 4px; height: 18px; border-radius: 4px;
          background: linear-gradient(180deg, #1565C0, #60A5FA);
        }
        .section-sub { font-size: 12.5px; color: #64748B; margin: 0 0 16px; }

        /* ── Quick actions ── */
        .qa-btn {
          display: flex; flex-direction: column; align-items: center; gap: 8px;
          padding: 16px 8px; border-radius: 14px; border: none;
          cursor: pointer; font-family: 'Cairo', sans-serif;
          font-size: 12px; font-weight: 700;
          transition: transform 0.2s, box-shadow 0.2s, filter 0.2s;
          box-shadow: 0 3px 10px rgba(15,23,42,0.06);
        }
        .qa-btn:hover { transform: translateY(-4px) scale(1.03); box-shadow: 0 12px 24px rgba(15,23,42,0.14); filter: saturate(1.15); }
        .qa-btn:active { transform: translateY(-1px) scale(1); }

        /* ── Team progress bars ── */
        .team-bar-track {
          width: 100%; height: 10px; border-radius: 999px;
          background: #EEF2F7; overflow: hidden;
          box-shadow: inset 0 1px 3px rgba(15,23,42,0.08);
        }
        .team-bar-fill {
          height: 100%; border-radius: 999px;
          transition: width 0.9s cubic-bezier(0.22,1,0.36,1);
          position: relative; overflow: hidden;
        }
        .team-bar-fill::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent);
          animation: barShimmer 2.4s ease-in-out infinite;
        }
        @keyframes barShimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        .team-row { transition: background 0.2s; border-radius: 10px; padding: 4px 6px; }
        .team-row:hover { background: #F8FAFF; }

        /* ── Leaderboard ── */
        .lb-card {
          position: relative;
          background: #fff;
          border: 1px solid #E9EEF6;
          border-radius: 16px;
          padding: 18px;
          display: flex; flex-direction: column; gap: 8px;
          overflow: hidden;
          transition: transform 0.22s, box-shadow 0.22s;
          animation: dashPop 0.55s cubic-bezier(0.22,1,0.36,1) both;
        }
        .lb-card::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px;
          background: linear-gradient(90deg, #1565C0, #60A5FA, #1565C0);
          background-size: 200% 100%;
          animation: bannerShift 4s ease infinite;
        }
        .lb-card:hover { transform: translateY(-4px); box-shadow: 0 14px 30px rgba(21,101,192,0.14); }
        .lb-emoji {
          width: 44px; height: 44px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          font-size: 22px;
          background: linear-gradient(135deg, #EFF6FF, #DBEAFE);
          box-shadow: 0 4px 10px rgba(21,101,192,0.12);
        }
        .lb-metric { font-size: 16px; font-weight: 800; color: #1565C0; letter-spacing: 0.3px; }

        /* ── Charts row ── */
        .charts-grid {
          display: grid;
          grid-template-columns: minmax(0, 2.2fr) minmax(240px, 1fr);
          gap: 16px;
          margin-top: 20px;
        }
        .chart-inner { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr); gap: 20px; align-items: center; }
        .legend-pill {
          display: flex; align-items: center; gap: 7px;
          font-size: 12px; color: #475569;
          padding: 5px 8px; border-radius: 8px;
          transition: background 0.15s;
        }
        .legend-pill:hover { background: #F1F5F9; }

        @keyframes dashFadeIn { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes dashPop { from { opacity: 0; transform: translateY(16px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }

        @media (max-width: 1100px) {
          .charts-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 760px) {
          .chart-inner { grid-template-columns: 1fr; }
          .banner { padding: 22px; }
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }
        }
      `}</style>

      {/* Page Header */}
      <PageHeader
        title={lang === 'ar' ? 'لوحة المتابعة والتحكم' : 'Operations Dashboard'}
        subtitle={lang === 'ar' ? 'نظرة شاملة على أداء الفرق والتذاكر' : 'A full overview of team and ticket performance'}
        badge={
          <Badge variant="blue" size="md" dot>
            {lang === 'ar' ? 'النظام متصل ونشط' : 'System Online'}
          </Badge>
        }
        actions={
          <Button
            variant="primary"
            size="md"
            onClick={() => setActivePage && setActivePage('tickets')}
          >
            + {lang === 'ar' ? 'إنشاء تذكرة جديدة' : 'New Ticket'}
          </Button>
        }
      />

      {/* Welcome Banner */}
      <div className="banner">
        {/* Decorative rings */}
        <svg className="banner-ring" width="280" height="280" viewBox="0 0 280 280" style={{ insetInlineEnd: '-50px', top: '-70px' }}>
          <circle cx="140" cy="140" r="130" stroke="#fff" strokeWidth="1.5" fill="none" strokeDasharray="6 8" />
          <circle cx="140" cy="140" r="90" stroke="#fff" strokeWidth="1.5" fill="none" />
          <circle cx="140" cy="140" r="50" stroke="#fff" strokeWidth="1.5" fill="none" strokeDasharray="4 6" />
        </svg>
        <span className="banner-float" style={{ insetInlineEnd: '130px', top: '26px', fontSize: '26px', animationDelay: '0s' }}>🎫</span>
        <span className="banner-float" style={{ insetInlineEnd: '70px', bottom: '30px', fontSize: '20px', animationDelay: '1.4s' }}>✅</span>
        <span className="banner-float" style={{ insetInlineEnd: '210px', bottom: '16px', fontSize: '18px', animationDelay: '2.6s' }}>⚡</span>

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <Avatar name={user?.name || user?.nameEn || 'U'} size="lg" />
            <span
              style={{
                position: 'absolute', bottom: '2px', insetInlineEnd: '2px',
                width: '14px', height: '14px', borderRadius: '50%',
                background: '#22C55E', border: '2.5px solid #0F2E6B',
                boxShadow: '0 0 0 0 rgba(34,197,94,0.6)',
                animation: 'pulseDot 2s ease-out infinite',
              }}
            />
          </div>
          <div>
            <div style={{ fontSize: '21px', fontWeight: '800', marginBottom: '6px', textShadow: '0 2px 12px rgba(0,0,0,0.3)' }}>
              {lang === 'ar' ? `مرحباً بك، ${user?.name || ''} 👋` : `Welcome back, ${user?.nameEn || user?.name || ''} 👋`}
            </div>
            <div style={{ fontSize: '13.5px', opacity: 0.88, marginBottom: '16px' }}>
              {lang === 'ar'
                ? 'نحو بيئة جامعية أكثر كفاءة وفعالية'
                : 'Toward a more efficient, effective university environment'}
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <span className="banner-chip">📅 {currentDate}</span>
              <span className="banner-chip">🕐 {currentTime}</span>
              <span className="banner-chip">
                <Badge variant={roleMeta.color} size="sm">
                  {lang === 'ar' ? roleMeta.label : roleMeta.labelEn}
                </Badge>
              </span>
            </div>
          </div>
        </div>

        <div
          style={{
            position: 'relative', zIndex: 1,
            display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px',
          }}
        >
          <div
            style={{
              fontSize: '11px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.7)',
            }}
          >
            {lang === 'ar' ? 'ملخص اليوم' : "Today's Snapshot"}
          </div>
          <div style={{ display: 'flex', gap: '22px' }}>
            {[
              { v: scopedStats.total, l: lang === 'ar' ? 'تذكرة' : 'Tickets', e: '🎫' },
              { v: scopedStats.completed, l: lang === 'ar' ? 'مكتملة' : 'Done', e: '✅' },
              { v: scopedStats.inProgress, l: lang === 'ar' ? 'قيد التنفيذ' : 'Active', e: '⚙️' },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: '800', textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>{s.v}</div>
                <div style={{ fontSize: '10.5px', opacity: 0.8, fontWeight: '700' }}>{s.e} {s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters: Team / Manager / Refresh */}
      <div className="filter-bar">
        <select
          value={selectedTeam}
          onChange={(e) => setSelectedTeam(e.target.value)}
          style={selectStyle}
        >
          <option value="all">{lang === 'ar' ? 'كل الفرق' : 'All Teams'}</option>
          {teamsList.map((team) => (
            <option key={team.id} value={String(team.id)}>
              {team.name}
            </option>
          ))}
        </select>

        {isAdmin && (
          <select
            value={selectedManager}
            onChange={(e) => setSelectedManager(e.target.value)}
            style={selectStyle}
          >
            <option value="all">{lang === 'ar' ? 'كل المديرين' : 'All Managers'}</option>
            {managersList.map((mgr) => (
              <option key={mgr.id} value={String(mgr.id)}>
                {mgr.fullName}
              </option>
            ))}
          </select>
        )}

        <Button
          variant="outline"
          size="md"
          disabled={isRefreshing}
          onClick={handleRefresh}
        >
          <span className={isRefreshing ? 'refresh-spin' : ''} style={{ display: 'inline-block' }}>
            {isRefreshing ? '⏳' : '🔄'}
          </span>{' '}
          {lang === 'ar'
            ? isRefreshing ? 'جاري التحديث...' : 'تحديث الإحصائيات'
            : isRefreshing ? 'Refreshing...' : 'Refresh Stats'}
        </Button>
      </div>

      {analysisError && (
        <div style={{ marginBottom: '16px', padding: '11px 16px', background: 'linear-gradient(135deg,#FEF2F2,#FEE2E2)', border: '1px solid #FCA5A5', borderRadius: '12px', fontSize: '12.5px', color: '#DC2626', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
          ⚠️ {analysisError}
        </div>
      )}

      {/* Top KPI Stripe */}
      {analysisLoading && !liveAnalysis ? (
        <div style={{ padding: '40px', display: 'flex', justifyContent: 'center' }}>
          <Spinner size="lg" />
        </div>
      ) : (
      <div className="stats-grid">
        {[
          <StatCard
            label={lang === 'ar' ? 'إجمالي التذاكر' : 'Total Tickets'}
            value={String(scopedStats.total)}
            icon="🎫"
            color="blue"
            note={lang === 'ar' ? 'عبر جميع الفرق' : 'across all teams'}
            onClick={() => setActivePage && setActivePage('tickets')}
          />,
          <StatCard
            label={lang === 'ar' ? 'غير مسندة' : 'Not Assigned'}
            value={String(scopedStats.notAssigned)}
            icon="📭"
            color="red"
            note={lang === 'ar' ? 'تحتاج تخصيص فوري' : 'needs assignment'}
          />,
          <StatCard
            label={lang === 'ar' ? 'قيد الانتظار' : 'Pending'}
            value={String(scopedStats.pending)}
            icon="🕓"
            color="amber"
            note={lang === 'ar' ? 'بانتظار البدء' : 'awaiting start'}
          />,
          <StatCard
            label={lang === 'ar' ? 'قيد التنفيذ' : 'In Progress'}
            value={String(scopedStats.inProgress)}
            icon="⚙️"
            color="amber"
            note={
              lang === 'ar'
                ? `بواسطة ${scopedStats.engineersWorking} مهندس${scopedStats.engineersWorking === 1 ? '' : 'ين'}`
                : `by ${scopedStats.engineersWorking} engineer${scopedStats.engineersWorking === 1 ? '' : 's'}`
            }
          />,
          <StatCard
            label={lang === 'ar' ? 'مكتملة' : 'Completed'}
            value={String(scopedStats.completed)}
            icon="✅"
            color="green"
            trend={
              scopedStats.completedTrend != null
                ? { value: `${Math.abs(scopedStats.completedTrend)}%`, isPositive: scopedStats.completedTrend >= 0 }
                : undefined
            }
            note={
              lang === 'ar'
                ? `${scopedStats.completedLast7Days} مكتملة خلال آخر 7 أيام`
                : `${scopedStats.completedLast7Days} completed in last 7 days`
            }
          />,
          <StatCard
            label={lang === 'ar' ? 'إجمالي الفرق' : 'Total Teams'}
            value={String(scopedTeams.length)}
            icon="🧩"
            color="blue"
            note={lang === 'ar' ? 'فرق نشطة حالياً' : 'currently active'}
            onClick={() => setActivePage && setActivePage('teams')}
          />,
          <StatCard
            label={lang === 'ar' ? 'حرجة / عاجلة' : 'Critical'}
            value={String(criticalCount)}
            icon="🔥"
            color="red"
            note={lang === 'ar' ? 'أولوية عالية أو عاجلة' : 'high or urgent priority'}
          />,
          <StatCard
            label={lang === 'ar' ? 'نسبة الالتزام بالـ SLA' : 'SLA Met'}
            value={slaText}
            icon="🎯"
            color="purple"
            note={lang === 'ar' ? 'التزام مواعيد التذاكر المكتملة' : 'completed tickets vs deadline'}
          />,
        ].map((card, i) => (
          <div key={i} className="stat-wrap" style={{ animationDelay: `${i * 0.05}s` }}>
            {card}
          </div>
        ))}
      </div>
      )}

      {/* Charts + Quick Actions row */}
      <div className="charts-grid">
        <div className="section-card">
          <div className="chart-inner">
            <div>
              <h3 className="section-title">
                {lang === 'ar' ? 'التذاكر الجديدة — آخر 7 أيام' : 'New Tickets — Last 7 Days'}
              </h3>
              <p className="section-sub">
                {lang === 'ar' ? 'حجم التذاكر الواردة يومياً' : 'Daily incoming ticket volume'}
              </p>
              <div style={{ height: '200px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={last7DaysData} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                    <defs>
                      <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3B82F6" />
                        <stop offset="100%" stopColor="#1565C0" />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      cursor={{ fill: 'rgba(59,130,246,0.08)' }}
                      contentStyle={{ fontSize: '12px', borderRadius: '10px', border: '1px solid #E2E8F0', fontFamily: 'Cairo, sans-serif', boxShadow: '0 8px 20px rgba(15,23,42,0.1)' }}
                      formatter={(value) => [value, lang === 'ar' ? 'تذاكر' : 'Tickets']}
                    />
                    <Bar dataKey="count" fill="url(#barGrad)" radius={[7, 7, 0, 0]} maxBarSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
              <h3 className="section-title">
                {lang === 'ar' ? 'حالة التذاكر' : 'Ticket Status'}
              </h3>
              <p className="section-sub">
                {lang === 'ar' ? 'التوزيع الحالي للحالات' : 'Current status distribution'}
              </p>
              {statusDistributionData.length === 0 ? (
                <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#CBD5E1', fontSize: '12.5px' }}>
                  {lang === 'ar' ? 'لا توجد بيانات' : 'No data'}
                </div>
              ) : (
                <div style={{ height: '200px', display: 'flex', alignItems: 'center' }}>
                  <ResponsiveContainer width="52%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusDistributionData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={48}
                        outerRadius={72}
                        paddingAngle={3}
                        cornerRadius={6}
                        strokeWidth={0}
                      >
                        {statusDistributionData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '10px', border: '1px solid #E2E8F0', fontFamily: 'Cairo, sans-serif', boxShadow: '0 8px 20px rgba(15,23,42,0.1)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                    {statusDistributionData.map((entry, i) => (
                      <div key={i} className="legend-pill">
                        <span style={{ width: '10px', height: '10px', borderRadius: '4px', background: entry.color, flexShrink: 0, boxShadow: `0 0 0 3px ${entry.color}22` }} />
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>{entry.name}</span>
                        <span style={{ fontWeight: '800', color: '#0F172A' }}>{entry.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="section-card">
          <h3 className="section-title" style={{ marginBottom: '14px' }}>
            {lang === 'ar' ? 'إجراءات سريعة' : 'Quick Actions'}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              { icon: '🎫', label: lang === 'ar' ? 'تذكرة جديدة' : 'New Ticket', bg: 'linear-gradient(135deg,#EFF6FF,#DBEAFE)', color: '#1565C0', page: 'tickets' },
              { icon: '🔍', label: lang === 'ar' ? 'كل التذاكر' : 'All Tickets', bg: 'linear-gradient(135deg,#F0FDF4,#DCFCE7)', color: '#166534', page: 'tickets' },
              { icon: '👥', label: lang === 'ar' ? 'إدارة الفرق' : 'Manage Teams', bg: 'linear-gradient(135deg,#FFFBEB,#FEF3C7)', color: '#B45309', page: 'teams' },
              { icon: '⭐', label: lang === 'ar' ? 'التقييمات' : 'Ratings', bg: 'linear-gradient(135deg,#F5F3FF,#EDE9FE)', color: '#6B21A8', page: 'ratings' },
            ].map((qa, i) => (
              <button
                key={i}
                onClick={() => setActivePage && setActivePage(qa.page)}
                className="qa-btn"
                style={{ background: qa.bg, color: qa.color, animationDelay: `${i * 0.07}s` }}
              >
                <span style={{ fontSize: '24px', filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.15))' }}>{qa.icon}</span>
                {qa.label}
              </button>
            ))}
          </div>

          <div
            style={{
              marginTop: '16px', padding: '12px 14px', borderRadius: '12px',
              background: 'linear-gradient(135deg,#F8FAFF,#EFF6FF)',
              border: '1px dashed #BFDBFE',
              fontSize: '11.5px', color: '#1D4ED8', fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: '8px',
            }}
          >
            💡 {lang === 'ar' ? 'استخدم الفلاتر أعلاه لتخصيص كل الإحصائيات والرسوم' : 'Use the filters above to scope all stats & charts'}
          </div>
        </div>
      </div>

      {/* Team Performance Summaries */}
      <div className="section-card" style={{ marginTop: '20px' }}>
        <h3 className="section-title">
          {lang === 'ar' ? 'ملخص أداء الفرق' : 'Team Performance Summaries'}
        </h3>
        <p className="section-sub">
          {lang === 'ar'
            ? 'نسبة إنجاز التذاكر مقارنة بالإجمالي لكل فريق'
            : 'Completed vs total tickets per team'}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {scopedTeams.length === 0 && (
            <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0 }}>
              {lang === 'ar' ? 'لا توجد فرق مطابقة للفلاتر الحالية' : 'No teams match the current filters'}
            </p>
          )}
          {scopedTeams.map((team, idx) => {
            const pct = Math.round((team.completed / team.total) * 100);
            const barColor = pct >= 80 ? '#16A34A' : pct >= 50 ? '#F59E0B' : '#DC2626';
            return (
              <div key={team.id} className="team-row" style={{ animationDelay: `${idx * 0.06}s` }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    marginBottom: '7px',
                  }}
                >
                  <span style={{ fontSize: '13.5px', fontWeight: '700', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: barColor, boxShadow: `0 0 0 3px ${barColor}22` }} />
                    {lang === 'ar' ? team.name : team.nameEn}
                  </span>
                  <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '700' }}>
                    {team.completed}/{team.total} <span style={{ color: barColor, fontWeight: '800' }}>({pct}%)</span>
                  </span>
                </div>
                <div className="team-bar-track">
                  <div
                    className="team-bar-fill"
                    style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${barColor}CC, ${barColor})` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Leaderboard & Performance Spotlight */}
      <div style={{ marginTop: '24px' }}>
        <h3 className="section-title" style={{ marginBottom: '14px' }}>
          {lang === 'ar' ? 'لوحة المتصدرين وأبرز الأداءات' : 'Leaderboard & Performance Spotlight'}
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
            gap: '14px',
          }}
        >
          <LeaderboardCard
            emoji="🏆"
            title={lang === 'ar' ? 'العضو الأعلى تقييماً' : 'Highest Rated Member'}
            name={leaderboard.topMember ? (lang === 'ar' ? leaderboard.topMember.name : leaderboard.topMember.nameEn) : null}
            metric={leaderboard.topMember ? `${leaderboard.topMember.rating}/10` : null}
            lang={lang}
          />
          <LeaderboardCard
            emoji="🎖️"
            title={lang === 'ar' ? 'قائد الفريق الأعلى تقييماً' : 'Highest Rated Leader'}
            name={leaderboard.topLeader ? (lang === 'ar' ? leaderboard.topLeader.name : leaderboard.topLeader.nameEn) : null}
            metric={leaderboard.topLeader ? `${leaderboard.topLeader.rating}/10` : null}
            lang={lang}
          />
          <LeaderboardCard
            emoji="⭐"
            title={lang === 'ar' ? 'المدير الأعلى تقييماً' : 'Highest Rated Manager'}
            name={leaderboard.topManager ? (lang === 'ar' ? leaderboard.topManager.name : leaderboard.topManager.nameEn) : null}
            metric={leaderboard.topManager ? `${leaderboard.topManager.rating}/10` : null}
            lang={lang}
          />
          <LeaderboardCard
            emoji="🚀"
            title={lang === 'ar' ? 'الأكثر إنجازاً للمهام' : 'Most Tasks Done'}
            name={leaderboard.mostTasks ? (lang === 'ar' ? leaderboard.mostTasks.name : leaderboard.mostTasks.nameEn) : null}
            metric={
              leaderboard.mostTasks
                ? lang === 'ar'
                  ? `${leaderboard.mostTasks.count} مهمة`
                  : `${leaderboard.mostTasks.count} tasks`
                : null
            }
            lang={lang}
          />
        </div>
      </div>

      {/* Recent & Urgent Tickets Table Section */}
      <div style={{ marginTop: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 className="section-title">
              {lang === 'ar' ? 'أحدث التذاكر العاجلة' : 'Recent & Urgent Tickets'}
            </h3>
            <p style={{ fontSize: '12.5px', color: '#64748B', margin: '2px 0 0' }}>
              {lang === 'ar'
                ? 'قائمة سريعة لأهم 5 تذاكر تحتاج انتباه فوري'
                : 'Top 5 tickets requiring immediate attention'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActivePage && setActivePage('tickets')}
          >
            {lang === 'ar' ? 'عرض جميع التذاكر ←' : 'View All Tickets →'}
          </Button>
        </div>

        {ticketsError && (
          <div style={{ marginBottom: '12px', padding: '11px 16px', background: 'linear-gradient(135deg,#FEF2F2,#FEE2E2)', border: '1px solid #FCA5A5', borderRadius: '12px', fontSize: '12.5px', color: '#DC2626', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ⚠️ {ticketsError}
          </div>
        )}

        {liveTickets === null ? (
          <div style={{ padding: '30px', display: 'flex', justifyContent: 'center' }}>
            <Spinner size="lg" />
          </div>
        ) : (
          <Table
            columns={columns}
            data={urgentTickets}
            emptyMessage={lang === 'ar' ? 'لا توجد تذاكر حالياً' : 'No tickets found'}
          />
        )}
      </div>

      {/* Detail Modal */}
      {selectedTicket && (
        <Modal
          open={Boolean(selectedTicket)}
          onClose={() => setSelectedTicket(null)}
          title={`${lang === 'ar' ? 'تفاصيل التذكرة' : 'Ticket Details'} — #${selectedTicket.id}`}
          subtitle={selectedTicket.createdAt}
          lang={lang}
          footer={
            <>
              <Button variant="secondary" onClick={() => setSelectedTicket(null)}>
                {lang === 'ar' ? 'إغلاق' : 'Close'}
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  alert(lang === 'ar' ? 'تم تحديث حالة التذكرة بنجاح' : 'Ticket status updated');
                  setSelectedTicket(null);
                }}
              >
                {lang === 'ar' ? 'تحديث الحالة والرد' : 'Update & Reply'}
              </Button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'start' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <TicketStatusBadge status={selectedTicket.status} lang={lang} size="lg" />
                <TicketPriorityBadge priority={selectedTicket.priority} lang={lang} size="md" />
              </div>
              <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 700 }}>
                🏷️ {lang === 'ar' ? selectedTicket.department : selectedTicket.departmentEn}
              </span>
            </div>

            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', marginBottom: '8px' }}>
                {lang === 'ar' ? selectedTicket.title : selectedTicket.titleEn}
              </h3>
              <p style={{ fontSize: '13.5px', color: '#334155', lineHeight: 1.7, background: 'linear-gradient(135deg,#F8FAFF,#F1F5F9)', padding: '14px 16px', borderRadius: '12px', border: '1px solid #E6EDF6' }}>
                {selectedTicket.description}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              <div style={{ padding: '12px 14px', background: 'linear-gradient(135deg,#FAFBFD,#F8FAFC)', borderRadius: '12px', border: '1px solid #E8EDF5' }}>
                <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '700' }}>{lang === 'ar' ? 'مقدم الطلب' : 'Requester'}</div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <Avatar name={selectedTicket.requester} size="sm" />
                  {selectedTicket.requester}
                </div>
              </div>
              <div style={{ padding: '12px 14px', background: 'linear-gradient(135deg,#FAFBFD,#F8FAFC)', borderRadius: '12px', border: '1px solid #E8EDF5' }}>
                <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '700' }}>{lang === 'ar' ? 'المسؤول المكلف' : 'Assigned Agent'}</div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <Avatar name={selectedTicket.assignedTo} size="sm" />
                  {selectedTicket.assignedTo}
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      <style>{`
        @keyframes pulseDot {
          0% { box-shadow: 0 0 0 0 rgba(34,197,94,0.55); }
          70% { box-shadow: 0 0 0 8px rgba(34,197,94,0); }
          100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); }
        }
      `}</style>
    </div>
  );
}

// Small local presentational card for the leaderboard section.
function LeaderboardCard({ emoji, title, name, metric, lang = 'ar' }) {
  const hasData = Boolean(name);
  return (
    <div className="lb-card">
      <div className="lb-emoji">{emoji}</div>
      <div style={{ fontSize: '11.5px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
        {title}
      </div>
      {hasData ? (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Avatar name={name} size="sm" />
            <span style={{ fontSize: '13.5px', fontWeight: '700', color: '#0F172A' }}>{name}</span>
          </div>
          <div className="lb-metric">{metric}</div>
        </>
      ) : (
        <div style={{ fontSize: '12.5px', color: '#CBD5E1', fontWeight: '600', fontStyle: 'italic' }}>
          {lang === 'ar' ? 'لا توجد بيانات كافية بعد' : 'Not enough data yet'}
        </div>
      )}
    </div>
  );
}
import React, { useState, useMemo } from 'react';
import {
  parseUtcDate,
  getTicketStatusColor,
  getTicketStatusText,
  getTaskStatusText,
  normalizeTaskStatus,
  normalizeTicketStatus,
  getPriorityColor,
  getPriorityText,
  normalizeTicketPriority,
  getDeadlineUrgency,
  formatMemberName,
  formatDate,
} from '../../../utils/constants';
import { Badge, Avatar, Button } from '../../shared';

const AR_MONTH_NAMES = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

const EN_MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const AR_WEEKDAYS = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
const EN_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function toLocalDateKey(dateObj) {
  if (!dateObj || isNaN(dateObj.getTime())) return null;
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function TicketCalendarView({
  tickets = [],
  onTicketClick,
  onSubtaskClick,
  getDeadlineUrgency: getUrgencyProp,
  lang = 'ar',
  t = {},
}) {
  const isRtl = lang === 'ar';
  const today = new Date();
  const todayKey = toLocalDateKey(today);

  // Month and Year state
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDayKey, setSelectedDayKey] = useState(todayKey);

  // Show subtasks toggle state (persisted in localStorage)
  const [showSubtasks, setShowSubtasks] = useState(() => {
    try {
      const saved = localStorage.getItem('tickets_calendar_show_subtasks');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const handleToggleSubtasks = () => {
    setShowSubtasks((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('tickets_calendar_show_subtasks', String(next));
      } catch (err) {
        console.warn(err);
      }
      return next;
    });
  };

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDayKey(toLocalDateKey(now));
  };

  // Group tickets and subtasks by date key
  const { eventsByDate, monthlyStats } = useMemo(() => {
    const map = {};
    let monthTicketsCount = 0;
    let monthSubtasksCount = 0;
    let monthOverdueCount = 0;

    const addEvent = (dateKey, event) => {
      if (!dateKey) return;
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(event);

      // Check if within the current visible month for stats
      const [ey, em] = dateKey.split('-').map(Number);
      if (ey === currentYear && em === currentMonth + 1) {
        if (event.type === 'ticket') monthTicketsCount++;
        if (event.type === 'subtask') monthSubtasksCount++;
        if (event.urgency?.isOverdue) monthOverdueCount++;
      }
    };

    tickets.forEach((ticket) => {
      // Ticket date calculation (priority to deadline, fallback to createdAt)
      const ticketDate = ticket.deadline ? parseUtcDate(ticket.deadline) : (ticket.createdAt ? parseUtcDate(ticket.createdAt) : null);
      const ticketDateKey = toLocalDateKey(ticketDate);
      const ticketUrgency = ticket.deadline
        ? (getUrgencyProp ? getUrgencyProp(ticket.deadline, ticket.completedAt, ticket.status) : getDeadlineUrgency(ticket.deadline, ticket.completedAt, ticket.status, lang))
        : null;

      if (ticketDateKey) {
        addEvent(ticketDateKey, {
          id: `ticket-${ticket.id}`,
          type: 'ticket',
          data: ticket,
          urgency: ticketUrgency,
        });
      }

      // Process subtasks
      const tasks = ticket.ticketTasks || ticket.TicketTasks || [];
      tasks.forEach((task) => {
        if (task.status === 'Deleted') return;

        const taskDate = task.deadline ? parseUtcDate(task.deadline) : (task.createdAt ? parseUtcDate(task.createdAt) : null);
        const taskDateKey = toLocalDateKey(taskDate);
        const taskUrgency = task.deadline
          ? getDeadlineUrgency(task.deadline, task.completedAt, task.status, lang)
          : null;

        if (taskDateKey) {
          addEvent(taskDateKey, {
            id: `subtask-${task.id}`,
            type: 'subtask',
            data: task,
            parentTicket: ticket,
            urgency: taskUrgency,
          });
        }
      });
    });

    return {
      eventsByDate: map,
      monthlyStats: {
        tickets: monthTicketsCount,
        subtasks: monthSubtasksCount,
        overdue: monthOverdueCount,
      },
    };
  }, [tickets, currentYear, currentMonth, getUrgencyProp, lang]);

  // Calendar grid construction
  const calendarDays = useMemo(() => {
    const days = [];
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const totalDaysInMonth = lastDayOfMonth.getDate();

    // Day offset calculation
    // Arabic: Week starts Saturday (Day 6 in JS). Sat=0, Sun=1, Mon=2, Tue=3, Wed=4, Thu=5, Fri=6.
    // English: Week starts Sunday (Day 0 in JS). Sun=0, Mon=1, Tue=2, Wed=3, Thu=4, Fri=5, Sat=6.
    const startDayOfWeek = isRtl
      ? (firstDayOfMonth.getDay() + 1) % 7
      : firstDayOfMonth.getDay();

    // Trailing days from previous month
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const d = new Date(currentYear, currentMonth - 1, dayNum);
      const key = toLocalDateKey(d);
      days.push({
        date: d,
        dayNum,
        key,
        isCurrentMonth: false,
        isToday: key === todayKey,
      });
    }

    // Days in current month
    for (let dayNum = 1; dayNum <= totalDaysInMonth; dayNum++) {
      const d = new Date(currentYear, currentMonth, dayNum);
      const key = toLocalDateKey(d);
      days.push({
        date: d,
        dayNum,
        key,
        isCurrentMonth: true,
        isToday: key === todayKey,
      });
    }

    // Leading days from next month to complete 5 or 6 rows (multiple of 7)
    const totalCells = Math.ceil(days.length / 7) * 7;
    const remaining = totalCells - days.length;
    for (let dayNum = 1; dayNum <= remaining; dayNum++) {
      const d = new Date(currentYear, currentMonth + 1, dayNum);
      const key = toLocalDateKey(d);
      days.push({
        date: d,
        dayNum,
        key,
        isCurrentMonth: false,
        isToday: key === todayKey,
      });
    }

    return days;
  }, [currentYear, currentMonth, isRtl, todayKey]);

  const weekdays = isRtl ? AR_WEEKDAYS : EN_WEEKDAYS;
  const monthName = isRtl ? AR_MONTH_NAMES[currentMonth] : EN_MONTH_NAMES[currentMonth];

  // Selected Day items
  const selectedDayEvents = (eventsByDate[selectedDayKey] || []).filter(
    (ev) => showSubtasks || ev.type === 'ticket'
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        background: '#FFFFFF',
        borderRadius: '16px',
        padding: '20px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
      }}
    >
      {/* Calendar Top Header: Controls, Month/Year, and Stats */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          borderBottom: '1px solid #F1F5F9',
          paddingBottom: '16px',
        }}
      >
        {/* Navigation & Month Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', direction: 'ltr' }}>
            <Button variant="secondary" size="sm" onClick={handlePrevMonth} title={t.calendarPrevMonth || 'الشهر السابق'}>
              ❮
            </Button>
            <Button variant="secondary" size="sm" onClick={handleToday}>
              {t.calendarToday || 'اليوم'}
            </Button>
            <Button variant="secondary" size="sm" onClick={handleNextMonth} title={t.calendarNextMonth || 'الشهر التالي'}>
              ❯
            </Button>
          </div>

          <h2
            style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: '800',
              color: '#0F172A',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>📅 {monthName} {currentYear}</span>
          </h2>
        </div>

        {/* Right side: Subtask Toggle & Stats Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Toggle Subtasks Button */}
          <button
            onClick={handleToggleSubtasks}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              border: showSubtasks ? '1.5px solid #818CF8' : '1px solid #CBD5E1',
              background: showSubtasks ? '#EEF2FF' : '#F8FAFC',
              color: showSubtasks ? '#4F46E5' : '#64748B',
              transition: 'all 0.15s ease',
            }}
          >
            <span>{showSubtasks ? '✓' : '○'}</span>
            <span>📋 {t.calendarShowSubtasks || 'إظهار المهام الفرعية'}</span>
          </button>

          {/* Month Stats Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                fontSize: '11.5px',
                fontWeight: '700',
                padding: '4px 8px',
                borderRadius: '6px',
                background: '#EFF6FF',
                color: '#1D4ED8',
                border: '1px solid #BFDBFE',
              }}
              title="تذاكر مجدولة هذا الشهر"
            >
              🏷️ {monthlyStats.tickets} {t.calendarTicketsCount || 'تذاكر'}
            </span>

            {showSubtasks && (
              <span
                style={{
                  fontSize: '11.5px',
                  fontWeight: '700',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  background: '#F5F3FF',
                  color: '#6D28D9',
                  border: '1px solid #DDD6FE',
                }}
                title="مهام فرعية مجدولة هذا الشهر"
              >
                📋 {monthlyStats.subtasks} {t.calendarSubtasksCount || 'مهام فرعية'}
              </span>
            )}

            {monthlyStats.overdue > 0 && (
              <span
                style={{
                  fontSize: '11.5px',
                  fontWeight: '700',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  background: '#FEF2F2',
                  color: '#DC2626',
                  border: '1px solid #FECACA',
                }}
                title="عناصر متأخرة هذا الشهر"
              >
                ⚠️ {monthlyStats.overdue}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
          gap: '6px',
        }}
      >
        {/* Day Name Headers */}
        {weekdays.map((dayName, idx) => (
          <div
            key={idx}
            style={{
              padding: '8px 4px',
              textAlign: 'center',
              fontSize: '12.5px',
              fontWeight: '800',
              color: idx === 0 || idx === 6 ? '#2563EB' : '#475569',
              background: '#F8FAFC',
              borderRadius: '8px',
            }}
          >
            {dayName}
          </div>
        ))}

        {/* Day Cells */}
        {calendarDays.map((cell) => {
          const allCellEvents = eventsByDate[cell.key] || [];
          const visibleEvents = allCellEvents.filter((ev) => showSubtasks || ev.type === 'ticket');
          const isSelected = cell.key === selectedDayKey;
          const hasOverdue = visibleEvents.some((ev) => ev.urgency?.isOverdue);

          return (
            <div
              key={cell.key}
              onClick={() => setSelectedDayKey(cell.key)}
              style={{
                minHeight: '105px',
                padding: '6px',
                background: isSelected
                  ? '#F0F9FF'
                  : cell.isToday
                  ? '#FAFAFE'
                  : cell.isCurrentMonth
                  ? '#FFFFFF'
                  : '#F8FAFC',
                borderRadius: '10px',
                border: isSelected
                  ? '2px solid #0284C7'
                  : cell.isToday
                  ? '2px solid #3B82F6'
                  : hasOverdue
                  ? '1px solid #FCA5A5'
                  : '1px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                cursor: 'pointer',
                transition: 'all 0.12s ease',
                opacity: cell.isCurrentMonth ? 1 : 0.45,
                position: 'relative',
              }}
            >
              {/* Day Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: cell.isToday || isSelected ? '800' : '600',
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: cell.isToday
                      ? '#2563EB'
                      : isSelected
                      ? '#0284C7'
                      : 'transparent',
                    color: cell.isToday || isSelected ? '#FFFFFF' : cell.isCurrentMonth ? '#1E293B' : '#94A3B8',
                  }}
                >
                  {cell.dayNum}
                </span>

                {visibleEvents.length > 0 && (
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: '700',
                      color: hasOverdue ? '#DC2626' : '#64748B',
                      background: hasOverdue ? '#FEE2E2' : '#F1F5F9',
                      padding: '1px 5px',
                      borderRadius: '10px',
                    }}
                  >
                    {visibleEvents.length}
                  </span>
                )}
              </div>

              {/* Event Chips (Limit to 3, then +X more) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1, overflow: 'hidden' }}>
                {visibleEvents.slice(0, 3).map((event) => {
                  const isTicket = event.type === 'ticket';
                  const item = event.data;
                  const isOverdue = event.urgency?.isOverdue;

                  if (isTicket) {
                    const normStatus = normalizeTicketStatus(item.status);
                    const statusColor = getTicketStatusColor(normStatus);
                    return (
                      <div
                        key={event.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onTicketClick) onTicketClick(item);
                        }}
                        title={`[تذكرة #${item.id}] ${item.title}\nالحالة: ${getTicketStatusText(normStatus, lang)}\nالفريق: ${item.teamName || '—'}`}
                        style={{
                          fontSize: '10.5px',
                          padding: '2px 5px',
                          borderRadius: '5px',
                          background: isOverdue ? '#FEF2F2' : '#EFF6FF',
                          border: isOverdue ? '1px solid #FCA5A5' : '1px solid #BFDBFE',
                          color: isOverdue ? '#991B1B' : '#1E40AF',
                          fontWeight: '700',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          cursor: 'pointer',
                        }}
                      >
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: statusColor.bg, flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          🏷️ #{item.id} {item.title}
                        </span>
                      </div>
                    );
                  }

                  // Subtask chip
                  const task = item;
                  const parent = event.parentTicket;
                  const normTaskStatus = normalizeTaskStatus(task.status);
                  const isTaskDone = normTaskStatus === 'Completed' || normTaskStatus === 'Approved';

                  return (
                    <div
                      key={event.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSubtaskClick) {
                          onSubtaskClick(task, parent);
                        } else if (parent && onTicketClick) {
                          onTicketClick(parent);
                        }
                      }}
                      title={`[مهمة فرعية #${task.id}] ${task.title}\nتتبع التذكرة #${parent?.id || '—'}: ${parent?.title || ''}\nالمسند إليه: ${formatMemberName(task.memberName, lang)}`}
                      style={{
                        fontSize: '10.5px',
                        padding: '2px 5px',
                        borderRadius: '5px',
                        background: isOverdue ? '#FEF2F2' : isTaskDone ? '#F0FDF4' : '#F5F3FF',
                        border: isOverdue ? '1px dashed #EF4444' : isTaskDone ? '1px dashed #86EFAC' : '1px dashed #A78BFA',
                        color: isOverdue ? '#991B1B' : isTaskDone ? '#15803D' : '#5B21B6',
                        fontWeight: '600',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        cursor: 'pointer',
                      }}
                    >
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        📋 #{task.id} {task.title}
                      </span>
                    </div>
                  );
                })}

                {visibleEvents.length > 3 && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDayKey(cell.key);
                    }}
                    style={{
                      fontSize: '10px',
                      fontWeight: '800',
                      color: '#2563EB',
                      textAlign: 'center',
                      background: '#F1F5F9',
                      borderRadius: '4px',
                      padding: '1px',
                    }}
                  >
                    +{visibleEvents.length - 3} {isRtl ? 'المزيد' : 'more'}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Day Agenda Drawer / Detailed Items List */}
      <div
        style={{
          marginTop: '8px',
          padding: '16px',
          background: '#F8FAFC',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A' }}>
              🗓️ {t.calendarItemsOnDay || 'عناصر هذا اليوم'}:
            </span>
            <Badge variant="blue" size="md">
              {selectedDayKey ? formatDate(selectedDayKey, lang) : '—'}
            </Badge>
            <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>
              ({selectedDayEvents.length} {t.calendarTotalScheduled || 'إجمالي'})
            </span>
          </div>

          <span style={{ fontSize: '11.5px', color: '#94A3B8' }}>
            {isRtl ? 'انقر على أي عنصر لعرض تفاصيله الكاملة' : 'Click on any item to view its details'}
          </span>
        </div>

        {selectedDayEvents.length === 0 ? (
          <div
            style={{
              padding: '24px',
              textAlign: 'center',
              color: '#94A3B8',
              fontSize: '13px',
              background: '#FFFFFF',
              borderRadius: '8px',
              border: '1px dashed #CBD5E1',
            }}
          >
            {t.calendarNoEvents || 'لا توجد تذاكر أو مهام مجدولة في هذا اليوم'}
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '10px',
            }}
          >
            {selectedDayEvents.map((event) => {
              const isTicket = event.type === 'ticket';
              const item = event.data;
              const isOverdue = event.urgency?.isOverdue;

              if (isTicket) {
                const normStatus = normalizeTicketStatus(item.status);
                const statusColor = getTicketStatusColor(normStatus);
                const priority = normalizeTicketPriority(item.priority);
                const pColor = getPriorityColor(priority);

                return (
                  <div
                    key={event.id}
                    onClick={() => onTicketClick && onTicketClick(item)}
                    style={{
                      padding: '12px 14px',
                      background: '#FFFFFF',
                      borderRadius: '10px',
                      border: isOverdue ? '1.5px solid #FCA5A5' : '1px solid #E2E8F0',
                      borderInlineStart: isOverdue ? '4px solid #DC2626' : '4px solid #2563EB',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      transition: 'transform 0.12s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: '800',
                          padding: '2px 7px',
                          borderRadius: '5px',
                          background: '#EFF6FF',
                          color: '#1D4ED8',
                        }}
                      >
                        🏷️ {t.ticketBadgeLabel || 'تذكرة'} #{item.id}
                      </span>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span
                          style={{
                            fontSize: '10.5px',
                            fontWeight: '700',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: statusColor.bg,
                            color: statusColor.text,
                          }}
                        >
                          {getTicketStatusText(normStatus, lang)}
                        </span>
                        <span
                          style={{
                            fontSize: '10.5px',
                            fontWeight: '700',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: pColor.bg,
                            color: pColor.text,
                          }}
                        >
                          {getPriorityText(priority, lang)}
                        </span>
                      </div>
                    </div>

                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A', lineHeight: 1.4 }}>
                      {item.title}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: '#64748B', marginTop: 'auto' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Avatar name={formatMemberName(item.memberName, lang)} size="xs" />
                        <span>{formatMemberName(item.memberName, lang)}</span>
                      </div>

                      {event.urgency && (
                        <Badge variant={event.urgency.variant} size="sm">
                          ⏱️ {event.urgency.label}
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              }

              // Subtask
              const task = item;
              const parent = event.parentTicket;
              const normStatus = normalizeTaskStatus(task.status);
              const priority = normalizeTicketPriority(task.priority);
              const pColor = getPriorityColor(priority);
              const isCompleted = normStatus === 'Completed' || normStatus === 'Approved';

              return (
                <div
                  key={event.id}
                  onClick={() => {
                    if (onSubtaskClick) {
                      onSubtaskClick(task, parent);
                    } else if (parent && onTicketClick) {
                      onTicketClick(parent);
                    }
                  }}
                  style={{
                    padding: '12px 14px',
                    background: '#FFFFFF',
                    borderRadius: '10px',
                    border: isOverdue ? '1.5px solid #FCA5A5' : '1px dashed #A78BFA',
                    borderInlineStart: isOverdue ? '4px solid #DC2626' : '4px solid #8B5CF6',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    transition: 'transform 0.12s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: '800',
                        padding: '2px 7px',
                        borderRadius: '5px',
                        background: '#F5F3FF',
                        color: '#6D28D9',
                      }}
                    >
                      📋 {t.subtaskBadgeLabel || 'مهمة فرعية'} #{task.id}
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span
                        style={{
                          fontSize: '10.5px',
                          fontWeight: '700',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: isCompleted ? '#DCFCE7' : '#EFF6FF',
                          color: isCompleted ? '#15803D' : '#1D4ED8',
                        }}
                      >
                        {getTaskStatusText(normStatus, lang)}
                      </span>
                      <span
                        style={{
                          fontSize: '10.5px',
                          fontWeight: '700',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: pColor.bg,
                          color: pColor.text,
                        }}
                      >
                        {getPriorityText(priority, lang)}
                      </span>
                    </div>
                  </div>

                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A', lineHeight: 1.4 }}>
                    {task.title}
                  </div>

                  {parent && (
                    <div style={{ fontSize: '11px', color: '#4F46E5', fontWeight: '600' }}>
                      🏷️ {isRtl ? 'تابعة للتذكرة' : 'Parent Ticket'}: #{parent.id} {parent.title}
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: '#64748B', marginTop: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Avatar name={formatMemberName(task.memberName, lang)} size="xs" />
                      <span>{formatMemberName(task.memberName, lang)}</span>
                    </div>

                    {event.urgency && (
                      <Badge variant={event.urgency.variant} size="sm">
                        ⏱️ {event.urgency.label}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

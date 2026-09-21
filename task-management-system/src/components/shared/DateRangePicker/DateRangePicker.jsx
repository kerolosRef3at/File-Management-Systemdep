import React, { useState, useRef, useEffect, useCallback } from 'react';

const WEEKDAYS_AR = ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'];
const WEEKDAYS_EN = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function toISODate(d) {
  if (!d) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseISODate(s) {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function formatDisplay(s, lang) {
  const d = parseISODate(s);
  if (!d) return null;
  return d.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB', { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * A single-icon date-range picker: one calendar icon opens a popover with
 * ONE month grid. You select the range yourself by hand — press on a day
 * and drag across the days you want (like painting a selection), or click
 * a start day then click an end day. Nothing is applied until you press
 * "Apply", so you stay in control of exactly what gets selected.
 */
export default function DateRangePicker({
  startDate, // ISO 'YYYY-MM-DD' or ''
  endDate, // ISO 'YYYY-MM-DD' or ''
  onChange, // ({ start, end }) => void
  lang = 'ar',
  placeholder,
  style = {},
}) {
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => {
    const d = parseISODate(startDate) || new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  // Working selection — only committed to onChange() when "Apply" is pressed.
  const [pendingStart, setPendingStart] = useState(null);
  const [pendingEnd, setPendingEnd] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef(null);
  const isRtl = lang === 'ar';
  const weekdays = isRtl ? WEEKDAYS_AR : WEEKDAYS_EN;
  const months = isRtl ? MONTHS_AR : MONTHS_EN;

  // Sync pending selection from committed props whenever the popover opens
  useEffect(() => {
    if (open) {
      setPendingStart(parseISODate(startDate));
      setPendingEnd(parseISODate(endDate));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    function handleOutsideClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [open]);

  // Finish a drag anywhere on the page (not just over a day cell)
  useEffect(() => {
    function handleMouseUp() {
      setIsDragging(false);
    }
    if (isDragging) document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [isDragging]);

  const handleDayMouseDown = useCallback((day) => {
    setIsDragging(true);
    setPendingStart(day);
    setPendingEnd(day);
  }, []);

  const handleDayMouseEnter = useCallback(
    (day) => {
      if (isDragging) setPendingEnd(day);
    },
    [isDragging]
  );

  const changeMonth = (delta) => {
    setViewMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  const rangeStart = pendingStart && pendingEnd && pendingStart > pendingEnd ? pendingEnd : pendingStart;
  const rangeEnd = pendingStart && pendingEnd && pendingStart > pendingEnd ? pendingStart : pendingEnd;

  const handleApply = () => {
    onChange({ start: toISODate(rangeStart), end: toISODate(rangeEnd) });
    setOpen(false);
  };

  const handleClear = () => {
    setPendingStart(null);
    setPendingEnd(null);
    onChange({ start: '', end: '' });
    setOpen(false);
  };

  const handleCancel = () => {
    setOpen(false);
  };

  // Build the grid of days for the visible month (including leading blanks)
  const firstOfMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
  const leadingBlanks = firstOfMonth.getDay();
  const cells = [];
  for (let i = 0; i < leadingBlanks; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d));

  const isSameDay = (a, b) => a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const isInRange = (d) => rangeStart && rangeEnd && d > rangeStart && d < rangeEnd;

  const committedStart = parseISODate(startDate);
  const committedEnd = parseISODate(endDate);
  const displayText =
    committedStart && committedEnd
      ? `${formatDisplay(startDate, lang)} → ${formatDisplay(endDate, lang)}`
      : placeholder || (isRtl ? 'اختر الفترة الزمنية' : 'Select date range');

  return (
    <div ref={containerRef} style={{ position: 'relative', fontFamily: 'Cairo, sans-serif', ...style }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '9px 13px',
          height: '42px',
          border: `1.5px solid ${open ? '#1565C0' : '#E2E8F0'}`,
          borderRadius: '10px',
          background: '#FAFBFD',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: committedStart ? '700' : '500',
          color: committedStart ? '#0F172A' : '#94A3B8',
          fontFamily: 'Cairo, sans-serif',
          whiteSpace: 'nowrap',
          boxShadow: open ? '0 0 0 3px rgba(21, 101, 192, 0.12)' : 'none',
          transition: 'border-color 0.18s, box-shadow 0.18s',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: '#1565C0' }}>
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        {displayText}
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            insetInlineStart: 0,
            zIndex: 50,
            background: '#FFFFFF',
            border: '1px solid #E8EDF5',
            borderRadius: '14px',
            boxShadow: '0 12px 32px rgba(15, 23, 42, 0.14)',
            padding: '14px',
            width: '280px',
            userSelect: isDragging ? 'none' : 'auto',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <button type="button" onClick={() => changeMonth(isRtl ? 1 : -1)} style={navBtnStyle}>
              {isRtl ? '›' : '‹'}
            </button>
            <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#0F172A' }}>
              {months[viewMonth.getMonth()]} {viewMonth.getFullYear()}
            </div>
            <button type="button" onClick={() => changeMonth(isRtl ? -1 : 1)} style={navBtnStyle}>
              {isRtl ? '‹' : '›'}
            </button>
          </div>

          <div style={{ fontSize: '10.5px', color: '#94A3B8', textAlign: 'center', marginBottom: '8px' }}>
            {isRtl ? 'اضغط واسحب لتحديد الأيام، أو اضغط يومين منفصلين' : 'Press & drag to select days, or click two separate days'}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '4px' }}>
            {weekdays.map((w, i) => (
              <div key={i} style={{ textAlign: 'center', fontSize: '10.5px', fontWeight: '700', color: '#94A3B8', padding: '4px 0' }}>
                {w}
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
            {cells.map((day, i) => {
              if (!day) return <div key={i} />;
              const isStart = isSameDay(day, rangeStart);
              const isEnd = isSameDay(day, rangeEnd);
              const inRange = isInRange(day);
              return (
                <button
                  key={i}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleDayMouseDown(day);
                  }}
                  onMouseEnter={() => handleDayMouseEnter(day)}
                  style={{
                    height: '30px',
                    border: 'none',
                    borderRadius: isStart || isEnd ? '8px' : inRange ? '0' : '8px',
                    background: isStart || isEnd ? '#1565C0' : inRange ? '#DBEAFE' : 'transparent',
                    color: isStart || isEnd ? '#FFFFFF' : '#334155',
                    fontSize: '12.5px',
                    fontWeight: isStart || isEnd ? '800' : '600',
                    cursor: 'pointer',
                    fontFamily: 'Cairo, sans-serif',
                  }}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #F1F5F9' }}>
            <button
              type="button"
              onClick={handleClear}
              style={{ ...footerBtnStyle, color: '#DC2626', background: '#FEF2F2', flex: '0 0 auto' }}
            >
              {isRtl ? 'مسح' : 'Clear'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              style={{ ...footerBtnStyle, color: '#64748B', background: '#F1F5F9', flex: '0 0 auto' }}
            >
              {isRtl ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={!rangeStart}
              style={{
                ...footerBtnStyle,
                color: '#FFFFFF',
                background: rangeStart ? '#1565C0' : '#CBD5E1',
                cursor: rangeStart ? 'pointer' : 'not-allowed',
                flex: 1,
              }}
            >
              {isRtl ? 'تطبيق' : 'Apply'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const navBtnStyle = {
  width: '26px',
  height: '26px',
  border: 'none',
  background: '#F1F5F9',
  borderRadius: '7px',
  cursor: 'pointer',
  fontSize: '15px',
  fontWeight: '700',
  color: '#334155',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const footerBtnStyle = {
  border: 'none',
  borderRadius: '8px',
  padding: '8px 12px',
  fontSize: '12px',
  fontWeight: '800',
  fontFamily: 'Cairo, sans-serif',
};

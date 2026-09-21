import React from 'react';

export default function QuickStatsStripe({
  stats = [
    { label: { ar: 'إجمالي التذاكر', en: 'Total Tickets' }, value: 142, color: '#1565C0', bg: '#EFF6FF' },
    { label: { ar: 'تذاكر جديدة', en: 'New / Open' }, value: 24, color: '#0284C7', bg: '#F0F9FF' },
    { label: { ar: 'قيد المعالجة', en: 'In Progress' }, value: 38, color: '#B45309', bg: '#FFFBEB' },
    { label: { ar: 'تم الحل', en: 'Resolved' }, value: 72, color: '#166534', bg: '#F0FDF4' },
    { label: { ar: 'حرجة / عاجلة', en: 'Critical' }, value: 5, color: '#991B1B', bg: '#FEF2F2' },
    { label: { ar: 'نسبة الالتزام بالـ SLA', en: 'SLA Met' }, value: '94%', color: '#6B21A8', bg: '#F5F3FF' },
  ],
  lang = 'ar',
  onStatClick,
  className = '',
  style = {},
}) {
  return (
    <div
      className={`rg-6 stat-stripe ${className}`}
      style={{
        background: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #E8EDF5',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        overflow: 'hidden',
        marginBottom: '20px',
        fontFamily: 'Cairo, sans-serif',
        ...style,
      }}
    >
      {stats.map((s, i) => (
        <div
          key={i}
          onClick={() => onStatClick && onStatClick(s, i)}
          style={{
            textAlign: 'center',
            padding: '16px 10px',
            borderInlineEnd: i < stats.length - 1 ? '1px solid #F1F5F9' : 'none',
            cursor: onStatClick ? 'pointer' : 'default',
            transition: 'background-color 0.15s',
          }}
          onMouseEnter={(e) => {
            if (onStatClick) e.currentTarget.style.background = s.bg;
          }}
          onMouseLeave={(e) => {
            if (onStatClick) e.currentTarget.style.background = 'transparent';
          }}
        >
          <div
            style={{
              fontSize: typeof s.value === 'string' ? '24px' : '28px',
              fontWeight: '900',
              color: s.color,
              lineHeight: 1,
              marginBottom: '5px',
            }}
          >
            {s.value}
          </div>
          <div style={{ fontSize: '12.5px', color: '#64748B', fontWeight: '700' }}>
            {s.label[lang] || s.label}
          </div>
        </div>
      ))}
    </div>
  );
}

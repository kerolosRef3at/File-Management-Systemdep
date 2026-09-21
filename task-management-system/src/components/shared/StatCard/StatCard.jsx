import React from 'react';

export default function StatCard({
  label,
  value,
  note,
  icon,
  color = 'blue', // 'blue' | 'green' | 'red' | 'amber' | 'purple'
  trend,          // { value: '+12%', isPositive: true }
  onClick,
  className = '',
  style = {},
}) {
  const colorMap = {
    blue: { text: '#1565C0', bg: '#EFF6FF', border: '#BFDBFE' },
    green: { text: '#166534', bg: '#F0FDF4', border: '#BBF7D0' },
    red: { text: '#991B1B', bg: '#FEF2F2', border: '#FECACA' },
    amber: { text: '#B45309', bg: '#FFFBEB', border: '#FDE68A' },
    purple: { text: '#6B21A8', bg: '#F5F3FF', border: '#DDD6FE' },
  };

  const scheme = colorMap[color] || colorMap.blue;

  return (
    <div
      onClick={onClick}
      className={`stat-card ${className}`}
      style={{
        background: '#FFFFFF',
        borderRadius: '16px',
        padding: '20px',
        border: '1px solid #E8EDF5',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: onClick ? 'pointer' : 'default',
        transition: onClick ? 'all 0.2s ease' : 'none',
        fontFamily: 'Cairo, sans-serif',
        ...style,
      }}
      onMouseEnter={onClick ? (e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.08)';
      } : undefined}
      onMouseLeave={onClick ? (e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)';
      } : undefined}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div>
          <div className="stat-label" style={{ fontSize: '13px', color: '#64748B', fontWeight: '700', marginBottom: '4px' }}>
            {label}
          </div>
          <div className="stat-value" style={{ fontSize: '28px', fontWeight: '900', color: scheme.text, lineHeight: 1 }}>
            {value}
          </div>
        </div>

        {icon && (
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: scheme.bg,
              border: `1px solid ${scheme.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              color: scheme.text,
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
        )}
      </div>

      {(note || trend) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
          {trend && (
            <span
              style={{
                fontSize: '11.5px',
                fontWeight: '800',
                padding: '2px 6px',
                borderRadius: '6px',
                background: trend.isPositive ? '#DCFCE7' : '#FEE2E2',
                color: trend.isPositive ? '#166534' : '#991B1B',
              }}
            >
              {trend.isPositive ? '↑' : '↓'} {trend.value}
            </span>
          )}
          {note && (
            <span className="stat-note" style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '600' }}>
              {note}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

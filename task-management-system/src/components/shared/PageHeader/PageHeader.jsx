import React from 'react';

export default function PageHeader({
  title,
  subtitle,
  badge,
  actions,
  breadcrumbs,
  className = '',
  style = {},
}) {
  return (
    <div
      className={`page-hdr ${className}`}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '14px',
        marginBottom: '22px',
        paddingBottom: '20px',
        borderBottom: '1.5px solid #E8EDF5',
        fontFamily: 'Cairo, sans-serif',
        ...style,
      }}
    >
      <div>
        {breadcrumbs && (
          <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '4px', display: 'flex', gap: '6px' }}>
            {breadcrumbs}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
            {title}
          </h1>
          {badge && <div>{badge}</div>}
        </div>
        {subtitle && (
          <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0', fontWeight: '500' }}>
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="page-hdr-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {actions}
        </div>
      )}
    </div>
  );
}

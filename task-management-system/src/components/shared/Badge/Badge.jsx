import React from 'react';

export default function Badge({
  children,
  variant = 'blue', // 'green' | 'red' | 'amber' | 'blue' | 'purple' | 'gray'
  size = 'md',      // 'sm' | 'md' | 'lg'
  dot = false,
  icon = null,
  className = '',
  style = {},
}) {
  const variantStyles = {
    green: {
      background: '#DCFCE7',
      color: '#166534',
      border: '1px solid #BBF7D0',
      dotColor: '#16A34A',
    },
    red: {
      background: '#FEE2E2',
      color: '#991B1B',
      border: '1px solid #FECACA',
      dotColor: '#DC2626',
    },
    amber: {
      background: '#FEF3C7',
      color: '#B45309',
      border: '1px solid #FDE68A',
      dotColor: '#D97706',
    },
    blue: {
      background: '#DBEAFE',
      color: '#1565C0',
      border: '1px solid #BFDBFE',
      dotColor: '#2563EB',
    },
    purple: {
      background: '#EDE9FE',
      color: '#6B21A8',
      border: '1px solid #DDD6FE',
      dotColor: '#9333EA',
    },
    gray: {
      background: '#F1F5F9',
      color: '#475569',
      border: '1px solid #E2E8F0',
      dotColor: '#94A3B8',
    },
  };

  const sizeStyles = {
    sm: { padding: '2px 8px', fontSize: '11px', height: '20px' },
    md: { padding: '4px 12px', fontSize: '12px', height: '24px' },
    lg: { padding: '6px 14px', fontSize: '13px', height: '28px' },
  };

  const curVariant = variantStyles[variant] || variantStyles.blue;
  const curSize = sizeStyles[size] || sizeStyles.md;

  return (
    <span
      className={`badge badge-${variant} ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        borderRadius: '999px',
        fontWeight: '700',
        whiteSpace: 'nowrap',
        fontFamily: 'Cairo, sans-serif',
        lineHeight: 1,
        ...curVariant,
        ...curSize,
        ...style,
      }}
    >
      {dot && (
        <span
          style={{
            width: size === 'sm' ? '5px' : '6px',
            height: size === 'sm' ? '5px' : '6px',
            borderRadius: '50%',
            background: curVariant.dotColor,
            flexShrink: 0,
          }}
        />
      )}
      {icon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
      <span>{children}</span>
    </span>
  );
}

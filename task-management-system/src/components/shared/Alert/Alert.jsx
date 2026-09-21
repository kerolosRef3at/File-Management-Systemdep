import React, { useState } from 'react';

export default function Alert({
  variant = 'info', // 'success' | 'error' | 'warning' | 'info'
  title,
  children,
  dismissible = false,
  onDismiss,
  icon,
  className = '',
  style = {},
}) {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const variantStyles = {
    success: {
      background: '#F0FDF4',
      border: '1px solid #BBF7D0',
      color: '#166534',
      icon: '✓',
      iconBg: '#DCFCE7',
    },
    error: {
      background: '#FEF2F2',
      border: '1px solid #FECACA',
      color: '#991B1B',
      icon: '⚠',
      iconBg: '#FEE2E2',
    },
    warning: {
      background: '#FFFBEB',
      border: '1px solid #FDE68A',
      color: '#B45309',
      icon: '!',
      iconBg: '#FEF3C7',
    },
    info: {
      background: '#EFF6FF',
      border: '1px solid #BFDBFE',
      color: '#1565C0',
      icon: 'ℹ',
      iconBg: '#DBEAFE',
    },
  };

  const v = variantStyles[variant] || variantStyles.info;

  const handleDismiss = () => {
    setVisible(false);
    if (onDismiss) onDismiss();
  };

  return (
    <div
      className={`alert-banner ${className}`}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '12px 16px',
        borderRadius: '12px',
        background: v.background,
        border: v.border,
        color: v.color,
        fontFamily: 'Cairo, sans-serif',
        fontSize: '13px',
        ...style,
      }}
    >
      <div
        style={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          background: v.iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: '900',
          flexShrink: 0,
          marginTop: '1px',
        }}
      >
        {icon || v.icon}
      </div>

      <div style={{ flex: 1 }}>
        {title && (
          <div style={{ fontWeight: '800', marginBottom: children ? '3px' : '0', fontSize: '13.5px' }}>
            {title}
          </div>
        )}
        {children && <div style={{ lineHeight: 1.5, opacity: 0.95 }}>{children}</div>}
      </div>

      {dismissible && (
        <button
          type="button"
          onClick={handleDismiss}
          style={{
            background: 'none',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer',
            fontSize: '14px',
            opacity: 0.6,
            padding: '2px 4px',
            lineHeight: 1,
            flexShrink: 0,
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
        >
          ✕
        </button>
      )}
    </div>
  );
}

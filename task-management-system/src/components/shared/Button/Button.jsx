import React from 'react';
import Spinner from '../Spinner/Spinner';

export default function Button({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'success'
  size = 'md',        // 'sm' | 'md' | 'lg'
  icon = null,
  iconPosition = 'start', // 'start' | 'end'
  loading = false,
  disabled = false,
  fullWidth = false,
  onClick,
  type = 'button',
  className = '',
  style = {},
  ...props
}) {
  const isDisabled = disabled || loading;

  const sizeStyles = {
    sm: { padding: '6px 12px', fontSize: '12px', borderRadius: '8px', height: '32px' },
    md: { padding: '9px 18px', fontSize: '13.5px', borderRadius: '10px', height: '40px' },
    lg: { padding: '12px 24px', fontSize: '15px', borderRadius: '12px', height: '48px' },
  };

  const variantStyles = {
    primary: {
      background: '#1565C0',
      color: '#FFFFFF',
      border: '1px solid #1565C0',
      hoverBg: '#0D47A1',
      hoverBorder: '#0D47A1',
      boxShadow: '0 2px 6px rgba(21, 101, 192, 0.25)',
    },
    secondary: {
      background: '#F1F5F9',
      color: '#334155',
      border: '1px solid #E2E8F0',
      hoverBg: '#E2E8F0',
      hoverBorder: '#CBD5E1',
      boxShadow: 'none',
    },
    outline: {
      background: 'transparent',
      color: '#1565C0',
      border: '1.5px solid #1565C0',
      hoverBg: '#EFF6FF',
      hoverBorder: '#1565C0',
      boxShadow: 'none',
    },
    danger: {
      background: '#DC2626',
      color: '#FFFFFF',
      border: '1px solid #DC2626',
      hoverBg: '#B91C1C',
      hoverBorder: '#B91C1C',
      boxShadow: '0 2px 6px rgba(220, 38, 38, 0.25)',
    },
    success: {
      background: '#16A34A',
      color: '#FFFFFF',
      border: '1px solid #16A34A',
      hoverBg: '#15803D',
      hoverBorder: '#15803D',
      boxShadow: '0 2px 6px rgba(22, 163, 74, 0.25)',
    },
    ghost: {
      background: 'transparent',
      color: '#64748B',
      border: '1px solid transparent',
      hoverBg: '#F1F5F9',
      hoverBorder: 'transparent',
      boxShadow: 'none',
    },
  };

  const curVariant = variantStyles[variant] || variantStyles.primary;
  const curSize = sizeStyles[size] || sizeStyles.md;

  const baseStyle = {
    display: fullWidth ? 'flex' : 'inline-flex',
    width: fullWidth ? '100%' : 'auto',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    opacity: isDisabled ? 0.65 : 1,
    fontFamily: 'Cairo, sans-serif',
    fontWeight: '700',
    transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
    outline: 'none',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    ...curSize,
    background: curVariant.background,
    color: curVariant.color,
    border: curVariant.border,
    boxShadow: curVariant.boxShadow,
    ...style,
  };

  const handleMouseEnter = (e) => {
    if (!isDisabled) {
      e.currentTarget.style.background = curVariant.hoverBg;
      e.currentTarget.style.borderColor = curVariant.hoverBorder;
      if (variant === 'primary' || variant === 'danger' || variant === 'success') {
        e.currentTarget.style.transform = 'translateY(-1px)';
      }
    }
  };

  const handleMouseLeave = (e) => {
    if (!isDisabled) {
      e.currentTarget.style.background = curVariant.background;
      e.currentTarget.style.borderColor = curVariant.border.split(' ')[2] || curVariant.border;
      e.currentTarget.style.transform = 'translateY(0)';
    }
  };

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`btn-component ${className}`}
      style={baseStyle}
      {...props}
    >
      {loading ? (
        <Spinner
          size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16}
          color={variant === 'outline' || variant === 'ghost' ? '#1565C0' : 'currentColor'}
        />
      ) : (
        <>
          {icon && iconPosition === 'start' && (
            <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>
          )}
          <span>{children}</span>
          {icon && iconPosition === 'end' && (
            <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>
          )}
        </>
      )}
    </button>
  );
}

import React from 'react';

export default function Toggle({
  checked = false,
  onChange,
  label,
  description,
  disabled = false,
  size = 'md', // 'sm' | 'md' | 'lg'
  name,
  id,
  className = '',
  style = {},
}) {
  const sizeMap = {
    sm: { trackW: 36, trackH: 20, thumbD: 14, translate: 16 },
    md: { trackW: 46, trackH: 26, thumbD: 20, translate: 20 },
    lg: { trackW: 56, trackH: 32, thumbD: 24, translate: 24 },
  };

  const s = sizeMap[size] || sizeMap.md;

  const handleToggle = () => {
    if (!disabled && onChange) {
      onChange(!checked);
    }
  };

  return (
    <div
      id={id}
      data-name={name}
      className={`toggle-group ${className}`}
      onClick={handleToggle}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '12px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        userSelect: 'none',
        opacity: disabled ? 0.6 : 1,
        fontFamily: 'Cairo, sans-serif',
        ...style,
      }}
    >
      <div
        role="switch"
        aria-checked={checked}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            handleToggle();
          }
        }}
        style={{
          position: 'relative',
          width: `${s.trackW}px`,
          height: `${s.trackH}px`,
          borderRadius: '999px',
          background: checked ? '#1565C0' : '#E2E8F0',
          transition: 'background-color 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
          flexShrink: 0,
          boxShadow: checked ? '0 2px 6px rgba(21, 101, 192, 0.3)' : 'inset 0 1px 2px rgba(0,0,0,0.06)',
          outline: 'none',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: `${(s.trackH - s.thumbD) / 2}px`,
            left: `${(s.trackH - s.thumbD) / 2}px`,
            width: `${s.thumbD}px`,
            height: `${s.thumbD}px`,
            borderRadius: '50%',
            background: '#FFFFFF',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            transition: 'transform 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: checked ? `translateX(${s.translate}px)` : 'translateX(0)',
          }}
        />
      </div>

      {(label || description) && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {label && (
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B', lineHeight: 1.3 }}>
              {label}
            </span>
          )}
          {description && (
            <span style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
              {description}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

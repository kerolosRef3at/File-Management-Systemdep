import React from 'react';

export default function Checkbox({
  checked = false,
  onChange,
  indeterminate = false,
  label,
  description,
  disabled = false,
  name,
  id,
  className = '',
  style = {},
}) {
  const handleChange = (e) => {
    if (!disabled && onChange) {
      onChange(e.target.checked);
    }
  };

  return (
    <label
      htmlFor={id}
      className={`checkbox-component ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'flex-start',
        gap: '9px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        userSelect: 'none',
        opacity: disabled ? 0.6 : 1,
        fontFamily: 'Cairo, sans-serif',
        ...style,
      }}
    >
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginTop: '2px' }}>
        <input
          type="checkbox"
          id={id}
          name={name}
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
        />
        <div
          style={{
            width: '18px',
            height: '18px',
            borderRadius: '5px',
            border: `1.5px solid ${checked || indeterminate ? '#1565C0' : '#CBD5E1'}`,
            background: checked || indeterminate ? '#1565C0' : '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.18s ease',
            boxShadow: checked ? '0 2px 5px rgba(21, 101, 192, 0.25)' : 'none',
          }}
        >
          {indeterminate ? (
            <svg width="10" height="2" viewBox="0 0 10 2" fill="none">
              <rect width="10" height="2" rx="1" fill="white" />
            </svg>
          ) : checked ? (
            <svg width="11" height="9" viewBox="0 0 12 10" fill="none">
              <path
                d="M1 5L4.5 8.5L11 1.5"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : null}
        </div>
      </div>

      {(label || description) && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {label && (
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#1E293B', lineHeight: 1.3 }}>
              {label}
            </span>
          )}
          {description && (
            <span style={{ fontSize: '11.5px', color: '#64748B', marginTop: '1px' }}>
              {description}
            </span>
          )}
        </div>
      )}
    </label>
  );
}

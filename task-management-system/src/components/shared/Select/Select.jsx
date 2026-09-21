import React, { useState } from 'react';

export default function Select({
  label,
  value,
  onChange,
  options = [], // [{ value: '...', label: '...' }]
  placeholder,
  error,
  hint,
  required = false,
  disabled = false,
  fullWidth = true,
  name,
  id,
  className = '',
  style = {},
  selectStyle = {},
  children,
  ...props
}) {
  const [isFocused, setIsFocused] = useState(false);
  const hasError = Boolean(error);

  const containerStyle = {
    display: fullWidth ? 'flex' : 'inline-flex',
    flexDirection: 'column',
    width: fullWidth ? '100%' : 'auto',
    fontFamily: 'Cairo, sans-serif',
    ...style,
  };

  const baseSelectStyle = {
    width: '100%',
    height: '42px',
    padding: '9px 13px',
    paddingInlineEnd: '36px',
    border: `1.5px solid ${hasError ? '#FCA5A5' : isFocused ? '#1565C0' : '#E2E8F0'}`,
    borderRadius: '10px',
    fontSize: '13.5px',
    fontFamily: 'Cairo, sans-serif',
    outline: 'none',
    background: disabled ? '#F8FAFC' : hasError ? '#FFFBFB' : '#FAFBFD',
    boxSizing: 'border-box',
    color: disabled ? '#94A3B8' : '#0F172A',
    boxShadow: isFocused ? '0 0 0 3px rgba(21, 101, 192, 0.12)' : 'none',
    transition: 'border-color 0.18s, box-shadow 0.18s, background 0.18s',
    cursor: disabled ? 'not-allowed' : 'pointer',
    appearance: 'none',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    ...selectStyle,
  };

  return (
    <div className={`select-field-group ${className}`} style={containerStyle}>
      {label && (
        <label
          htmlFor={id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12.5px',
            fontWeight: '700',
            color: '#334155',
            marginBottom: '6px',
            userSelect: 'none',
          }}
        >
          {label}
          {required && <span style={{ color: '#DC2626', fontWeight: '800' }}>*</span>}
          {hint && (
            <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '500', marginInlineStart: '4px' }}>
              ({hint})
            </span>
          )}
        </label>
      )}

      <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
        <select
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={baseSelectStyle}
          {...props}
        >
          {placeholder && (
            <option value="" disabled hidden={required}>
              {placeholder}
            </option>
          )}
          {options.length > 0
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>

        {/* Custom Chevron Arrow */}
        <span
          style={{
            position: 'absolute',
            insetInlineEnd: '12px',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            color: disabled ? '#CBD5E1' : isFocused ? '#1565C0' : '#64748B',
            transition: 'color 0.18s',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </div>

      {hasError && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '11.5px',
            color: '#DC2626',
            marginTop: '4px',
            fontWeight: '700',
          }}
        >
          <span style={{ fontSize: '9px' }}>●</span>
          {error}
        </div>
      )}
    </div>
  );
}

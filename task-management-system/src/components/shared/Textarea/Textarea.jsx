import React, { useState } from 'react';

export default function Textarea({
  label,
  value,
  onChange,
  placeholder,
  error,
  hint,
  required = false,
  disabled = false,
  readOnly = false,
  rows = 4,
  maxLength,
  showCount = false,
  fullWidth = true,
  name,
  id,
  className = '',
  style = {},
  textareaStyle = {},
  ...props
}) {
  const [isFocused, setIsFocused] = useState(false);
  const hasError = Boolean(error);
  const currentLength = typeof value === 'string' ? value.length : 0;

  const containerStyle = {
    display: fullWidth ? 'flex' : 'inline-flex',
    flexDirection: 'column',
    width: fullWidth ? '100%' : 'auto',
    fontFamily: 'Cairo, sans-serif',
    ...style,
  };

  const baseTextareaStyle = {
    width: '100%',
    padding: '10px 13px',
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
    resize: 'vertical',
    minHeight: '80px',
    cursor: disabled ? 'not-allowed' : 'text',
    ...textareaStyle,
  };

  return (
    <div className={`textarea-field-group ${className}`} style={containerStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
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

        {showCount && maxLength && (
          <span style={{ fontSize: '11px', color: currentLength > maxLength ? '#DC2626' : '#94A3B8', fontWeight: '600' }}>
            {currentLength}/{maxLength}
          </span>
        )}
      </div>

      <textarea
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        rows={rows}
        maxLength={maxLength}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={baseTextareaStyle}
        {...props}
      />

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

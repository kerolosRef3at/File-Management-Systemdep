import React, { useState } from 'react';

export function DateInput({
  label,
  value,
  onChange,
  error,
  hint,
  required = false,
  disabled = false,
  min,
  max,
  fullWidth = true,
  name,
  id,
  className = '',
  style = {},
  ...props
}) {
  const [isFocused, setIsFocused] = useState(false);
  const hasError = Boolean(error);

  return (
    <div
      className={`date-field-group ${className}`}
      style={{
        display: fullWidth ? 'flex' : 'inline-flex',
        flexDirection: 'column',
        width: fullWidth ? '100%' : 'auto',
        fontFamily: 'Cairo, sans-serif',
        ...style,
      }}
    >
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
        <input
          id={id}
          name={name}
          type="date"
          value={value}
          onChange={onChange}
          min={min}
          max={max}
          disabled={disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={{
            width: '100%',
            height: '42px',
            padding: '9px 13px',
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
            direction: 'ltr',
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}
          {...props}
        />
      </div>

      {hasError && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11.5px', color: '#DC2626', marginTop: '4px', fontWeight: '700' }}>
          <span style={{ fontSize: '9px' }}>●</span>
          {error}
        </div>
      )}
    </div>
  );
}

export function TimeInput({
  label,
  value,
  onChange,
  error,
  hint,
  required = false,
  disabled = false,
  fullWidth = true,
  name,
  id,
  className = '',
  style = {},
  ...props
}) {
  const [isFocused, setIsFocused] = useState(false);
  const hasError = Boolean(error);

  return (
    <div
      className={`time-field-group ${className}`}
      style={{
        display: fullWidth ? 'flex' : 'inline-flex',
        flexDirection: 'column',
        width: fullWidth ? '100%' : 'auto',
        fontFamily: 'Cairo, sans-serif',
        ...style,
      }}
    >
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

      <input
        id={id}
        name={name}
        type="time"
        value={value}
        onChange={onChange}
        disabled={disabled}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={{
          width: '100%',
          height: '42px',
          padding: '9px 13px',
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
          direction: 'ltr',
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
        {...props}
      />

      {hasError && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11.5px', color: '#DC2626', marginTop: '4px', fontWeight: '700' }}>
          <span style={{ fontSize: '9px' }}>●</span>
          {error}
        </div>
      )}
    </div>
  );
}

export function DateTimeRangePicker({
  fromLabel = 'من تاريخ',
  toLabel = 'إلى تاريخ',
  fromDate,
  toDate,
  onFromChange,
  onToChange,
  error,
  disabled = false,
  style = {},
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', ...style }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <DateInput
          label={fromLabel}
          value={fromDate}
          onChange={onFromChange}
          disabled={disabled}
          max={toDate}
        />
        <DateInput
          label={toLabel}
          value={toDate}
          onChange={onToChange}
          disabled={disabled}
          min={fromDate}
        />
      </div>
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11.5px', color: '#DC2626', marginTop: '4px', fontWeight: '700' }}>
          <span style={{ fontSize: '9px' }}>●</span>
          {error}
        </div>
      )}
    </div>
  );
}

export default DateInput;

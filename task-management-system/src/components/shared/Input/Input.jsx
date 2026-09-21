import React, { useState } from 'react';

export default function Input({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  hint,
  required = false,
  disabled = false,
  readOnly = false,
  leftIcon = null,
  rightIcon = null,
  fullWidth = true,
  name,
  id,
  className = '',
  style = {},
  inputStyle = {},
  autoComplete,
  dir,
  onKeyDown,
  showText, // استقبالها هنا لاستبعادها من الـ DOM
  hideText, // استقبالها هنا لاستبعادها من الـ DOM
  ...props
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isPasswordType = type === 'password';
  const computedType = isPasswordType ? (showPassword ? 'text' : 'password') : type;
  // Password fields no longer force LTR — their direction (and therefore
  // which side the show/hide button lands on) follows whatever `dir` the
  // caller passes, which should reflect the page's language (rtl for
  // Arabic, ltr for English). Email/number/tel still default to LTR since
  // those are always Latin-script values regardless of page language.
  const effectiveDir = dir || (type === 'email' || type === 'number' || type === 'tel' ? 'ltr' : undefined);

  const hasError = Boolean(error);

  const containerStyle = {
    display: fullWidth ? 'flex' : 'inline-flex',
    flexDirection: 'column',
    width: fullWidth ? '100%' : 'auto',
    fontFamily: 'Cairo, sans-serif',
    ...style,
  };

  const inputWrapperStyle = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    direction: effectiveDir,
  };

  const baseInputStyle = {
    width: '100%',
    height: '42px',
    padding: '9px 13px',
    paddingInlineStart: leftIcon ? '38px' : '13px',
    paddingInlineEnd: isPasswordType ? '82px' : rightIcon ? '42px' : '13px',
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
    cursor: disabled ? 'not-allowed' : 'text',
    direction: effectiveDir,
    ...inputStyle,
  };

  const showLabel = showText || 'إظهار';
  const hideLabel = hideText || 'إخفاء';

  return (
    <div className={`input-field-group ${className}`} style={containerStyle}>
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

      <div style={inputWrapperStyle}>
        {leftIcon && (
          <span
            style={{
              position: 'absolute',
              insetInlineStart: '12px',
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none',
              color: isFocused ? '#1565C0' : '#94A3B8',
              transition: 'color 0.18s',
            }}
          >
            {leftIcon}
          </span>
        )}

        <input
          id={id}
          name={name}
          type={computedType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          autoComplete={autoComplete}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={onKeyDown}
          style={baseInputStyle}
          {...props}
        />

        {isPasswordType ? (
          <button
            type="button"
            tabIndex={-1}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setShowPassword((p) => !p)}
            style={{
              position: 'absolute',
              insetInlineEnd: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              border: 'none',
              background: 'rgba(21, 101, 192, 0.07)',
              cursor: 'pointer',
              color: '#1565C0',
              fontWeight: '700',
              fontSize: '12px',
              fontFamily: 'Cairo, sans-serif',
              padding: '4px 8px',
              borderRadius: '6px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              userSelect: 'none',
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(21, 101, 192, 0.14)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(21, 101, 192, 0.07)')}
            aria-label={showPassword ? hideLabel : showLabel}
            title={showPassword ? hideLabel : showLabel}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {showPassword ? (
                <>
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </>
              ) : (
                <>
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </>
              )}
            </svg>
            <span>{showPassword ? hideLabel : showLabel}</span>
          </button>
        ) : rightIcon ? (
          <span
            style={{
              position: 'absolute',
              insetInlineEnd: '12px',
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none',
              color: isFocused ? '#1565C0' : '#94A3B8',
              transition: 'color 0.18s',
            }}
          >
            {rightIcon}
          </span>
        ) : null}
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
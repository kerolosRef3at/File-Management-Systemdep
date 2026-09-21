import React, { useEffect } from 'react';

export default function Modal({
  open = false,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = '680px',
  dir = 'rtl',
  className = '',
  style = {},
}) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      className={`modal-backdrop ${className}`}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(15, 23, 42, 0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        backdropFilter: 'blur(3px)',
        direction: dir,
        fontFamily: 'Cairo, sans-serif',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="modal-inner"
        style={{
          background: '#FFFFFF',
          borderRadius: '20px',
          width: '100%',
          maxWidth,
          maxHeight: '88vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 32px 80px rgba(0, 0, 0, 0.22)',
          animation: 'modalSlideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          ...style,
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #F1F5F9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <div>
            {title && (
              <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                {title}
              </h2>
            )}
            {subtitle && (
              <p style={{ fontSize: '12px', color: '#94A3B8', margin: '2px 0 0' }}>
                {subtitle}
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            style={{
              background: '#F1F5F9',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 12px',
              cursor: 'pointer',
              fontSize: '13px',
              color: '#475569',
              fontFamily: 'Cairo, sans-serif',
              fontWeight: '700',
              transition: 'all 0.18s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.9)';
              e.currentTarget.style.color = '#FFFFFF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#F1F5F9';
              e.currentTarget.style.color = '#475569';
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div
          style={{
            padding: '24px',
            overflowY: 'auto',
            overflowX: 'auto',
            flex: 1,
          }}
        >
          {children}
        </div>

        {/* Modal Footer */}
        {footer && (
          <div
            style={{
              padding: '14px 24px',
              borderTop: '1px solid #F1F5F9',
              background: '#F8FAFC',
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: '10px',
              flexShrink: 0,
            }}
          >
            {footer}
          </div>
        )}
      </div>

      <style>{`
        @keyframes modalSlideIn {
          from { opacity: 0; transform: scale(0.96) translateY(-8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}

import React from 'react';
import { translations } from '../../utils/constants';
import Button from './Button/Button';
import Spinner from './Spinner/Spinner';

export default function ConfirmDeleteModal({
  open = false,
  onClose,
  onConfirm,
  title,
  message,
  itemName,
  loading = false,
  lang = 'ar',
}) {
  const t = translations[lang] || translations.ar;
  const isRtl = lang === 'ar';

  if (!open) return null;

  return (
    <div
      onClick={loading ? undefined : onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        background: 'rgba(15, 23, 42, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backdropFilter: 'blur(4px)',
        direction: isRtl ? 'rtl' : 'ltr',
        fontFamily: 'Cairo, sans-serif',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#FFFFFF',
          borderRadius: '18px',
          width: '100%',
          maxWidth: '440px',
          overflow: 'hidden',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.25)',
          animation: 'modalSlideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Content Body */}
        <div style={{ padding: '24px 24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '14px' }}>
          {/* Danger Icon Badge */}
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#FEE2E2',
              color: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '26px',
              boxShadow: '0 0 0 8px #FEF2F2',
            }}
          >
            🗑️
          </div>

          {/* Title & Message */}
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', margin: '0 0 6px' }}>
              {title || t.delete}
            </h3>
            <p style={{ fontSize: '13px', color: '#64748B', margin: 0, lineHeight: 1.5 }}>
              {message || (lang === 'ar' ? 'هل أنت متأكد من رغبتك في الحذف؟ لا يمكن التراجع عن هذا الإجراء.' : 'Are you sure you want to proceed? This action cannot be undone.')}
            </p>
          </div>

          {/* Item Highlight Box (if provided) */}
          {itemName && (
            <div
              style={{
                width: '100%',
                padding: '10px 14px',
                background: '#F8FAFC',
                borderRadius: '10px',
                border: '1px solid #E2E8F0',
                fontSize: '13px',
                fontWeight: '700',
                color: '#1E293B',
                wordBreak: 'break-word',
              }}
            >
              {itemName}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid #F1F5F9',
            background: '#F8FAFC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '10px',
          }}
        >
          <Button
            variant="secondary"
            size="md"
            onClick={onClose}
            disabled={loading}
            style={{ flex: '1 1 0' }}
          >
            {t.cancel}
          </Button>

          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              flex: '1 1 0',
              padding: '10px 16px',
              borderRadius: '10px',
              border: 'none',
              background: '#DC2626',
              color: '#FFFFFF',
              fontWeight: '700',
              fontSize: '13.5px',
              fontFamily: 'Cairo, sans-serif',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              opacity: loading ? 0.7 : 1,
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.background = '#B91C1C';
            }}
            onMouseLeave={(e) => {
              if (!loading) e.currentTarget.style.background = '#DC2626';
            }}
          >
            {loading ? (
              <>
                <Spinner size="sm" />
                <span>{t.deleting}</span>
              </>
            ) : (
              <span>{t.delete}</span>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes modalSlideIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}

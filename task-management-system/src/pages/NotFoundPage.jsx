import React from 'react';
import { translations } from '../utils/constants';
import { Button } from '../components/shared';

export default function NotFoundPage({ lang = 'ar', onNavigate }) {
  const t = translations[lang] || translations.ar;
  const isRtl = lang === 'ar';

  return (
    <div
      style={{
        minHeight: '70vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        direction: isRtl ? 'rtl' : 'ltr',
        fontFamily: 'Cairo, sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: '520px',
          width: '100%',
          background: '#FFFFFF',
          borderRadius: '24px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 12px 36px rgba(15, 23, 42, 0.06)',
          padding: '40px 28px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
        }}
      >
        {/* Visual 404 Illustration Badge */}
        <div
          style={{
            position: 'relative',
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(21, 101, 192, 0.12)',
          }}
        >
          <span style={{ fontSize: '54px' }}>🔍</span>
          <span
            style={{
              position: 'absolute',
              bottom: '4px',
              [isRtl ? 'left' : 'right']: '4px',
              background: '#DC2626',
              color: '#FFFFFF',
              fontSize: '13px',
              fontWeight: '900',
              padding: '2px 8px',
              borderRadius: '99px',
              boxShadow: '0 2px 6px rgba(220, 38, 38, 0.3)',
            }}
          >
            404
          </span>
        </div>

        {/* Text Details */}
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '900', color: '#0F172A', margin: '0 0 8px' }}>
            {t.pageNotFound}
          </h1>
          <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.6, margin: 0, maxWidth: '400px' }}>
            {t.pageNotFoundDesc}
          </p>
        </div>

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            flexWrap: 'wrap',
            width: '100%',
            marginTop: '8px',
          }}
        >
          <Button
            variant="primary"
            size="lg"
            onClick={() => onNavigate && onNavigate('tickets')}
            style={{ flex: '1 1 180px' }}
          >
            🎫 {t.backToTickets}
          </Button>

          <Button
            variant="secondary"
            size="lg"
            onClick={() => onNavigate && onNavigate('dashboard')}
            style={{ flex: '1 1 160px' }}
          >
            📊 {t.backToDashboard}
          </Button>
        </div>
      </div>
    </div>
  );
}

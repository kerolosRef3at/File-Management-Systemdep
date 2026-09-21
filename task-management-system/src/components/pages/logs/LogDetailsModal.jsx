import React, { useEffect, useState } from 'react';
import { Modal, Spinner, Badge } from '../../shared';
import { translations, formatDateTime } from '../../../utils/constants';
import { getActionBadgeVariant, getActionLabel, getEntityLabel, resolveEntityDisplay } from '../../../utils/logHelpers';
import logService from '../../../services/logService';

export default function LogDetailsModal({ logId, onClose, lang = 'ar', lookups }) {
  const t = translations[lang] || translations.ar;
  const isRtl = lang === 'ar';

  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!logId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    logService
      .getLogById(logId)
      .then((data) => {
        if (!cancelled) setDetails(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || t.errorOccurred);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [logId, t.errorOccurred]);

  return (
    <Modal open={!!logId} onClose={onClose} title={t.logDetailsTitle} dir={isRtl ? 'rtl' : 'ltr'} maxWidth="560px">
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '30px' }}>
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <div style={{ color: '#DC2626', fontWeight: '700', textAlign: 'center', padding: '20px' }}>⚠️ {error}</div>
      ) : details ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Row label={t.timestamp} value={formatDateTime(details.createdAt, lang)} />
          <Row
            label={t.responsibleUser}
            value={details.userFullName ? `${details.userFullName} (${details.username || ''})` : t.systemUser}
          />
          <Row label={t.filterByAction} value={<Badge variant={getActionBadgeVariant(details.action)}>{getActionLabel(details.action, t)}</Badge>} />
          <Row label={t.affectedEntity} value={`${getEntityLabel(details.entityName, t)}: ${resolveEntityDisplay(details.entityName, details.entityId, lookups, t)}`} />

          <div>
            <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
              {t.fullDetailsLabel}
            </div>
            <div
              style={{
                padding: '14px',
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '10px',
                fontSize: '13px',
                color: '#334155',
                lineHeight: 1.7,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {details.details || '—'}
            </div>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', fontSize: '13px' }}>
      <span style={{ color: '#64748B', fontWeight: '600', flexShrink: 0 }}>{label}</span>
      <span style={{ color: '#0F172A', fontWeight: '700', textAlign: 'end' }}>{value}</span>
    </div>
  );
}

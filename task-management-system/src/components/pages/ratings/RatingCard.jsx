import React, { useState } from 'react';
import { Card, Badge, Button, Textarea } from '../../shared';
import { translations, formatDateTime } from '../../../utils/constants';
import { getFileUrl } from '../../../services/api';

export default function RatingCard({ rating, lang = 'ar', showApprovalActions = false, onApprove, onReject, currentUserId, currentUserRole, onEdit, onDelete }) {
  const t = translations[lang] || translations.ar;
  const [approvalComment, setApprovalComment] = useState('');
  const [busy, setBusy] = useState(false);

  const isStandard = rating.type === 'Standard';
  const isOwner = String(rating.fromUserId) === String(currentUserId);
  const isAdmin = currentUserRole === 'admin';
  // Matches the backend rule: you can edit/delete your own rating only
  // while it's pending; an Admin can delete any rating at any time.
  const canEdit = onEdit && isOwner && !rating.isApproved;
  const canDelete = onDelete && ((isOwner && !rating.isApproved) || isAdmin);

  const handleApprove = async () => {
    setBusy(true);
    try {
      await onApprove(rating.id, approvalComment);
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async () => {
    setBusy(true);
    try {
      await onReject(rating.id);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(t.deleteRatingConfirmMessage)) return;
    setBusy(true);
    try {
      await onDelete(rating.id);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <Card.Body>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A' }}>
              {t.from}: {rating.fromUserName} &nbsp;→&nbsp; {t.to}: {rating.toUserName}
            </div>
            <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '3px' }}>
              {formatDateTime(rating.createdAt, lang)}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <Badge variant={isStandard ? 'green' : 'amber'}>
              {isStandard ? t.standardType : t.reportType}
            </Badge>
            {rating.isApproved ? (
              <Badge variant="blue">{t.approvedStatus}</Badge>
            ) : (
              <Badge variant="gray">{t.pendingApprovalStatus}</Badge>
            )}
            <Badge variant="purple" size="lg">
              {t.score}: {rating.averageScore ?? 0}/10
            </Badge>
            {canEdit && (
              <Button variant="ghost" size="sm" onClick={() => onEdit(rating)}>
                ✏️ {t.edit}
              </Button>
            )}
            {canDelete && (
              <Button variant="ghost" size="sm" onClick={handleDelete} loading={busy} style={{ color: '#DC2626' }}>
                🗑️ {t.delete}
              </Button>
            )}
          </div>
        </div>

        {rating.comment && (
          <div style={{ marginTop: '12px', fontSize: '13px', color: '#475569', lineHeight: 1.6 }}>
            <strong style={{ color: '#334155' }}>{t.ratingComment}: </strong>
            {rating.comment}
          </div>
        )}

        {rating.fileUrl && (
          <a
            href={getFileUrl(rating.fileUrl)}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              marginTop: '10px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: '#EFF6FF',
              border: '1px solid #BFDBFE',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '700',
              color: '#1565C0',
              textDecoration: 'none',
            }}
          >
            📎 {t.viewAttachment}
          </a>
        )}

        {rating.rateItems && rating.rateItems.length > 0 && (
          <div
            style={{
              marginTop: '12px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            {rating.rateItems.map((ri) => (
              <div
                key={ri.id}
                style={{
                  padding: '6px 12px',
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '999px',
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#334155',
                }}
              >
                {ri.title}: <span style={{ color: '#1565C0' }}>{ri.value}/{ri.maxValue}</span>
              </div>
            ))}
          </div>
        )}

        {rating.isApproved && rating.approvedByName && (
          <div style={{ marginTop: '10px', fontSize: '12px', color: '#94A3B8' }}>
            {t.approvedByLabel}: {rating.approvedByName}
            {rating.approvalComment ? ` — "${rating.approvalComment}"` : ''}
          </div>
        )}

        {showApprovalActions && (
          <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #F1F5F9' }}>
            <Textarea
              placeholder={t.approvalCommentPlaceholder}
              value={approvalComment}
              onChange={(e) => setApprovalComment(e.target.value)}
              rows={2}
              style={{ marginBottom: '10px' }}
            />
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <Button variant="success" size="sm" onClick={handleApprove} loading={busy}>
                {t.approveRating}
              </Button>
              <Button variant="danger" size="sm" onClick={handleReject} loading={busy}>
                {t.rejectRating}
              </Button>
            </div>
          </div>
        )}
      </Card.Body>
    </Card>
  );
}

import React, { useState, useMemo, useEffect } from 'react';
import { Modal, Button, Input, Select, Textarea, Alert } from '../../shared';
import { translations } from '../../../utils/constants';

let localIdCounter = 0;
function nextLocalId() {
  localIdCounter += 1;
  return `local-${localIdCounter}`;
}

function buildDefaultItems(t) {
  return [
    { localId: nextLocalId(), title: t.defaultCriteriaSpeed, value: 8, maxValue: 10 },
    { localId: nextLocalId(), title: t.defaultCriteriaQuality, value: 8, maxValue: 10 },
    { localId: nextLocalId(), title: t.defaultCriteriaCommunication, value: 8, maxValue: 10 },
  ];
}

// `editingRating`: when provided, the modal switches to edit mode — the
// recipient can't be changed (only comment + scores), and it calls
// onSubmit({ isEdit: true, id, comment, rateItems }) instead of creating a
// brand-new rating.
export default function SubmitRatingModal({ open, onClose, onSubmit, users = [], currentUserId, lang = 'ar', editingRating = null }) {
  const t = translations[lang] || translations.ar;
  const isRtl = lang === 'ar';
  const isEditMode = Boolean(editingRating);

  const [targetUserId, setTargetUserId] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [comment, setComment] = useState('');
  const [items, setItems] = useState(() => buildDefaultItems(t));
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const selectableUsers = useMemo(() => {
    const term = userSearch.trim().toLowerCase();
    return (users || [])
      .filter((u) => String(u.id) !== String(currentUserId))
      .filter((u) => !term || (u.fullName || '').toLowerCase().includes(term) || (u.username || '').toLowerCase().includes(term));
  }, [users, userSearch, currentUserId]);

  // Populate fields when opening to edit an existing rating, or reset them
  // to a blank "new rating" form otherwise. Runs on every open so re-opening
  // for a different rating (or a fresh submission) always starts clean.
  useEffect(() => {
    if (!open) return;
    setError('');
    setAttachmentFile(null);
    if (editingRating) {
      setTargetUserId(String(editingRating.toUserId));
      setUserSearch('');
      setComment(editingRating.comment || '');
      setItems(
        (editingRating.rateItems || []).map((ri) => ({
          localId: nextLocalId(),
          title: ri.title,
          value: ri.value,
          maxValue: ri.maxValue,
        }))
      );
    } else {
      setTargetUserId('');
      setUserSearch('');
      setComment('');
      setItems(buildDefaultItems(t));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingRating]);

  if (!open) return null;

  const updateItem = (localId, field, value) => {
    setItems((prev) => prev.map((it) => (it.localId === localId ? { ...it, [field]: value } : it)));
  };

  const addItem = () => {
    setItems((prev) => [...prev, { localId: nextLocalId(), title: '', value: 8, maxValue: 10 }]);
  };

  const removeItem = (localId) => {
    setItems((prev) => (prev.length > 1 ? prev.filter((it) => it.localId !== localId) : prev));
  };

  const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.pdf', '.doc', '.docx'];
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB, matches backend limit

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setError('');
    if (!file) {
      setAttachmentFile(null);
      return;
    }
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setError(lang === 'ar' ? 'نوع الملف غير مدعوم. الأنواع المسموحة: jpg, png, pdf, doc, docx' : 'Unsupported file type. Allowed: jpg, png, pdf, doc, docx');
      e.target.value = '';
      setAttachmentFile(null);
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError(lang === 'ar' ? 'حجم الملف كبير جدًا. الحد الأقصى 10 ميجابايت' : 'File is too large. Maximum size is 10 MB');
      e.target.value = '';
      setAttachmentFile(null);
      return;
    }
    setAttachmentFile(file);
  };

  const handleSubmit = async () => {
    setError('');
    if (!isEditMode && !targetUserId) {
      setError(lang === 'ar' ? 'يرجى اختيار مستخدم لتقييمه' : 'Please select a user to rate');
      return;
    }
    const cleanItems = items.filter((it) => it.title && it.title.trim());
    if (cleanItems.length === 0) {
      setError(lang === 'ar' ? 'يرجى إضافة معيار تقييم واحد على الأقل' : 'Please add at least one rating criteria');
      return;
    }

    const normalizedItems = cleanItems.map((it) => ({
      title: it.title.trim(),
      value: Number(it.value),
      maxValue: Number(it.maxValue) || 10,
    }));

    setSubmitting(true);
    try {
      if (isEditMode) {
        await onSubmit({ isEdit: true, id: editingRating.id, comment, rateItems: normalizedItems });
      } else {
        await onSubmit({
          toUserId: targetUserId,
          comment,
          rateItems: normalizedItems,
          file: attachmentFile,
        });
      }
      // Reset on success
      setTargetUserId('');
      setUserSearch('');
      setComment('');
      setItems(buildDefaultItems(t));
      setAttachmentFile(null);
    } catch (err) {
      setError(err.message || t.errorOccurred);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={submitting ? undefined : onClose}
      title={isEditMode ? t.editRatingTitle : t.submitRatingTitle}
      dir={isRtl ? 'rtl' : 'ltr'}
      maxWidth="600px"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            {t.cancel}
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={submitting}>
            {submitting ? t.submittingRating : isEditMode ? t.saveChangesBtn : t.submitRatingBtn}
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {error && <Alert variant="error">{error}</Alert>}

        <div>
          {isEditMode ? (
            <div>
              <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>
                {t.targetUserLabel}
              </label>
              <div style={{ padding: '10px 14px', background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: '10px', fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>
                {editingRating.toUserName}
              </div>
            </div>
          ) : (
            <>
              <Input
                label={t.targetUserLabel}
                placeholder={t.targetUserPlaceholder}
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                style={{ marginBottom: '8px' }}
              />
              <Select
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                placeholder={t.targetUserPlaceholder}
                options={selectableUsers.map((u) => ({
                  value: String(u.id),
                  label: `${u.fullName || u.username}${u.jobTitle ? ` — ${u.jobTitle}` : ''}`,
                }))}
              />
            </>
          )}
        </div>

        <Textarea
          label={t.generalCommentLabel}
          placeholder={t.generalCommentPlaceholder}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          maxLength={1000}
          showCount
        />

        {!isEditMode && (
        <div>
          <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>
            {t.attachmentLabel}
          </label>
          <div style={{ fontSize: '11.5px', color: '#94A3B8', marginBottom: '8px' }}>
            {t.attachmentHint}
          </div>

          {attachmentFile ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
                padding: '9px 12px',
                background: '#F0FDF4',
                border: '1.5px solid #BBF7D0',
                borderRadius: '10px',
              }}
            >
              <span style={{ fontSize: '12.5px', color: '#166534', fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                📎 {attachmentFile.name}
              </span>
              <button
                type="button"
                onClick={() => setAttachmentFile(null)}
                style={{ background: 'transparent', border: 'none', color: '#DC2626', cursor: 'pointer', fontSize: '13px', flexShrink: 0 }}
              >
                ✕
              </button>
            </div>
          ) : (
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                borderRadius: '10px',
                border: '1.5px dashed #CBD5E1',
                fontSize: '12.5px',
                fontWeight: '700',
                color: '#1565C0',
                cursor: 'pointer',
                background: '#F8FAFC',
              }}
            >
              📎 {t.attachFileBtn}
              <input type="file" accept=".jpg,.jpeg,.png,.pdf,.doc,.docx" onChange={handleFileChange} style={{ display: 'none' }} />
            </label>
          )}
        </div>
        )}

        <div>
          <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '10px' }}>
            {t.ratingItemsLabel}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {items.map((it, idx) => (
              <div
                key={it.localId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  background: '#F8FAFC',
                  borderRadius: '10px',
                  border: '1px solid #E2E8F0',
                }}
              >
                <div style={{ flex: '1 1 auto', minWidth: 0 }}>
                  {idx < 3 && !isEditMode ? (
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>{it.title}</div>
                  ) : (
                    <input
                      type="text"
                      value={it.title}
                      onChange={(e) => updateItem(it.localId, 'title', e.target.value)}
                      placeholder={t.criteriaTitlePlaceholder}
                      style={{
                        width: '100%',
                        border: '1.5px solid #E2E8F0',
                        borderRadius: '8px',
                        padding: '6px 10px',
                        fontSize: '13px',
                        fontFamily: 'Cairo, sans-serif',
                        boxSizing: 'border-box',
                      }}
                    />
                  )}
                </div>

                <input
                  type="range"
                  min="0"
                  max={it.maxValue || 10}
                  step="0.5"
                  value={it.value}
                  onChange={(e) => updateItem(it.localId, 'value', e.target.value)}
                  style={{ width: '110px', flexShrink: 0 }}
                />

                <div
                  style={{
                    minWidth: '46px',
                    textAlign: 'center',
                    fontWeight: '800',
                    fontSize: '13px',
                    color: '#1565C0',
                    flexShrink: 0,
                  }}
                >
                  {it.value}/{it.maxValue}
                </div>

                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(it.localId)}
                    title={t.removeCriteriaItem}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#DC2626',
                      cursor: 'pointer',
                      fontSize: '14px',
                      padding: '2px 4px',
                      flexShrink: 0,
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          <Button variant="ghost" size="sm" onClick={addItem} style={{ marginTop: '10px' }}>
            {t.addCriteriaItem}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

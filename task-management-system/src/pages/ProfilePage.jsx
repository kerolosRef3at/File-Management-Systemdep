import React, { useState, useEffect, useCallback } from 'react';
import { translations, formatDateTime } from '../utils/constants';
import { PageHeader, Card, Avatar, Badge, Input, Button, Spinner, Alert } from '../components/shared';
import profileService from '../services/profileService';
import { getFileUrl } from '../services/api';

const ROLE_BADGE = {
  admin: 'purple',
  manager: 'blue',
  member: 'green',
};

export default function ProfilePage({ lang = 'ar', user, onProfileUpdated }) {
  const t = translations[lang] || translations.ar;
  const isRtl = lang === 'ar';

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Personal info form
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [signatureFile, setSignatureFile] = useState(null);
  const [signaturePreview, setSignaturePreview] = useState(null);
  const [savingInfo, setSavingInfo] = useState(false);
  const [infoError, setInfoError] = useState('');
  const [infoSuccess, setInfoSuccess] = useState('');

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await profileService.getProfile();
      setProfile(data);
      setFullName(data.fullName || '');
      setEmail(data.email || '');
      setPhone(data.phoneNumber || '');
      setJobTitle(data.jobTitle || '');
    } catch (err) {
      setLoadError(err.message || t.errorOccurred);
    } finally {
      setLoading(false);
    }
  }, [t.errorOccurred]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSignatureChange = (e) => {
    const file = e.target.files?.[0] || null;
    setSignatureFile(file);
    setSignaturePreview(file ? URL.createObjectURL(file) : null);
  };

  const handleSaveInfo = async () => {
    setInfoError('');
    setInfoSuccess('');
    if (!fullName.trim()) {
      setInfoError(lang === 'ar' ? 'الاسم الكامل مطلوب' : 'Full name is required');
      return;
    }
    setSavingInfo(true);
    try {
      await profileService.updateProfile({ fullName, email, phone, jobTitle, signature: signatureFile });
      setInfoSuccess(t.profileUpdatedSuccess);
      setSignatureFile(null);
      await loadProfile();
      if (onProfileUpdated) onProfileUpdated({ ...user, name: fullName, nameEn: fullName, email });
      setTimeout(() => setInfoSuccess(''), 4000);
    } catch (err) {
      setInfoError(err.message || t.errorOccurred);
    } finally {
      setSavingInfo(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError(t.required);
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError(t.passwordTooShortError);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(t.passwordMismatchError);
      return;
    }
    setSavingPassword(true);
    try {
      await profileService.changePassword({ currentPassword, newPassword });
      setPasswordSuccess(t.passwordUpdatedSuccess);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(''), 4000);
    } catch (err) {
      setPasswordError(err.message || t.errorOccurred);
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <Spinner size="lg" />
        <span style={{ fontSize: '13.5px', color: '#64748B', fontWeight: '600' }}>{t.loading}</span>
      </div>
    );
  }

  if (loadError || !profile) {
    return (
      <div style={{ padding: '36px', textAlign: 'center', background: '#FEF2F2', borderRadius: '12px', border: '1px solid #FCA5A5' }}>
        <div style={{ fontSize: '14px', color: '#DC2626', fontWeight: '700', marginBottom: '12px' }}>⚠️ {loadError}</div>
        <Button variant="secondary" size="sm" onClick={loadProfile}>
          {t.retry}
        </Button>
      </div>
    );
  }

  const roleKey = (profile.role || 'member').toLowerCase();
  const isBlocked = (profile.status || '').toLowerCase() === 'blocked';
  const currentSignatureUrl = signaturePreview || getFileUrl(profile.signatureUrl);

  return (
    <div style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
      <PageHeader title={t.profileTitle} subtitle={t.profileSubtitle} />

      {/* Profile Summary */}
      <Card style={{ marginBottom: '20px' }}>
        <Card.Body>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <Avatar name={profile.fullName} size="xl" />
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A' }}>{profile.fullName}</div>
              <div style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>@{profile.username}</div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                <Badge variant={ROLE_BADGE[roleKey] || 'gray'}>{profile.role}</Badge>
                <Badge variant={isBlocked ? 'red' : 'green'}>{profile.status}</Badge>
              </div>
            </div>
            <div style={{ textAlign: isRtl ? 'left' : 'right', fontSize: '12.5px', color: '#94A3B8' }}>
              <div>{t.accountCreatedOn}</div>
              <div style={{ fontWeight: '700', color: '#475569', marginTop: '2px' }}>{formatDateTime(profile.createdAt, lang)}</div>
            </div>
          </div>
        </Card.Body>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        {/* Card A: Personal Info & Signature */}
        <Card>
          <Card.Header title={t.personalInfoCard} />
          <Card.Body>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {infoError && <Alert variant="error">{infoError}</Alert>}
              {infoSuccess && <Alert variant="success">{infoSuccess}</Alert>}

              <Input label={t.fullNameLabel} required value={fullName} onChange={(e) => setFullName(e.target.value)} />
              <Input label={t.emailLabel} type="email" value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" />
              <Input label={t.phoneLabel} value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" />
              <Input label={t.jobTitleLabel} value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />

              <div>
                <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '8px' }}>
                  {t.signatureLabel}
                </label>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                  {currentSignatureUrl ? (
                    <img
                      src={currentSignatureUrl}
                      alt="signature"
                      style={{ height: '52px', maxWidth: '160px', objectFit: 'contain', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '6px', background: '#FFFFFF' }}
                    />
                  ) : (
                    <div style={{ fontSize: '12.5px', color: '#94A3B8', fontStyle: 'italic' }}>{t.noSignatureUploaded}</div>
                  )}

                  <label
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      border: '1.5px dashed #CBD5E1',
                      fontSize: '12.5px',
                      fontWeight: '700',
                      color: '#1565C0',
                      cursor: 'pointer',
                      background: '#F8FAFC',
                    }}
                  >
                    {profile.signatureUrl ? t.changeSignature : t.uploadSignature}
                    <input type="file" accept="image/*" onChange={handleSignatureChange} style={{ display: 'none' }} />
                  </label>
                </div>
              </div>

              <Button variant="primary" onClick={handleSaveInfo} loading={savingInfo} style={{ marginTop: '6px' }}>
                {savingInfo ? t.savingChanges : t.saveChangesBtn}
              </Button>
            </div>
          </Card.Body>
        </Card>

        {/* Card B: Security & Password */}
        <Card style={{ display: 'flex', flexDirection: 'column' }}>
          <Card.Header title={t.securityCard} />
          <Card.Body style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {passwordError && <Alert variant="error">{passwordError}</Alert>}
              {passwordSuccess && <Alert variant="success">{passwordSuccess}</Alert>}

              <Input
                label={t.currentPasswordLabel}
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                dir={lang === 'ar' ? 'rtl' : 'ltr'}
                showText={lang === 'ar' ? 'إظهار' : 'Show'}
                hideText={lang === 'ar' ? 'إخفاء' : 'Hide'}
              />
              <Input
                label={t.newPasswordLabel}
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                dir={lang === 'ar' ? 'rtl' : 'ltr'}
                showText={lang === 'ar' ? 'إظهار' : 'Show'}
                hideText={lang === 'ar' ? 'إخفاء' : 'Hide'}
              />
              <Input
                label={t.confirmNewPasswordLabel}
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                dir={lang === 'ar' ? 'rtl' : 'ltr'}
                showText={lang === 'ar' ? 'إظهار' : 'Show'}
                hideText={lang === 'ar' ? 'إخفاء' : 'Hide'}
              />
            </div>

            {/* Fills the remaining vertical space so this card visually balances
                the Personal Info card (which naturally has more fields), and
                keeps the action button pinned to the bottom of the card — same
                position as the "Save Changes" button in the other card. */}
            <div
              style={{
                marginTop: '20px',
                paddingTop: '18px',
                borderTop: '1px dashed #E2E8F0',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#334155', marginBottom: '10px' }}>
                {t.securityTipsTitle}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[t.securityTip1, t.securityTip2, t.securityTip3].map((tip, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '9px' }}>
                    <span
                      style={{
                        flexShrink: 0,
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: '#EFF6FF',
                        color: '#1565C0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                      }}
                    >
                      🛡️
                    </span>
                    <span style={{ fontSize: '12.5px', color: '#64748B', lineHeight: 1.6 }}>{tip}</span>
                  </div>
                ))}
              </div>
            </div>

            <Button variant="primary" onClick={handleChangePassword} loading={savingPassword} style={{ marginTop: '20px' }}>
              {savingPassword ? t.updatingPassword : t.updatePasswordBtn}
            </Button>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Input } from '../components/shared';

const logo = '/logo.png';
const background = '/background.png'; // ← provided image: campus + soft curved pale-blue shape baked in

import { setAuthToken } from '../services/api';
import api from '../services/api';

const UserIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const LockIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);

const GlobeIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const ChevronDown = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const ArrowLeft = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const ArrowRight = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const UNIV_AR = 'جَامِعَةُ أَسْيُوطَ التِّكْنُولُوجِيَّةُ الدَّوْلِيَّةُ';
const UNIV_EN = 'Assiut International Technological University';

export default function LoginPage({ onLogin, lang = 'en', setLang }) {
  // If no external language controller is provided, manage language internally
  const [internalLang, setInternalLang] = useState('en');
  const activeLang = setLang ? lang : internalLang;
  const switchLang = setLang ? setLang : setInternalLang;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [mode, setMode] = useState('login');
  const [fpEmail, setFpEmail] = useState('');
  const [fpOtp, setFpOtp] = useState('');
  const [fpNewPassword, setFpNewPassword] = useState('');
  const [fpConfirmPassword, setFpConfirmPassword] = useState('');
  const [fpError, setFpError] = useState('');
  const [fpInfo, setFpInfo] = useState('');
  const [fpLoading, setFpLoading] = useState(false);

  function resetForgotState() {
    setMode('login');
    setFpEmail('');
    setFpOtp('');
    setFpNewPassword('');
    setFpConfirmPassword('');
    setFpError('');
    setFpInfo('');
    setFpLoading(false);
  }

  async function handleSendOtp() {
    setFpError('');
    setFpInfo('');
    if (!fpEmail) {
      setFpError(activeLang === 'ar' ? 'أدخل البريد الإلكتروني' : 'Enter your email');
      return;
    }
    setFpLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: fpEmail });
      setFpInfo(
        activeLang === 'ar'
          ? '✅ إذا كان هذا البريد مسجلاً، تم إرسال كود التحقق إليه.'
          : '✅ If this email is registered, a reset code has been sent.'
      );
      setMode('forgotReset');
    } catch (backendErr) {
      console.error('forgot-password error:', backendErr);
      setFpError(
        backendErr.response?.data?.message ||
        (activeLang === 'ar' ? 'فشل الاتصال بالخادم، يرجى المحاولة لاحقاً' : 'Server connection failed, please try again later')
      );
    } finally {
      setFpLoading(false);
    }
  }

  async function handleResetPassword() {
    setFpError('');
    if (!fpOtp || !fpNewPassword || !fpConfirmPassword) {
      setFpError(activeLang === 'ar' ? 'يرجى تعبئة كل الحقول' : 'Please fill in all fields');
      return;
    }
    if (fpNewPassword.length < 6) {
      setFpError(activeLang === 'ar' ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters');
      return;
    }
    if (fpNewPassword !== fpConfirmPassword) {
      setFpError(activeLang === 'ar' ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match');
      return;
    }
    setFpLoading(true);
    try {
      await api.post('/auth/reset-password', {
        email: fpEmail,
        otp: fpOtp,
        newPassword: fpNewPassword,
      });
      setFpInfo(activeLang === 'ar' ? '✅ تم تغيير كلمة المرور، يمكنك تسجيل الدخول الآن' : '✅ Password changed, you can now log in');
      setTimeout(() => {
        resetForgotState();
        setEmail(fpEmail);
      }, 1200);
    } catch (backendErr) {
      console.error('reset-password error:', backendErr);
      setFpError(
        backendErr.response?.data?.message ||
        (activeLang === 'ar' ? 'حدث خطأ أثناء تغيير كلمة المرور' : 'An error occurred while resetting password')
      );
    } finally {
      setFpLoading(false);
    }
  }

  async function handleLogin() {
    if (!email || !password) {
      setError(activeLang === 'ar' ? 'يرجى إدخال البيانات' : 'Please enter credentials');
      return;
    }
    setLoading(true);
    setError('');
    const trimmedId = email.trim();
    try {
      const res = await api.post('/auth/login', {
        identifier: trimmedId,
        password: password,
      });
      if (res && res.token) {
        setAuthToken(res.token);
        const userData = {
          id: res.userId,
          name: res.username === 'admin' ? 'م. أحمد حسني (مدير النظام)' : res.username,
          nameEn: res.username === 'admin' ? 'Eng. Ahmed Hosny (Admin)' : res.username,
          email: trimmedId.includes('@') ? trimmedId : `${trimmedId}@aitu.edu`,
          role: (res.role || 'admin').toLowerCase(),
        };
        localStorage.setItem('user', JSON.stringify(userData));
        if (onLogin) onLogin(userData);
        return;
      } else {
        setError(activeLang === 'ar' ? 'استجابة غير صالحة من الخادم' : 'Invalid response from server');
      }
    } catch (backendErr) {
      console.error('Backend login error:', backendErr);
      const errorMsg = backendErr.response?.data?.message ||
        (activeLang === 'ar' ? 'اسم المستخدم أو كلمة المرور غير صحيحة أو فشل الاتصال' : 'Invalid identifier or password / Connection failed');
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }

  const isRtl = activeLang === 'ar';
  const t = {
    name: isRtl ? UNIV_AR : UNIV_EN,
    subName: isRtl ? UNIV_EN : UNIV_AR,
    hero: isRtl ? ['نبني عقولًا', 'لمستقبلٍ', 'أكثر إشراقًا'] : ['BUILDING', 'MINDS FOR A', 'BRIGHTER', 'FUTURE'],
    userPh: isRtl ? 'اسم المستخدم أو البريد الإلكتروني' : 'Username or email',
    passPh: isRtl ? 'كلمة المرور' : 'Password',
    remember: isRtl ? 'تذكرني' : 'Remember me',
    forgot: isRtl ? 'نسيت كلمة المرور؟' : 'Forgot password?',
    login: isRtl ? 'تسجيل الدخول' : 'Login',
    or: isRtl ? 'أو' : 'Or',
    langLabel: isRtl ? 'عربي' : 'English',
  };

  return (
    <div className="lp-root" dir={isRtl ? 'rtl' : 'ltr'}>

      {/* ════════ PROVIDED BACKGROUND — campus + soft curved shape, used AS-IS ════════
          ONLY this layer is mirrored in RTL. Nothing else is ever transformed. */}
      <div className="lp-bg" style={{ backgroundImage: `url(${background})` }} />

      {/* Soft readability veil toward the card side (positioned, never mirrored) */}
      <div className="lp-veil" />

      {/* ════════ HEADER — one flex row so logo/name and the language pill can never collide.
          Flex naturally mirrors position (not text) when dir="rtl", so no per-element overrides needed. ════════ */}
      <div className="lp-header">
        <div className="lp-brand">
          <img src={logo} alt="AITU" className="lp-brand-logo" />
          <div className="lp-brand-text">
            <div className="lp-brand-name">{t.name}</div>
            <div className="lp-brand-sub">{t.subName}</div>
          </div>
        </div>

        <button
          className="lp-lang"
          onClick={() => switchLang(isRtl ? 'en' : 'ar')}
          aria-label="Switch language"
        >
          <span className="lp-icon">{GlobeIcon}</span>
          <span className="lp-lang-label">{t.langLabel}</span>
          <span className="lp-icon lp-chev">{ChevronDown}</span>
        </button>
      </div>

      {/* ════════ HERO TEXT — grouped block on the campus side, never mirrored ════════ */}
      <div className="lp-hero">
        <div className="lp-hero-rule" />
        <div className="lp-hero-lines">
          {t.hero.map((w, i) => <div key={i}>{w}</div>)}
        </div>
      </div>

      {/* ════════ LOGIN CARD — auto height, sized to its content, on the pale-blue shape ════════
          right side in EN, left side in AR on desktop; centered, full-focus on mobile. Card itself is never mirrored. */}
      <div className="lp-card-zone">
        <div className="lp-card">
          <img src={logo} alt="AITU" className="lp-card-logo" />

          <div className="lp-card-name">{t.name}</div>
          <div className="lp-card-sub">{t.subName}</div>

          <div className="lp-card-rule" />

          {mode === 'login' && (
            <div className="lp-form">
              <Input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                placeholder={t.userPh}
                dir={isRtl ? 'rtl' : 'ltr'}
                leftIcon={UserIcon}
              />

              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                placeholder={t.passPh}
                dir={isRtl ? 'rtl' : 'ltr'}
                leftIcon={LockIcon}
                showText={isRtl ? 'إظهار' : 'Show'}
                hideText={isRtl ? 'إخفاء' : 'Hide'}
              />

              <div className="lp-row">
                <label className="lp-remember">
                  <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                  <span>{t.remember}</span>
                </label>
                <button
                  type="button"
                  className="lp-link"
                  onClick={() => {
                    setFpEmail(email);
                    setMode('forgotEmail');
                    setFpError('');
                    setFpInfo('');
                  }}
                >
                  {t.forgot}
                </button>
              </div>

              {error && (
                <div className="lp-alert lp-alert-error">
                  <span>⚠️</span><span>{error}</span>
                </div>
              )}

              <button className="lp-btn-primary" disabled={loading} onClick={handleLogin}>
                {loading && <span className="lp-spinner" />}
                <span>{t.login}</span>
                <span className="lp-btn-arrow">{isRtl ? ArrowLeft : ArrowRight}</span>
              </button>
            </div>
          )}

          {mode === 'forgotEmail' && (
            <div className="lp-form">
              <p className="lp-hint">
                {isRtl
                  ? 'أدخل بريدك الإلكتروني وسنرسل لك رمز تحقق لإعادة تعيين كلمة المرور.'
                  : 'Enter your email to receive a password reset verification code.'}
              </p>
              <Input
                type="email"
                value={fpEmail}
                onChange={(e) => setFpEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                placeholder={isRtl ? 'البريد الإلكتروني' : 'Email'}
                dir="ltr"
                leftIcon={UserIcon}
              />
              {fpError && <div className="lp-alert lp-alert-error"><span>⚠️</span><span>{fpError}</span></div>}
              <button className="lp-btn-primary" disabled={fpLoading} onClick={handleSendOtp}>
                {fpLoading && <span className="lp-spinner" />}
                <span>{isRtl ? 'إرسال رمز التحقق' : 'Send Verification Code'}</span>
              </button>
              <button onClick={resetForgotState} className="lp-btn-ghost">
                {isRtl ? '→ رجوع لتسجيل الدخول' : '← Back to Login'}
              </button>
            </div>
          )}

          {mode === 'forgotReset' && (
            <div className="lp-form">
              {fpInfo && <div className="lp-alert lp-alert-success"><span>✅</span><span>{fpInfo}</span></div>}
              <Input
                value={fpOtp}
                onChange={(e) => setFpOtp(e.target.value.replace(/\D/g, ''))}
                maxLength={6}
                dir="ltr"
                placeholder={isRtl ? 'رمز التحقق (6 أرقام)' : 'Verification Code (6 digits)'}
                inputStyle={{ textAlign: 'center', letterSpacing: '8px', fontSize: '20px', fontWeight: '800' }}
              />
              <Input
                type="password"
                value={fpNewPassword}
                onChange={(e) => setFpNewPassword(e.target.value)}
                placeholder={isRtl ? 'كلمة المرور الجديدة' : 'New Password'}
                dir="ltr"
                leftIcon={LockIcon}
                showText={isRtl ? 'إظهار' : 'Show'}
                hideText={isRtl ? 'إخفاء' : 'Hide'}
              />
              <Input
                type="password"
                value={fpConfirmPassword}
                onChange={(e) => setFpConfirmPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleResetPassword()}
                placeholder={isRtl ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                dir="ltr"
                leftIcon={LockIcon}
                showText={isRtl ? 'إظهار' : 'Show'}
                hideText={isRtl ? 'إخفاء' : 'Hide'}
              />
              {fpError && <div className="lp-alert lp-alert-error"><span>⚠️</span><span>{fpError}</span></div>}
              <button className="lp-btn-primary" disabled={fpLoading} onClick={handleResetPassword}>
                {fpLoading && <span className="lp-spinner" />}
                <span>{isRtl ? 'حفظ كلمة المرور الجديدة' : 'Reset Password'}</span>
              </button>
              <button onClick={resetForgotState} className="lp-btn-ghost">
                {isRtl ? '→ رجوع لتسجيل الدخول' : '← Back to Login'}
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700;800&display=swap');

        * { box-sizing: border-box; }
        html, body { overflow-x: hidden; }

        .lp-root {
          position: relative;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          font-family: 'Inter', 'Segoe UI', Helvetica, Arial, sans-serif;
          background: #F4F8FD;
        }
        [dir="rtl"] .lp-root, [dir="rtl"].lp-root {
          font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif;
        }

        /* ═════════ PROVIDED BACKGROUND — used AS-IS, mirrored ONLY in RTL ═════════ */
        .lp-bg {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          z-index: 1;
          transition: transform 0.45s ease;
        }
        [dir="rtl"] .lp-bg {
          transform: scaleX(-1);   /* ← the ONLY mirrored element in the entire page */
        }

        /* Soft white/blue readability veil toward the card side — positioned, never mirrored */
        .lp-veil {
          position: absolute;
          top: 0; bottom: 0; right: 0;
          width: 46%;
          z-index: 2;
          pointer-events: none;
          background: linear-gradient(to left, rgba(255,255,255,0.38), rgba(255,255,255,0.12) 55%, transparent);
        }
        [dir="rtl"] .lp-veil {
          right: auto; left: 0;
          background: linear-gradient(to right, rgba(255,255,255,0.38), rgba(255,255,255,0.12) 55%, transparent);
        }

        /* ═════════ UI LAYERS — z-index above background, NEVER mirrored ═════════ */

        /* ── Header row: logo+name and the language pill live in one flex row so they
             can never overlap. dir="rtl" mirrors the ORDER automatically — text inside
             each element stays untouched. ── */
        .lp-header {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          z-index: 8;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: clamp(10px, 2vw, 24px);
          padding: clamp(18px, 3vw, 40px) clamp(18px, 4vw, 52px);
        }

        .lp-brand {
          display: flex;
          align-items: center;
          gap: clamp(8px, 1.2vw, 16px);
          min-width: 0;
          flex: 1 1 auto;
        }
        .lp-brand-text { min-width: 0; }
        .lp-brand-name {
          font-size: clamp(12px, 1.3vw, 17px);
          font-weight: 700;
          color: #0B2A5B;
          line-height: 1.35;
        }
        .lp-brand-sub {
          font-size: clamp(10px, 0.95vw, 13px);
          font-weight: 500;
          color: #64748B;
          margin-top: 4px;
          line-height: 1.4;
        }
        .lp-brand-logo {
          width: clamp(38px, 4.5vw, 64px);
          height: clamp(38px, 4.5vw, 64px);
          border-radius: 50%;
          object-fit: cover;
          background: #fff;
          box-shadow: 0 6px 18px rgba(11, 42, 91, 0.10);
          flex-shrink: 0;
          padding: 2px;
        }

        /* ── Language selector — flex-shrink:0 so it never gets squeezed by a long name ── */
        .lp-lang {
          flex-shrink: 0;
          background: rgba(255,255,255,0.75);
          backdrop-filter: blur(6px);
          border: 1px solid #E2E8F0;
          border-radius: 999px;
          height: clamp(34px, 3.4vw, 40px);
          padding: 0 clamp(12px, 1.6vw, 18px);
          cursor: pointer;
          font-family: inherit;
          font-size: clamp(12px, 1.1vw, 14px);
          line-height: 1;
          font-weight: 600;
          color: #1E293B;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
        }
        .lp-lang:hover { color: #1565C0; border-color: #1565C0; }
        .lp-icon { display: inline-flex; align-items: center; color: #334155; }
        .lp-chev { color: #64748B; }

        /* ── Hero block — campus side, one grouped composition (left in EN → right in AR) ── */
        .lp-hero {
          position: absolute;
          top: 19%;
          left: 6%;
          max-width: 42%;
          z-index: 5;
        }
        [dir="rtl"] .lp-hero { left: auto; right: 6%; }
        .lp-hero-rule {
          width: 44px;
          height: 3px;
          background: #1565C0;
          border-radius: 3px;
          margin-bottom: 22px;
        }
        .lp-hero-lines {
          color: #0B2A5B;
          font-size: clamp(24px, 3.4vw, 48px);
          font-weight: 800;
          letter-spacing: 3px;
          line-height: 1.18;
          text-transform: uppercase;
        }
        [dir="rtl"] .lp-hero-lines {
          text-transform: none;
          letter-spacing: 0.5px;
          font-size: clamp(26px, 3.8vw, 54px);
          font-weight: 700;
          line-height: 1.35;
        }

        /* ── Login card zone — over the pale-blue shape: right in EN, left in AR ── */
        .lp-card-zone {
          position: absolute;
          top: 0;
          bottom: 0;
          right: 5.5%;
          z-index: 6;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        [dir="rtl"] .lp-card-zone { right: auto; left: 5.5%; }

        /* Card hugs its content — no forced height, no dead space */
        .lp-card {
          width: clamp(380px, 28vw, 540px);
          max-height: 92vh;
          background: #FFFFFF;
          border: 1px solid #E8EEF6;
          border-radius: 26px;
          padding: clamp(34px, 3.2vw, 48px) clamp(28px, 3vw, 46px) clamp(28px, 2.6vw, 40px);
          box-shadow:
            0 28px 70px rgba(15, 35, 80, 0.16),
            0 8px 20px rgba(15, 35, 80, 0.07);
          text-align: center;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
        }

        .lp-card-logo {
          width: clamp(72px, 7vw, 96px);
          height: clamp(72px, 7vw, 96px);
          border-radius: 50%;
          object-fit: cover;
          display: block;
          margin: 2px auto 20px;
          box-shadow: 0 10px 26px rgba(11, 42, 91, 0.16);
          animation: lpLogoFloat 4s ease-in-out infinite;
        }
        @keyframes lpLogoFloat {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-8px); }
        }

        .lp-card-name {
          font-size: clamp(16px, 1.5vw, 19px);
          font-weight: 800;
          color: #0B2A5B;
          line-height: 1.45;
          letter-spacing: 0.2px;
        }
        .lp-card-sub {
          font-size: clamp(12.5px, 1.1vw, 14.5px);
          font-weight: 500;
          color: #64748B;
          margin-top: 6px;
          line-height: 1.6;
        }
        [dir="rtl"] .lp-card-sub { font-size: clamp(13px, 1.15vw, 15px); }

        .lp-card-rule {
          width: 52px;
          height: 3px;
          background: linear-gradient(90deg, #1565C0, #3D8BE8);
          margin: clamp(18px, 2vw, 24px) auto clamp(20px, 2.2vw, 28px);
          border-radius: 3px;
        }

        .lp-form {
          display: flex;
          flex-direction: column;
          gap: clamp(13px, 1.4vw, 17px);
          text-align: start;
        }

        /* Ensure real <input> elements stay comfortably tappable on every device */
        .lp-card input[type="text"],
        .lp-card input[type="email"],
        .lp-card input[type="password"] {
          min-height: 48px;
        }

        .lp-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 14px;
          margin-top: -2px;
          gap: 10px;
          flex-wrap: wrap;
        }
        .lp-remember {
          display: flex;
          align-items: center;
          gap: 9px;
          color: #334155;
          font-weight: 600;
          cursor: pointer;
          user-select: none;
        }
        .lp-remember input {
          accent-color: #0B2A5B;
          width: 17px;
          height: 17px;
          cursor: pointer;
          margin: 0;
        }
        .lp-link {
          background: none;
          border: none;
          color: #1565C0;
          font-size: 14px;
          font-family: inherit;
          cursor: pointer;
          font-weight: 700;
          padding: 0;
        }
        .lp-link:hover { color: #0B2A5B; text-decoration: underline; }

        .lp-hint {
          margin: 0;
          color: #475569;
          font-size: 14.5px;
          line-height: 1.7;
          text-align: start;
        }

        .lp-alert {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 11px 14px;
          border-radius: 12px;
          font-size: 13.5px;
          font-weight: 700;
          font-family: inherit;
          line-height: 1.4;
        }
        .lp-alert-error { background: #FEF2F2; color: #B91C1C; border: 1px solid #FECACA; }
        .lp-alert-success { background: #F0FDF4; color: #166534; border: 1px solid #BBF7D0; }

        .lp-btn-primary {
          width: 100%;
          height: 54px;
          padding: 0 24px;
          border: none;
          border-radius: 999px;
          font-size: clamp(15px, 1.4vw, 16.5px);
          line-height: 1;
          font-weight: 800;
          font-family: inherit;
          color: #fff;
          cursor: pointer;
          background: linear-gradient(135deg, #0E2E63, #17418C);
          box-shadow: 0 12px 26px rgba(11, 42, 91, 0.28);
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-top: 12px;
        }
        .lp-btn-primary:disabled { cursor: wait; opacity: 0.85; }
        .lp-btn-primary:not(:disabled):hover {
          transform: translateY(-2px);
          box-shadow: 0 16px 34px rgba(11, 42, 91, 0.36);
          background: linear-gradient(135deg, #123B7D, #1E4FA3);
        }
        .lp-btn-arrow { display: inline-flex; align-items: center; transition: transform 0.2s; }
        .lp-btn-primary:not(:disabled):hover .lp-btn-arrow {
          transform: translateX(4px);
        }
        [dir="rtl"] .lp-btn-primary:not(:disabled):hover .lp-btn-arrow {
          transform: translateX(-4px);
        }

        .lp-btn-ghost {
          width: 100%;
          height: 48px;
          padding: 0 20px;
          border: 1.5px solid #E2E8F0;
          border-radius: 999px;
          font-size: 14px;
          line-height: 1;
          font-weight: 700;
          font-family: inherit;
          color: #64748B;
          cursor: pointer;
          background: transparent;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .lp-btn-ghost:hover { background: #F1F5F9; border-color: #CBD5E1; }

        .lp-spinner {
          width: 16px;
          height: 16px;
          border: 2.5px solid rgba(255,255,255,0.35);
          border-top-color: #fff;
          border-radius: 50%;
          animation: lpSpin 0.7s linear infinite;
          display: inline-block;
        }
        @keyframes lpSpin { to { transform: rotate(360deg); } }

        /* ═════════════════════════ RESPONSIVE ═════════════════════════
           Fluid clamp() sizing above already covers the 1280→1920 laptop
           range smoothly. The breakpoints below handle the structural
           changes: tightening on small laptops, then switching to a
           stacked, mobile-first composition once the desktop two-column
           layout no longer fits. */

        /* Small laptops / large tablets landscape (1024–1279) */
        @media (max-width: 1279px) {
          .lp-card-zone { right: 4%; }
          [dir="rtl"] .lp-card-zone { right: auto; left: 4%; }
          .lp-card { width: clamp(360px, 34vw, 500px); }
          .lp-hero { left: 4%; max-width: 46%; }
          [dir="rtl"] .lp-hero { left: auto; right: 4%; }
        }

        /* Tablets portrait and below — switch to a stacked, mobile-style composition */
        @media (max-width: 1023px) {
          .lp-root { height: auto; min-height: 100vh; overflow-y: auto; overflow-x: hidden; }
          .lp-bg { position: fixed; background-position: center 40%; }
          .lp-veil { display: none; }

          .lp-header { position: relative; padding: 20px 18px 0; }

          .lp-hero {
            position: relative;
            top: auto;
            left: auto;
            right: auto;
            max-width: 100%;
            margin: clamp(20px, 4vw, 32px) 18px 0;
          }
          [dir="rtl"] .lp-hero { right: auto; }

          .lp-card-zone {
            position: relative;
            top: auto;
            bottom: auto;
            right: auto;
            left: auto;
            padding: clamp(20px, 4vw, 32px) 16px clamp(32px, 6vw, 48px);
          }
          [dir="rtl"] .lp-card-zone { left: auto; }
          .lp-card { width: min(92vw, 460px); max-height: none; }
        }

        /* Mobile phones — card becomes the sole focus */
        @media (max-width: 767px) {
          .lp-card { width: min(92vw, 450px); border-radius: 22px; }
          .lp-hero-lines { font-size: clamp(22px, 6vw, 30px); }
          [dir="rtl"] .lp-hero-lines { font-size: clamp(24px, 6.4vw, 32px); }
          .lp-bg { background-position: center 65%; }
        }

        /* Small phones */
        @media (max-width: 480px) {
          .lp-header { padding: 16px 14px 0; gap: 10px; }
          .lp-brand-logo { width: 42px; height: 42px; }
          .lp-brand-name { font-size: 12.5px; }
          .lp-brand-sub { font-size: 10.5px; }
          .lp-lang { height: 32px; padding: 0 12px; font-size: 12.5px; }

          .lp-hero { margin: 18px 16px 0; }
          .lp-hero-rule { margin-bottom: 12px; }

          .lp-card-zone { padding: 18px 12px 28px; }
          .lp-card { width: min(93vw, 420px); padding: 30px 20px 26px; }
          .lp-card-logo { width: 72px; height: 72px; margin-bottom: 12px; }
          .lp-card-rule { margin: 16px auto 18px; }
          .lp-form { gap: 12px; }
        }

        /* Very small phones (320–359px) */
        @media (max-width: 359px) {
          .lp-brand-name { font-size: 11.5px; }
          .lp-brand-sub { display: none; } /* keep the header from ever wrapping onto 3 lines */
          .lp-card { padding: 24px 16px 22px; }
          .lp-card-logo { width: 60px; height: 60px; margin-bottom: 10px; }
          .lp-card-name { font-size: 14.5px; }
          .lp-btn-primary { font-size: 14px; }
        }

        /* Short viewports / mobile landscape — prioritize the card over decoration */
        @media (max-height: 520px) and (orientation: landscape) {
          .lp-header { padding: 10px 16px 0; }
          .lp-hero { display: none; }
          .lp-card-zone { padding: 12px 16px 20px; align-items: flex-start; }
          .lp-card { padding: 20px 24px 18px; }
          .lp-card-logo { width: 52px; height: 52px; margin-bottom: 8px; animation: none; }
          .lp-card-rule { margin: 10px auto 14px; }
          .lp-form { gap: 10px; }
        }
      `}</style>
    </div>
  );
}
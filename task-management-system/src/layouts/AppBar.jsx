const logo = '/logo.png';

export default function AppBar({
  lang = 'ar',
  setLang,
  user = { name: 'المدير العام', nameEn: 'Admin User', role: 'admin' },
  onLogout,
  systemTitle = {
    ar: 'نظام إدارة التذاكر والمهام',
    en: 'Ticketing Management System',
  },
  universityName = {
    ar: <><span style={{ color: '#000000', fontWeight: 800 }}>KERNEL</span> <span style={{ color: '#0066ff', fontWeight: 800 }}>PANIC</span></>,
    en: <span style={{ color: '#94a3b8', fontWeight: 600, letterSpacing: '1px' }}>IT TEAM</span>,
  },
  onToggleSidebar,
}) {
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  const ROLE_LABELS = {
    admin: { ar: 'مدير النظام', en: 'System Admin' },
    manager: { ar: 'مدير قسم', en: 'Department Manager' },
    agent: { ar: 'مهندس الدعم', en: 'Support Agent' },
    user: { ar: 'مستخدم', en: 'Client User' },
    hr: { ar: 'موارد بشرية', en: 'HR' },
    head: { ar: 'رئيس القسم', en: 'Dept Head' },
    employee: { ar: 'موظف', en: 'Employee' },
  };

  const handleHamburgerClick = () => {
    if (onToggleSidebar) {
      onToggleSidebar();
    } else {
      document.querySelector('.sidebar')?.classList.toggle('open');
      document.querySelector('.sidebar-overlay')?.classList.toggle('open');
    }
  };

  return (
    <>
      <style>{`
        @keyframes floatLogo {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }

        /* Unified sticky app-header */
        .app-header {
          position: sticky;
          top: 0;
          z-index: 200;
          width: 100%;
          background: #FFFFFF;
          box-shadow: 0 2px 10px rgba(15, 23, 42, 0.08);
          border-bottom: 1px solid #E8EDF5;
        }

        /* Top bar: crisp dark navy strip */
        .hdr-top {
          background: #0D3B7A;
          padding: 5px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-family: 'Cairo', sans-serif;
          direction: ${dir};
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          transition: padding 0.2s ease;
        }
        .hdr-top-left {
          font-size: 12.5px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.85);
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .hdr-top-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .hdr-top-sep {
          width: 1px;
          height: 12px;
          background: rgba(255, 255, 255, 0.2);
        }
        .hdr-top-user {
          font-size: 12.5px;
          color: rgba(255, 255, 255, 0.85);
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .hdr-top-btn {
          font-size: 12px;
          font-weight: 700;
          color: #FFFFFF;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.25);
          border-radius: 6px;
          cursor: pointer;
          font-family: 'Cairo', sans-serif;
          padding: 2px 8px;
          transition: all 0.15s ease;
        }
        .hdr-top-btn:hover {
          background: rgba(255, 255, 255, 0.22);
          border-color: rgba(255, 255, 255, 0.4);
        }
        .hdr-top-logout {
          font-size: 12px;
          font-weight: 600;
          color: #FCA5A5;
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.25);
          border-radius: 6px;
          cursor: pointer;
          font-family: 'Cairo', sans-serif;
          padding: 2px 8px;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: all 0.15s ease;
        }
        .hdr-top-logout:hover {
          background: rgba(239, 68, 68, 0.25);
          color: #FFFFFF;
        }

        /* Main header */
        .hdr-main {
          background: #FFFFFF;
          padding: 8px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-family: 'Cairo', sans-serif;
          direction: ${dir};
        }

        .hdr-brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .hdr-logo-wrap {
          animation: floatLogo 3.5s ease-in-out infinite;
          flex-shrink: 0;
          display: flex;
          align-items: center;
        }

        .hdr-univ {
          border-inline-end: 1.5px solid #E8EDF5;
          padding-inline-end: 14px;
        }
        .hdr-univ-name {
          font-size: 16px;
          font-weight: 700;
          color: #0D3B7A;
          white-space: nowrap;
        }
        .hdr-univ-en {
          font-size: 11.5px;
          color: #94A3B8;
          margin-top: 1px;
          white-space: nowrap;
        }

        .hdr-system {
          font-size: 15px;
          color: #1565C0;
          font-weight: 600;
          white-space: nowrap;
        }

        .hdr-center {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          text-align: center;
          pointer-events: none;
        }
        .hdr-center-title {
          font-size: 20px;
          font-weight: 800;
          color: #1565C0;
          white-space: nowrap;
          font-family: 'Cairo', sans-serif;
        }
        .hdr-center-sub {
          font-size: 11px;
          color: #94A3B8;
          margin-top: 1px;
          white-space: nowrap;
          font-family: 'Cairo', sans-serif;
        }

        .hdr-hamburger {
          display: none;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          cursor: pointer;
          flex-shrink: 0;
          transition: background 0.15s;
        }
        .hdr-hamburger:hover { background: #EEF2F6; }

        /* Responsive breakpoints */
        @media (max-width: 1023px) {
          .hdr-center { display: none; }
          .hdr-univ-en { display: none; }
          .hdr-hamburger { display: flex !important; }
          .hdr-spacer { display: none; }
        }
        @media (max-width: 767px) {
          .hdr-system { display: none; }
          .hdr-top { padding: 4px 14px; }
          .hdr-main { padding: 6px 14px; }
          .hdr-univ-name { font-size: 13.5px; white-space: normal; line-height: 1.25; max-width: 260px; }
          .hdr-brand { gap: 10px; }
          .hdr-logo-wrap img { width: 44px !important; height: 44px !important; }
        }
        @media (max-width: 639px) {
          .hdr-top { padding: 3px 10px; font-size: 11px; }
          .hdr-top-left { font-size: 11px; }
          .hdr-top-user { display: none; }
          .hdr-univ-name { font-size: 12.5px; max-width: 210px; }
          .hdr-brand { gap: 8px; }
          .hdr-logo-wrap img { width: 38px !important; height: 38px !important; }
        }
        @media (max-width: 420px) {
          .hdr-univ-name { font-size: 11.5px; max-width: 170px; }
          .hdr-top-right { gap: 6px; }
          .hdr-top-left { display: none; }
          .hdr-top-btn, .hdr-top-logout { font-size: 11px; padding: 2px 6px; }
        }
      `}</style>

      {/* Single Unified Header */}
      <header className="app-header">
        {/* Top Notification / Role Bar */}
        <div className="hdr-top">
          <span className="hdr-top-left">
            <span>🏛️</span>
            <span>
              {lang === 'ar'
                ? `${universityName.ar} — EGC Ticketing`
                : `${universityName.en} — EGC Ticketing`}
            </span>
          </span>

          <div className="hdr-top-right">
            {user && (
              <span className="hdr-top-user">
                <span>{lang === 'ar' ? user.name : (user.nameEn || user.name)}</span>
                <span>•</span>
                <span style={{ color: '#93C5FD', fontWeight: '700' }}>
                  {ROLE_LABELS[user.role]?.[lang] || user.role}
                </span>
              </span>
            )}

            {user && <div className="hdr-top-sep" />}

            {setLang && (
              <button
                className="hdr-top-btn"
                onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
                title={lang === 'ar' ? 'Switch to English' : 'التحويل للعربية'}
              >
                🌐 {lang === 'ar' ? 'English' : 'عربي'}
              </button>
            )}

            {onLogout && (
              <>
                <div className="hdr-top-sep" />
                <button className="hdr-top-logout" onClick={onLogout} title={lang === 'ar' ? 'تسجيل الخروج' : 'Logout'}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  <span>{lang === 'ar' ? 'خروج' : 'Logout'}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Main Brand AppBar */}
        <div className="hdr-main">
          {/* Brand: Hamburger + Logo + Name */}
          <div className="hdr-brand">
            <button className="hdr-hamburger" onClick={handleHamburgerClick} title="Menu">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2.5" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            {/* Logo with float animation */}
            <div className="hdr-logo-wrap">
              <img src={logo} alt="KERNEL PANIC Logo" style={{ height: '44px', width: 'auto', maxWidth: '48px', objectFit: 'contain', background: 'transparent', borderRadius: 0, padding: 0, boxShadow: 'none' }} onError={(e) => { e.target.src = '/logos/kp_icon.png'; }} />
            </div>

            {/* University / Company Brand Text */}
            <div className="hdr-univ">
              <div className="hdr-univ-name" style={{ fontSize: '20px', fontWeight: 800, lineHeight: 1.2 }}>
                <span style={{ color: '#000000', fontWeight: 800 }}>KERNEL</span> <span style={{ color: '#0066ff', fontWeight: 800 }}>PANIC</span>
              </div>
              <div className="hdr-univ-en" style={{ color: '#8899ac', fontWeight: 700, letterSpacing: '2px', fontSize: '11px', marginTop: '1px' }}>
                IT TEAM
              </div>
            </div>
          </div>

          {/* Center System Title */}
          <div className="hdr-center">
            <div className="hdr-center-title">
              {lang === 'ar' ? systemTitle.ar : systemTitle.en}
            </div>
            <div className="hdr-center-sub">
              {lang === 'ar' ? systemTitle.en : systemTitle.ar}
            </div>
          </div>

          {/* Right Spacer / Balance */}
          <div className="hdr-spacer" style={{ flexShrink: 0, minWidth: '180px' }} />
        </div>
      </header>
    </>
  );
}

import React from 'react';

export default function Sidebar({
  activePage = 'dashboard',
  setActivePage,
  role = 'admin',
  lang = 'ar',
  systemName = {
    ar: 'نظام إدارة التذاكر والمهام',
    en: 'Ticketing Management System',
  },
  customNavItems,
}) {
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  const defaultPages = [
    {
      id: 'dashboard',
      label: { ar: 'لوحة التحكم', en: 'Dashboard' },
      icon: 'grid',
      roles: ['admin', 'manager', 'member', 'agent', 'user', 'employee', 'head', 'hr'],
    },
    {
      id: 'tickets',
      label: { ar: 'جميع التذاكر', en: 'All Tickets' },
      icon: 'ticket',
      roles: ['admin', 'manager', 'member', 'agent', 'user', 'employee', 'head', 'hr'],
    },
    {
      id: 'teams',
      label: { ar: 'فرق العمل', en: 'Teams' },
      icon: 'users',
      roles: ['admin', 'manager', 'member', 'agent', 'user', 'employee', 'head', 'hr'],
    },
    {
      id: 'users',
      label: { ar: 'المستخدمين وفرق العمل', en: 'Users & Teams' },
      icon: 'users',
      roles: ['admin', 'manager', 'hr'],
    },
    {
      id: 'ratings',
      label: { ar: 'تقييمات الأداء', en: 'Performance Ratings' },
      icon: 'star',
      roles: ['admin', 'manager', 'member', 'agent', 'user', 'employee', 'head', 'hr'],
    },
    {
      id: 'logs',
      label: { ar: 'سجل العمليات', en: 'Audit Logs' },
      icon: 'shield-check',
      roles: ['admin'],
    },
    {
      id: 'profile',
      label: { ar: 'الملف الشخصي', en: 'My Profile' },
      icon: 'profile',
      roles: ['admin', 'manager', 'agent', 'user', 'employee', 'head', 'hr', 'member'],
    },
  ];

  const items = customNavItems || defaultPages;
  const pages = items.filter((p) => !p.roles || p.roles.includes(role));

  const icons = {
    grid: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
    ticket: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
        <path d="M13 5v2" /><path d="M13 17v2" /><path d="M13 11v2" />
      </svg>
    ),
    my_tickets: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="8.5" cy="7" r="4" />
        <polyline points="17 11 19 13 23 9" />
      </svg>
    ),
    plus: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    ),
    palette: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
        <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
        <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
        <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
      </svg>
    ),
    users: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    sitemap: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="3" width="6" height="4" /><rect x="3" y="14" width="6" height="4" /><rect x="15" y="14" width="6" height="4" /><line x1="12" y1="7" x2="12" y2="11" /><line x1="12" y1="11" x2="6" y2="14" /><line x1="12" y1="11" x2="18" y2="14" />
      </svg>
    ),
    chart: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /><line x1="2" y1="20" x2="22" y2="20" />
      </svg>
    ),
    profile: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
      </svg>
    ),
    star: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    'shield-check': (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        <polyline points="9 12 11 14 15 10" />
      </svg>
    ),
  };

  const roleLabel = {
    admin: { ar: 'مدير النظام', en: 'System Admin' },
    manager: { ar: 'مدير قسم', en: 'Dept Manager' },
    agent: { ar: 'مهندس دعم', en: 'Support Agent' },
    user: { ar: 'مستخدم', en: 'Client' },
    head: { ar: 'رئيس القسم', en: 'Dept Head' },
    employee: { ar: 'موظف', en: 'Employee' },
    hr: { ar: 'موارد بشرية', en: 'HR Manager' },
  };

  const handleNavClick = (pageId) => {
    if (setActivePage) {
      setActivePage(pageId);
    }
    // Close mobile drawer upon selection
    document.querySelector('.sidebar')?.classList.remove('open');
    document.querySelector('.sidebar-overlay')?.classList.remove('open');
  };

  return (
    <aside
      className="sidebar"
      style={{
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Cairo, sans-serif',
        direction: dir,
      }}
    >
      {/* Sidebar Header / System Name + Mobile Close Button */}
      <div
        style={{
          padding: '16px 18px',
          borderBottom: '1px solid #E2E8F0',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
        }}
      >
        <div style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A', lineHeight: 1.4 }}>
          {lang === 'ar' ? systemName.ar : systemName.en}
        </div>
        <button
          className="sidebar-close-btn"
          onClick={() => {
            document.querySelector('.sidebar')?.classList.remove('open');
            document.querySelector('.sidebar-overlay')?.classList.remove('open');
          }}
          style={{
            background: '#F1F5F9',
            border: 'none',
            fontSize: '16px',
            color: '#475569',
            cursor: 'pointer',
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
            fontWeight: '700',
          }}
          title={lang === 'ar' ? 'إغلاق القائمة' : 'Close menu'}
        >
          ✕
        </button>
      </div>

      {/* Role Badge */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid #F1F5F9', flexShrink: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            background: '#F8FAFC',
            borderRadius: '8px',
            border: '1px solid #E8EDF5',
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#16A34A',
              boxShadow: '0 0 0 2px rgba(22, 163, 74, 0.2)',
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#334155' }}>
            {roleLabel[role]?.[lang] || role}
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <nav
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '8px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
        }}
      >
        {pages.map((page) => {
          const active = activePage === page.id;
          return (
            <button
              key={page.id}
              onClick={() => handleNavClick(page.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'Cairo, sans-serif',
                fontSize: '13px',
                fontWeight: active ? '700' : '500',
                textAlign: lang === 'ar' ? 'right' : 'left',
                width: '100%',
                direction: dir,
                transition: 'all 0.15s ease',
                background: active ? '#EFF6FF' : 'transparent',
                color: active ? '#1565C0' : '#475569',
                borderInlineStart: active ? '3px solid #1565C0' : '3px solid transparent',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = '#F8FAFC';
                  e.currentTarget.style.color = '#1E293B';
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#475569';
                }
              }}
            >
              <span
                style={{
                  flexShrink: 0,
                  opacity: active ? 1 : 0.65,
                  color: active ? '#1565C0' : 'currentColor',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {icons[page.icon] || icons.grid}
              </span>
              <span
                style={{
                  flex: 1,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {page.label[lang] || page.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div
        style={{
          padding: '12px 14px',
          borderTop: '1px solid #F1F5F9',
          flexShrink: 0,
        }}
      >
        <div style={{ fontSize: '11px', color: '#94A3B8', textAlign: 'center', fontWeight: '600' }}>
          EGC Ticketing © {new Date().getFullYear()}
        </div>
      </div>
    </aside>
  );
}

import React from 'react';
import AppBar from './AppBar';
import Sidebar from './Sidebar';

export default function AppShell({
  children,
  activePage = 'dashboard',
  setActivePage,
  user,
  onLogout,
  lang = 'ar',
  setLang,
  customNavItems,
}) {
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  const closeMobileSidebar = () => {
    document.querySelector('.sidebar')?.classList.remove('open');
    document.querySelector('.sidebar-overlay')?.classList.remove('open');
  };

  return (
    <div className="app" dir={dir} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F1F5F9' }}>
      {/* Top Header / AppBar */}
      <AppBar
        lang={lang}
        setLang={setLang}
        user={user}
        onLogout={onLogout}
      />

      {/* Main Layout Area: Sidebar + Content */}
      <div className="layout">
        <Sidebar
          activePage={activePage}
          setActivePage={setActivePage}
          role={user?.role || 'admin'}
          lang={lang}
          customNavItems={customNavItems}
        />

        {/* Main Content Area */}
        <main className="main page-pad" style={{ flex: 1, minWidth: 0 }}>
          {children}
        </main>
      </div>

      {/* Mobile Drawer Overlay Backdrop */}
      <div
        className="sidebar-overlay"
        onClick={closeMobileSidebar}
      />
    </div>
  );
}

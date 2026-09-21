import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import { AppShell } from './layouts';
import {
  LoginPage,
  Dashboard,
  TicketsPage,
  TeamsPage,
  UsersPage,
  RatingsPage,
  LogsPage,
  ProfilePage,
  ComponentShowcase,
  NotFoundPage,
} from './pages';
import api, { setAuthToken } from './services/api';

export default function App() {
  // ── 1. Language Persistence (Saved in localStorage) ──
  const [lang, setLangState] = useState(() => {
    return localStorage.getItem('app_lang') || 'ar';
  });

  const setLang = (newLang) => {
    setLangState(newLang);
    localStorage.setItem('app_lang', newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
  };

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  // ── 2. User Authentication Persistence ──
  // IMPORTANT: if there's no saved user, `user` must be null (not a fake
  // logged-in admin). A fake user with no real token would render the
  // authenticated app shell while every API call fails with 401.
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      const savedToken = localStorage.getItem('token');
      // Require BOTH a cached user AND a token — a user record with no
      // token is a stale/broken session, not a valid one.
      if (savedUser && savedToken) {
        return JSON.parse(savedUser);
      }
      return null;
    } catch {
      return null;
    }
  });

  // If a 401 comes back from any API call (expired/invalid token), api.js
  // clears localStorage and fires this event — force the user back to login.
  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      navigate('login');
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 3. Path-Based Routing (/tickets, /teams, /dashboard, etc.) ──
  const getPageFromPath = useCallback(() => {
    const rawPath = window.location.pathname.replace(/^\/+|\/+$/g, '');
    if (!rawPath || rawPath === 'dashboard') return 'dashboard';
    if (rawPath === 'tickets') return 'tickets';
    if (rawPath.startsWith('tickets')) return 'tickets';
    if (rawPath.startsWith('teams')) return 'teams';
    if (rawPath.startsWith('users')) return 'users';
    if (rawPath.startsWith('ratings')) return 'ratings';
    if (rawPath.startsWith('logs')) return 'logs';
    if (rawPath.startsWith('profile')) return 'profile';
    if (rawPath === 'login') return 'login';
    return '404';
  }, []);

  const [activePage, setActivePageState] = useState(getPageFromPath);

  // Navigate with browser history & URL path synchronization
  const navigate = (pageId) => {
    setActivePageState(pageId);
    const targetPath = pageId === 'dashboard' ? '/dashboard' : `/${pageId}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState({ pageId }, '', targetPath);
    }
  };

  // Listen to browser Back/Forward navigation
  useEffect(() => {
    const onPopState = () => {
      setActivePageState(getPageFromPath());
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [getPageFromPath]);

  // Sync initial URL path on mount if needed
  useEffect(() => {
    const initialPage = getPageFromPath();
    const targetPath = initialPage === 'dashboard' ? '/dashboard' : `/${initialPage}`;
    if (window.location.pathname !== targetPath) {
      window.history.replaceState({ pageId: initialPage }, '', targetPath);
    }
  }, [getPageFromPath]);

  const handleLogin = (userData) => {
    setUser(userData);
    navigate('dashboard');
  };

  // Refresh the locally cached user (name/email) after a Profile edit,
  // without requiring a re-login.
  const handleProfileUpdated = (updatedFields) => {
    setUser((prev) => {
      const merged = { ...prev, ...updatedFields };
      localStorage.setItem('user', JSON.stringify(merged));
      return merged;
    });
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.warn('Logout endpoint call failed (continuing local logout):', err.message);
    }
    setUser(null);
    setAuthToken('');
    localStorage.removeItem('user');
    navigate('login');
  };

  // If unauthenticated, show LoginPage
  if (!user || activePage === 'login') {
    return (
      <LoginPage
        onLogin={handleLogin}
        lang={lang}
        setLang={setLang}
      />
    );
  }

  // Render authenticated view inside AppShell layout
  return (
    <AppShell
      activePage={activePage}
      setActivePage={navigate}
      user={user}
      onLogout={handleLogout}
      lang={lang}
      setLang={setLang}
    >
      {activePage === 'dashboard' && (
        <Dashboard lang={lang} user={user} setActivePage={navigate} />
      )}

      {(activePage === 'tickets' || activePage === 'myTickets' || activePage === 'createTicket') && (
        <TicketsPage lang={lang} user={user} />
      )}

      {activePage === 'teams' && (
        <TeamsPage lang={lang} user={user} />
      )}

      {activePage === 'users' && (
        <UsersPage lang={lang} user={user} />
      )}

      {activePage === 'ratings' && (
        <RatingsPage lang={lang} user={user} />
      )}

      {activePage === 'logs' && (
        user?.role === 'admin' ? (
          <LogsPage lang={lang} user={user} />
        ) : (
          <NotFoundPage lang={lang} onNavigate={navigate} />
        )
      )}

      {activePage === 'profile' && (
        <ProfilePage lang={lang} user={user} onProfileUpdated={handleProfileUpdated} />
      )}

      {activePage === 'components' && (
        <ComponentShowcase lang={lang} />
      )}

      {activePage === '404' && (
        <NotFoundPage lang={lang} onNavigate={navigate} />
      )}

      {activePage !== 'dashboard' &&
        activePage !== 'tickets' &&
        activePage !== 'myTickets' &&
        activePage !== 'createTicket' &&
        activePage !== 'teams' &&
        activePage !== 'users' &&
        activePage !== 'ratings' &&
        activePage !== 'logs' &&
        activePage !== 'profile' &&
        activePage !== 'components' &&
        activePage !== '404' && (
          <NotFoundPage lang={lang} onNavigate={navigate} />
        )}
    </AppShell>
  );
}
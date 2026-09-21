/**
 * Date and time formatting helpers for EGC Ticketing System
 */

export function formatDate(dateString, locale = 'ar-EG') {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return String(dateString);
    return d.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return String(dateString);
  }
}

export function formatDateTime(dateString, locale = 'ar-EG') {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return String(dateString);
    return d.toLocaleString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(dateString);
  }
}

export function formatTime(timeString, locale = 'ar-EG') {
  if (!timeString) return '—';
  try {
    if (timeString.includes(':')) {
      const parts = timeString.split(':');
      const d = new Date();
      d.setHours(parseInt(parts[0], 10), parseInt(parts[1], 10), 0);
      return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
    }
    return timeString;
  } catch {
    return timeString;
  }
}

export function getTodayISODate() {
  return new Date().toISOString().slice(0, 10);
}

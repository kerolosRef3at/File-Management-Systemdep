/**
 * General helper utilities
 */

export function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function truncateText(text, maxLength = 30) {
  if (!text) return '';
  return text.length > maxLength ? text.slice(0, maxLength) + '…' : text;
}

export function getInitials(name) {
  if (!name) return '؟';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

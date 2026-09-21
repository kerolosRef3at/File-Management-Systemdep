import React from 'react';
import { Badge } from '../../shared';

export default function TicketStatusBadge({ status = 'open', lang = 'ar', size = 'md' }) {
  const statusConfig = {
    // ── Backend TicketStatus enum (Plan §1.2: 0=NotAssigned, 1=Pending,
    // 2=OnProgress, 3=Completed, 4=Deleted) — native keys, no lossy mapping needed.
    notAssigned: {
      variant: 'red',
      label: { ar: 'غير مسندة', en: 'Not Assigned' },
    },
    pending: {
      variant: 'amber',
      label: { ar: 'قيد الانتظار', en: 'Pending' },
    },
    onProgress: {
      variant: 'blue',
      label: { ar: 'قيد التنفيذ', en: 'In Progress' },
    },
    completed: {
      variant: 'green',
      label: { ar: 'مكتملة', en: 'Completed' },
    },
    deleted: {
      variant: 'gray',
      label: { ar: 'محذوفة', en: 'Deleted' },
    },

    // ── Legacy generic support-ticket keys — kept for backward compatibility
    // with any existing screens still using this vocabulary.
    open: {
      variant: 'blue',
      label: { ar: 'مفتوحة', en: 'Open' },
    },
    in_progress: {
      variant: 'amber',
      label: { ar: 'قيد المعالجة', en: 'In Progress' },
    },
    resolved: {
      variant: 'green',
      label: { ar: 'تم الحل', en: 'Resolved' },
    },
    closed: {
      variant: 'gray',
      label: { ar: 'مغلقة', en: 'Closed' },
    },
    escalated: {
      variant: 'red',
      label: { ar: 'مُصعدة', en: 'Escalated' },
    },
    pending_user: {
      variant: 'purple',
      label: { ar: 'في انتظار العميل', en: 'Pending User' },
    },
  };

  const cfg = statusConfig[status] || statusConfig.open;

  return (
    <Badge variant={cfg.variant} size={size} dot>
      {cfg.label[lang] || cfg.label.ar}
    </Badge>
  );
}

import React from 'react';
import { Badge } from '../../shared';
import {
  normalizeTicketPriority,
  getPriorityText,
} from '../../../utils/constants';

export default function TicketPriorityBadge({ priority = 'Medium', lang = 'ar', size = 'sm' }) {
  const norm = normalizeTicketPriority(priority);
  const text = getPriorityText(norm, lang);

  const priorityConfig = {
    Urgent: {
      variant: 'red',
      icon: '🔥',
    },
    High: {
      variant: 'red',
      icon: '▲',
    },
    Medium: {
      variant: 'amber',
      icon: '■',
    },
    Low: {
      variant: 'blue',
      icon: '▼',
    },
  };

  const cfg = priorityConfig[norm] || priorityConfig.Medium;

  return (
    <Badge variant={cfg.variant} size={size} icon={<span style={{ fontSize: '10px' }}>{cfg.icon}</span>}>
      {text}
    </Badge>
  );
}

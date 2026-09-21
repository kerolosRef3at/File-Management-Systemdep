import React from 'react';
import { getInitials } from '../../../utils/helpers';

export default function Avatar({
  src,
  name,
  size = 'md', // 'sm' | 'md' | 'lg' | 'xl'
  status,      // 'online' | 'offline' | 'busy' | 'away'
  className = '',
  style = {},
}) {
  const sizeMap = {
    sm: { dim: 28, fontSize: '11px', statusDim: 7 },
    md: { dim: 36, fontSize: '13px', statusDim: 9 },
    lg: { dim: 46, fontSize: '16px', statusDim: 11 },
    xl: { dim: 64, fontSize: '22px', statusDim: 14 },
  };

  const s = sizeMap[size] || sizeMap.md;

  const statusColors = {
    online: '#16A34A',
    offline: '#94A3B8',
    busy: '#DC2626',
    away: '#D97706',
  };

  const initials = getInitials(name);

  return (
    <div
      className={`avatar-component ${className}`}
      style={{
        position: 'relative',
        width: `${s.dim}px`,
        height: `${s.dim}px`,
        borderRadius: '50%',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        userSelect: 'none',
        ...style,
      }}
    >
      {src ? (
        <img
          src={src}
          alt={name || 'Avatar'}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            objectFit: 'cover',
            border: '1.5px solid #E2E8F0',
          }}
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #1565C0 0%, #1E88E5 100%)',
            color: '#FFFFFF',
            fontSize: s.fontSize,
            fontWeight: '800',
            fontFamily: 'Cairo, sans-serif',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1.5px solid #BFDBFE',
            textTransform: 'uppercase',
          }}
        >
          {initials}
        </div>
      )}

      {status && statusColors[status] && (
        <span
          style={{
            position: 'absolute',
            bottom: '0px',
            right: '0px',
            width: `${s.statusDim}px`,
            height: `${s.statusDim}px`,
            borderRadius: '50%',
            background: statusColors[status],
            border: '2px solid #FFFFFF',
          }}
        />
      )}
    </div>
  );
}

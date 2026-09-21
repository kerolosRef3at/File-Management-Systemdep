import React from 'react';

export default function Spinner({ size = 'md', color = '#1565C0', className = '', style = {} }) {
  const sizeMap = {
    sm: 14,
    md: 20,
    lg: 32,
    xl: 48,
  };

  const dim = typeof size === 'number' ? size : sizeMap[size] || 20;

  return (
    <div
      className={`inline-spinner ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
    >
      <svg
        width={dim}
        height={dim}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          animation: 'spinAnimation 0.85s linear infinite',
        }}
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke={color}
          strokeWidth="3"
          strokeOpacity="0.2"
        />
        <path
          d="M12 2C6.47715 2 2 6.47715 2 12C2 13.6841 2.41727 15.2711 3.15074 16.6667"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      <style>{`
        @keyframes spinAnimation {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

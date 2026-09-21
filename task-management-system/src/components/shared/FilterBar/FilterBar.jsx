import React from 'react';

export default function FilterBar({
  children,
  className = '',
  style = {},
}) {
  return (
    <div
      className={`filter-bar ${className}`}
      style={{
        display: 'flex',
        gap: '10px',
        flexWrap: 'wrap',
        alignItems: 'center',
        marginBottom: '16px',
        fontFamily: 'Cairo, sans-serif',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

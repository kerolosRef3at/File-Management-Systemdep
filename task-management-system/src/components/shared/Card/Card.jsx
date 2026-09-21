import React from 'react';

export function CardHeader({ children, title, subtitle, action, className = '', style = {} }) {
  return (
    <div
      className={`card-header ${className}`}
      style={{
        padding: '16px 20px',
        borderBottom: '1px solid #E8EDF5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        ...style,
      }}
    >
      {(title || subtitle) ? (
        <div>
          {title && <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A', margin: 0 }}>{title}</h3>}
          {subtitle && <p style={{ fontSize: '12px', color: '#94A3B8', margin: '2px 0 0' }}>{subtitle}</p>}
        </div>
      ) : (
        children
      )}
      {action && <div>{action}</div>}
    </div>
  );
}

export function CardBody({ children, className = '', style = {} }) {
  return (
    <div
      className={`card-body ${className}`}
      style={{
        padding: '20px',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '', style = {} }) {
  return (
    <div
      className={`card-footer ${className}`}
      style={{
        padding: '14px 20px',
        borderTop: '1px solid #E8EDF5',
        background: '#FAFBFD',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export default function Card({
  children,
  hoverable = false,
  onClick,
  className = '',
  style = {},
  ...props
}) {
  return (
    <div
      onClick={onClick}
      className={`card-container ${className}`}
      style={{
        background: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #E8EDF5',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        overflow: 'hidden',
        fontFamily: 'Cairo, sans-serif',
        transition: hoverable ? 'transform 0.2s ease, box-shadow 0.2s ease' : 'none',
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
      onMouseEnter={hoverable ? (e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(15, 23, 42, 0.08)';
      } : undefined}
      onMouseLeave={hoverable ? (e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)';
      } : undefined}
      {...props}
    >
      {children}
    </div>
  );
}

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

import React, { useState } from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  fullWidth?: boolean;
}

/** Animated submit button with loading spinner */
export default function Button({
  children, type = 'button', onClick, loading = false,
  variant = 'primary', fullWidth = true, disabled = false, style = {}, ...props
}: ButtonProps) {
  const [hovered, setHovered] = useState(false);

  const base = {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    width: fullWidth ? '100%' : 'auto',
    padding: '14px 24px',
    border: 'none', borderRadius: 'var(--radius-sm)',
    fontSize: 15, fontWeight: 600, fontFamily: 'inherit',
    cursor: loading || disabled ? 'not-allowed' : 'pointer',
    transition: 'all 250ms',
    position: 'relative' as const, overflow: 'hidden',
    opacity: disabled && !loading ? 0.5 : 1,
    transform: hovered && !loading && !disabled ? 'translateY(-1px)' : 'translateY(0)',
  };

  const variants = {
    primary: {
      background: 'linear-gradient(135deg, #22c55e 0%, #14b8a6 100%)',
      color: '#fff',
      boxShadow: hovered
        ? '0 6px 28px rgba(34,197,94,0.5)'
        : '0 4px 20px rgba(34,197,94,0.35)',
    },
    secondary: {
      background: 'var(--bg-input)',
      border: '1px solid var(--border)',
      color: 'var(--text-secondary)',
    },
    danger: {
      background: 'linear-gradient(135deg, #ef4444, #dc2626)',
      color: '#fff',
      boxShadow: '0 4px 16px rgba(239,68,68,0.3)',
    },
  };

  return (
    <button
      type={type}
      onClick={!loading && !disabled ? onClick : undefined}
      disabled={loading || disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ ...base, ...variants[variant], ...style }}
      {...props}
    >
      {loading ? (
        <span style={{
          display: 'inline-block',
          width: 18, height: 18,
          border: '2px solid rgba(255,255,255,0.3)',
          borderTopColor: '#fff',
          borderRadius: '50%',
          animation: 'btn-spin 0.7s linear infinite',
        }} />
      ) : children}
      <style>{`@keyframes btn-spin { to { transform: rotate(360deg); } }`}</style>
    </button>
  );
}

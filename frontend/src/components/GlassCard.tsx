import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

/** Glassmorphism card */
export default function GlassCard({ children, style = {}, className = '' }: GlassCardProps) {
  return (
    <div
      className={className}
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.5), 0 0 40px rgba(34,197,94,0.1)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

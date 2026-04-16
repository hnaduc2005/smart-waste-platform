import { Link } from 'react-router-dom';

/** Shared brand sidebar for all auth pages */
export default function AuthBrandSide({ title, highlight, subtitle, stats, features }) {
  return (
    <aside style={{
      display: 'flex', flexDirection: 'column', justifyContent: 'center',
      padding: '60px 64px', position: 'relative', overflow: 'hidden',
    }}>
      {/* Tinted border-right overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(135deg, rgba(34,197,94,0.05) 0%, rgba(20,184,166,0.03) 100%)',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        pointerEvents: 'none',
      }} />

      {/* Logo */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
        <div style={{
          width: 44, height: 44,
          background: 'linear-gradient(135deg, #22c55e, #14b8a6)',
          borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, boxShadow: '0 0 20px rgba(34,197,94,0.4)', flexShrink: 0,
        }}>♻️</div>
        <span style={{
          fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px',
          background: 'linear-gradient(135deg, #22c55e, #14b8a6)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>EcoCycle</span>
      </Link>

      {/* Headline */}
      <div style={{ marginTop: 64 }}>
        <h1 style={{
          fontSize: 'clamp(30px, 3vw, 46px)', fontWeight: 800,
          lineHeight: 1.15, letterSpacing: '-1px', color: 'var(--text-primary)', marginBottom: 20,
        }}>
          {title}{' '}
          {highlight && (
            <span style={{
              background: 'linear-gradient(135deg, #22c55e, #14b8a6)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>{highlight}</span>
          )}
        </h1>
        <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 380 }}>
          {subtitle}
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ display: 'flex', gap: 40, marginTop: 52 }}>
          {stats.map(s => (
            <div key={s.label}>
              <div style={{
                fontSize: 28, fontWeight: 800,
                background: 'linear-gradient(135deg, #22c55e, #14b8a6)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                lineHeight: 1,
              }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginTop: 4 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Features */}
      {features && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 52 }}>
          {features.map(f => (
            <div key={f.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: 14, color: 'var(--text-secondary)' }}>
              <div style={{
                width: 32, height: 32, flexShrink: 0,
                background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
                borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
              }}>{f.icon}</div>
              <div>
                {f.title && <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: 2 }}>{f.title}</strong>}
                {f.label}
              </div>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}

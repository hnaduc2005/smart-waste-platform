import { useEffect, useState } from 'react';

/** Animated alert box - error | success | info */
export default function Alert({ message, type = 'error', onClose }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (message) setVisible(true);
    else setVisible(false);
  }, [message]);

  if (!message) return null;

  const styles = {
    error:   { bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)',   color: '#fca5a5', icon: '⚠️' },
    success: { bg: 'rgba(34,197,94,0.1)',    border: 'rgba(34,197,94,0.25)',   color: '#86efac', icon: '✅' },
    info:    { bg: 'rgba(59,130,246,0.1)',   border: 'rgba(59,130,246,0.25)',  color: '#93c5fd', icon: 'ℹ️' },
  };
  const s = styles[type] || styles.error;

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      padding: '14px 16px', borderRadius: 'var(--radius-sm)',
      background: s.bg, border: `1px solid ${s.border}`, color: s.color,
      fontSize: 13, lineHeight: 1.5, marginBottom: 20,
      animation: 'slideDown 0.3s ease',
    }}>
      <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{s.icon}</span>
      <span style={{ flex: 1 }}>{message}</span>
      {onClose && (
        <button onClick={onClose} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: s.color, fontSize: 16, padding: 0, opacity: 0.7,
        }}>✕</button>
      )}
      <style>{`@keyframes slideDown { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}

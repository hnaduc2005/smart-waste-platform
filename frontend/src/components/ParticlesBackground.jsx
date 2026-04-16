import { useEffect, useRef } from 'react';
import styles from './ParticlesBackground.module.css';

const COLORS = ['#22c55e', '#14b8a6', '#4ade80', '#2dd4bf'];

export default function ParticlesBackground() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const particles = [];
    for (let i = 0; i < 22; i++) {
      const p = document.createElement('div');
      const size = Math.random() * 4 + 2;
      p.style.cssText = `
        position: absolute;
        border-radius: 50%;
        width: ${size}px; height: ${size}px;
        left: ${Math.random() * 100}%;
        background: ${COLORS[Math.floor(Math.random() * COLORS.length)]};
        opacity: 0;
        animation: floatUp ${Math.random() * 15 + 10}s linear ${Math.random() * 10}s infinite;
      `;
      container.appendChild(p);
      particles.push(p);
    }

    return () => particles.forEach(p => p.remove());
  }, []);

  return (
    <>
      <div className="page-bg" />
      <div ref={containerRef} style={{ position: 'fixed', inset: 0, zIndex: -1, pointerEvents: 'none' }} />
      <style>{`
        @keyframes floatUp {
          0%   { transform: translateY(100vh) scale(0); opacity: 0; }
          10%  { opacity: 0.4; }
          90%  { opacity: 0.1; }
          100% { transform: translateY(-10vh) scale(1); opacity: 0; }
        }
      `}</style>
    </>
  );
}

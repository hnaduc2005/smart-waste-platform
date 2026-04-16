import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { icon: '🏠', label: 'Tổng quan', id: 'overview', active: true },
  { icon: '🗑️', label: 'Yêu cầu thu gom', id: 'requests' },
  { icon: '🏆', label: 'Điểm thưởng', id: 'rewards' },
  { icon: '📊', label: 'Báo cáo', id: 'reports' },
  { icon: '🗺️', label: 'Bản đồ', id: 'map' },
  { icon: '🔔', label: 'Thông báo', id: 'notifications', badge: 3 },
  { icon: '⚙️', label: 'Cài đặt', id: 'settings' },
];

const STATS = [
  { icon: '♻️', color: 'rgba(34,197,94,0.12)',  value: '24',     label: 'Lần thu gom', trend: '↑ +3 tháng này' },
  { icon: '🏆', color: 'rgba(20,184,166,0.12)',  value: '1,240',  label: 'Điểm tích lũy', trend: '↑ +50 hôm nay' },
  { icon: '⚖️', color: 'rgba(59,130,246,0.12)',  value: '87kg',   label: 'Rác tái chế', trend: '↑ +12kg tháng này' },
  { icon: '🌱', color: 'rgba(234,179,8,0.12)',   value: 'Top 5%', label: 'Xếp hạng khu vực', trend: '↑ Tăng 8 bậc' },
];

const ACTIVITIES = [
  { icon: '✅', bg: 'rgba(34,197,94,0.1)',  title: 'Thu gom hoàn thành', sub: '+50 điểm · Rác hữu cơ 2kg',  badge: 'success', time: '2 giờ trước' },
  { icon: '⏳', bg: 'rgba(234,179,8,0.1)',  title: 'Yêu cầu đang xử lý', sub: 'Đang chờ · Rác tái chế 3.5kg', badge: 'warning', time: 'Hôm nay' },
  { icon: '🏆', bg: 'rgba(59,130,246,0.1)', title: 'Đạt huy hiệu mới',    sub: 'Green Hero · 100kg rác đã phân loại', badge: 'info', time: '3 ngày trước' },
];

const BADGE_STYLES = {
  success: { bg: 'rgba(34,197,94,0.15)',  color: '#4ade80' },
  warning: { bg: 'rgba(234,179,8,0.15)',  color: '#fbbf24' },
  info:    { bg: 'rgba(59,130,246,0.15)', color: '#60a5fa' },
};

// ── Animated Mini Bar Chart ────────────────────────────────────────
function BarChart() {
  const bars = [40, 65, 30, 80, 55, 90, 45];
  const days = ['T2','T3','T4','T5','T6','T7','CN'];
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120, padding: '0 4px' }}>
        {bars.map((h, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
            <div style={{
              width: '100%', height: `${h}%`,
              background: 'linear-gradient(to top, #22c55e, #14b8a6)',
              borderRadius: '4px 4px 0 0', opacity: 0.7,
              animationName: 'barGrow', animationDuration: '0.8s',
              animationDelay: `${i * 0.1}s`, animationFillMode: 'both',
              animationTimingFunction: 'ease-out',
              transformOrigin: 'bottom',
            }} />
          </div>
        ))}
        <style>{`@keyframes barGrow { from { transform: scaleY(0); opacity: 0; } to { transform: scaleY(1); opacity: 0.7; } }`}</style>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>
        {days.map(d => <span key={d}>{d}</span>)}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState('overview');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    navigate('/login');
  };

  const roleMap = { CITIZEN: '🧑‍💼 Công dân', COLLECTOR: '🚛 Thu gom', ENTERPRISE: '🏭 Doanh nghiệp' };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Logout modal */}
      {showLogoutModal && (
        <div onClick={(e) => e.target === e.currentTarget && setShowLogoutModal(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            background: '#111a16', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 28,
            padding: '36px 32px', maxWidth: 360, width: '90%', textAlign: 'center',
            animation: 'slideDown 0.2s ease',
          }}>
            <div style={{ fontSize: 44, marginBottom: 16 }}>👋</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Đăng xuất?</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 28 }}>
              Bạn có chắc muốn đăng xuất khỏi tài khoản EcoCycle không?
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setShowLogoutModal(false)}
                style={{ flex: 1, padding: '12px 20px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-secondary)', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
                Hủy bỏ
              </button>
              <button onClick={handleLogout} disabled={loggingOut}
                style={{ flex: 1, padding: '12px 20px', background: 'linear-gradient(135deg,#ef4444,#dc2626)', border: 'none', borderRadius: 8, color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                {loggingOut ? '...' : 'Đăng xuất'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Sidebar ── */}
      <nav style={{ width: 260, flexShrink: 0, background: 'rgba(255,255,255,0.04)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', padding: '28px 0', backdropFilter: 'blur(20px)' }}>
        {/* Logo */}
        <div style={{ padding: '0 24px 24px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#22c55e,#14b8a6)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>♻️</div>
            <span style={{ fontSize: 18, fontWeight: 800, background: 'linear-gradient(135deg,#22c55e,#14b8a6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>EcoCycle</span>
          </div>
        </div>

        {/* Nav */}
        <div style={{ flex: 1, padding: '16px 12px' }}>
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => setActiveNav(item.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                padding: '11px 12px', borderRadius: 8, border: 'none',
                background: activeNav === item.id ? 'rgba(34,197,94,0.1)' : 'transparent',
                color: activeNav === item.id ? 'var(--green-400)' : 'var(--text-secondary)',
                fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all 150ms', textAlign: 'left',
              }}>
              <span style={{ fontSize: 18, width: 20, textAlign: 'center' }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge && (
                <span style={{ background: 'var(--green-500)', color: 'white', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10 }}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* User card */}
        <div style={{ padding: '16px 12px 0', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 8 }}>
            <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#22c55e,#14b8a6)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: 'white', flexShrink: 0 }}>
              {user?.username?.charAt(0).toUpperCase() || '?'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.username || '...'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--green-400)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                {roleMap[user?.role] || user?.role}
              </div>
            </div>
            <button onClick={() => setShowLogoutModal(true)}
              title="Đăng xuất"
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16, padding: 4, borderRadius: 6, transition: 'all 150ms' }}
              onMouseEnter={e => { e.target.style.color='#ef4444'; e.target.style.background='rgba(239,68,68,0.1)'; }}
              onMouseLeave={e => { e.target.style.color='var(--text-muted)'; e.target.style.background='transparent'; }}>
              ⏻
            </button>
          </div>
        </div>
      </nav>

      {/* ── Main content ── */}
      <main style={{ flex: 1, padding: 40, overflowY: 'auto' }}>

        {/* Welcome banner */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(34,197,94,0.1) 0%, rgba(20,184,166,0.07) 100%)',
          border: '1px solid rgba(34,197,94,0.2)', borderRadius: 20,
          padding: '28px 32px', marginBottom: 32, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', right: 32, top: '50%', transform: 'translateY(-50%)', fontSize: 80, opacity: 0.12 }}>♻️</div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 20, fontSize: 12, color: 'var(--green-400)', fontWeight: 600, marginBottom: 12 }}>
            🟢 Đang hoạt động
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.3px', marginBottom: 4 }}>
            Xin chào, <span style={{ background: 'linear-gradient(135deg,#22c55e,#14b8a6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{user?.username}</span>! 👋
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} · Cùng tạo ra tác động tích cực!
          </p>
        </div>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 36 }}>
          {STATS.map(s => (
            <div key={s.label} style={{ padding: 24, background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, backdropFilter: 'blur(20px)' }}>
              <div style={{ width: 44, height: 44, background: s.color, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 16 }}>{s.icon}</div>
              <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-1px', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6 }}>{s.label}</div>
              <div style={{ fontSize: 12, color: 'var(--green-400)', marginTop: 8, fontWeight: 500 }}>{s.trend}</div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <p style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>⚡ Thao tác nhanh</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginBottom: 36 }}>
          {[
            { icon: '📍', label: 'Đặt lịch thu gom' },
            { icon: '🤖', label: 'Nhận diện rác AI' },
            { icon: '🗺️', label: 'Xem bản đồ' },
            { icon: '🏅', label: 'Đổi điểm thưởng' },
          ].map(a => (
            <div key={a.label} style={{ padding: 20, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, cursor: 'pointer', textAlign: 'center', transition: 'all 250ms' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(34,197,94,0.4)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.background = 'rgba(34,197,94,0.06)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{a.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{a.label}</div>
            </div>
          ))}
        </div>

        {/* Chart + Activity */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div style={{ padding: 24, background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, backdropFilter: 'blur(20px)' }}>
            <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>📈 Hoạt động 7 ngày qua</p>
            <BarChart />
          </div>

          <div style={{ padding: 24, background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, backdropFilter: 'blur(20px)' }}>
            <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>🕐 Hoạt động gần đây</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {ACTIVITIES.map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 }}>
                  <div style={{ width: 38, height: 38, background: a.bg, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0 }}>{a.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{a.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 3 }}>
                      <span style={{ padding: '2px 8px', borderRadius: 10, background: BADGE_STYLES[a.badge].bg, color: BADGE_STYLES[a.badge].color, fontSize: 10, fontWeight: 700 }}>
                        {a.sub.split('·')[0]}
                      </span>
                      {' · '}{a.sub.split('·')[1]}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{a.time}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <style>{`@keyframes slideDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }`}</style>
      </main>
    </div>
  );
}

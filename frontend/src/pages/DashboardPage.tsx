import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CitizenRequestView } from '../components/CitizenRequestView';
import { MapDispatcher } from '../components/MapDispatcher';
import { CollectorTasksView } from '../components/CollectorTasksView';
import { CollectorHistoryView } from '../components/CollectorHistoryView';
import { rewardApi } from '../services/rewardApi';
import { RewardView } from '../components/RewardView';
import { RewardConfigView } from '../components/RewardConfigView';
import { CitizenReportView } from '../components/CitizenReportView';
import { CitizenComplaintView } from '../components/CitizenComplaintView';
import { NotificationView } from '../components/NotificationView';
import { UserProfileView } from '../components/UserProfileView';
import { EnterpriseDashboardView } from '../components/EnterpriseDashboardView';
import { EnterpriseStatsView } from '../components/EnterpriseStatsView';
import { notificationApi } from '../services/notificationApi';
import { userApi } from '../services/userApi';
import { enterpriseApi } from '../services/enterpriseApi';
import { collectionApi } from '../services/collectionApi';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
interface NavItem {
  icon: string;
  label: string;
  id: string;
  active?: boolean;
  badge?: number;
  roles?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { icon: '🏠', label: 'Tổng quan', id: 'overview', active: true, roles: ['CITIZEN', 'COLLECTOR', 'ENTERPRISE'] },
  { icon: '🗑️', label: 'Yêu cầu thu gom', id: 'requests', roles: ['CITIZEN'] },
  { icon: '🚚', label: 'Tuyến thu gom', id: 'tasks', roles: ['COLLECTOR'] },
  { icon: '📋', label: 'Lịch sử thu gom', id: 'history', roles: ['COLLECTOR'] },
  { icon: '🏭', label: 'Quản lý doanh nghiệp', id: 'enterprise', roles: ['ENTERPRISE'] },
  { icon: '📊', label: 'Thống kê vận hành', id: 'stats', roles: ['ENTERPRISE'] },
  { icon: '🗺️', label: 'Bản đồ điều phối', id: 'map', roles: ['ENTERPRISE'] },
  { icon: '🏆', label: 'Điểm thưởng', id: 'rewards', roles: ['CITIZEN'] },
  { icon: '📊', label: 'Báo cáo', id: 'reports', roles: ['CITIZEN'] },
  { icon: '📩', label: 'Khiếu nại', id: 'complaints', roles: ['CITIZEN'] },
  { icon: '🔔', label: 'Thông báo', id: 'notifications', roles: ['CITIZEN', 'COLLECTOR', 'ENTERPRISE'] },
  { icon: '⚙️', label: 'Cài đặt', id: 'settings', roles: ['CITIZEN', 'COLLECTOR', 'ENTERPRISE'] },
];

const BADGE_STYLES = {
  success: { bg: 'rgba(34,197,94,0.15)', color: '#4ade80' },
  warning: { bg: 'rgba(234,179,8,0.15)', color: '#fbbf24' },
  info: { bg: 'rgba(59,130,246,0.15)', color: '#60a5fa' },
};

const WASTE_LABELS: Record<string, string> = {
  RECYCLABLE: '♻️ Tái chế', ORGANIC: '🍎 Hữu cơ',
  HAZARDOUS: '⚠️ Độc hại', BULKY: '🛏️ Cồng kềnh', ELECTRONIC: '💻 Điện tử',
};

const STATUS_INFO: Record<string, { icon: string; badge: 'success' | 'warning' | 'info'; label: string }> = {
  COLLECTED: { icon: '✅', badge: 'success', label: 'Hoàn thành' },
  COMPLETED: { icon: '✅', badge: 'success', label: 'Hoàn thành' },
  PENDING: { icon: '⏳', badge: 'warning', label: 'Chờ xử lý' },
  ASSIGNED: { icon: '🟡', badge: 'info', label: 'Đã tiếp nhận' },
  ON_THE_WAY: { icon: '🚚', badge: 'info', label: 'Đang đến' },
  CANCELLED: { icon: '❌', badge: 'warning', label: 'Đã hủy' },
};

function CustomChart({ data }: { data: { name: string; điểm: number; đơn: number }[] }) {
  return (
    <div style={{ width: '100%', height: 250 }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPoints" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ backgroundColor: 'rgba(17, 24, 39, 0.9)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}
            itemStyle={{ color: '#22c55e', fontWeight: 'bold' }}
            cursor={{ fill: 'rgba(255,255,255,0.02)' }}
          />
          <Area type="monotone" dataKey="điểm" name="Điểm thưởng" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#colorPoints)" />
          <Area type="monotone" dataKey="đơn" name="Số đơn" stroke="#14b8a6" strokeWidth={2} fillOpacity={0} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState('overview');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [displayName, setDisplayName] = useState<string>('');

  // Citizen real stats
  const [citizenRequests, setCitizenRequests] = useState<any[]>([]);
  const [citizenCompletedTasks, setCitizenCompletedTasks] = useState<any[]>([]);
  const [citizenPoints, setCitizenPoints] = useState(0);
  const [citizenChartData, setCitizenChartData] = useState<any[]>([]);

  useEffect(() => {
    let interval: any;
    const updateUnreadCount = async () => {
      if (!user?.userId) return;
      try {
        const data = await notificationApi.getMine();
        setUnreadNotificationCount(data.filter((n: any) => !n.isRead).length);
      } catch (e) { }
    };
    updateUnreadCount();
    interval = setInterval(updateUnreadCount, 3000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const fetchDisplayName = async () => {
      if (!user?.userId) return;
      try {
        if (user.role === 'ENTERPRISE') {
          const ent = await enterpriseApi.getMyEnterprise(user.userId).catch(() => null);
          const profile = await userApi.getProfile(user.userId).catch(() => null);
          setDisplayName(ent?.name || profile?.companyName || user.username);
        } else {
          const profile = await userApi.getProfile(user.userId);
          setDisplayName(profile?.fullName || user.username);
        }
      } catch (error) {
        setDisplayName(user.username);
      }
    };
    fetchDisplayName();
  }, [user]);

  // Fetch citizen-specific real data
  useEffect(() => {
    if (!user?.userId || user.role !== 'CITIZEN') return;

    const load = async () => {
      const [reqResult, completedResult, rewardResult] = await Promise.allSettled([
        collectionApi.getCitizenRequests(user.userId),
        collectionApi.getCitizenCompletedTasks(user.userId),
        rewardApi.getHistory(user.userId),
      ]);

      const requests = reqResult.status === 'fulfilled' ? reqResult.value : [];
      const completed = completedResult.status === 'fulfilled' ? completedResult.value : [];
      const rewards = rewardResult.status === 'fulfilled' ? rewardResult.value : [];

      setCitizenRequests(requests);
      setCitizenCompletedTasks(completed);

      const totalPts = rewards.reduce((s: number, r: any) => s + (r.amount ?? r.points ?? 0), 0);
      setCitizenPoints(totalPts);

      // Build 7-day chart: đếm đơn theo ngày trong tuần
      const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
      const today = new Date();
      const chart = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() - (6 - i));
        const dayLabel = dayNames[d.getDay()];
        const dateStr = d.toISOString().slice(0, 10);

        const dayRequests = requests.filter((r: any) => {
          const created = r.createdAt ? r.createdAt.slice(0, 10) : '';
          return created === dateStr;
        });
        const dayRewards = rewards.filter((r: any) => {
          const created = r.createdAt ? r.createdAt.slice(0, 10) : '';
          return created === dateStr;
        });
        const pts = dayRewards.reduce((s: number, r: any) => s + (r.amount ?? r.points ?? 0), 0);

        return { name: dayLabel, điểm: pts, đơn: dayRequests.length };
      });
      setCitizenChartData(chart);
    };

    load();
  }, [user]);

  // Derived citizen stats
  const totalWeightKg = citizenCompletedTasks.reduce((s: number, t: any) => s + (t.weight ?? 0), 0);
  const thisMonthRequests = citizenRequests.filter((r: any) => {
    if (!r.createdAt) return false;
    const d = new Date(r.createdAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const citizenStats = [
    { icon: '♻️', color: 'rgba(34,197,94,0.12)', value: String(citizenRequests.length), label: 'Lần thu gom', trend: `↑ +${thisMonthRequests} tháng này` },
    { icon: '🏆', color: 'rgba(20,184,166,0.12)', value: citizenPoints.toLocaleString(), label: 'Điểm tích lũy', trend: citizenPoints > 0 ? '🔥 Có điểm để đổi thưởng' : 'Chưa có điểm' },
    { icon: '⚖️', color: 'rgba(59,130,246,0.12)', value: `${totalWeightKg.toFixed(1)} kg`, label: 'Tổng khối lượng', trend: `${citizenCompletedTasks.length} cuốc hoàn thành` },
    { icon: '📅', color: 'rgba(234,179,8,0.12)', value: String(citizenRequests.filter((r: any) => r.status === 'PENDING' || r.status === 'ASSIGNED' || r.status === 'ON_THE_WAY').length), label: 'Đang chờ xử lý', trend: 'Đơn chưa hoàn thành' },
  ];

  // 3 hoạt động gần nhất từ request thực tế
  const recentActivities = [...citizenRequests]
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 3)
    .map((r: any) => {
      const si = STATUS_INFO[r.status] ?? { icon: '❔', badge: 'warning' as const, label: r.status };
      const timeAgo = (() => {
        if (!r.createdAt) return '';
        const diff = Date.now() - new Date(r.createdAt).getTime();
        const h = Math.floor(diff / 3600000);
        const d = Math.floor(diff / 86400000);
        return h < 1 ? 'Vừa xong' : h < 24 ? `${h} giờ trước` : `${d} ngày trước`;
      })();
      return {
        icon: si.icon,
        bg: BADGE_STYLES[si.badge].bg,
        title: si.label,
        sub: `${WASTE_LABELS[r.type] ?? r.type} · ID: ${r.id?.substring(0, 8)}`,
        badge: si.badge,
        time: timeAgo,
      };
    });

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
          {NAV_ITEMS.filter(item => !item.roles || !user?.role || item.roles.includes(user.role)).map(item => (
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
              {item.id === 'notifications' && unreadNotificationCount > 0 && (
                <span style={{ background: 'var(--green-500)', color: 'white', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10 }}>
                  {unreadNotificationCount}
                </span>
              )}
              {item.badge && item.id !== 'notifications' && (
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
                {displayName || user?.username || '...'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--green-400)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                {user?.role ? (roleMap[user.role as keyof typeof roleMap] || user.role) : 'CITIZEN'}
              </div>
            </div>
            <button onClick={() => setShowLogoutModal(true)}
              title="Đăng xuất"
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16, padding: 4, borderRadius: 6, transition: 'all 150ms' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#ef4444'; (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.1)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
              ⏻
            </button>
          </div>
        </div>
      </nav>

      {/* ── Main content ── */}
      <main style={{ flex: 1, padding: 40, overflowY: 'auto' }}>

        {activeNav === 'requests' && ['CITIZEN'].includes(user?.role || '') && <CitizenRequestView />}
        {activeNav === 'map' && user?.role === 'ENTERPRISE' && <MapDispatcher />}
        {activeNav === 'tasks' && user?.role === 'COLLECTOR' && <CollectorTasksView />}
        {activeNav === 'history' && user?.role === 'COLLECTOR' && <CollectorHistoryView />}
        {activeNav === 'rewards' && user?.role === 'CITIZEN' && <RewardView />}
        {activeNav === 'reports' && user?.role === 'CITIZEN' && <CitizenReportView />}
        {activeNav === 'complaints' && user?.role === 'CITIZEN' && <CitizenComplaintView />}
        {activeNav === 'enterprise' && user?.role === 'ENTERPRISE' && <EnterpriseDashboardView />}
        {activeNav === 'stats' && user?.role === 'ENTERPRISE' && <EnterpriseStatsView />}
        {activeNav === 'notifications' && <NotificationView onNavigateToTasks={() => setActiveNav('tasks')} />}
        {activeNav === 'settings' && <UserProfileView />}

        {activeNav === 'overview' && (
          <>
            {/* Welcome banner — chung cho tất cả role */}
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
                Xin chào, <span style={{ background: 'linear-gradient(135deg,#22c55e,#14b8a6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{displayName || user?.username}</span>! 👋
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} · Cùng tạo ra tác động tích cực!
              </p>
            </div>

            {/* ── CITIZEN overview ── */}
            {user?.role === 'CITIZEN' && (
              <>
                {/* Stats từ DB thật */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 36 }}>
                  {citizenStats.map(s => (
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
                    { icon: '📍', label: 'Đặt lịch thu gom', action: () => setActiveNav('requests') },
                    { icon: '🤖', label: 'Nhận diện rác AI', action: () => navigate('/waste-classifier') },
                    { icon: '🏅', label: 'Đổi điểm thưởng', action: () => setActiveNav('rewards') },
                    { icon: '📊', label: 'Xem báo cáo', action: () => setActiveNav('reports') },
                  ].map(a => (
                    <div key={a.label} onClick={a.action} style={{ padding: 20, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, cursor: 'pointer', textAlign: 'center', transition: 'all 250ms' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(34,197,94,0.4)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.background = 'rgba(34,197,94,0.06)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}>
                      <div style={{ fontSize: 28, marginBottom: 10 }}>{a.icon}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{a.label}</div>
                    </div>
                  ))}
                </div>

                {/* Chart + Activity */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24 }}>
                  <div style={{ padding: 24, background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, backdropFilter: 'blur(20px)' }}>
                    <p style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, display: 'flex', justifyContent: 'space-between' }}>
                      <span>📈 Hoạt động 7 ngày qua</span>
                      <span style={{ fontSize: 12, color: 'var(--green-400)', background: 'rgba(34,197,94,0.1)', padding: '4px 12px', borderRadius: 12 }}>
                        {citizenChartData.reduce((s, d) => s + d.điểm, 0)} điểm
                      </span>
                    </p>
                    {citizenChartData.some(d => d.điểm > 0 || d.đơn > 0)
                      ? <CustomChart data={citizenChartData} />
                      : <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Chưa có hoạt động trong 7 ngày qua</div>
                    }
                  </div>
                  <div style={{ padding: 24, background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, backdropFilter: 'blur(20px)' }}>
                    <p style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>🕑 Đơn gần nhất</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {recentActivities.length === 0
                        ? <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>Chưa có đơn nào</div>
                        : recentActivities.map((a, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 }}>
                            <div style={{ width: 38, height: 38, background: a.bg, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0 }}>{a.icon}</div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 13, fontWeight: 600 }}>{a.title}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 3 }}>
                                <span style={{ padding: '2px 8px', borderRadius: 10, background: BADGE_STYLES[a.badge as keyof typeof BADGE_STYLES].bg, color: BADGE_STYLES[a.badge as keyof typeof BADGE_STYLES].color, fontSize: 10, fontWeight: 700 }}>
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
              </>
            )}

            {/* ── COLLECTOR overview ── */}
            {user?.role === 'COLLECTOR' && (
              <>
                <p style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>⚡ Thao tác nhanh</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginBottom: 36 }}>
                  {[
                    { icon: '🚚', label: 'Xem nhiệm vụ', action: () => setActiveNav('tasks') },
                    { icon: '📋', label: 'Lịch sử thu gom', action: () => setActiveNav('history') },
                    { icon: '🔔', label: 'Thông báo', action: () => setActiveNav('notifications') },
                    { icon: '⚙️', label: 'Cài đặt', action: () => setActiveNav('settings') },
                  ].map(a => (
                    <div key={a.label} onClick={a.action} style={{ padding: 20, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, cursor: 'pointer', textAlign: 'center', transition: 'all 250ms' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(34,197,94,0.4)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.background = 'rgba(34,197,94,0.06)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}>
                      <div style={{ fontSize: 28, marginBottom: 10 }}>{a.icon}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{a.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ padding: 28, background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(59,130,246,0.03))', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 20 }}>
                  <p style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>🚛 Trạng thái hôm nay</p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>
                    Vào mục <b>Tuyến thu gom</b> để xem các đơn được giao và cập nhật tiến trình. Sau khi hoàn thành, kiểm tra <b>Lịch sử</b> để xem kết quả.
                  </p>
                </div>
              </>
            )}

            {/* ── ENTERPRISE overview ── */}
            {user?.role === 'ENTERPRISE' && (
              <>
                <p style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>⚡ Thao tác nhanh</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginBottom: 36 }}>
                  {[
                    { icon: '🏭', label: 'Quản lý doanh nghiệp', action: () => setActiveNav('enterprise') },
                    { icon: '🗺️', label: 'Bản đồ điều phối', action: () => setActiveNav('map') },
                    { icon: '📊', label: 'Thống kê vận hành', action: () => setActiveNav('stats') },
                    { icon: '🔔', label: 'Thông báo', action: () => setActiveNav('notifications') },
                  ].map(a => (
                    <div key={a.label} onClick={a.action} style={{ padding: 20, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, cursor: 'pointer', textAlign: 'center', transition: 'all 250ms' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(34,197,94,0.4)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.background = 'rgba(34,197,94,0.06)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}>
                      <div style={{ fontSize: 28, marginBottom: 10 }}>{a.icon}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{a.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ padding: 28, background: 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(20,184,166,0.03))', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 20 }}>
                  <p style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>🏭 Hướng dẫn vận hành</p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>
                    Vào <b>Quản lý doanh nghiệp</b> để điều phối tài xế và xử lý đơn. Dùng <b>Bản đồ điều phối</b> để quan sát trực quan. Xem <b>Thống kê vận hành</b> để theo dõi hiệu suất và đội xe.
                  </p>
                </div>
              </>
            )}
          </>
        )}
        <style>{`@keyframes slideDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }`}</style>
      </main>
    </div>
  );
}

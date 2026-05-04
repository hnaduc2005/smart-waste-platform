import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminApi } from '../services/adminApi';
import { rewardApi } from '../services/rewardApi';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';

const S = {
  page: { display: 'flex', minHeight: '100vh', fontFamily: "'Inter','Segoe UI',sans-serif", background: '#0a0f0d', color: '#e2e8f0' } as React.CSSProperties,
  sidebar: { width: 240, background: '#111a16', borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column' as const, padding: '24px 0' },
  logo: { padding: '0 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 18, fontWeight: 800, color: '#22c55e' },
  navBtn: (active: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 10, width: '100%',
    padding: '11px 20px', background: active ? 'rgba(34,197,94,0.12)' : 'transparent',
    border: 'none', color: active ? '#22c55e' : '#94a3b8',
    fontSize: 14, fontWeight: 500, cursor: 'pointer', textAlign: 'left', transition: 'all 150ms',
  }),
  main: { flex: 1, padding: 36, overflowY: 'auto' as const },
  card: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 24 } as React.CSSProperties,
  badge: (color: string): React.CSSProperties => ({ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: color + '25', color }),
  btn: (color: string): React.CSSProperties => ({ padding: '6px 14px', borderRadius: 8, border: 'none', background: color, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }),
};

const STATUS_COLOR: Record<string, string> = {
  OPEN: '#f59e0b', IN_PROGRESS: '#60a5fa', RESOLVED: '#22c55e', CLOSED: '#94a3b8',
};
const STATUS_LABEL: Record<string, string> = {
  OPEN: '🟡 Chờ xử lý', IN_PROGRESS: '🔵 Đang xử lý', RESOLVED: '✅ Đã giải quyết', CLOSED: '⚫ Đã đóng',
};
const COMPLAINT_TYPE_LABEL: Record<string, string> = {
  NOT_COLLECTED: '🚫 Không đến lấy rác',
  LATE_COLLECTION: '⏰ Thu gom trễ',
  WRONG_POINTS: '🏆 Điểm tính sai',
  RUDE_BEHAVIOR: '😤 Thái độ xấu',
  DAMAGE: '💥 Hư hỏng tài sản',
  OTHER: '📝 Lý do khác',
};
const ROLE_COLOR: Record<string, string> = {
  CITIZEN: '#22c55e', COLLECTOR: '#14b8a6', ENTERPRISE: '#8b5cf6', ADMIN: '#f59e0b',
};

export default function AdminDashboardPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'overview' | 'users' | 'complaints' | 'rewards'>('overview');

  // Overview
  const [stats, setStats] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Users
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [lockingId, setLockingId] = useState<string | null>(null);
  const [changingRoleId, setChangingRoleId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Complaints
  const [complaints, setComplaints] = useState<any[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [adminNote, setAdminNote] = useState('');
  const [enterprises, setEnterprises] = useState<any[]>([]);
  const [resolving, setResolving] = useState(false);
  const [complaintsLoading, setComplaintsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [adminSidebarOpen, setAdminSidebarOpen] = useState(false);

  // Reward Rules
  const REWARD_DEFAULTS = [
    { id: '1', type: 'RECYCLABLE', label: 'Rác Tái Chế',    pointsPerKg: 10,  invalidMultiplier: 0.2, icon: '♻️' },
    { id: '2', type: 'ORGANIC',    label: 'Rác Hữu Cơ',     pointsPerKg: 5,   invalidMultiplier: 0.2, icon: '🍎' },
    { id: '3', type: 'HAZARDOUS',  label: 'Rác Độc Hại',    pointsPerKg: 50,  invalidMultiplier: 0.2, icon: '⚠️' },
    { id: '4', type: 'ELECTRONIC', label: 'Rác Điện Tử',    pointsPerKg: 100, invalidMultiplier: 0.2, icon: '💻' },
    { id: '5', type: 'BULKY',      label: 'Rác Cồng Kềnh',  pointsPerKg: 20,  invalidMultiplier: 0.2, icon: '🛋️' },
  ];
  const [rewardRules, setRewardRules] = useState(REWARD_DEFAULTS);
  const [rewardLoading, setRewardLoading] = useState(false);
  const [rewardSaving, setRewardSaving] = useState(false);
  const [rewardToast, setRewardToast] = useState<string | null>(null);

  const handleRefreshOverview = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        adminApi.getStats().then(setStats).catch(() => {}),
        adminApi.getCharts().then(setCharts).catch(() => {}),
        adminApi.getEnterprises().then(setEnterprises).catch(() => {}),
        adminApi.getRecentUsers().then(setRecentUsers).catch(() => {})
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  // Load overview
  useEffect(() => {
    handleRefreshOverview();
  }, []);

  // Load users
  useEffect(() => {
    if (tab !== 'users') return;
    setUsersLoading(true);
    adminApi.getAllUsers(roleFilter).then(setUsers).catch(() => setUsers([])).finally(() => setUsersLoading(false));
  }, [tab, roleFilter]);

  // Load complaints
  useEffect(() => {
    if (tab !== 'complaints') return;
    setComplaintsLoading(true);
    adminApi.getComplaints().then(setComplaints).catch(() => setComplaints([])).finally(() => setComplaintsLoading(false));
  }, [tab]);

  // Load reward rules
  useEffect(() => {
    if (tab !== 'rewards') return;
    setRewardLoading(true);
    rewardApi.getRules().then(data => {
      if (data && data.length > 0) {
        setRewardRules(prev => prev.map(pr => {
          const api = data.find((d: any) => d.type === pr.type);
          return api ? { ...pr, pointsPerKg: api.pointsPerKg, invalidMultiplier: api.invalidMultiplier ?? 0.2 } : pr;
        }));
      }
    }).catch(() => {}).finally(() => setRewardLoading(false));
  }, [tab]);

  const handleSaveRewards = async () => {
    setRewardSaving(true);
    try {
      await Promise.all(rewardRules.map(r =>
        rewardApi.updateRule(r.type, { pointsPerKg: r.pointsPerKg, invalidMultiplier: r.invalidMultiplier })
      ));
      setRewardToast('✅ Đã lưu cấu hình điểm thưởng thành công!');
    } catch {
      setRewardToast('❌ Lưu thất bại, vui lòng thử lại.');
    } finally {
      setRewardSaving(false);
      setTimeout(() => setRewardToast(null), 4000);
    }
  };

  const handleLock = async (userId: string, locked: boolean) => {
    setLockingId(userId);
    try {
      await adminApi.lockUser(userId, locked);
      setUsers(prev => prev.map(u => String(u.id) === userId ? { ...u, locked, status: locked ? 'LOCKED' : 'ACTIVE' } : u));
      if (selectedUser && String(selectedUser.id) === userId) setSelectedUser((p: any) => ({ ...p, locked, status: locked ? 'LOCKED' : 'ACTIVE' }));
    } finally { setLockingId(null); }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    setChangingRoleId(userId);
    try {
      await adminApi.changeRole(userId, newRole);
      setUsers(prev => prev.map(u => String(u.id) === userId ? { ...u, role: newRole } : u));
      if (selectedUser && String(selectedUser.id) === userId) setSelectedUser((p: any) => ({ ...p, role: newRole }));
    } finally { setChangingRoleId(null); }
  };

  const handleResolve = async (status: string) => {
    if (!selectedComplaint) return;
    setResolving(true);
    try {
      await adminApi.resolveComplaint(selectedComplaint.id, adminNote, status);
      setComplaints(prev => prev.map(c => c.id === selectedComplaint.id ? { ...c, status, adminNote } : c));
      setSelectedComplaint(null);
      setAdminNote('');
    } finally { setResolving(false); }
  };

  const TABS = [
    { id: 'overview',   icon: '📊', label: 'Tổng quan hệ thống' },
    { id: 'users',      icon: '👥', label: 'Quản lý tài khoản' },
    { id: 'complaints', icon: '📩', label: 'Khiếu nại' },
    { id: 'rewards',    icon: '🏅', label: 'Cấu hình điểm thưởng' },
  ] as const;

  const filteredComplaints = statusFilter === 'ALL'
    ? complaints
    : complaints.filter(c => c.status === statusFilter);

  return (
    <div className="admin-layout" style={S.page}>
      {/* Mobile sidebar toggle */}
      <button className="sidebar-toggle" onClick={() => setAdminSidebarOpen(!adminSidebarOpen)} aria-label="Toggle menu">
        {adminSidebarOpen ? '✕' : '☰'}
      </button>
      {/* Mobile overlay */}
      <div className={`sidebar-overlay ${adminSidebarOpen ? 'active' : ''}`} onClick={() => setAdminSidebarOpen(false)} />

      {/* Sidebar */}
      <nav className={`admin-sidebar-nav ${adminSidebarOpen ? 'open' : ''}`} style={S.sidebar}>
        <div style={S.logo}>⚙️ EcoAdmin</div>
        <div style={{ padding: '16px 0' }}>
          {TABS.map(t => (
            <button key={t.id} style={S.navBtn(tab === t.id)} onClick={() => { setTab(t.id); setAdminSidebarOpen(false); }}>
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>
        <div style={{ marginTop: 'auto', padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={() => { logout(); navigate('/login'); }}
            style={{ width: '100%', padding: '9px 0', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#f87171', fontSize: 13, cursor: 'pointer' }}>
            ⏻ Đăng xuất
          </button>
        </div>
      </nav>

      <main className="admin-main-content" style={S.main}>
        {/* ── OVERVIEW ── */}
        {tab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeIn 0.4s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800, background: 'linear-gradient(90deg, #22c55e, #14b8a6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Tổng quan hệ thống
                </h2>
                <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: 14 }}>Giám sát hoạt động và hiệu suất nền tảng theo thời gian thực.</p>
              </div>
              <button 
                disabled={refreshing}
                style={{ ...S.btn(refreshing ? '#64748b' : '#22c55e'), padding: '10px 20px', borderRadius: 12, display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, cursor: refreshing ? 'not-allowed' : 'pointer', opacity: refreshing ? 0.7 : 1 }} 
                onClick={handleRefreshOverview}
              >
                <span style={{ display: 'inline-block', transform: refreshing ? 'rotate(180deg)' : 'none', transition: 'transform 0.5s' }}>⟳</span> 
                {refreshing ? 'Đang cập nhật...' : 'Cập nhật dữ liệu'}
              </button>
            </div>

            {/* KPI cards */}
            <div className="admin-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
              {[
                { label: 'Tổng người dùng', value: stats?.totalUsers?.count ?? '...', icon: '👥', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
                { label: 'Rác thu gom (kg)', value: stats?.wasteCollected?.count?.toFixed(0) ?? '...', icon: '⚖️', color: '#14b8a6', bg: 'rgba(20,184,166,0.1)' },
                { label: 'Điểm thưởng đã cấp', value: stats?.rewardsClaimed?.count?.toFixed(0) ?? '...', icon: '🏆', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
                { label: 'Doanh nghiệp đối tác', value: enterprises.length > 0 ? enterprises.length : '...', icon: '🏭', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
              ].map(c => (
                <div key={c.label} style={{ ...S.card, padding: '20px', position: 'relative', overflow: 'hidden', border: `1px solid ${c.color}30`, transition: 'transform 0.2s', cursor: 'pointer' }}
                     onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                     onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                  <div style={{ position: 'absolute', right: -15, top: -15, fontSize: 100, opacity: 0.05 }}>{c.icon}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: c.color, marginBottom: 16 }}>
                      {c.icon}
                    </div>
                  </div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{c.value}</div>
                  <div style={{ fontSize: 14, color: '#94a3b8', marginTop: 8, fontWeight: 500 }}>{c.label}</div>
                </div>
              ))}
            </div>

            {/* Main Charts Area */}
            <div className="admin-charts-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div style={{ ...S.card, padding: '24px 30px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Phân bổ thu gom rác (kg)</h3>
                      <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>Thống kê theo từng tuần</p>
                    </div>
                    <select style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', padding: '6px 12px', borderRadius: 8, fontSize: 13, outline: 'none' }}>
                      <option value="7d">7 ngày qua</option>
                      <option value="30d">30 ngày qua</option>
                      <option value="all">Tất cả</option>
                    </select>
                  </div>
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={charts?.wasteDemographics ?? []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorOrganic" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorRecycle" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={12} axisLine={false} tickLine={false} dy={10} />
                      <YAxis stroke="#64748b" fontSize={12} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: '#111a16', border: '1px solid #1e3a2f', borderRadius: 10, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)' }} itemStyle={{ fontSize: 13, fontWeight: 600 }} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: 13, paddingTop: 10 }} />
                      <Area type="monotone" dataKey="organic" name="Hữu cơ" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#colorOrganic)" />
                      <Area type="monotone" dataKey="recycle" name="Tái chế" stroke="#14b8a6" strokeWidth={3} fillOpacity={1} fill="url(#colorRecycle)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="admin-sub-charts" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                  <div style={S.card}>
                    <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700 }}>Tăng trưởng người dùng</h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={charts?.userGrowth ?? []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={11} axisLine={false} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={11} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: '#111a16', border: '1px solid #1e3a2f', borderRadius: 10 }} />
                        <Line type="monotone" dataKey="users" name="Người dùng mới" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#111a16' }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={S.card}>
                    <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700 }}>Tỷ lệ rác theo loại</h3>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 220 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={[
                              { name: 'Tái chế được', value: 65, color: '#14b8a6' },
                              { name: 'Hữu cơ', value: 25, color: '#22c55e' },
                              { name: 'Độc hại', value: 10, color: '#f59e0b' }
                            ]} 
                            cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                            { [1,2,3].map((_, i) => <Cell key={i} fill={['#14b8a6', '#22c55e', '#f59e0b'][i]} />) }
                          </Pie>
                          <Tooltip contentStyle={{ background: '#111a16', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                          <Legend layout="vertical" verticalAlign="middle" align="right" iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar Info Area */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div style={{ ...S.card, flex: 1, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Người dùng mới</h3>
                    <span style={{ fontSize: 12, color: '#3b82f6', cursor: 'pointer', fontWeight: 600 }} onClick={() => setTab('users')}>Xem tất cả →</span>
                  </div>
                  <div style={{ padding: 12, overflowY: 'auto', flex: 1, maxHeight: 420 }}>
                    {!recentUsers || recentUsers.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b', fontSize: 13 }}>Không có dữ liệu</div>
                    ) : (
                      recentUsers.slice(0, 7).map((u, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', borderRadius: 12, transition: 'background 0.2s', cursor: 'pointer' }}
                             onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                             onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <div style={{ width: 40, height: 40, borderRadius: '50%', background: `linear-gradient(135deg, ${ROLE_COLOR[u.role] ?? '#3b82f6'}, #1e293b)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
                            {u.username?.charAt(0).toUpperCase()}
                          </div>
                          <div style={{ flex: 1, overflow: 'hidden' }}>
                            <div style={{ fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.username}</div>
                            <div style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.email}</div>
                          </div>
                          <div style={{ fontSize: 11, padding: '4px 8px', borderRadius: 12, background: `${ROLE_COLOR[u.role] ?? '#94a3b8'}20`, color: ROLE_COLOR[u.role] ?? '#94a3b8', fontWeight: 600 }}>
                            {u.role}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div style={{ ...S.card, background: 'linear-gradient(145deg, rgba(34,197,94,0.1), rgba(20,184,166,0.05))', border: '1px solid rgba(34,197,94,0.2)' }}>
                  <div style={{ fontSize: 24, marginBottom: 12 }}>🚀</div>
                  <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: '#fff' }}>Hiệu suất hệ thống</h3>
                  <p style={{ margin: 0, fontSize: 13, color: '#94a3b8', lineHeight: 1.5 }}>
                    Tất cả các dịch vụ đang hoạt động bình thường. Độ trễ trung bình <strong style={{ color: '#22c55e' }}>45ms</strong>. API Gateway xử lý <strong style={{ color: '#14b8a6' }}>1.2k req/s</strong>.
                  </p>
                  <div style={{ marginTop: 16, height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: '98%', height: '100%', background: 'linear-gradient(90deg, #22c55e, #14b8a6)', borderRadius: 3 }}></div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: '#64748b', fontWeight: 600 }}>
                    <span>Uptime: 99.9%</span>
                    <span>Load: 24%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── USERS ── */}
        {tab === 'users' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h2 style={{ margin: 0, fontSize: 26, fontWeight: 800 }}>Quản lý tài khoản & Phân quyền 👥</h2>

            {/* Filters row */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' as const }}>
              {['ALL','CITIZEN','COLLECTOR','ENTERPRISE','ADMIN'].map(r => (
                <button key={r} onClick={() => setRoleFilter(r)}
                  style={{ padding: '7px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                    background: roleFilter === r ? (ROLE_COLOR[r] ?? '#64748b') : 'rgba(255,255,255,0.06)',
                    color: roleFilter === r ? '#fff' : '#94a3b8' }}>
                  {r === 'ALL' ? '🌐 Tất cả' : r === 'CITIZEN' ? '🧑 Công dân' : r === 'COLLECTOR' ? '🚛 Thu gom' : r === 'ENTERPRISE' ? '🏭 Doanh nghiệp' : '⚙️ Admin'}
                </button>
              ))}
              <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                placeholder="🔍 Tìm username / email..."
                style={{ marginLeft: 'auto', padding: '8px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', fontSize: 13, outline: 'none', width: 240 }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: selectedUser ? '1fr 320px' : '1fr', gap: 20 }}>
              {/* Table */}
              <div style={S.card}>
                {usersLoading
                  ? <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>⏳ Đang tải...</div>
                  : (() => {
                    const filtered = users.filter(u =>
                      !searchTerm ||
                      String(u.username ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                      String(u.email ?? '').toLowerCase().includes(searchTerm.toLowerCase())
                    );
                    return (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, fontSize: 13 }}>
                          <span style={{ fontWeight: 700 }}>Danh sách ({filtered.length})</span>
                          <span style={{ color: '#64748b' }}>Click vào hàng để xem chi tiết & phân quyền</span>
                        </div>
                        <div style={{ overflowX: 'auto' as const }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: 13 }}>
                            <thead>
                              <tr style={{ color: '#64748b', textAlign: 'left' as const, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                {['Tài khoản', 'Email', 'Vai trò', 'Ngày tạo', 'Trạng thái', ''].map(h => (
                                  <th key={h} style={{ padding: '8px 12px', fontWeight: 600 }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {filtered.map((u: any) => (
                                <tr key={u.id}
                                  onClick={() => setSelectedUser(selectedUser?.id === u.id ? null : u)}
                                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer',
                                    background: selectedUser?.id === u.id ? 'rgba(34,197,94,0.06)' : 'transparent',
                                    transition: 'background 150ms' }}>
                                  <td style={{ padding: '12px' }}>
                                    <div style={{ fontWeight: 600 }}>{u.username}</div>
                                    <div style={{ color: '#64748b', fontSize: 11 }}>{String(u.id).substring(0, 12)}...</div>
                                  </td>
                                  <td style={{ padding: '12px', color: '#94a3b8', fontSize: 12 }}>{u.email}</td>
                                  <td style={{ padding: '12px' }}>
                                    <span style={S.badge(ROLE_COLOR[u.role] ?? '#94a3b8')}>{u.role}</span>
                                  </td>
                                  <td style={{ padding: '12px', color: '#64748b', fontSize: 12 }}>
                                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : '—'}
                                  </td>
                                  <td style={{ padding: '12px' }}>
                                    {(u.locked || u.status === 'LOCKED')
                                      ? <span style={S.badge('#ef4444')}>🔒 Bị khoá</span>
                                      : <span style={S.badge('#22c55e')}>✅ Hoạt động</span>}
                                  </td>
                                  <td style={{ padding: '12px' }}>
                                    {lockingId === String(u.id)
                                      ? <span style={{ color: '#64748b' }}>...</span>
                                      : (u.locked || u.status === 'LOCKED')
                                      ? <button style={S.btn('#22c55e')} onClick={e => { e.stopPropagation(); handleLock(String(u.id), false); }}>Mở khoá</button>
                                      : <button style={S.btn('#ef4444')} onClick={e => { e.stopPropagation(); handleLock(String(u.id), true); }}>Khoá</button>}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {filtered.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Không có dữ liệu</div>}
                        </div>
                      </>
                    );
                  })()}
              </div>

              {/* Detail / phân quyền panel */}
              {selectedUser && (
                <div style={{ ...S.card, position: 'sticky' as const, top: 0, height: 'fit-content', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <h3 style={{ margin: 0, fontSize: 16 }}>Chi tiết tài khoản</h3>
                    <button onClick={() => setSelectedUser(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 18 }}>✕</button>
                  </div>

                  {/* Avatar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 52, height: 52, borderRadius: 14, background: `linear-gradient(135deg, ${ROLE_COLOR[selectedUser.role] ?? '#22c55e'}, #0a0f0d)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                      {selectedUser.username?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{selectedUser.username}</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>{selectedUser.email}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                    {[['ID', String(selectedUser.id)],
                      ['Ngày tạo', selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleString('vi-VN') : '—'],
                      ['Trạng thái', selectedUser.status],
                    ].map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                        <span style={{ color: '#64748b' }}>{k}</span>
                        <span style={{ fontWeight: 600, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v}</span>
                      </div>
                    ))}
                  </div>

                  {/* Phân quyền */}
                  <div style={{ padding: 16, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 14 }}>
                    <p style={{ margin: '0 0 12px', fontWeight: 700, fontSize: 13, color: '#a78bfa' }}>🔐 Phân quyền</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {['CITIZEN','COLLECTOR','ENTERPRISE','ADMIN'].map(role => (
                        <button key={role}
                          disabled={changingRoleId === String(selectedUser.id)}
                          onClick={() => handleChangeRole(String(selectedUser.id), role)}
                          style={{ padding: '9px 14px', borderRadius: 10, border: `2px solid ${selectedUser.role === role ? ROLE_COLOR[role] : 'rgba(255,255,255,0.08)'}`,
                            background: selectedUser.role === role ? (ROLE_COLOR[role] + '20') : 'transparent',
                            color: selectedUser.role === role ? ROLE_COLOR[role] : '#94a3b8',
                            fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 150ms' }}>
                          <span>{role === 'CITIZEN' ? '🧑' : role === 'COLLECTOR' ? '🚛' : role === 'ENTERPRISE' ? '🏭' : '⚙️'}</span>
                          {role}
                          {selectedUser.role === role && <span style={{ marginLeft: 'auto', fontSize: 11 }}>✓ Hiện tại</span>}
                        </button>
                      ))}
                    </div>
                    {changingRoleId === String(selectedUser.id) && <p style={{ margin: '8px 0 0', fontSize: 12, color: '#64748b' }}>Đang cập nhật...</p>}
                  </div>

                  {/* Lock/Unlock */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    {(selectedUser.locked || selectedUser.status === 'LOCKED')
                      ? <button style={{ ...S.btn('#22c55e'), flex: 1, padding: '10px 0' }}
                          onClick={() => handleLock(String(selectedUser.id), false)}
                          disabled={lockingId === String(selectedUser.id)}>
                          {lockingId === String(selectedUser.id) ? '...' : '🔓 Mở khoá tài khoản'}
                        </button>
                      : <button style={{ ...S.btn('#ef4444'), flex: 1, padding: '10px 0' }}
                          onClick={() => { if(window.confirm(`Khoá tài khoản ${selectedUser.username}?`)) handleLock(String(selectedUser.id), true); }}
                          disabled={lockingId === String(selectedUser.id)}>
                          {lockingId === String(selectedUser.id) ? '...' : '🔒 Khoá tài khoản'}
                        </button>}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── COMPLAINTS ── */}
        {tab === 'complaints' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h2 style={{ margin: 0, fontSize: 26, fontWeight: 800 }}>Khiếu nại & Tranh chấp 📩</h2>

            {/* Status filter */}
            <div style={{ display: 'flex', gap: 8 }}>
              {['ALL','OPEN','IN_PROGRESS','RESOLVED','CLOSED'].map(s => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  style={{ padding: '7px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                    background: statusFilter === s ? (STATUS_COLOR[s] ?? '#22c55e') : 'rgba(255,255,255,0.06)',
                    color: statusFilter === s ? '#fff' : '#94a3b8' }}>
                  {s === 'ALL' ? 'Tất cả' : s === 'OPEN' ? '🔴 Mới' : s === 'IN_PROGRESS' ? '🔵 Đang xử lý' : s === 'RESOLVED' ? '🟢 Đã giải quyết' : '⚫ Đóng'}
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: selectedComplaint ? '1fr 380px' : '1fr', gap: 20 }}>
              {/* List */}
              <div style={S.card}>
                {complaintsLoading
                  ? <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>⏳ Đang tải...</div>
                  : filteredComplaints.length === 0
                  ? <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>Không có khiếu nại nào</div>
                  : filteredComplaints.map((c: any) => (
                  <div key={c.id} onClick={() => { setSelectedComplaint(c); setAdminNote(c.adminNote || ''); }}
                    style={{ padding: 16, marginBottom: 10, borderRadius: 14,
                      background: selectedComplaint?.id === c.id ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${selectedComplaint?.id === c.id ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.06)'}`,
                      cursor: 'pointer', transition: 'all 150ms' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{c.title}</div>
                        <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>
                          👤 {c.citizenName || 'Ẩn danh'} · {COMPLAINT_TYPE_LABEL[c.type] || c.type} · {c.createdAt ? new Date(c.createdAt).toLocaleDateString('vi-VN') : '—'}
                        </div>
                      </div>
                      <span style={S.badge(STATUS_COLOR[c.status] ?? '#94a3b8')}>{STATUS_LABEL[c.status] ?? c.status}</span>
                    </div>
                    {c.description && <p style={{ margin: '8px 0 0', fontSize: 12, color: '#94a3b8' }}>{c.description.substring(0, 120)}...</p>}
                  </div>
                ))}
              </div>

              {/* Detail / resolve panel */}
              {selectedComplaint && (
                <div style={{ ...S.card, position: 'sticky' as const, top: 0, height: 'fit-content' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                    <h3 style={{ margin: 0, fontSize: 16 }}>Chi tiết khiếu nại</h3>
                    <button onClick={() => setSelectedComplaint(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 18 }}>✕</button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                    <div><span style={{ color: '#64748b' }}>Tiêu đề: </span><strong>{selectedComplaint.title}</strong></div>
                    <div><span style={{ color: '#64748b' }}>Người gửi: </span>{selectedComplaint.citizenName}</div>
                    <div><span style={{ color: '#64748b' }}>Loại: </span>{selectedComplaint.type}</div>
                    <div><span style={{ color: '#64748b' }}>Ngày: </span>{selectedComplaint.createdAt ? new Date(selectedComplaint.createdAt).toLocaleString('vi-VN') : '—'}</div>
                    {selectedComplaint.description && (
                      <div style={{ padding: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 10 }}>
                        {selectedComplaint.description}
                      </div>
                    )}
                  </div>

                  {/* Enterprise contact */}
                  {enterprises.length > 0 && (
                    <div style={{ marginTop: 16, padding: 14, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 12 }}>
                      <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: '#a78bfa' }}>📋 Liên hệ doanh nghiệp</p>
                      {enterprises.slice(0, 3).map((e: any) => (
                        <div key={e.id} style={{ marginBottom: 8, fontSize: 12 }}>
                          <div style={{ fontWeight: 600 }}>{e.companyName}</div>
                          {e.email && <a href={`mailto:${e.email}`} style={{ color: '#60a5fa', display: 'block' }}>✉️ {e.email}</a>}
                          {e.phone && <a href={`tel:${e.phone}`} style={{ color: '#4ade80', display: 'block' }}>📞 {e.phone}</a>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Resolve */}
                  <div style={{ marginTop: 16 }}>
                    <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 6 }}>Ghi chú xử lý:</label>
                    <textarea value={adminNote} onChange={e => setAdminNote(e.target.value)} rows={3}
                      style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: 10, color: '#e2e8f0', fontSize: 13, resize: 'none', boxSizing: 'border-box' as const }}
                      placeholder="Nhập ghi chú..." />
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <button style={{ ...S.btn('#3b82f6'), flex: 1 }} onClick={() => handleResolve('IN_PROGRESS')} disabled={resolving}>
                      🔵 Đang xử lý
                    </button>
                    <button style={{ ...S.btn('#22c55e'), flex: 1 }} onClick={() => handleResolve('RESOLVED')} disabled={resolving}>
                      {resolving ? '...' : '✅ Giải quyết'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── REWARDS CONFIG ── */}
        {tab === 'rewards' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 26, fontWeight: 800 }}>Cấu hình Điểm thưởng 🏅</h2>
                <p style={{ margin: '6px 0 0', color: '#94a3b8', fontSize: 14 }}>
                  Thiết lập số điểm người dân nhận được trên mỗi kg rác thải. Cấu hình này áp dụng cho <b style={{ color: '#22c55e' }}>toàn bộ hệ thống</b>.
                </p>
              </div>
            </div>

            {/* Toast */}
            {rewardToast && (
              <div style={{
                padding: '12px 20px', borderRadius: 12, fontWeight: 600, fontSize: 14,
                background: rewardToast.startsWith('✅') ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                border: `1px solid ${rewardToast.startsWith('✅') ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`,
                color: rewardToast.startsWith('✅') ? '#34d399' : '#f87171'
              }}>
                {rewardToast}
              </div>
            )}

            {rewardLoading ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>⏳ Đang tải...</div>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {rewardRules.map(rule => (
                    <div key={rule.id} style={{
                      ...S.card, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap'
                    }}>
                      {/* Icon */}
                      <div style={{
                        width: 60, height: 60, background: 'rgba(34,197,94,0.08)', borderRadius: 16,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, flexShrink: 0
                      }}>
                        {rule.icon}
                      </div>

                      {/* Label */}
                      <div style={{ flex: 1, minWidth: 160 }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{rule.label}</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>Loại rác: {rule.type}</div>
                      </div>

                      {/* Inputs */}
                      <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                        <div>
                          <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 8, fontWeight: 600 }}>
                            Điểm thưởng (Hợp lệ)
                          </label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <input
                              type="number" min={0} value={rule.pointsPerKg}
                              onChange={e => setRewardRules(prev => prev.map(r =>
                                r.id === rule.id ? { ...r, pointsPerKg: parseFloat(e.target.value) || 0 } : r
                              ))}
                              style={{
                                width: 100, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)',
                                padding: '10px 12px', borderRadius: 10, color: '#22c55e', fontSize: 18,
                                fontWeight: 800, textAlign: 'center', outline: 'none'
                              }}
                            />
                            <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>Điểm / kg</span>
                          </div>
                        </div>

                        <div>
                          <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 8, fontWeight: 600 }}>
                            Tỷ lệ khi sai phân loại (%)
                          </label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <input
                              type="number" min={0} max={100} step={1}
                              value={Math.round((rule.invalidMultiplier || 0) * 100)}
                              onChange={e => setRewardRules(prev => prev.map(r =>
                                r.id === rule.id ? { ...r, invalidMultiplier: (parseFloat(e.target.value) || 0) / 100 } : r
                              ))}
                              style={{
                                width: 100, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)',
                                padding: '10px 12px', borderRadius: 10, color: '#f59e0b', fontSize: 18,
                                fontWeight: 800, textAlign: 'center', outline: 'none'
                              }}
                            />
                            <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>% Điểm gốc</span>
                          </div>
                        </div>

                        {/* Preview */}
                        <div style={{
                          padding: '10px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 12,
                          border: '1px solid rgba(255,255,255,0.08)', fontSize: 12, color: '#64748b', lineHeight: 1.6
                        }}>
                          <div>✅ Hợp lệ: <b style={{ color: '#22c55e' }}>{rule.pointsPerKg} điểm</b> / kg</div>
                          <div>⚠️ Sai loại: <b style={{ color: '#f59e0b' }}>{(rule.pointsPerKg * (rule.invalidMultiplier || 0)).toFixed(1)} điểm</b> / kg</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={handleSaveRewards} disabled={rewardSaving}
                    style={{
                      padding: '14px 40px', background: rewardSaving ? '#374151' : '#22c55e',
                      color: 'white', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700,
                      cursor: rewardSaving ? 'not-allowed' : 'pointer', transition: '0.2s', opacity: rewardSaving ? 0.7 : 1
                    }}
                  >
                    {rewardSaving ? '⏳ Đang lưu...' : '💾 Lưu cấu hình điểm'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

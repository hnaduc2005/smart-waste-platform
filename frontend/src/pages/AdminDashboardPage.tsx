import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminApi } from '../services/adminApi';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line,
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
const ROLE_COLOR: Record<string, string> = {
  CITIZEN: '#22c55e', COLLECTOR: '#14b8a6', ENTERPRISE: '#8b5cf6', ADMIN: '#f59e0b',
};

export default function AdminDashboardPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'overview' | 'users' | 'complaints'>('overview');

  // Overview
  const [stats, setStats] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);

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

  // Load overview
  useEffect(() => {
    adminApi.getStats().then(setStats).catch(() => {});
    adminApi.getCharts().then(setCharts).catch(() => {});
    adminApi.getEnterprises().then(setEnterprises).catch(() => {});
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
    { id: 'overview', icon: '📊', label: 'Tổng quan hệ thống' },
    { id: 'users',    icon: '👥', label: 'Quản lý tài khoản' },
    { id: 'complaints', icon: '📩', label: 'Khiếu nại' },
  ] as const;

  const filteredComplaints = statusFilter === 'ALL'
    ? complaints
    : complaints.filter(c => c.status === statusFilter);

  return (
    <div style={S.page}>
      {/* Sidebar */}
      <nav style={S.sidebar}>
        <div style={S.logo}>⚙️ EcoAdmin</div>
        <div style={{ padding: '16px 0' }}>
          {TABS.map(t => (
            <button key={t.id} style={S.navBtn(tab === t.id)} onClick={() => setTab(t.id)}>
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

      <main style={S.main}>
        {/* ── OVERVIEW ── */}
        {tab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <h2 style={{ margin: 0, fontSize: 26, fontWeight: 800 }}>Tổng quan hệ thống 📊</h2>

            {/* KPI cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
              {[
                { label: 'Tổng người dùng', value: stats?.totalUsers?.count ?? '...', icon: '👥', color: '#22c55e' },
                { label: 'Rác thu gom (kg)', value: stats?.wasteCollected?.count?.toFixed(0) ?? '...', icon: '⚖️', color: '#14b8a6' },
                { label: 'Điểm thưởng', value: stats?.rewardsClaimed?.count?.toFixed(0) ?? '...', icon: '🏆', color: '#f59e0b' },
                { label: 'AI Scans', value: stats?.activeScans?.count?.toLocaleString() ?? '...', icon: '🤖', color: '#8b5cf6' },
              ].map(c => (
                <div key={c.label} style={S.card}>
                  <div style={{ fontSize: 28, marginBottom: 10 }}>{c.icon}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: c.color }}>{c.value}</div>
                  <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>{c.label}</div>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24 }}>
              <div style={S.card}>
                <p style={{ fontWeight: 700, marginBottom: 16 }}>📈 Thu gom theo tuần</p>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={charts?.wasteDemographics ?? []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} axisLine={false} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={12} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#111a16', border: '1px solid #1e3a2f', borderRadius: 10 }} />
                    <Bar dataKey="organic" name="Hữu cơ" fill="#22c55e" radius={[4,4,0,0]} />
                    <Bar dataKey="recycle" name="Tái chế" fill="#14b8a6" radius={[4,4,0,0]} />
                    <Bar dataKey="hazardous" name="Độc hại" fill="#f59e0b" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={S.card}>
                <p style={{ fontWeight: 700, marginBottom: 16 }}>👥 Tăng trưởng người dùng</p>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={charts?.userGrowth ?? []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} axisLine={false} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={12} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#111a16', border: '1px solid #1e3a2f', borderRadius: 10 }} />
                    <Line type="monotone" dataKey="users" stroke="#22c55e" strokeWidth={3} dot={{ r: 4, fill: '#22c55e' }} />
                  </LineChart>
                </ResponsiveContainer>
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
                          👤 {c.citizenName || 'Ẩn danh'} · {c.type} · {c.createdAt ? new Date(c.createdAt).toLocaleDateString('vi-VN') : '—'}
                        </div>
                      </div>
                      <span style={S.badge(STATUS_COLOR[c.status] ?? '#94a3b8')}>{c.status}</span>
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
      </main>
    </div>
  );
}

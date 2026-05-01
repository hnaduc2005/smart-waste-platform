import { useState, useEffect } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  AreaChart, Area,
} from 'recharts';
import { analyticsApi } from '../services/analyticsApi';
import { collectionApi } from '../services/collectionApi';
import { rewardApi } from '../services/rewardApi';
import { useAuth } from '../context/AuthContext';

const COLORS = ['#22c55e', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6'];

const WASTE_LABELS: Record<string, string> = {
  RECYCLABLE: '♻️ Tái chế',
  ORGANIC: '🍎 Hữu cơ',
  HAZARDOUS: '⚠️ Độc hại',
  BULKY: '🛋️ Cồng kềnh',
  ELECTRONIC: '💻 Điện tử',
};

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  COLLECTED:  { label: 'Hoàn thành', color: '#4ade80', bg: 'rgba(34,197,94,0.15)' },
  COMPLETED:  { label: 'Hoàn thành', color: '#4ade80', bg: 'rgba(34,197,94,0.15)' },
  PENDING:    { label: 'Chờ xử lý',  color: '#fbbf24', bg: 'rgba(234,179,8,0.15)' },
  ASSIGNED:   { label: 'Tiếp nhận', color: '#60a5fa', bg: 'rgba(59,130,246,0.15)' },
  ON_THE_WAY: { label: 'Đang đến',  color: '#60a5fa', bg: 'rgba(59,130,246,0.15)' },
  CANCELLED:  { label: 'Đã hủy',    color: '#f87171', bg: 'rgba(239,68,68,0.15)' },
};

export const CitizenReportView = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  // --- State ---
  const [analytics, setAnalytics] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [completedTasks, setCompletedTasks] = useState<any[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [monthlyChart, setMonthlyChart] = useState<any[]>([]);

  useEffect(() => {
    if (!user?.userId) return;
    setLoading(true);

    Promise.allSettled([
      analyticsApi.getUserStats(user.userId),
      collectionApi.getCitizenRequests(user.userId),
      collectionApi.getCitizenCompletedTasks(user.userId),
      rewardApi.getHistory(user.userId),
    ]).then(([analyticsRes, reqRes, completedRes, rewardRes]) => {
      if (analyticsRes.status === 'fulfilled') setAnalytics(analyticsRes.value);

      const reqs = reqRes.status === 'fulfilled' ? reqRes.value : [];
      const done = completedRes.status === 'fulfilled' ? completedRes.value : [];
      const rwds = rewardRes.status === 'fulfilled' ? rewardRes.value : [];

      setRequests(reqs);
      setCompletedTasks(done);
      setTotalPoints(rwds.reduce((s: number, r: any) => s + (r.amount ?? r.points ?? 0), 0));

      // Build 6-month chart
      const now = new Date();
      const chart = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        const label = `T${d.getMonth() + 1}`;
        const monthReqs = reqs.filter((r: any) => {
          if (!r.createdAt) return false;
          const rd = new Date(r.createdAt);
          return rd.getMonth() === d.getMonth() && rd.getFullYear() === d.getFullYear();
        });
        const monthPts = rwds.filter((r: any) => {
          if (!r.createdAt) return false;
          const rd = new Date(r.createdAt);
          return rd.getMonth() === d.getMonth() && rd.getFullYear() === d.getFullYear();
        }).reduce((s: number, r: any) => s + (r.amount ?? r.points ?? 0), 0);
        return { name: label, 'Số đơn': monthReqs.length, 'Điểm': monthPts };
      });
      setMonthlyChart(chart);
    }).finally(() => setLoading(false));
  }, [user]);

  // --- Derived ---
  const totalWeight = analytics?.totalWeight ?? completedTasks.reduce((s: number, t: any) => s + (t.weight ?? 0), 0);
  const co2Saved = analytics?.co2Saved ?? totalWeight * 2.5;

  const recyclable = requests.filter((r: any) => r.type === 'RECYCLABLE').length;
  const recycleRate = requests.length > 0 ? Math.round((recyclable / requests.length) * 100) : 0;

  const thisMonth = requests.filter((r: any) => {
    if (!r.createdAt) return false;
    const d = new Date(r.createdAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const lastMonth = requests.filter((r: any) => {
    if (!r.createdAt) return false;
    const d = new Date(r.createdAt);
    const now = new Date();
    const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
  }).length;
  const growth = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : (thisMonth > 0 ? 100 : 0);

  const personalDistribution = analytics?.personalDistribution?.length
    ? analytics.personalDistribution
    : Object.entries(
        requests.reduce((acc: Record<string, number>, r: any) => {
          const label = WASTE_LABELS[r.type]?.replace(/\S+\s/, '') ?? r.type;
          acc[label] = (acc[label] ?? 0) + 1;
          return acc;
        }, {})
      ).map(([name, value]) => ({ name, value }));

  const sortedRequests = [...requests]
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400, flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 40 }}>⏳</div>
      <p style={{ color: 'var(--text-secondary)' }}>Đang tải báo cáo...</p>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Báo cáo tác động ♻️</h2>
        <p style={{ color: 'var(--text-secondary)', margin: '8px 0 0' }}>
          Dữ liệu thực tế từ các hoạt động thu gom của bạn trong hệ thống.
        </p>
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {[
          { label: 'Tổng khối lượng', value: `${totalWeight.toFixed(1)} kg`, icon: '⚖️', color: 'rgba(34,197,94,0.12)', sub: `${requests.length} đơn đã tạo` },
          { label: 'CO₂ tiết kiệm', value: `${co2Saved.toFixed(1)} kg`, icon: '🌿', color: 'rgba(16,185,129,0.12)', sub: 'Quy đổi thực tế' },
          { label: 'Tỷ lệ tái chế', value: `${recycleRate}%`, icon: '♻️', color: 'rgba(59,130,246,0.12)', sub: `${recyclable}/${requests.length} đơn` },
          { label: 'Tăng trưởng', value: growth >= 0 ? `+${growth}%` : `${growth}%`, icon: growth >= 0 ? '📈' : '📉', color: growth >= 0 ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', sub: 'So với tháng trước' },
        ].map(m => (
          <div key={m.label} style={{ padding: 22, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20 }}>
            <div style={{ width: 44, height: 44, background: m.color, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 14 }}>{m.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1 }}>{m.value}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6 }}>{m.label}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.2fr', gap: 24 }}>
        {/* Pie: Phân loại rác */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 24, padding: 24 }}>
          <h3 style={{ margin: '0 0 20px', fontSize: 17 }}>Phân loại rác của bạn</h3>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              {personalDistribution.length > 0 ? (
                <PieChart>
                  <Pie data={personalDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={5} dataKey="value">
                    {personalDistribution.map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#111a16', border: '1px solid var(--border)', borderRadius: 12, fontSize: 13 }} itemStyle={{ color: 'white' }} />
                </PieChart>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>Chưa có dữ liệu</div>
              )}
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginTop: 12 }}>
            {personalDistribution.map((item: any, idx: number) => (
              <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[idx % COLORS.length] }} />
                <span style={{ color: 'var(--text-secondary)' }}>{item.name}:</span>
                <span style={{ fontWeight: 700 }}>{Number(item.value).toFixed(item.value < 10 ? 0 : 1)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Area: Hoạt động 6 tháng */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 24, padding: 24 }}>
          <h3 style={{ margin: '0 0 20px', fontSize: 17 }}>Hoạt động 6 tháng gần nhất</h3>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyChart} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="cgPoints" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="cgOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} stroke="var(--text-muted)" fontSize={12} />
                <YAxis axisLine={false} tickLine={false} stroke="var(--text-muted)" fontSize={12} />
                <Tooltip contentStyle={{ background: '#111a16', border: '1px solid var(--border)', borderRadius: 12 }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Area type="monotone" dataKey="Điểm" stroke="#22c55e" strokeWidth={2} fill="url(#cgPoints)" />
                <Area type="monotone" dataKey="Số đơn" stroke="#14b8a6" strokeWidth={2} fill="url(#cgOrders)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Comparison Bar Chart */}
      {analytics?.comparisonData?.length > 0 && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 24, padding: 24 }}>
          <h3 style={{ margin: '0 0 20px', fontSize: 17 }}>So sánh hiệu suất khu vực</h3>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.comparisonData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} stroke="var(--text-muted)" fontSize={12} />
                <YAxis axisLine={false} tickLine={false} stroke="var(--text-muted)" fontSize={12} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} contentStyle={{ background: '#111a16', border: '1px solid var(--border)', borderRadius: 12 }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Bar dataKey="user" name="Bạn" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="average" name="Trung bình khu vực" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Lịch sử đơn thu gom */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 24, padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 17 }}>📋 Lịch sử đơn thu gom</h3>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Tổng: {requests.length} đơn</span>
        </div>

        {sortedRequests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Chưa có đơn nào</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {sortedRequests.slice(0, 10).map((r: any, i: number) => {
              const ss = STATUS_STYLE[r.status] ?? { label: r.status, color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' };
              const date = r.createdAt ? new Date(r.createdAt).toLocaleDateString('vi-VN') : '—';
              return (
                <div key={r.id ?? i} style={{
                  display: 'grid', gridTemplateColumns: '1fr auto auto auto',
                  alignItems: 'center', gap: 16,
                  padding: '14px 18px', background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14,
                }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>
                      {WASTE_LABELS[r.type] ?? r.type}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                      📍 {r.address ?? r.location ?? 'Không có địa chỉ'}
                    </div>
                    {r.description && (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 2 }}>
                        📝 {r.description}
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{date}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    #{r.id?.substring(0, 8)}
                  </span>
                  <span style={{
                    padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                    background: ss.bg, color: ss.color, whiteSpace: 'nowrap',
                  }}>
                    {ss.label}
                  </span>
                </div>
              );
            })}
            {sortedRequests.length > 10 && (
              <div style={{ textAlign: 'center', padding: '10px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                ... và {sortedRequests.length - 10} đơn khác
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tổng kết */}
      <div style={{ padding: 24, background: 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(20,184,166,0.04))', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ fontSize: 28 }}>🌍</div>
          <h3 style={{ margin: 0, fontSize: 17 }}>Tác động môi trường của bạn</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            { icon: '🌳', label: 'Cây xanh tương đương', value: `${(co2Saved / 21).toFixed(1)} cây` },
            { icon: '⚡', label: 'Điện tiết kiệm', value: `${(totalWeight * 1.5).toFixed(0)} kWh` },
            { icon: '💧', label: 'Nước tiết kiệm', value: `${(totalWeight * 10).toFixed(0)} lít` },
          ].map(item => (
            <div key={item.label} style={{ textAlign: 'center', padding: 16, background: 'rgba(0,0,0,0.2)', borderRadius: 16 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#4ade80' }}>{item.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

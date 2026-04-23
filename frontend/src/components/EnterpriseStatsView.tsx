import { useState, useEffect } from 'react';
import { analyticsApi, DashboardData } from '../services/analyticsApi';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, Legend
} from 'recharts';

const ENTERPRISE_API = 'http://localhost:8087/api/v1/enterprises';
const COLORS = ['#22c55e', '#14b8a6', '#f59e0b', '#ef4444'];

interface SystemOverview {
  totalActiveEnterprises: number;
  totalVehicles: number;
  availableVehicles: number;
  onDutyVehicles: number;
  maintenanceVehicles: number;
  totalDailyCapacityTon: number;
  systemUtilizationPct: number;
  enterprises: {
    id: number; name: string; serviceArea: string;
    acceptedWasteTypes: string; dailyCapacityTon: number;
    totalVehicles: number; availableVehicles: number;
  }[];
}

export const EnterpriseStatsView = () => {
  const [analyticsData, setAnalyticsData] = useState<DashboardData | null>(null);
  const [overview, setOverview] = useState<SystemOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      analyticsApi.getDashboardData(),
      axios.get<SystemOverview>(`${ENTERPRISE_API}/overview`).then(r => r.data),
    ]).then(([analyticsResult, overviewResult]) => {
      if (analyticsResult.status === 'fulfilled') setAnalyticsData(analyticsResult.value);
      if (overviewResult.status === 'fulfilled') setOverview(overviewResult.value);
    }).finally(() => setLoading(false));
  }, []);

  // Tính tổng khối lượng theo loại rác từ weekly data
  const wasteByType = analyticsData ? [
    { name: 'Tái chế', value: analyticsData.weekly.reduce((s, d) => s + d.recycle, 0) },
    { name: 'Hữu cơ',  value: analyticsData.weekly.reduce((s, d) => s + d.organic, 0) },
    { name: 'Độc hại',  value: analyticsData.weekly.reduce((s, d) => s + d.hazardous, 0) },
  ].filter(d => d.value > 0) : [];

  const totalWeightKg = analyticsData?.districts.reduce((s, d) => s + d.total, 0) ?? 0;
  const avgEfficiency = analyticsData?.districts.length
    ? Math.round(analyticsData.districts.reduce((s, d) => s + d.efficiency, 0) / analyticsData.districts.length)
    : 0;

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-secondary)' }}>
      <div style={{ fontSize: 32, marginBottom: 16 }}>⏳</div>
      Đang tải số liệu...
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Thống kê vận hành 📊</h2>
        <p style={{ color: 'var(--text-secondary)', margin: '8px 0 0' }}>
          Phân tích dữ liệu thu gom và năng lực xử lý rác thải thời gian thực.
        </p>
      </div>

      {/* KPI Cards — hàng 1: Analytics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        {[
          { label: 'Tổng khối lượng tuần', value: `${totalWeightKg.toLocaleString()} kg`, icon: '⚖️', color: 'rgba(34,197,94,0.1)' },
          { label: 'Hiệu suất thu gom TB', value: `${avgEfficiency}%`, icon: '📈', color: 'rgba(168,85,247,0.1)' },
          { label: 'Doanh nghiệp hoạt động', value: overview?.totalActiveEnterprises ?? '—', icon: '🏭', color: 'rgba(59,130,246,0.1)' },
          { label: 'Công suất hệ thống', value: `${overview?.totalDailyCapacityTon ?? '—'} tấn/ngày`, icon: '🏗️', color: 'rgba(245,158,11,0.1)' },
        ].map(s => (
          <div key={s.label} style={{ padding: 24, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20 }}>
            <div style={{ width: 40, height: 40, background: s.color, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 12 }}>{s.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{s.value}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* KPI Cards — hàng 2: Fleet Status */}
      {overview && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            { label: 'Xe sẵn sàng', value: overview.availableVehicles, icon: '🟢', color: 'rgba(34,197,94,0.15)' },
            { label: 'Xe đang đi gom', value: overview.onDutyVehicles, icon: '🟡', color: 'rgba(245,158,11,0.15)' },
            { label: 'Xe bảo trì', value: overview.maintenanceVehicles, icon: '🔴', color: 'rgba(239,68,68,0.15)' },
          ].map(s => (
            <div key={s.label} style={{ padding: 20, background: s.color, border: '1px solid var(--border)', borderRadius: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontSize: 32, fontWeight: 900 }}>{s.value}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24 }}>
        {/* Biểu đồ tuần */}
        <div style={{ padding: 24, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20 }}>
          <h3 style={{ fontSize: 18, margin: '0 0 24px' }}>Khối lượng thu gom 7 ngày qua (kg)</h3>
          {analyticsData?.weekly && analyticsData.weekly.some(d => d.organic + d.recycle + d.hazardous > 0) ? (
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData.weekly}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} stroke="var(--text-muted)" />
                  <YAxis axisLine={false} tickLine={false} stroke="var(--text-muted)" />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                    contentStyle={{ background: '#111a16', borderRadius: 12, border: '1px solid var(--border)' }}
                  />
                  <Legend />
                  <Bar dataKey="organic"   name="Hữu cơ"   fill="#22c55e" radius={[3,3,0,0]} stackId="a" />
                  <Bar dataKey="recycle"   name="Tái chế"  fill="#14b8a6" radius={[3,3,0,0]} stackId="a" />
                  <Bar dataKey="hazardous" name="Độc hại"  fill="#f59e0b" radius={[3,3,0,0]} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              Chưa có dữ liệu trong 7 ngày qua
            </div>
          )}
        </div>

        {/* Phân loại rác */}
        <div style={{ padding: 24, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20 }}>
          <h3 style={{ fontSize: 18, margin: '0 0 24px' }}>Phân loại rác (7 ngày)</h3>
          {wasteByType.length > 0 ? (
            <>
              <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={wasteByType} innerRadius={55} outerRadius={80} paddingAngle={5} dataKey="value">
                      {wasteByType.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: any) => `${v} kg`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
                {wasteByType.map((item, i) => (
                  <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                    <span style={{ color: 'var(--text-secondary)' }}>{item.name}:</span>
                    <span style={{ fontWeight: 700 }}>{item.value.toFixed(1)} kg</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              Chưa có dữ liệu
            </div>
          )}
        </div>
      </div>

      {/* Hiệu suất theo quận */}
      {analyticsData?.districts && analyticsData.districts.length > 0 && (
        <div style={{ padding: 24, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20 }}>
          <h3 style={{ fontSize: 18, margin: '0 0 20px' }}>Hiệu suất thu gom theo quận/huyện</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {analyticsData.districts.map(d => (
              <div key={d.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontWeight: 600 }}>{d.name}</span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                    {d.total.toFixed(1)} kg — <b style={{ color: d.efficiency >= 80 ? '#22c55e' : '#f59e0b' }}>{d.efficiency}%</b>
                  </span>
                </div>
                <div style={{ height: 8, background: 'rgba(255,255,255,0.07)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{
                    width: `${d.efficiency}%`, height: '100%', borderRadius: 4,
                    background: d.efficiency >= 80 ? 'var(--green-500)' : d.efficiency >= 60 ? '#f59e0b' : '#ef4444',
                    transition: 'width 0.6s ease'
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bảng doanh nghiệp */}
      {overview?.enterprises && overview.enterprises.length > 0 && (
        <div style={{ padding: 24, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20 }}>
          <h3 style={{ fontSize: 18, margin: '0 0 20px' }}>Danh sách doanh nghiệp đang hoạt động</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  {['Tên doanh nghiệp', 'Khu vực', 'Loại rác', 'Công suất/ngày', 'Xe sẵn sàng'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {overview.enterprises.map(e => (
                  <tr key={e.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 600 }}>{e.name}</td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>{e.serviceArea || '—'}</td>
                    <td style={{ padding: '12px 14px' }}>
                      {e.acceptedWasteTypes?.split(',').map(t => (
                        <span key={t} style={{ display: 'inline-block', fontSize: 11, padding: '2px 8px', borderRadius: 20, background: 'rgba(34,197,94,0.15)', color: '#4ade80', marginRight: 4 }}>
                          {t.trim()}
                        </span>
                      ))}
                    </td>
                    <td style={{ padding: '12px 14px' }}>{e.dailyCapacityTon} tấn</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ color: e.availableVehicles > 0 ? '#4ade80' : '#f87171', fontWeight: 700 }}>
                        {e.availableVehicles}/{e.totalVehicles}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

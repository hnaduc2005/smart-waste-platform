import { useState, useEffect } from 'react';
import { analyticsApi } from '../services/analyticsApi';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';

export const EnterpriseStatsView = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsApi.getDashboardData()
      .then(res => setData(res))
      .catch(err => {
        console.error(err);
        // Fallback mock data if service is down
        setData({
          totalWeight: 1240,
          pendingRequests: 12,
          activeVehicles: 5,
          wasteByType: [
            { name: 'Tái chế', value: 450 },
            { name: 'Hữu cơ', value: 600 },
            { name: 'Độc hại', value: 120 },
            { name: 'Điện tử', value: 70 },
          ],
          weeklyTrend: [
            { day: 'T2', weight: 120 },
            { day: 'T3', weight: 210 },
            { day: 'T4', weight: 150 },
            { day: 'T5', weight: 180 },
            { day: 'T6', weight: 240 },
            { day: 'T7', weight: 190 },
            { day: 'CN', weight: 150 },
          ]
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const COLORS = ['#22c55e', '#14b8a6', '#f59e0b', '#ef4444'];

  if (loading) return <div style={{ textAlign: 'center', padding: 40 }}>Đang tải số liệu...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h2 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Thống kê vận hành 📊</h2>
        <p style={{ color: 'var(--text-secondary)', margin: '8px 0 0' }}>Phân tích dữ liệu thu gom và xử lý rác thải thời gian thực.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
        {[
          { label: 'Tổng khối lượng (kg)', value: data?.totalWeight, icon: '⚖️', color: 'rgba(34,197,94,0.1)' },
          { label: 'Yêu cầu chờ xử lý', value: data?.pendingRequests, icon: '⏳', color: 'rgba(245,158,11,0.1)' },
          { label: 'Xe đang hoạt động', value: data?.activeVehicles, icon: '🚚', color: 'rgba(59,130,246,0.1)' },
          { label: 'Hiệu suất xử lý', value: '94%', icon: '📈', color: 'rgba(168,85,247,0.1)' },
        ].map(s => (
          <div key={s.label} style={{ padding: 24, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20 }}>
            <div style={{ width: 40, height: 40, background: s.color, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 12 }}>{s.icon}</div>
            <div style={{ fontSize: 32, fontWeight: 800 }}>{s.value}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24 }}>
        {/* Weekly Trend */}
        <div style={{ padding: 24, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20 }}>
          <h3 style={{ fontSize: 18, margin: '0 0 24px' }}>Khối lượng thu gom theo tuần (kg)</h3>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} stroke="var(--text-muted)" />
                <YAxis axisLine={false} tickLine={false} stroke="var(--text-muted)" />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.02)'}}
                  contentStyle={{ background: '#111a16', borderRadius: 12, border: '1px solid var(--border)' }}
                />
                <Bar dataKey="weight" fill="var(--green-500)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Waste Distribution */}
        <div style={{ padding: 24, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20 }}>
          <h3 style={{ fontSize: 18, margin: '0 0 24px' }}>Phân loại rác</h3>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.wasteByType}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data?.wasteByType?.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
            {data?.wasteByType?.map((item: any, index: number) => (
              <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[index % COLORS.length] }} />
                <span style={{ color: 'var(--text-secondary)' }}>{item.name}:</span>
                <span style={{ fontWeight: 600 }}>{item.value}kg</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

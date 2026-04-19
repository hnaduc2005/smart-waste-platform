import { useState, useEffect } from 'react';
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend 
} from 'recharts';
import { Target, Leaf, Trash2, TrendingUp, Loader2 } from 'lucide-react';
import { analyticsApi } from '../services/analyticsApi';
import { useAuth } from '../context/AuthContext';

export const CitizenReportView = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    personalDistribution: any[];
    comparisonData: any[];
    totalWeight: number;
    co2Saved: number;
  }>({
    personalDistribution: [],
    comparisonData: [],
    totalWeight: 0,
    co2Saved: 0
  });

  useEffect(() => {
    if (user?.userId) {
      setLoading(true);
      analyticsApi.getUserStats(user.userId)
        .then(res => {
          setData(res);
          setLoading(false);
        })
        .catch(err => {
          console.error("Lỗi lấy dữ liệu báo cáo:", err);
          setLoading(false);
        });
    }
  }, [user]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', flexDirection: 'column', gap: 16 }}>
        <Loader2 className="animate-spin" size={48} color="var(--green-400)" />
        <p style={{ color: 'var(--text-secondary)' }}>Đang tải dữ liệu thực tế...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Báo cáo tác động ♻️</h2>
        <p style={{ color: 'var(--text-secondary)', margin: '8px 0 0' }}>Dữ liệu thực tế được tổng hợp từ các hoạt động của bạn trong hệ thống.</p>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {[
          { label: 'Tổng khối lượng', value: `${data.totalWeight.toFixed(1)}kg`, icon: <Trash2 size={24} />, color: 'rgba(34,197,94,0.1)' },
          { label: 'Co2 tiết kiệm', value: `${data.co2Saved.toFixed(1)}kg`, icon: <Leaf size={24} />, color: 'rgba(16,185,129,0.1)' },
          { label: 'Tỷ lệ tái chế', value: 'Tính toán...', icon: <Target size={24} />, color: 'rgba(59,130,246,0.1)' },
          { label: 'Tăng trưởng', value: 'Ổn định', icon: <TrendingUp size={24} />, color: 'rgba(168,85,247,0.1)' },
        ].map(m => (
          <div key={m.label} style={{ padding: 20, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20 }}>
            <div style={{ width: 44, height: 44, background: m.color, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>{m.icon}</div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>{m.value}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{m.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.2fr', gap: 24 }}>
        {/* Pie Chart: Personal Distribution */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 24, padding: 24 }}>
          <h3 style={{ margin: '0 0 24px', fontSize: 18 }}>Phân loại rác của bạn</h3>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              {data.personalDistribution.length > 0 ? (
                <PieChart>
                  <Pie
                    data={data.personalDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data.personalDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#22c55e', '#10b981', '#ef4444', '#6b7280'][index % 4]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ background: '#111a16', border: '1px solid var(--border)', borderRadius: 12, fontSize: 13 }}
                    itemStyle={{ color: 'white' }}
                  />
                </PieChart>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>Chưa có dữ liệu phân loại</div>
              )}
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginTop: 12 }}>
            {data.personalDistribution.map((item, idx) => (
              <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: ['#22c55e', '#10b981', '#ef4444', '#6b7280'][idx % 4] }} />
                <span style={{ color: 'var(--text-secondary)' }}>{item.name}:</span>
                <span style={{ fontWeight: 600 }}>{Number(item.value).toFixed(1)}kg</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar Chart: Area Comparison */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 24, padding: 24 }}>
          <h3 style={{ margin: '0 0 24px', fontSize: 18 }}>So sánh hiệu suất khu vực</h3>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.comparisonData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} stroke="var(--text-muted)" fontSize={12} />
                <YAxis axisLine={false} tickLine={false} stroke="var(--text-muted)" fontSize={12} />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.02)'}}
                  contentStyle={{ background: '#111a16', border: '1px solid var(--border)', borderRadius: 12 }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Bar dataKey="user" name="Bạn" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="average" name="Trung bình khu vực" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ marginTop: 24, padding: 16, background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 20 }}>💡</div>
              <p style={{ margin: 0, fontSize: 13, color: '#4ade80', fontWeight: 500 }}>
                Dữ liệu so sánh được tính toán dựa trên tổng khối lượng rác thu gom tại mỗi khu vực chia cho hệ số quy đổi hộ gia đình.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import { useState, useEffect } from 'react';
import { analyticsApi, DashboardData } from '../services/analyticsApi';
import { enterpriseApi } from '../services/enterpriseApi';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, Legend
} from 'recharts';

import { userApi } from '../services/userApi';
import { collectionApi } from '../services/collectionApi';
import { useAuth } from '../context/AuthContext';

const COLORS = ['#22c55e', '#14b8a6', '#f59e0b', '#ef4444'];

export const EnterpriseStatsView = () => {
  const { user } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<DashboardData | null>(null);
  const [myEnterprise, setMyEnterprise] = useState<any>(null);
  // myCollectors: tất cả collectors thuộc doanh nghiệp này
  const [myCollectors, setMyCollectors] = useState<any[]>([]);
  // onTheWayCollectorIds: tập hợp collectorId đang có task ON_THE_WAY
  const [onTheWayCollectorIds, setOnTheWayCollectorIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [enterpriseResult, collectorsResult, tasksResult] = await Promise.allSettled([
          enterpriseApi.getMyEnterprise(user?.userId || ''),
          userApi.getCollectors(),
          collectionApi.getActiveTasks()  // lấy TaskAssignment đang ON_THE_WAY, có collectorId
        ]);
        
        let ent = null;
        if (enterpriseResult.status === 'fulfilled') {
          ent = enterpriseResult.value;
          setMyEnterprise(ent);
        }

        let filteredCollectors: any[] = [];
        if (collectorsResult.status === 'fulfilled') {
          const allCollectors = collectorsResult.value;
          // Chỉ lấy collectors thuộc doanh nghiệp này
          // QUAN TRỌNG: nếu ent.name chưa có (doanh nghiệp mới chưa cấu hình) → trả về [] để tránh data leakage
          filteredCollectors = ent?.name
            ? allCollectors.filter((c: any) => c.companyName === ent.name)
            : [];
          setMyCollectors(filteredCollectors);
        }

        // Xác định collectors đang đi gom từ TaskAssignment có status ON_THE_WAY
        if (tasksResult.status === 'fulfilled') {
          const activeTasks: any[] = tasksResult.value;
          const collectorIdSet = new Set(filteredCollectors.map((c: any) => String(c.id)));
          const activeIds = new Set<string>();
          activeTasks.forEach((t: any) => {
            const cid = t.collectorId ? String(t.collectorId) : null;
            if (cid && collectorIdSet.has(cid)) {
              activeIds.add(cid);
            }
          });
          setOnTheWayCollectorIds(activeIds);
        }

        // Fetch histories for THIS enterprise directly from backend API
        // Truyền thêm collectorIds để hệ thống fallback tìm dữ liệu cũ (trước khi có cột enterprise_name)
        let allMyHistory: any[] = [];
        if (ent && ent.name) {
          try {
            const currentCollectorIds = filteredCollectors.map((c: any) => String(c.id));
            const historyResult = await collectionApi.getEnterpriseHistory(ent.name, currentCollectorIds);
            allMyHistory = historyResult || [];
          } catch (e) {
            console.error('Failed to fetch enterprise history', e);
          }
        }

        // Compute analytics data locally for THIS enterprise
        const daysOfWeek = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        const todayDow = new Date().getDay();
        const backendDowOrder = [1, 2, 3, 4, 5, 6, 0];
        
        const weeklyStats: any[] = backendDowOrder.map(dow => ({
           name: daysOfWeek[dow],
           organic: 0, recycle: 0, hazardous: 0, electronic: 0, bulky: 0
        }));

        const districtStatsMap: Record<string, number> = {};

        allMyHistory.forEach(item => {
           // Chỉ tính kg từ đơn collector đã xác nhận (CollectionProof tồn tại)
           // item.weight = null nghĩa là collector chưa điền kg → bỏ qua
           if (item.weight === null || item.weight === undefined) return;
           const weight = Number(item.weight);
           if (isNaN(weight) || weight <= 0) return;

           let dow = todayDow;
           if (item.completedAt) {
             const d = new Date(item.completedAt);
             if (!isNaN(d.getTime())) dow = d.getDay();
           }
           const dayData = weeklyStats.find(d => d.name === daysOfWeek[dow]);
           const wt = (item.wasteType || 'RECYCLABLE').toLowerCase();
           
           if (dayData) {
             if (wt.includes('organic')) dayData.organic += weight;
             else if (wt.includes('recyclable') || wt.includes('recycle')) dayData.recycle += weight;
             else if (wt.includes('hazard')) dayData.hazardous += weight;
             else if (wt.includes('electronic')) dayData.electronic += weight;
             else if (wt.includes('bulky')) dayData.bulky += weight;
             else dayData.recycle += weight;
           }

           const dName = item.district || 'Khu vực hoạt động';
           if (!districtStatsMap[dName]) districtStatsMap[dName] = 0;
           districtStatsMap[dName] += weight;
        });

        const districtStats = Object.keys(districtStatsMap).map(name => ({
           name,
           total: districtStatsMap[name],
           efficiency: 100 // Assume 100% for completed tasks
        })).sort((a,b) => b.total - a.total);

        setAnalyticsData({
           districts: districtStats,
           weekly: weeklyStats
        });

      } finally {
        setLoading(false);
      }
    };
    if (user?.userId) {
      loadData();
    }
    // Refresh mỗi 30 giây
    const interval = setInterval(() => { if (user?.userId) loadData(); }, 30000);
    return () => clearInterval(interval);
  }, [user?.userId]);

  // Xe sẵn sàng = collectors đã đăng nhập vào app (isOnline === true)
  // Nếu isOnline là null/undefined thì coi như offline, không đếm vào
  const readyVehicles = myCollectors.filter((c: any) => c.isOnline === true);
  // Xe đang đi gom = collectors có task ON_THE_WAY trong DB
  // Fallback về isOnline === false nếu không có task data từ API
  const collectingVehicles = onTheWayCollectorIds.size > 0
    ? myCollectors.filter((c: any) => onTheWayCollectorIds.has(String(c.id)))
    : myCollectors.filter((c: any) => c.isOnline === false);

  // Build collectorIdSet dùng c.id (UUID string)
  // (chỉ duyết lại khi build set trong useEffect)

  // Tính tổng khối lượng theo loại rác từ weekly data
  const wasteByType = analyticsData ? [
    { name: 'Tái chế',   value: analyticsData.weekly.reduce((s, d) => s + (d.recycle   ?? 0), 0) },
    { name: 'Hữu cơ',   value: analyticsData.weekly.reduce((s, d) => s + (d.organic   ?? 0), 0) },
    { name: 'Độc hại',   value: analyticsData.weekly.reduce((s, d) => s + (d.hazardous ?? 0), 0) },
    { name: 'Điện tử',   value: analyticsData.weekly.reduce((s, d) => s + (d.electronic ?? 0), 0) },
    { name: 'Cồng kềnh', value: analyticsData.weekly.reduce((s, d) => s + (d.bulky     ?? 0), 0) },
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

  // Doanh nghiệp chưa cấu hình năng lực → chưa có name → hiển thị empty state
  if (!myEnterprise?.name) return (
    <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-secondary)' }}>
      <div style={{ fontSize: 56, marginBottom: 20 }}>🏭</div>
      <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 12px', color: 'var(--text)' }}>
        Doanh nghiệp chưa được cấu hình
      </h2>
      <p style={{ fontSize: 15, maxWidth: 400, margin: '0 auto 24px', lineHeight: 1.6 }}>
        Vui lòng vào mục <b>Quản lý Năng lực</b> để điền thông tin doanh nghiệp 
        (tên, khu vực, loại rác tiếp nhận) trước khi xem thống kê.
      </p>
      <div style={{ display: 'inline-block', padding: '10px 24px', background: 'rgba(34,197,94,0.1)', border: '1px solid var(--green-500)', borderRadius: 12, fontSize: 14, color: 'var(--green-400)', fontWeight: 600 }}>
        ← Chọn tab "Quản lý Năng lực" để bắt đầu
      </div>
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
          { label: 'Công suất của bạn', value: `${myEnterprise?.dailyCapacityTon ?? 0} tấn/ngày`, icon: '🏗️', color: 'rgba(245,158,11,0.1)' },
        ].map(s => (
          <div key={s.label} style={{ padding: 24, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20 }}>
            <div style={{ width: 40, height: 40, background: s.color, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 12 }}>{s.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{s.value}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* KPI Cards — hàng 2: Fleet Status */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        {[
          { label: 'Xe sẵn sàng',   value: readyVehicles.length,     icon: '🟢', color: 'rgba(34,197,94,0.15)' },
          { label: 'Xe đang đi gom', value: collectingVehicles.length, icon: '🟡', color: 'rgba(245,158,11,0.15)' },
        ].map(s => (
          <div key={s.label} style={{ padding: 20, background: s.color, border: '1px solid var(--border)', borderRadius: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 32, fontWeight: 900 }}>{s.value}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

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

    </div>
  );
};

import { useState, useEffect } from 'react';
import { rewardApi } from '../services/rewardApi';

// Hiển thị read-only — chỉ Admin mới có quyền chỉnh sửa cấu hình điểm
export const RewardConfigView = () => {
  const [rules, setRules] = useState([
    { id: '1', type: 'RECYCLABLE', label: 'Rác Tái Chế', pointsPerKg: 10, invalidMultiplier: 0.2, icon: '♻️' },
    { id: '2', type: 'ORGANIC', label: 'Rác Hữu Cơ', pointsPerKg: 5, invalidMultiplier: 0.2, icon: '🍎' },
    { id: '3', type: 'HAZARDOUS', label: 'Rác Độc Hại', pointsPerKg: 50, invalidMultiplier: 0.2, icon: '⚠️' },
    { id: '4', type: 'ELECTRONIC', label: 'Rác Điện Tử', pointsPerKg: 100, invalidMultiplier: 0.2, icon: '💻' },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRules = async () => {
      try {
        const data = await rewardApi.getRules();
        if (data && data.length > 0) {
          setRules(prevRules => prevRules.map(pr => {
            const apiRule = data.find((d: any) => d.type === pr.type);
            if (apiRule) {
              return { ...pr, pointsPerKg: apiRule.pointsPerKg, invalidMultiplier: apiRule.invalidMultiplier ?? 0.2 };
            }
            return pr;
          }));
        }
      } catch (err) {
        console.error('Failed to fetch reward rules', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRules();
  }, []);

  if (loading) {
    return <div style={{ color: 'var(--text-secondary)' }}>Đang tải cấu hình...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Cấu hình Điểm thưởng 🏅</h2>
        <p style={{ color: 'var(--text-secondary)', margin: '8px 0 0' }}>
          Bảng điểm thưởng hiện tại được áp dụng cho toàn hệ thống.
        </p>
      </div>

      {/* Banner thông báo quyền Admin */}
      <div style={{
        padding: '14px 20px', borderRadius: 14, marginBottom: 24,
        background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.25)',
        display: 'flex', alignItems: 'center', gap: 14
      }}>
        <div style={{ fontSize: 28 }}>🔐</div>
        <div>
          <div style={{ fontWeight: 700, color: '#a78bfa', marginBottom: 4 }}>
            Chỉ Admin mới có thể chỉnh sửa cấu hình điểm
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Bảng điểm này được quản lý tập trung bởi Admin hệ thống và áp dụng đồng nhất cho tất cả doanh nghiệp.
            Nếu cần thay đổi, vui lòng liên hệ Admin.
          </div>
        </div>
      </div>

      {/* Read-only cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {rules.map(rule => (
          <div key={rule.id} style={{
            padding: 24, background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 20, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap'
          }}>
            <div style={{
              width: 56, height: 56, background: 'rgba(255,255,255,0.03)', borderRadius: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28
            }}>
              {rule.icon}
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{rule.label}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Loại: {rule.type}</div>
            </div>

            <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 600 }}>
                  Điểm / kg (Hợp lệ)
                </div>
                <div style={{
                  padding: '10px 20px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)',
                  borderRadius: 10, fontSize: 20, fontWeight: 800, color: 'var(--green-400)'
                }}>
                  {rule.pointsPerKg}
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 600 }}>
                  Phân loại sai
                </div>
                <div style={{
                  padding: '10px 20px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)',
                  borderRadius: 10, fontSize: 20, fontWeight: 800, color: '#f59e0b'
                }}>
                  {Math.round((rule.invalidMultiplier || 0) * 100)}%
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

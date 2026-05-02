import { useState, useEffect } from 'react';
import { rewardApi } from '../services/rewardApi';

export const RewardConfigView = () => {
  const [rules, setRules] = useState([
    { id: '1', type: 'RECYCLABLE', label: 'Rác Tái Chế', pointsPerKg: 10, invalidMultiplier: 0.2, icon: '♻️' },
    { id: '2', type: 'ORGANIC', label: 'Rác Hữu Cơ', pointsPerKg: 5, invalidMultiplier: 0.2, icon: '🍎' },
    { id: '3', type: 'HAZARDOUS', label: 'Rác Độc Hại', pointsPerKg: 50, invalidMultiplier: 0.2, icon: '⚠️' },
    { id: '4', type: 'ELECTRONIC', label: 'Rác Điện Tử', pointsPerKg: 100, invalidMultiplier: 0.2, icon: '💻' },
  ]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchRules = async () => {
      try {
        const data = await rewardApi.getRules();
        if (data && data.length > 0) {
          setRules(prevRules => prevRules.map(pr => {
            const apiRule = data.find(d => d.type === pr.type);
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

  const handleUpdatePoints = (id: string, newPoints: number) => {
    setRules(rules.map(r => r.id === id ? { ...r, pointsPerKg: newPoints } : r));
  };
  
  const handleUpdateMultiplier = (id: string, newMul: number) => {
    setRules(rules.map(r => r.id === id ? { ...r, invalidMultiplier: newMul } : r));
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      await Promise.all(rules.map(r => 
        rewardApi.updateRule(r.type, { pointsPerKg: r.pointsPerKg, invalidMultiplier: r.invalidMultiplier })
      ));
      alert('Đã lưu cấu hình điểm thưởng thành công!');
    } catch (err) {
      console.error(err);
      alert('Lưu thất bại, vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ color: 'var(--text-secondary)' }}>Đang tải cấu hình...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Cấu hình Điểm thưởng 🏅</h2>
        <p style={{ color: 'var(--text-secondary)', margin: '8px 0 0' }}>Thiết lập số điểm người dân nhận được trên mỗi kg rác thải, bao gồm cả rác phân loại sai.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 32 }}>
        {rules.map(rule => (
          <div key={rule.id} style={{ padding: 24, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ width: 56, height: 56, background: 'rgba(255,255,255,0.03)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
              {rule.icon}
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{rule.label}</div>
            </div>
            
            <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Điểm thưởng (Hợp lệ)</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <input
                    type="number" value={rule.pointsPerKg} onChange={e => handleUpdatePoints(rule.id, parseFloat(e.target.value))}
                    style={{ width: 90, background: 'var(--bg-input)', border: '1px solid var(--border)', padding: '10px 12px', borderRadius: 10, color: 'var(--green-400)', fontSize: 16, fontWeight: 800, textAlign: 'center' }}
                  />
                  <span style={{ fontSize: 14, fontWeight: 600 }}>Điểm / kg</span>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Tỷ lệ điểm khi sai phân loại (%)</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <input
                    type="number" step="1" min="0" max="100" 
                    value={Math.round((rule.invalidMultiplier || 0) * 100)} 
                    onChange={e => handleUpdateMultiplier(rule.id, parseFloat(e.target.value) / 100)}
                    style={{ width: 90, background: 'var(--bg-input)', border: '1px solid var(--border)', padding: '10px 12px', borderRadius: 10, color: '#f59e0b', fontSize: 16, fontWeight: 800, textAlign: 'center' }}
                  />
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#f59e0b' }}>% Điểm gốc</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={saveConfig} disabled={saving}
          style={{ padding: '16px 40px', background: 'var(--green-500)', color: 'white', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: 'pointer', transition: '0.2s', opacity: saving ? 0.7 : 1 }}
        >
          {saving ? 'Đang lưu...' : 'Lưu Cấu Hình'}
        </button>
      </div>
    </div>
  );
};

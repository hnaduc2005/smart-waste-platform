import { useState } from 'react';

export const RewardConfigView = () => {
  // Mock data 
  const [rules, setRules] = useState([
    { id: '1', type: 'RECYCLABLE', label: 'Rác Tái Chế', pointsPerKg: 10, icon: '♻️' },
    { id: '2', type: 'ORGANIC', label: 'Rác Hữu Cơ', pointsPerKg: 5, icon: '🍎' },
    { id: '3', type: 'HAZARDOUS', label: 'Rác Độc Hại', pointsPerKg: 50, icon: '⚠️' },
    { id: '4', type: 'ELECTRONIC', label: 'Rác Điện Tử', pointsPerKg: 100, icon: '💻' },
  ]);

  const [saving, setSaving] = useState(false);

  const handleUpdate = (id: string, newPoints: number) => {
    setRules(rules.map(r => r.id === id ? { ...r, pointsPerKg: newPoints } : r));
  };

  const saveConfig = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      alert('Đã lưu cấu hình điểm thưởng tạm thời (Mock)!');
    }, 800);
  };

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Cấu hình Điểm thưởng 🏅</h2>
        <p style={{ color: 'var(--text-secondary)', margin: '8px 0 0' }}>Thiết lập số điểm người dân nhận được trên mỗi kg rác thải.</p>
        <div style={{ marginTop: 12, padding: '8px 16px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10, fontSize: 13, color: '#60a5fa', display: 'inline-block' }}>
          ℹ️ Đây là giao diện giả lập (Mock UI) do Backend Reward Service chưa hỗ trợ API Config.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 32 }}>
        {rules.map(rule => (
          <div key={rule.id} style={{ padding: 24, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ width: 56, height: 56, background: 'rgba(255,255,255,0.03)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
              {rule.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>{rule.label}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input
                  type="number" value={rule.pointsPerKg} onChange={e => handleUpdate(rule.id, parseFloat(e.target.value))}
                  style={{ width: 80, background: 'var(--bg-input)', border: '1px solid var(--border)', padding: '8px 12px', borderRadius: 8, color: 'var(--green-400)', fontSize: 18, fontWeight: 800, textAlign: 'center' }}
                />
                <span style={{ fontSize: 14, fontWeight: 600 }}>Điểm / kg</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={saveConfig} disabled={saving}
          style={{ padding: '16px 40px', background: 'var(--green-500)', color: 'white', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: 'pointer' }}
        >
          {saving ? 'Đang lưu...' : 'Lưu Cấu Hình'}
        </button>
      </div>
    </div>
  );
};

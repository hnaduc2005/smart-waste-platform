import { useState, useEffect } from 'react';
import { enterpriseApi, Vehicle } from '../services/enterpriseApi';

export const VehicleManagementView = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Form State
  const [licensePlate, setLicensePlate] = useState('');
  const [maxPayload, setMaxPayload] = useState<number>(3.5);
  const [submitting, setSubmitting] = useState(false);

  const fetchVehicles = () => {
    setLoading(true);
    enterpriseApi.getVehicles()
      .then(res => setVehicles(res))
      .catch(err => {
        console.error(err);
        setVehicles([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licensePlate) return;
    try {
      setSubmitting(true);
      await enterpriseApi.registerVehicle({
        licensePlate,
        maxPayload,
        currentStatus: 'AVAILABLE'
      });
      setShowForm(false);
      setLicensePlate('');
      fetchVehicles();
    } catch (err) {
      alert('Đăng ký xe thất bại!');
    } finally {
      setSubmitting(false);
    }
  };

  const STATUS_LABELS: Record<string, { label: string, color: string, bg: string }> = {
    AVAILABLE: { label: 'Sẵn sàng', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
    ON_DUTY: { label: 'Đang hoạt động', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
    MAINTENANCE: { label: 'Bảo trì', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Quản lý Đội xe 🚚</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '8px 0 0' }}>Đăng ký và theo dõi trạng thái các phương tiện thu gom.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          style={{
            background: showForm ? 'rgba(239, 68, 68, 0.1)' : 'var(--green-500)',
            color: showForm ? '#ef4444' : 'white',
            border: 'none', padding: '12px 24px', borderRadius: 12,
            fontSize: 15, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
          }}
        >
          {showForm ? '✕ Hủy bỏ' : '＋ Đăng ký xe mới'}
        </button>
      </div>

      {showForm && (
        <div style={{ padding: 28, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20 }}>
          <h3 style={{ marginTop: 0, marginBottom: 20 }}>Thông tin xe mới</h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 16, alignItems: 'flex-end' }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, marginBottom: 8, color: 'var(--text-secondary)' }}>Biển số xe</label>
              <input 
                type="text" required value={licensePlate} onChange={e => setLicensePlate(e.target.value)}
                placeholder="Ví dụ: 59H1-123.45"
                style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: 10, color: 'white', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, marginBottom: 8, color: 'var(--text-secondary)' }}>Tải trọng (Tấn)</label>
              <input 
                type="number" step="0.1" required value={maxPayload} onChange={e => setMaxPayload(parseFloat(e.target.value))}
                style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: 10, color: 'white', boxSizing: 'border-box' }}
              />
            </div>
            <button 
              type="submit" disabled={submitting}
              style={{ padding: '12px 32px', background: 'var(--green-500)', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}
            >
              {submitting ? '...' : 'Lưu xe'}
            </button>
          </form>
        </div>
      )}

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '16px 24px', fontSize: 13, color: 'var(--text-secondary)' }}>BIỂN SỐ</th>
              <th style={{ padding: '16px 24px', fontSize: 13, color: 'var(--text-secondary)' }}>TẢI TRỌNG</th>
              <th style={{ padding: '16px 24px', fontSize: 13, color: 'var(--text-secondary)' }}>TRẠNG THÁI</th>
              <th style={{ padding: '16px 24px', fontSize: 13, color: 'var(--text-secondary)' }}>THAO TÁC</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} style={{ padding: 40, textAlign: 'center' }}>Đang tải...</td></tr>
            ) : vehicles.map(v => (
              <tr key={v.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '16px 24px', fontWeight: 700 }}>{v.licensePlate}</td>
                <td style={{ padding: '16px 24px' }}>{v.maxPayload} Tấn</td>
                <td style={{ padding: '16px 24px' }}>
                  <span style={{ 
                    padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                    color: STATUS_LABELS[v.currentStatus].color, background: STATUS_LABELS[v.currentStatus].bg 
                  }}>
                    {STATUS_LABELS[v.currentStatus].label}
                  </span>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginRight: 12 }}>✏️ Sửa</button>
                  <button style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>🗑️ Xóa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

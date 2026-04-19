import { useState, useEffect } from 'react';
import { enterpriseApi, Enterprise } from '../services/enterpriseApi';

export const EnterpriseProfileView = () => {
  const [enterprise, setEnterprise] = useState<Enterprise | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    enterpriseApi.getEnterprises()
      .then(res => {
        if (res && res.length > 0) setEnterprise(res[0]);
        else setEnterprise({
          name: 'Công ty Môi Trường Xanh',
          licenseNumber: 'GP-2024-ABC',
          address: '123 Đường Tên Lửa, TP.HCM',
          dailyCapacity: 50.5
        });
      })
      .catch(() => {
        setEnterprise({
          name: 'Công ty Môi Trường Xanh (Demo)',
          licenseNumber: 'GP-2024-ABC',
          address: '123 Đường Tên Lửa, TP.HCM',
          dailyCapacity: 50.5
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enterprise) return;
    setSaving(true);
    // Simulate API call
    setTimeout(() => {
      setSaving(false);
      alert('Đã cập nhật cấu hình doanh nghiệp!');
    }, 1000);
  };

  if (loading) return <div>Đang tải...</div>;

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Cấu hình Doanh nghiệp 🏭</h2>
        <p style={{ color: 'var(--text-secondary)', margin: '8px 0 0' }}>Quản lý thông tin pháp lý và năng lực xử lý rác thải.</p>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ padding: 32, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>Tên Doanh Nghiệp</label>
            <input 
              type="text" value={enterprise?.name} onChange={e => setEnterprise({...enterprise!, name: e.target.value})}
              style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)', padding: '14px 16px', borderRadius: 12, color: 'white', boxSizing: 'border-box' }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>Số Giấy Phép Kinh Doanh</label>
            <input 
              type="text" value={enterprise?.licenseNumber} onChange={e => setEnterprise({...enterprise!, licenseNumber: e.target.value})}
              style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)', padding: '14px 16px', borderRadius: 12, color: 'white', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>Công suất xử lý (Tấn/Ngày)</label>
            <input 
              type="number" value={enterprise?.dailyCapacity} onChange={e => setEnterprise({...enterprise!, dailyCapacity: parseFloat(e.target.value)})}
              style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)', padding: '14px 16px', borderRadius: 12, color: 'white', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>Địa chỉ Trụ sở</label>
            <textarea 
              value={enterprise?.address} onChange={e => setEnterprise({...enterprise!, address: e.target.value})}
              style={{ width: '100%', height: 80, background: 'var(--bg-input)', border: '1px solid var(--border)', padding: '14px 16px', borderRadius: 12, color: 'white', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'none' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            type="submit" disabled={saving}
            style={{ padding: '16px 40px', background: 'var(--green-500)', color: 'white', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(34,197,94,0.3)' }}
          >
            {saving ? 'Đang lưu...' : 'Lưu Thay Đổi'}
          </button>
        </div>
      </form>
    </div>
  );
};

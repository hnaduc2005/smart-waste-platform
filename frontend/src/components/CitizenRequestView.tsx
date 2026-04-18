import React, { useState, useEffect } from 'react';
import { collectionApi } from '../services/collectionApi';
import { useAuth } from '../context/AuthContext';

const STATUS_MAP = {
  PENDING: { label: 'Chờ xử lý', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  ASSIGNED: { label: 'Đã phân công', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
  COLLECTED: { label: 'Đã thu gom', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
  COMPLETED: { label: 'Hoàn thành', color: '#059669', bg: 'rgba(5, 150, 105, 0.15)' },
  CANCELLED: { label: 'Đã hủy', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
};

const WASTE_TYPES = [
  { value: 'RECYCLABLE', label: 'Rác tái chế (Nhựa, Giấy, Kim loại)', icon: '♻️' },
  { value: 'ORGANIC', label: 'Rác hữu cơ (Thức ăn thừa)', icon: '🍎' },
  { value: 'HAZARDOUS', label: 'Rác độc hại (Pin, Hóa chất)', icon: '⚠️' },
  { value: 'BULKY', label: 'Rác cồng kềnh (Tủ, Bàn ghế)', icon: '🛋️' },
  { value: 'ELECTRONIC', label: 'Rác điện tử (E-waste)', icon: '💻' },
];

export const CitizenRequestView = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form State
  const [type, setType] = useState('RECYCLABLE');
  const [location, setLocation] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [gettingLocation, setGettingLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchRequests = async () => {
    if (!user?.userId) return;
    try {
      setLoading(true);
      const data = await collectionApi.getCitizenRequests(user.userId);
      setRequests(data);
    } catch (error) {
      console.error('Error fetching requests', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userId]);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Trình duyệt của bạn không hỗ trợ định vị GPS!');
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation(`${position.coords.latitude},${position.coords.longitude}`);
        setGettingLocation(false);
      },
      (error) => {
        alert('Không thể lấy vị trí. Vui lòng cho phép quyền truy cập vị trí.');
        setGettingLocation(false);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location) {
      alert('Vui lòng cung cấp tọa độ GPS!');
      return;
    }
    try {
      setSubmitting(true);
      await collectionApi.createRequest({
        citizenId: user.userId,
        type,
        location,
        imageUrl: imageUrl || 'https://via.placeholder.com/300?text=No+Image'
      });
      setShowForm(false);
      setLocation('');
      setImageUrl('');
      setType('RECYCLABLE');
      fetchRequests(); // reload list
    } catch (error) {
      alert('Tạo yêu cầu thất bại. Vui lòng thử lại.');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Yêu cầu thu gom</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '8px 0 0' }}>Theo dõi và quản lý các yêu cầu đổ rác của bạn</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          style={{
            background: showForm ? 'rgba(239, 68, 68, 0.1)' : 'var(--green-500)',
            color: showForm ? '#ef4444' : 'white',
            border: 'none', padding: '12px 24px', borderRadius: 12,
            fontSize: 15, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', gap: 8
          }}
        >
          {showForm ? <>✕ Hủy tạo</> : <>＋ Gửi yêu cầu mới</>}
        </button>
      </div>

      {/* Form Overlay/Section */}
      {showForm && (
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 20, padding: 32, backdropFilter: 'blur(10px)',
          animation: 'fadeInDown 0.3s ease-out'
        }}>
          <h3 style={{ fontSize: 20, marginTop: 0, marginBottom: 24 }}>Tạo yêu cầu dọn rác 📍</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            
            {/* Waste Type */}
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>
                Loại rác thải của bạn
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                {WASTE_TYPES.map(w => (
                  <label key={w.value} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '16px',
                    background: type === w.value ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                    border: `1px solid ${type === w.value ? 'var(--green-500)' : 'var(--border)'}`,
                    borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s'
                  }}>
                    <input type="radio" name="wasteType" value={w.value} checked={type === w.value} 
                           onChange={() => setType(w.value)} style={{ display: 'none' }} />
                    <span style={{ fontSize: 24 }}>{w.icon}</span>
                    <span style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.3 }}>{w.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* GPS Location */}
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>
                Vị trí thu gom (GPS) <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: 12 }}>
                <input 
                  type="text" required readOnly 
                  value={location} placeholder="Nhấn vào nút bên cạnh để lấy vị trí..."
                  style={{
                    flex: 1, background: 'var(--bg-input)', border: '1px solid var(--border)',
                    padding: '14px 16px', borderRadius: 12, color: 'var(--text)', fontSize: 15, fontFamily: 'inherit'
                  }}
                />
                <button type="button" onClick={handleGetLocation} disabled={gettingLocation}
                  style={{
                    background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)',
                    padding: '0 20px', borderRadius: 12, cursor: gettingLocation ? 'wait' : 'pointer',
                    fontWeight: 600, transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 8
                  }}>
                  {gettingLocation ? 'Đang lấy...' : '📍 Lấy GPS'}
                </button>
              </div>
            </div>

            {/* Image Upload Mock */}
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>
                Ảnh chụp hiện trạng rác (Tùy chọn)
              </label>
              <input 
                type="text" 
                value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Dán link ảnh (hoặc hệ thống sẽ dùng ảnh mặc định)"
                style={{
                  width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)',
                  padding: '14px 16px', borderRadius: 12, color: 'var(--text)', fontSize: 15, boxSizing: 'border-box'
                }}
              />
            </div>

            <button type="submit" disabled={submitting}
              style={{
                background: 'var(--green-500)', color: 'white', border: 'none',
                padding: '16px', borderRadius: 12, fontSize: 16, fontWeight: 700,
                cursor: submitting ? 'wait' : 'pointer', marginTop: 12, transition: 'all 0.2s'
              }}>
              {submitting ? 'Đang gửi...' : '🚀 XÁC NHẬN GỬI YÊU CẦU'}
            </button>
          </form>
        </div>
      )}

      {/* Requests List */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 20, border: '1px solid var(--border)', padding: '24px 0', minHeight: 400 }}>
        <h3 style={{ fontSize: 18, margin: '0 24px 20px' }}>Lịch sử yêu cầu của bạn</h3>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>Đang tải dữ liệu...</div>
        ) : requests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🍃</div>
            <p>Bạn chưa có yêu cầu thu gom nào.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '16px 24px', fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>ID</th>
                  <th style={{ padding: '16px 24px', fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>Phân loại</th>
                  <th style={{ padding: '16px 24px', fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>Tọa độ (GPS)</th>
                  <th style={{ padding: '16px 24px', fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>Trạng thái</th>
                  <th style={{ padding: '16px 24px', fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(r => {
                  const statusConf = STATUS_MAP[r.status] || { label: r.status, color: '#ccc', bg: 'rgba(255,255,255,0.1)' };
                  const typeLabel = WASTE_TYPES.find(w => w.value === r.type)?.label || r.type;
                  return (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '16px 24px', fontSize: 14, fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                        {r.id.substring(0, 8)}...
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: 14, fontWeight: 500 }}>{typeLabel}</td>
                      <td style={{ padding: '16px 24px', fontSize: 14 }}>
                        <a href={`https://maps.google.com/?q=${r.location}`} target="_blank" rel="noreferrer"
                           style={{ color: '#38bdf8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                          📍 Xem MAP
                        </a>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <span style={{
                          background: statusConf.bg, color: statusConf.color,
                          padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700
                        }}>
                          {statusConf.label}
                        </span>
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: 13, color: 'var(--text-secondary)' }}>
                        {new Date(r.createdAt || Date.now()).toLocaleString('vi-VN')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { collectionApi } from '../services/collectionApi';
import { useAuth } from '../context/AuthContext';
import { notificationApi } from '../services/notificationApi';

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

const formatDate = (dateInput: any) => {
  if (!dateInput) return new Date().toLocaleString('vi-VN');
  
  if (Array.isArray(dateInput)) {
    const [year, month, day, hour = 0, minute = 0, second = 0] = dateInput;
    // Backend trả về mảng số theo giờ UTC, cần dùng Date.UTC để trình duyệt tự cộng thêm 7 tiếng (múi giờ VN)
    return new Date(Date.UTC(year, month - 1, day, hour, minute, second)).toLocaleString('vi-VN');
  }

  let dateString = String(dateInput);
  // Nếu là chuỗi ISO thiếu timezone (VD: "2026-04-26T01:00:00"), ép thành UTC bằng cách thêm 'Z'
  if (dateString.includes('T') && !dateString.endsWith('Z') && !dateString.includes('+')) {
    dateString += 'Z';
  }
  
  const dateObj = new Date(dateString);
  return isNaN(dateObj.getTime()) ? new Date().toLocaleString('vi-VN') : dateObj.toLocaleString('vi-VN');
};

export const CitizenRequestView = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form State
  const [type, setType] = useState('RECYCLABLE');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchRequests = async () => {
    if (!user?.userId) return;
    try {
      setLoading(true);
      const data = await collectionApi.getCitizenRequests(user.userId);
      setRequests(data);
    } catch (error) {
      console.warn('Backend API failed, falling back to local storage', error);
      const saved = localStorage.getItem('eco_citizen_requests');
      if (saved) {
        setRequests(JSON.parse(saved).filter((r: any) => r.citizenId === user.userId));
      } else {
        setRequests([]);
      }
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
    if (!user?.userId) return;
    if (!location) {
      alert('Vui lòng cung cấp tọa độ GPS!');
      return;
    }
    try {
      setSubmitting(true);
      if (imageFile) {
        await collectionApi.createRequestWithImage(user.userId, location, description, imageFile);
      } else {
        await collectionApi.createRequest({
          citizenId: user.userId,
          type,
          location,
          description,
          imageUrl: imageUrl || 'https://via.placeholder.com/300?text=No+Image'
        });
      }
      alert('Tạo yêu cầu thành công!');
    } catch (error) {
      console.warn('Backend failed, saving request to local storage', error);
      const saved = localStorage.getItem('eco_citizen_requests');
      const reqs = saved ? JSON.parse(saved) : [];
      reqs.push({
        id: 'req-' + Date.now(),
        citizenId: user.userId,
        type,
        location,
        imageUrl: imageUrl || 'https://via.placeholder.com/300?text=No+Image',
        status: 'PENDING',
        createdAt: new Date().toISOString()
      });
      localStorage.setItem('eco_citizen_requests', JSON.stringify(reqs));
      alert('Tạo yêu cầu (Ngoại tuyến) thành công!');
    } finally {
      setShowForm(false);
      setLocation('');
      setDescription('');
      setImageUrl('');
      setImageFile(null);
      setType('RECYCLABLE');
      fetchRequests(); // reload list
      

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
                Loại rác thải của bạn <span style={{fontSize: 12, fontWeight: 400}}>(Nếu tải ảnh lên, AI sẽ tự động nhận diện lại loại rác này)</span>
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
                  type="text" required 
                  value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Nhập địa chỉ hoặc lấy GPS..."
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

            {/* Description */}
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>
                Mô tả chi tiết <span style={{fontSize: 12, fontWeight: 400}}>(Tùy chọn)</span>
              </label>
              <textarea 
                value={description} onChange={(e) => setDescription(e.target.value)} 
                placeholder="Ví dụ: Rác để trong hẻm, có 3 túi to..."
                rows={3}
                style={{
                  width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)',
                  padding: '14px 16px', borderRadius: 12, color: 'var(--text)', fontSize: 15, fontFamily: 'inherit',
                  resize: 'vertical', boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Image Upload for AI */}
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>
                Ảnh chụp hiện trạng rác (Tùy chọn - Dùng AI nhận diện)
              </label>
              <div style={{
                background: 'var(--bg-input)', border: '1px dashed var(--border)', 
                padding: '20px', borderRadius: 12, textAlign: 'center', cursor: 'pointer'
              }}>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setImageFile(file);
                  }}
                  style={{
                    width: '100%', color: 'var(--text)', fontSize: 14
                  }}
                />
                {imageFile && (
                  <p style={{marginTop: 8, color: 'var(--green-400)', fontSize: 13}}>
                    ✅ Đã chọn ảnh: {imageFile.name}. Khi gửi, AI sẽ tự động phân loại!
                  </p>
                )}
              </div>
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
                  <th style={{ padding: '16px 24px', fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>Mô tả</th>
                  <th style={{ padding: '16px 24px', fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>Trạng thái</th>
                  <th style={{ padding: '16px 24px', fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(r => {
                  const statusConf = STATUS_MAP[r.status as keyof typeof STATUS_MAP] || { label: r.status, color: '#ccc', bg: 'rgba(255,255,255,0.1)' };
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
                      <td style={{ padding: '16px 24px', fontSize: 14, color: 'var(--text-secondary)', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.description || '-'}
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
                        {formatDate(r.createdAt)}
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

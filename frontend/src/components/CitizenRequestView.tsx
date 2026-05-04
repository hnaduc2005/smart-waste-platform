import React, { useState, useEffect } from 'react';
import { collectionApi } from '../services/collectionApi';
import { useAuth } from '../context/AuthContext';
import { notificationApi } from '../services/notificationApi';

const STATUS_MAP = {
  PENDING:    { label: 'Chờ xử lý',    color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  ASSIGNED:   { label: 'Đã phân công', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
  ON_THE_WAY: { label: '🚚 Đang đến',  color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)' },
  COLLECTED:  { label: 'Đã thu gom',   color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
  COMPLETED:  { label: 'Hoàn thành',   color: '#059669', bg: 'rgba(5, 150, 105, 0.15)' },
  CANCELLED:  { label: 'Đã hủy',       color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
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
  const [location, setLocation] = useState('');          // raw text address entered by user
  const [locationCoords, setLocationCoords] = useState(''); // "lat,lng" after geocoding
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeLabel, setGeocodeLabel] = useState('');  // human-readable address from geocoder
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

  /** Tọa độ trung tâm các quận/huyện TP.HCM — dùng làm fallback khi Nominatim thất bại */
  const DISTRICT_CENTROIDS: Record<string, [number, number]> = {
    'quận 1': [10.7769, 106.7009], 'quan 1': [10.7769, 106.7009],
    'quận 2': [10.7880, 106.7516], 'quan 2': [10.7880, 106.7516],
    'quận 3': [10.7900, 106.6849], 'quan 3': [10.7900, 106.6849],
    'quận 4': [10.7574, 106.7036], 'quan 4': [10.7574, 106.7036],
    'quận 5': [10.7557, 106.6626], 'quan 5': [10.7557, 106.6626],
    'quận 6': [10.7465, 106.6354], 'quan 6': [10.7465, 106.6354],
    'quận 7': [10.7332, 106.7218], 'quan 7': [10.7332, 106.7218],
    'quận 8': [10.7237, 106.6289], 'quan 8': [10.7237, 106.6289],
    'quận 9': [10.8412, 106.7794], 'quan 9': [10.8412, 106.7794],
    'quận 10': [10.7757, 106.6676], 'quan 10': [10.7757, 106.6676],
    'quận 11': [10.7636, 106.6479], 'quan 11': [10.7636, 106.6479],
    'quận 12': [10.8681, 106.6898], 'quan 12': [10.8681, 106.6898],
    'bình thạnh': [10.8118, 106.7120], 'binh thanh': [10.8118, 106.7120],
    'gò vấp': [10.8384, 106.6652], 'go vap': [10.8384, 106.6652],
    'phú nhuận': [10.7960, 106.6835], 'phu nhuan': [10.7960, 106.6835],
    'tân bình': [10.8015, 106.6524], 'tan binh': [10.8015, 106.6524],
    'tân phú': [10.7903, 106.6286], 'tan phu': [10.7903, 106.6286],
    'bình tân': [10.7539, 106.6034], 'binh tan': [10.7539, 106.6034],
    'thủ đức': [10.8601, 106.7658], 'thu duc': [10.8601, 106.7658],
    'hóc môn': [10.8921, 106.5980], 'hoc mon': [10.8921, 106.5980],
    'củ chi': [11.0054, 106.4953], 'cu chi': [11.0054, 106.4953],
    'bình chánh': [10.6755, 106.6024], 'binh chanh': [10.6755, 106.6024],
    'nhà bè': [10.6919, 106.7418], 'nha be': [10.6919, 106.7418],
    'cần giờ': [10.4135, 106.8673], 'can gio': [10.4135, 106.8673],
    // Phường/xã nổi tiếng → quận tương ứng
    'an phú đông': [10.8681, 106.6898],  // Quận 12
    'thạnh lộc': [10.8770, 106.6793],     // Quận 12
    'tân thới hiệp': [10.8620, 106.6700], // Quận 12
    'hiệp thành': [10.8800, 106.6600],    // Quận 12
    'thạnh xuân': [10.8900, 106.7000],    // Quận 12
    'đông hưng thuận': [10.8750, 106.6600],// Quận 12
    'tân chánh hiệp': [10.8650, 106.6500],// Quận 12
    'an phú': [10.7900, 106.7450],        // Quận 2
    'bình an': [10.8000, 106.7600],       // Quận 2
    'bình khánh': [10.7800, 106.7500],    // Quận 2
    'thảo điền': [10.8000, 106.7400],     // Quận 2
    'thạnh mỹ lợi': [10.7700, 106.7600],  // Quận 2
    'bình trưng': [10.8100, 106.7700],    // Quận 2
    'thạnh mỹ tây': [10.8118, 106.7120],  // Bình Thạnh
    'văn thánh': [10.8000, 106.7160],     // Bình Thạnh
  };

  /** Thử tra cứu tọa độ từ tên quận/phường trong địa chỉ */
  const fallbackByDistrictName = (address: string): string | null => {
    const lc = address.toLowerCase()
      .replace(/tp\.|tp |t\.p\.|thành phố|tỉnh|city|province/gi, '')
      .trim();
    // Sort by length desc so longer (more specific) names are matched first
    const keys = Object.keys(DISTRICT_CENTROIDS).sort((a, b) => b.length - a.length);
    for (const key of keys) {
      if (lc.includes(key)) {
        const [lat, lng] = DISTRICT_CENTROIDS[key];
        setGeocodeLabel(`📍 Khu vực: ${key.replace(/^\w/, c => c.toUpperCase())} (TP.HCM) — tọa độ trung tâm`);
        return `${lat.toFixed(6)},${lng.toFixed(6)}`;
      }
    }
    return null;
  };

  /**
   * Geocode địa chỉ text → "lat,lng".
   * Chiến lược: (1) Nominatim full query, (2) Nominatim simplified, (3) fallback by district/ward name.
   */
  const geocodeAddress = async (address: string): Promise<string | null> => {
    // Chuẩn hoá: bỏ phần "Việt Nam" và "Hồ Chí Minh" nếu đã có trong address để tránh trùng
    const clean = address
      .replace(/,?\s*(việt nam|vietnam|viet nam)/gi, '')
      .replace(/,?\s*(hồ chí minh|ho chi minh|tp\.?\s*hcm|tp\.?\s*hồ chí minh)/gi, '')
      .trim()
      .replace(/,\s*$/, '');

    const tryNominatim = async (q: string): Promise<{lat:string;lon:string;display_name:string} | null> => {
      try {
        const query = encodeURIComponent(q + ', Hồ Chí Minh, Việt Nam');
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1&countrycodes=vn&addressdetails=1`,
          { headers: { 'Accept-Language': 'vi', 'User-Agent': 'EcoCycle-App/1.0' } }
        );
        if (!res.ok) return null;
        const data = await res.json();
        return data && data.length > 0 ? data[0] : null;
      } catch { return null; }
    };

    // Strategy 1: Nominatim full cleaned address
    let result = await tryNominatim(clean);
    if (result) {
      setGeocodeLabel(result.display_name);
      return `${parseFloat(result.lat).toFixed(6)},${parseFloat(result.lon).toFixed(6)}`;
    }

    // Strategy 2: Nominatim with progressive fallback (bỏ dần số nhà, tên đường, phường)
    const parts = clean.split(',').map(s => s.trim()).filter(Boolean);
    for (let i = 1; i < parts.length; i++) {
      const simplified = parts.slice(i).join(', ');
      result = await tryNominatim(simplified);
      if (result) {
        setGeocodeLabel(result.display_name);
        return `${parseFloat(result.lat).toFixed(6)},${parseFloat(result.lon).toFixed(6)}`;
      }
    }

    // Strategy 3: Fallback by known Vietnamese district/ward names in the text
    const fallback = fallbackByDistrictName(address);
    if (fallback) return fallback;

    return null;
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Trình duyệt của bạn không hỗ trợ định vị GPS!');
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = `${position.coords.latitude.toFixed(6)},${position.coords.longitude.toFixed(6)}`;
        setLocationCoords(coords);
        setLocation(coords); // show coords in input
        setGeocodeLabel('📍 Vị trí GPS thực tế');
        setGettingLocation(false);
      },
      () => {
        alert('Không thể lấy vị trí. Vui lòng cho phép quyền truy cập vị trí.');
        setGettingLocation(false);
      }
    );
  };

  const handleGeocodeInput = async () => {
    if (!location.trim()) return;
    // If already coords format, skip geocoding
    if (/^-?\d+\.\d+\s*,\s*-?\d+\.\d+$/.test(location.trim())) {
      setLocationCoords(location.trim());
      setGeocodeLabel('✅ Tọa độ GPS hợp lệ');
      return;
    }
    setGeocoding(true);
    const coords = await geocodeAddress(location);
    setGeocoding(false);
    if (coords) {
      setLocationCoords(coords);
    } else {
      alert('Không tìm thấy địa chỉ này. Hãy thử nhập chính xác hơn hoặc sử dụng nút Lấy GPS.');
      setGeocodeLabel('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.userId) return;
    if (!location.trim()) {
      alert('Vui lòng nhập địa chỉ hoặc lấy GPS!');
      return;
    }

    // Ensure we have geocoded coordinates before submitting
    let finalCoords = locationCoords;
    if (!finalCoords) {
      // Try geocoding now if user didn't press the geocode button
      setSubmitting(true);
      if (/^-?\d+\.\d+\s*,\s*-?\d+\.\d+$/.test(location.trim())) {
        finalCoords = location.trim();
      } else {
        const coords = await geocodeAddress(location);
        if (!coords) {
          alert('Không thể xác định tọa độ cho địa chỉ này. Hãy thử lại hoặc dùng nút Lấy GPS.');
          setSubmitting(false);
          return;
        }
        finalCoords = coords;
      }
    }

    try {
      if (!submitting) setSubmitting(true);
      if (imageFile) {
        await collectionApi.createRequestWithImage(user.userId, finalCoords, description, imageFile);
      } else {
        await collectionApi.createRequest({
          citizenId: user.userId,
          type,
          location: finalCoords,
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
      setLocationCoords('');
      setGeocodeLabel('');
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
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8, color: imageFile ? 'var(--green-400)' : 'var(--text-secondary)' }}>
                {imageFile ? '🤖 AI sẽ tự động nhận diện loại rác dựa trên ảnh của bạn' : 'Loại rác thải của bạn'}
              </label>
              <div style={{ 
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12,
                opacity: imageFile ? 0.5 : 1, pointerEvents: imageFile ? 'none' : 'auto'
              }}>
                {WASTE_TYPES.map(w => (
                  <label key={w.value} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '16px',
                    background: type === w.value && !imageFile ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                    border: `1px solid ${type === w.value && !imageFile ? 'var(--green-500)' : 'var(--border)'}`,
                    borderRadius: 12, cursor: imageFile ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                    filter: imageFile ? 'grayscale(100%)' : 'none'
                  }}>
                    <input type="radio" name="wasteType" value={w.value} checked={type === w.value} 
                           onChange={() => setType(w.value)} disabled={!!imageFile} style={{ display: 'none' }} />
                    <span style={{ fontSize: 24 }}>{w.icon}</span>
                    <span style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.3 }}>{w.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Location Input + Geocoding */}
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>
                Vị trí thu gom <span style={{ color: '#ef4444' }}>*</span>
                <span style={{ fontSize: 12, fontWeight: 400, marginLeft: 6 }}>(Gõ địa chỉ rồi bấm "Xác định" HOẶC dùng GPS tự động)</span>
              </label>
              <div className="location-input-group" style={{ display: 'flex', gap: 10 }}>
                <input
                  type="text" required
                  value={location}
                  onChange={(e) => { setLocation(e.target.value); setLocationCoords(''); setGeocodeLabel(''); }}
                  onBlur={handleGeocodeInput}
                  placeholder="VD: 119 Thạnh Lộc 15, Quận 12, TP.HCM"
                  style={{
                    flex: 1, background: 'var(--bg-input)',
                    border: `1px solid ${locationCoords ? 'rgba(34,197,94,0.6)' : 'var(--border)'}`,
                    padding: '14px 16px', borderRadius: 12, color: 'var(--text-primary)', fontSize: 15, fontFamily: 'inherit',
                    transition: 'border-color 0.2s'
                  }}
                />
                <button type="button" onClick={handleGeocodeInput} disabled={geocoding || !location.trim()}
                  title="Chuyển địa chỉ thành tọa độ bản đồ"
                  style={{
                    background: locationCoords ? 'rgba(34,197,94,0.15)' : 'rgba(168,85,247,0.1)',
                    color: locationCoords ? '#4ade80' : '#c084fc',
                    border: `1px solid ${locationCoords ? 'rgba(34,197,94,0.4)' : 'rgba(168,85,247,0.3)'}`,
                    padding: '0 16px', borderRadius: 12, cursor: (geocoding || !location.trim()) ? 'not-allowed' : 'pointer',
                    fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', gap: 6, opacity: !location.trim() ? 0.5 : 1
                  }}>
                  {geocoding ? '⏳' : locationCoords ? '✅' : '🗺️'}
                  {geocoding ? 'Đang xác định...' : locationCoords ? 'Đã xác định' : 'Xác định địa chỉ'}
                </button>
                <button type="button" onClick={handleGetLocation} disabled={gettingLocation}
                  title="Lấy vị trí GPS thực tế của bạn ngay lập tức"
                  style={{
                    background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)',
                    padding: '0 16px', borderRadius: 12, cursor: gettingLocation ? 'wait' : 'pointer',
                    fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', gap: 6
                  }}>
                  {gettingLocation ? '⏳ Đang lấy...' : '📍 GPS tự động'}
                </button>
              </div>
              {/* Geocode result feedback */}
              {locationCoords && (
                <div style={{
                  marginTop: 8, padding: '8px 14px', borderRadius: 10,
                  background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)',
                  fontSize: 13, display: 'flex', alignItems: 'flex-start', gap: 8
                }}>
                  <span>✅</span>
                  <div>
                    <div style={{ color: '#4ade80', fontWeight: 600 }}>Tọa độ: {locationCoords}</div>
                    {geocodeLabel && <div style={{ color: 'var(--text-secondary)', marginTop: 2 }}>{geocodeLabel}</div>}
                  </div>
                </div>
              )}
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
                      <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                        <span style={{
                          background: statusConf.bg, color: statusConf.color,
                          padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                          whiteSpace: 'nowrap', display: 'inline-block'
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

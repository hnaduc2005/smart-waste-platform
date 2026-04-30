import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { collectionApi } from '../services/collectionApi';
import { notificationApi } from '../services/notificationApi';
import { userApi } from '../services/userApi';
import { enterpriseApi } from '../services/enterpriseApi';
import { useAuth } from '../context/AuthContext';

// Cố định lỗi icon mặc định của leaflet khi dùng react
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Icon màu đỏ cho đơn báo PENDING
const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Icon màu xanh cho Collector
const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});



const WASTE_TYPE_MAP: Record<string, string> = {
  'RECYCLABLE': '♻️ Rác tái chế (Nhựa, Giấy, Kim loại)',
  'ORGANIC': '🍎 Rác hữu cơ (Thức ăn thừa)',
  'HAZARDOUS': '⚠️ Rác độc hại (Pin, Hóa chất)',
  'BULKY': '🛋️ Rác cồng kềnh (Tủ, Bàn ghế)',
  'ELECTRONIC': '💻 Rác điện tử (E-waste)',
};

export const MapDispatcher = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [collectors, setCollectors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [assignMsg, setAssignMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [enterprise, setEnterprise] = useState<any>(null);

  // Dùng ref để interval luôn đọc được giá trị mới nhất (tránh stale closure)
  const serviceAreaRef = useRef<string | undefined>(undefined);
  const enterpriseNameRef = useRef<string | undefined>(undefined);
  const rejectedIdsRef = useRef<Set<string>>(new Set());

  // Default center: Ho Chi Minh City
  const DEFAULT_LAT = 10.823;
  const DEFAULT_LNG = 106.629;

  const fetchCollectors = async () => {
    try {
      const data = await userApi.getCollectors();
      const myEntName = enterpriseNameRef.current;
      // Chỉ hiển thị các collector trực thuộc doanh nghiệp này (so khớp companyName)
      const myCollectors = data.filter((c: any) => !myEntName || c.companyName === myEntName);

      const mapped = myCollectors.map((c: any, index: number) => ({
        id: c.id,
        name: c.fullName || 'Tài xế',
        vehiclePlate: c.vehiclePlate || '',
        status: c.isOnline === false ? 'Không hoạt động' : 'Sẵn sàng',
        coords: (c.latitude && c.longitude)
          ? [c.latitude, c.longitude]
          : [DEFAULT_LAT + (index % 3) * 0.008, DEFAULT_LNG + Math.floor(index / 3) * 0.008]
      }));
      setCollectors(mapped);
    } catch (e) {
      console.error('Lỗi tải danh sách collector:', e);
      setCollectors([]);
    }
  };

  const fetchPending = async () => {
    try {
      setLoading(true);
      const sa = serviceAreaRef.current;
      const districtParam = (sa && sa !== 'Toàn TP.HCM') ? sa : undefined;
      const data = await collectionApi.getAllRequests('PENDING', districtParam);
      // Lọc ra những đơn đã bị reject (trong trường hợp API chưa kịp cập nhật)
      const filtered = (data || []).filter((r: any) => !rejectedIdsRef.current.has(r.id));
      setRequests(filtered);
    } catch (e) {
      console.error('Lỗi tải đơn pending:', e);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      if (user?.userId) {
        try {
          const ent = await enterpriseApi.getMyEnterprise(user.userId);
          setEnterprise(ent);
          serviceAreaRef.current = ent?.serviceArea;  // cập nhật ref
          enterpriseNameRef.current = ent?.name; // lưu tên doanh nghiệp để filter tài xế
        } catch { /* no enterprise */ }
      }
      fetchPending();
      fetchCollectors();
    };
    init();
    // interval luôn đọc serviceAreaRef.current — không bị stale closure
    const interval = setInterval(() => {
      fetchPending();
      fetchCollectors();
    }, 10000);
    return () => clearInterval(interval);
  }, [user?.userId]);

  const handleAssign = async (reqId: string, collectorId: string) => {
    if (!collectorId) return;
    const targetReq = requests.find(r => r.id === reqId);
    const citizenId = targetReq?.citizenId;

    try {
      setAssigningId(reqId);
      setAssignMsg(null);

      await collectionApi.assignTask({ requestId: reqId, collectorId });

      setAssignMsg({ type: 'success', text: '✅ Đã gán nhiệm vụ thành công!' });
      setTimeout(() => setAssignMsg(null), 3000);
      fetchPending();

      // Gửi thông báo cho cả hai bên
      if (citizenId) {
        notificationApi.create({
          userId: citizenId,
          title: 'Rác của bạn sắp được thu gom! 🚛',
          message: `Đơn (ID: ${reqId.substring(0,8)}) đã được giao cho tài xế.`,
          type: 'COLLECTION',
          isRead: false
        }).catch(console.warn);
      }
      notificationApi.create({
        userId: collectorId,
        title: 'Bạn có nhiệm vụ thu gom mới! 🚛',
        message: `Đơn thu gom (ID: ${reqId.substring(0,8)}) vừa được phân công cho bạn.`,
        type: 'SYSTEM',
        isRead: false
      }).catch(console.warn);

    } catch (e: any) {
      console.error('Lỗi gán nhiệm vụ:', e);
      const msg = e?.response?.data?.message || e?.message || 'Gán thất bại';
      setAssignMsg({ type: 'error', text: `❌ ${msg}` });
      setTimeout(() => setAssignMsg(null), 5000);
    } finally {
      setAssigningId(null);
    }
  };
  const handleReject = async (reqId: string, citizenId: string) => {
    // Đánh dấu ngay vào ref — interval fetch sau này cũng sẽ lọc ra
    rejectedIdsRef.current.add(reqId);
    // Xóa khỏi UI ngay lập tức
    setRequests(prev => prev.filter(r => r.id !== reqId));
    try {
      await collectionApi.rejectRequest(reqId);
      setAssignMsg({ type: 'success', text: '✅ Đã từ chối đơn' });
      setTimeout(() => setAssignMsg(null), 3000);
      if (citizenId) {
        notificationApi.create({
          userId: citizenId,
          title: 'Đơn thu gom bị từ chối ❌',
          message: `Đơn (ID: ${reqId.substring(0,8)}) không phù hợp với khu vực phục vụ.`,
          type: 'SYSTEM',
          isRead: false
        }).catch(console.warn);
      }
    } catch (e) {
      // Nếu API thất bại, xóa khỏi ref và restore lại UI bằng cách fetch mới
      rejectedIdsRef.current.delete(reqId);
      setAssignMsg({ type: 'error', text: '❌ Không thể từ chối đơn' });
      setTimeout(() => setAssignMsg(null), 3000);
    }
  };

  const handleDragStart = (e: React.DragEvent, collectorId: string) => {
    e.dataTransfer.setData('collectorId', collectorId);
  };

  const handleDropOnRequest = (e: React.DragEvent, reqId: string) => {
    e.preventDefault();
    const collectorId = e.dataTransfer.getData('collectorId');
    if (collectorId) {
      handleAssign(reqId, collectorId);
    }
  };

  return (
    <div style={{ display: 'flex', gap: 24, height: 'calc(100vh - 120px)' }}>

      {/* Map Section */}
      <div style={{ flex: 1, position: 'relative', borderRadius: 20, overflow: 'hidden', border: '1px solid var(--border)' }}>
      {/* Assign status toast */}
        {assignMsg && (
          <div style={{
            position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 1000,
            background: assignMsg.type === 'success' ? 'rgba(16,185,129,0.95)' : 'rgba(239,68,68,0.95)',
            color: 'white', padding: '10px 20px', borderRadius: 20, fontWeight: 600, fontSize: 14,
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)', whiteSpace: 'nowrap'
          }}>
            {assignMsg.text}
          </div>
        )}

        <MapContainer center={[10.823, 106.629]} zoom={14} style={{ height: '100%', width: '100%' }}>
          {/* OpenStreetMap standard tiles — chi tiết hơn CARTO, phủ đường nhỏ VN */}
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            maxZoom={19}
          />

          {/* Legend overlay */}
          <div style={{
            position: 'absolute', bottom: 24, left: 12, zIndex: 1000,
            background: 'rgba(15,23,42,0.9)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
            padding: '10px 14px', fontSize: 12, color: '#f1f5f2', display: 'flex', flexDirection: 'column', gap: 6
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png" style={{ height: 20, objectFit: 'contain' }} />
              <span>Đơn chờ thu gom ({requests.length})</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png" style={{ height: 20, objectFit: 'contain' }} />
              <span>Tài xế ({collectors.filter(c => c.status === 'Sẵn sàng').length} sẵn sàng)</span>
            </div>
          </div>

          {/* Render Collectors (Green) */}
          {collectors.map(col => (
            <Marker key={col.id} position={col.coords as any} icon={greenIcon}>
              <Popup>
                <div style={{ padding: 6, minWidth: 200 }}>
                  <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 6 }}>🚛 {col.name}</div>
                  {col.vehiclePlate && <div style={{ fontSize: 12, color: '#555', marginBottom: 4 }}>🚗 Biển số: <b>{col.vehiclePlate}</b></div>}
                  <div style={{ fontSize: 12, color: '#555', marginBottom: 4 }}>
                    📍 Tọa độ: <code style={{ background: '#f3f4f6', padding: '1px 4px', borderRadius: 4 }}>{col.coords[0].toFixed(5)}, {col.coords[1].toFixed(5)}</code>
                  </div>
                  <div style={{ color: col.status === 'Sẵn sàng' ? '#059669' : '#d97706', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                    ● {col.status}
                  </div>
                  <a
                    href={`https://www.google.com/maps?q=${col.coords[0]},${col.coords[1]}`}
                    target="_blank" rel="noreferrer"
                    style={{ display: 'block', textAlign: 'center', background: '#4285f4', color: 'white', padding: '6px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}
                  >
                    🗺️ Xem trên Google Maps
                  </a>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Render Pending Requests (Red) */}
          {requests.map(req => {
            if (!req.location) return null;
            const parts = req.location.split(',').map((s: string) => parseFloat(s.trim()));
            if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) return null;
            const [lat, lng] = parts;
            return (
              <Marker key={req.id} position={[lat, lng]} icon={redIcon}>
                <Popup>
                  <div style={{ padding: 8, minWidth: 220 }}>
                    <div style={{ fontWeight: 800, color: '#dc2626', marginBottom: 6, fontSize: 15 }}>
                      🗑️ Đơn thu gom #{req.id.substring(0, 8)}
                    </div>
                    <div style={{ fontSize: 13, marginBottom: 4 }}><b>Loại rác:</b> {WASTE_TYPE_MAP[req.type] || req.type}</div>
                    <div style={{ fontSize: 12, color: '#555', marginBottom: 4 }}>
                      📍 Tọa độ: <code style={{ background: '#f3f4f6', padding: '1px 4px', borderRadius: 4 }}>{lat.toFixed(5)}, {lng.toFixed(5)}</code>
                    </div>
                    {req.description && (
                      <div style={{ fontSize: 12, color: '#666', marginBottom: 4, fontStyle: 'italic' }}>📝 {req.description}</div>
                    )}
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`}
                      target="_blank" rel="noreferrer"
                      style={{ display: 'block', textAlign: 'center', background: '#dc2626', color: 'white', padding: '6px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: 'none', marginBottom: 10 }}
                    >
                      🚗 Chỉ đường đến đây
                    </a>
                    <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>Gán tài xế:</div>
                    <select
                      defaultValue=""
                      onChange={(e) => { if (e.target.value) handleAssign(req.id, e.target.value); }}
                      disabled={assigningId === req.id}
                      style={{ width: '100%', padding: '6px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13 }}
                    >
                      <option value="">-- Chọn tài xế --</option>
                      {collectors.filter(c => c.status === 'Sẵn sàng').map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleReject(req.id, req.citizenId)}
                      style={{ marginTop: 8, width: '100%', padding: '6px', background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                    >
                      ❌ Từ chối đơn này
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Sidebar Task Management */}
      <div style={{ width: 340, display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 18, color: 'var(--text)' }}>
            🚚 Các tài xế đang hoạt động
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
            Danh sách các tài xế hiện đang làm việc trên hệ thống. Trạng thái của họ sẽ được cập nhật theo thời gian thực.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {collectors.map(col => (
              <div 
                key={col.id} 
                style={{ 
                  padding: '14px 16px', borderRadius: 12, border: '1px solid var(--border)',
                  background: 'rgba(255,255,255,0.02)',
                  opacity: col.status === 'Sẵn sàng' ? 1 : 0.6,
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: 15 }}>{col.name}</span>
                  <span style={{ 
                    fontSize: 11, padding: '2px 8px', borderRadius: 10, fontWeight: 700,
                    background: col.status === 'Sẵn sàng' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                    color: col.status === 'Sẵn sàng' ? '#10b981' : '#f59e0b'
                  }}>
                    {col.status}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  ID: {col.id} · Vị trí: {col.coords.join(', ')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Danh sách yêu cầu Pending */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 18, color: 'var(--text)' }}>
             📋 Đơn chờ phân công
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
            {requests.length === 0 ? 'Không có đơn nào trong khu vực.' : `Có ${requests.length} yêu cầu cần được điều phối`}
            {enterprise?.serviceArea && (
              <span style={{ display: 'block', marginTop: 6, color: '#34d399', fontWeight: 700 }}>
                📍 Khu vực: {enterprise.serviceArea}
              </span>
            )}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {requests.map(req => (
              <div 
                key={req.id} 
                onDragOver={e => e.preventDefault()}
                onDrop={e => handleDropOnRequest(e, req.id)}
                style={{
                  padding: '14px 16px', borderRadius: 12, border: '1px solid var(--border)',
                  background: 'rgba(239, 68, 68, 0.05)', borderLeft: '4px solid #ef4444',
                  transition: 'all 0.2s',
                }}
                onDragEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'; }}
                onDragLeave={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{WASTE_TYPE_MAP[req.type] || req.type}</span>
                  <span style={{ fontSize: 11, color: '#ef4444', fontWeight: 600 }}>CHỜ GÁN</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, wordBreak: 'break-all' }}>
                  <b>ID:</b> {req.id.substring(0, 8)}<br/>
                  <b>📍</b> {req.location}
                </div>
                <select 
                  onChange={(e) => {
                    if(e.target.value) handleAssign(req.id, e.target.value);
                  }}
                  disabled={assigningId === req.id}
                  style={{ width: '100%', padding: '6px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--green-400)', fontSize: 12, fontWeight: 600, outline: 'none' }}
                >
                  <option value="">-- Chọn tài xế để gán --</option>
                  {collectors.filter(c => c.status === 'Sẵn sàng').map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

      </div>
      
    </div>
  );
};

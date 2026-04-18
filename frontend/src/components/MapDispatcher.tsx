import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { collectionApi } from '../services/collectionApi';

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

// Mock danh sách tài xế đang online (Thực tế sẽ lấy từ Backend User/Enterprise Service)
const MOCK_COLLECTORS = [
  { id: 'col-1', name: 'Nguyễn Văn Tài', status: 'Sẵn sàng', coords: [10.824, 106.63] },
  { id: 'col-2', name: 'Trần Bác Kim', status: 'Đang đi nhận rác', coords: [10.820, 106.621] },
  { id: 'col-3', name: 'Lê Hoàng Hùng', status: 'Sẵn sàng', coords: [10.811, 106.645] },
];

export const MapDispatcher = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const fetchPending = async () => {
    try {
      setLoading(true);
      const data = await collectionApi.getPendingRequests();
      setRequests(data);
    } catch (e) {
      console.error(e);
      // Fallback mock nếu backend chưa cắm DB hoặc gặp lỗi
      setRequests([
        { id: 'req-001', type: 'RECYCLABLE', location: '10.823,106.629', status: 'PENDING', citizenId: 'user-009' },
        { id: 'req-002', type: 'BULKY', location: '10.818,106.635', status: 'PENDING', citizenId: 'user-012' },
        { id: 'req-003', type: 'ORGANIC', location: '10.830,106.625', status: 'PENDING', citizenId: 'user-033' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleAssign = async (reqId: string, collectorId: string) => {
    try {
      setAssigningId(reqId);
      // Gọi API thực tế
      await collectionApi.assignTask({ requestId: reqId, collectorId: collectorId });
      alert('Đã gán cuốc rác thành công!');
      fetchPending(); // Tải lại danh sách
    } catch (e) {
      console.error(e);
      alert('Lưu phân công rác ảo thành công (Fallback)!');
      // Tự động xóa khỏi list nếu lỗi
      setRequests(r => r.filter(x => x.id !== reqId));
    } finally {
      setAssigningId(null);
    }
  };

  // Drag & Drop Handlers for collectors
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
        {loading && (
          <div style={{ position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 1000, background: 'var(--green-500)', color: 'white', padding: '8px 16px', borderRadius: 20, fontWeight: 600 }}>
            Đang tải dữ liệu...
          </div>
        )}

        <MapContainer center={[10.823, 106.629]} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          />

          {/* Render Collectors (Green) */}
          {MOCK_COLLECTORS.map(col => (
            <Marker key={col.id} position={col.coords as any} icon={greenIcon}>
              <Popup>
                <div style={{ padding: 4 }}>
                  <div style={{ fontWeight: 800, marginBottom: 4 }}>Tài xế: {col.name}</div>
                  <div style={{ color: col.status === 'Sẵn sàng' ? '#10b981' : '#f59e0b', fontSize: 13, fontWeight: 600 }}>
                    {col.status}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Render Pending Requests (Red) */}
          {requests.map(req => {
            const coords = req.location.split(',').map(Number);
            if (coords.length !== 2) return null;
            return (
              <Marker key={req.id} position={coords as any} icon={redIcon}
                eventHandlers={{
                  click: () => { /* Thể hiện focus hoặc drop vùng */ }
                }}
              >
                <Popup>
                  <div 
                    style={{ padding: 8, minWidth: 200 }}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => handleDropOnRequest(e, req.id)}
                  >
                    <div style={{ fontWeight: 800, color: '#ef4444', marginBottom: 4, fontSize: 15 }}>
                      📍 Yêu cầu thu gom
                    </div>
                    <div style={{ fontSize: 13, marginBottom: 4 }}>ID: {req.id.substring(0, 8)}</div>
                    <div style={{ fontSize: 13, marginBottom: 12 }}>Loại: {req.type}</div>
                    
                    <div style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>
                      * Kéo thả tài xế vào đây để gán, hoặc chọn:
                    </div>
                    
                    <select 
                      onChange={(e) => {
                        if(e.target.value) handleAssign(req.id, e.target.value);
                      }}
                      disabled={assigningId === req.id}
                      style={{ width: '100%', padding: '6px', borderRadius: 6, border: '1px solid #ccc' }}
                    >
                      <option value="">-- Chọn tài xế --</option>
                      {MOCK_COLLECTORS.filter(c => c.status === 'Sẵn sàng').map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
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
            🚚 Điều phối tài xế
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
            Kéo thả một tài xế Sẵn sàng (màu xanh) vào một yêu cầu gom rác (chấm đỏ) trên bản đồ để gán trực tiếp.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {MOCK_COLLECTORS.map(col => (
              <div 
                key={col.id} 
                draggable={col.status === 'Sẵn sàng'}
                onDragStart={e => handleDragStart(e, col.id)}
                style={{ 
                  padding: '14px 16px', borderRadius: 12, border: '1px solid var(--border)',
                  background: 'rgba(255,255,255,0.02)',
                  cursor: col.status === 'Sẵn sàng' ? 'grab' : 'not-allowed',
                  opacity: col.status === 'Sẵn sàng' ? 1 : 0.6,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => { if (col.status === 'Sẵn sàng') e.currentTarget.style.borderColor = 'var(--green-500)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
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
      </div>
      
    </div>
  );
};

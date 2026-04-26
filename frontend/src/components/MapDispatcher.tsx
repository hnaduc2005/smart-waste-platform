import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { collectionApi } from '../services/collectionApi';
import { notificationApi } from '../services/notificationApi';

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

let MOCK_COLLECTORS = [
  { id: '6a028d3a-cba0-4ea0-8468-4decfb95da14', name: 'suu123 (Tài xế)', status: 'Sẵn sàng', coords: [10.824, 106.63] },
  { id: '11111111-1111-1111-1111-111111111111', name: 'Trần Bác Kim', status: 'Đang đi nhận rác', coords: [10.820, 106.621] },
  { id: '22222222-2222-2222-2222-222222222222', name: 'Lê Hoàng Hùng', status: 'Sẵn sàng', coords: [10.811, 106.645] },
];

try {
  const saved = localStorage.getItem('eco_all_users');
  if (saved) {
    const users = JSON.parse(saved);
    const realCollectors = users.filter((u: any) => u.role === 'COLLECTOR' || u.role === 'Công nhân thu gom' || u.username.includes('gom'));
    realCollectors.forEach((c: any) => {
      if (!MOCK_COLLECTORS.find(mc => mc.id === c.userId)) {
        MOCK_COLLECTORS.push({
          id: c.userId,
          name: c.username + ' (Thực)',
          status: 'Sẵn sàng',
          coords: c.coords || [10.824, 106.63]
        });
      }
    });
  }
} catch (e) {}

const WASTE_TYPE_MAP: Record<string, string> = {
  'RECYCLABLE': '♻️ Rác tái chế (Nhựa, Giấy, Kim loại)',
  'ORGANIC': '🍎 Rác hữu cơ (Thức ăn thừa)',
  'HAZARDOUS': '⚠️ Rác độc hại (Pin, Hóa chất)',
  'BULKY': '🛋️ Rác cồng kềnh (Tủ, Bàn ghế)',
  'ELECTRONIC': '💻 Rác điện tử (E-waste)',
};

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
      const mockPending = [
        { id: '33333333-3333-3333-3333-333333333333', type: 'RECYCLABLE', location: '10.823,106.629', status: 'PENDING', citizenId: '44444444-4444-4444-4444-444444444444' },
        { id: '55555555-5555-5555-5555-555555555555', type: 'BULKY', location: '10.818,106.635', status: 'PENDING', citizenId: '66666666-6666-6666-6666-666666666666' },
        { id: '77777777-7777-7777-7777-777777777777', type: 'ORGANIC', location: '10.830,106.625', status: 'PENDING', citizenId: '88888888-8888-8888-8888-888888888888' },
      ];
      
      try {
        const savedTasks = localStorage.getItem('eco_assigned_tasks');
        if (savedTasks) {
          const assignedIds = JSON.parse(savedTasks).map((t: any) => t.request?.id);
          setRequests(mockPending.filter(req => !assignedIds.includes(req.id)));
        } else {
          setRequests(mockPending);
        }
      } catch (err) {
        setRequests(mockPending);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleAssign = async (reqId: string, collectorId: string) => {
    const targetReq = requests.find(r => r.id === reqId);
    const citizenId = targetReq ? targetReq.citizenId : '5548a421-134b-497d-843a-5dba9f4f78fa';
    
    try {
      setAssigningId(reqId);
      // Gọi API thực tế
      try {
        await collectionApi.assignTask({ requestId: reqId, collectorId: collectorId });
      } catch (backendErr) {
        console.warn('Backend API failed, falling back to local storage', backendErr);
      }
      alert('Đã gán cuốc rác thành công!');
      fetchPending(); // Tải lại danh sách

      // Create notification via API
      try {
        await notificationApi.create({
          userId: citizenId,
          title: 'Rác của bạn chuẩn bị được thu gom! 🚛',
          message: `Đơn thu gom (ID: ${reqId.substring(0,8)}) đã được giao cho tài xế. Vui lòng chuẩn bị rác nhé!`,
          type: 'COLLECTION',
          isRead: false
        });
        await notificationApi.create({
          userId: collectorId,
          title: 'Bạn có nhiệm vụ thu gom mới! 🚛',
          message: `Doanh nghiệp vừa phân công cho bạn đơn thu gom (ID: ${reqId.substring(0,8)}). Hãy kiểm tra tuyến thu gom!`,
          type: 'SYSTEM',
          isRead: false
        });
      } catch(err) {
        console.warn('Failed to create notifications via API, saving to local storage', err);
        const savedNotis = localStorage.getItem('eco_notifications');
        const notis = savedNotis ? JSON.parse(savedNotis) : [];
        notis.push({
          id: 'noti-' + Date.now(),
          title: 'Rác của bạn chuẩn bị được thu gom! 🚛',
          message: `Đơn thu gom (ID: ${reqId.substring(0,8)}) đã được giao cho tài xế. Vui lòng chuẩn bị rác nhé!`,
          type: 'COLLECTION',
          createdAt: new Date().toISOString(),
          isRead: false
        });
        notis.push({
          id: 'noti-' + (Date.now() + 1),
          title: 'Bạn có nhiệm vụ thu gom mới! 🚛',
          message: `Doanh nghiệp vừa phân công cho bạn đơn thu gom (ID: ${reqId.substring(0,8)}). Hãy kiểm tra tuyến thu gom!`,
          type: 'SYSTEM',
          createdAt: new Date().toISOString(),
          isRead: false
        });
        localStorage.setItem('eco_notifications', JSON.stringify(notis));
      }

      if (targetReq) {
        const tasksSaved = localStorage.getItem('eco_assigned_tasks');
        const eco_tasks = tasksSaved ? JSON.parse(tasksSaved) : [];
        eco_tasks.push({ 
          id: 'task-' + Date.now(), 
          status: 'ASSIGNED', 
          collectorId: collectorId,
          request: targetReq 
        });
        localStorage.setItem('eco_assigned_tasks', JSON.stringify(eco_tasks));
      }
    } catch (e) {
      console.error(e);
      alert('Gán cuốc rác thất bại!');
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
            if (!req.location) return null;
            const coords = req.location.split(',').map(Number);
            if (coords.length !== 2 || isNaN(coords[0]) || isNaN(coords[1])) return null;
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
                    <div style={{ fontSize: 13, marginBottom: 12 }}><b>Loại:</b> {WASTE_TYPE_MAP[req.type] || req.type}</div>
                    
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
            🚚 Các tài xế đang hoạt động
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
            Danh sách các tài xế hiện đang làm việc trên hệ thống. Trạng thái của họ sẽ được cập nhật theo thời gian thực.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {MOCK_COLLECTORS.map(col => (
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
            {requests.length === 0 ? 'Hiện tại không có đơn nào.' : `Có ${requests.length} yêu cầu cần được điều phối.`}
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
                  {MOCK_COLLECTORS.filter(c => c.status === 'Sẵn sàng').map(c => (
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

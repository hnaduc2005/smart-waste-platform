import React, { useState, useEffect } from 'react';

export default function MapDispatcher() {
  const [trashItems, setTrashItems] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [toastMessage, setToastMessage] = useState('');
  const [loading, setLoading] = useState(true);

  // Hook Liên Kết Microservices Khối 3 (Collection) và Khối 2 (Waste Report)
  useEffect(() => {
    // Gọi API sang Khối 3 để lấy toạ độ rác và xe hiện tại đang chạy trên đường
    fetch('http://localhost:8083/api/v1/collection/live-map')
      .then(res => {
        if (!res.ok) throw new Error("Chưa bật Backend Khối 3!");
        return res.json();
      })
      .then(data => {
        setTrashItems(data.trashItems || []);
        setVehicles(data.vehicles || []);
        setLoading(false);
      })
      .catch(err => {
        console.warn("Lỗi chưa chạy Service Khối 3:", err);
        setTrashItems([]);
        setVehicles([]);
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <div className="text-purple-400 flex flex-col items-center">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        Đang quét định vị vệ tinh GPS Mạng lưới Rác từ Khối 2 & 3...
      </div>
    </div>
  );

  // Khi bắt đầu kéo Rác
  const handleDragStart = (e: React.DragEvent, id: number) => {
    e.dataTransfer.setData('trashId', id.toString());
  };

  // Cho phép thả đè lên Xe Rác
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Khi thả Rác vảo Xe
  const handleDrop = (e: React.DragEvent, vehicleId: string) => {
    e.preventDefault();
    const trashId = parseInt(e.dataTransfer.getData('trashId'));

    // Cập nhật trạng thái Rác thành ASSIGNED (đã được giao)
    setTrashItems(items =>
      items.map(item =>
        item.id === trashId ? { ...item, status: 'ASSIGNED' } : item
      )
    );

    // Kích hoạt thông báo "Đã điều phối"
    setToastMessage(`Đã giao thành công một đơn rác cho Xe: ${vehicleId}`);
    setTimeout(() => setToastMessage(''), 3000);

    // TODO: Ở đây gọi API bắn lên Khối 3: POST /api/v1/collection/assign
  };

  const pendingTrashCount = trashItems.filter(t => t.status === 'PENDING').length;

  return (
    <div className="h-full flex flex-col relative z-10">

      {/* Toast Notification (Sẽ hiện ra khi kéo thả thành công) */}
      {toastMessage && (
        <div className="absolute top-0 right-0 mt-4 mr-4 bg-green-500/90 text-white px-4 py-3 rounded-xl shadow-lg shadow-green-500/20 backdrop-blur-md z-50 flex items-center space-x-2 animate-bounce">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          <span className="font-medium tracking-wide">{toastMessage}</span>
        </div>
      )}

      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Bản Đồ Điều Phối Rác</h1>
          <p className="text-gray-400">Kéo thả các điểm rác nhấp nháy tới vạch Xe Rác để phân luồng tự động.</p>
        </div>
        <div className="flex space-x-3">
          <div className="px-4 py-2 bg-[#161720]/80 border border-white/10 rounded-lg flex items-center space-x-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
            <span className="text-sm font-medium text-gray-300">{pendingTrashCount} Điểm Cần Gom</span>
          </div>
          <div className="px-4 py-2 bg-[#161720]/80 border border-white/10 rounded-lg flex items-center space-x-2">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>
            <span className="text-sm font-medium text-gray-300">{vehicles.length} Xe Đang Rảnh</span>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 bg-[#161720]/40 backdrop-blur-sm border border-white/10 rounded-3xl relative overflow-hidden group">

        {/* Lưới giả lập 3D map */}
        <div className="absolute inset-0 border-[0.5px] border-purple-500/10 grid grid-cols-[repeat(12,minmax(0,1fr))] grid-rows-[repeat(12,minmax(0,1fr))]">
          {Array(144).fill(0).map((_, i) => (
            <div key={i} className="border-[0.5px] border-white/5"></div>
          ))}
        </div>

        {/* Cụm radar giữa bản đồ */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-[400px] h-[400px] rounded-full border border-green-500/10 animate-[spin_10s_linear_infinite] pointer-events-none transition-colors flex items-center justify-center">
            <div className="w-1/2 h-px bg-gradient-to-r from-transparent via-green-500/50 to-green-500 absolute top-1/2 right-0 origin-left"></div>
          </div>
        </div>

        {/* Vòng lặp Render các Cụm Rác */}
        {trashItems.map((trash) => {
          if (trash.status !== 'PENDING') return null; // Nếu đã bị gom thì ẩn đi

          return (
            <div
              key={trash.id}
              draggable
              onDragStart={(e) => handleDragStart(e, trash.id)}
              className="absolute cursor-grab active:cursor-grabbing hover:scale-110 transition-transform z-20"
              style={{ top: trash.top, left: trash.left }}
            >
              <div className="w-6 h-6 rounded-full bg-red-500 relative flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,1)]">
                <div className="absolute -inset-2 rounded-full border border-red-500/50 animate-ping"></div>
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </div>
              <div className="absolute mt-2 -ml-8 bg-[#0a0a0e]/90 text-xs px-2 py-1 rounded border border-red-500/50 text-red-200 whitespace-nowrap backdrop-blur-md">
                {trash.type} ({trash.weight}kg)
              </div>
            </div>
          );
        })}

        {/* Vòng lặp Render Xe Rác */}
        {vehicles.map((vehicle) => (
          <div
            key={vehicle.id}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, vehicle.id)}
            className="absolute hover:scale-110 transition-transform z-10 w-24 h-24 -ml-12 -mt-12 flex items-center justify-center"
            style={{ top: vehicle.top, left: vehicle.left }}
          >
            {/* Vùng nhận thả rộng hơn (w-24 h-24) để dễ thả đè */}
            <div className="relative">
              <div className="w-8 h-8 rounded-xl bg-green-500 relative flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.8)] z-10">
                <div className="absolute -inset-3 rounded-xl bg-green-500/20 animate-pulse"></div>
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" /></svg>
              </div>
              <div className="absolute top-10 left-1/2 transform -translate-x-1/2 text-center pointer-events-none">
                <div className="bg-[#0a0a0e]/90 text-xs px-2 py-1 rounded border border-green-500/50 text-green-200 inline-block backdrop-blur-md">Xe: {vehicle.id}</div>
                <div className="text-[10px] text-gray-400 font-mono mt-0.5">TL: {vehicle.capacity}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

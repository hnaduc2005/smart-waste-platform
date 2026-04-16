import { useState, useEffect } from 'react';

export default function Fleet() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Hook gọi API lấy dữ liệu thực từ Hệ Thống lúc Load trang
  useEffect(() => {
    // Gọi THẲNG API tới Backend Khối 5 
    fetch('http://localhost:8085/api/v1/vehicles')
      .then(res => {
         if (!res.ok) throw new Error("Chưa bật Backend Java port 8085!");
         return res.json();
      })
      .then(data => {
         // Đổ dữ liệu thật từ Backend vào UI
         // Do entity Vehicle.java đang trả về danh sách xe, mình hứng vào đây
         setVehicles(data);
         setLoading(false);
      })
      .catch(err => {
         console.warn("Lỗi chưa thấy Service Khối 5:", err);
         // Không có backend thì không hiện xe nào cả (Không hard-code)
         setVehicles([]);
         setLoading(false);
      });
  }, []);

  if (loading) return (
    <div className="h-full flex flex-col space-y-6 justify-center items-center">
        <div className="text-purple-400 flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          Đồng bộ hoá Tọa độ và Thông tin phương tiện từ Khối 3...
        </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col space-y-6 relative z-10">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Quản Lý Đội Xe (Enterprise Fleet)</h1>
          <p className="text-gray-400">Điều hành và giám sát xe tải chuyên chở rác của công ty bạn.</p>
        </div>
        <button className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-purple-500/25 flex items-center space-x-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
          <span>Đăng ký Xe Mới</span>
        </button>
      </div>

      <div className="flex-1 bg-[#161720]/80 backdrop-blur-md border border-white/5 rounded-3xl overflow-hidden relative">
        {/* Table Header */}
        <div className="grid grid-cols-5 px-8 py-4 bg-white/5 border-b border-white/5 text-xs font-semibold text-gray-400 tracking-wider uppercase">
          <div>Biển số / Mã Xe</div>
          <div>Loại Phương Tiện</div>
          <div>Tải Trọng</div>
          <div>Người Lái / Phụ Trách</div>
          <div>Trạng Thái</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-white/5">
          {vehicles.map((v, index) => (
            <div key={index} className="grid grid-cols-5 px-8 py-5 items-center hover:bg-white/[0.02] transition-colors group">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center p-2">
                   <svg className="w-full h-full text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" /></svg>
                </div>
                <span className="font-bold text-white tracking-wide">{v.id}</span>
              </div>
              <div className="text-gray-300">{v.type}</div>
              <div className="text-gray-300 font-mono">{v.capacity}</div>
              <div className="text-gray-400">{v.driver}</div>
              <div>
                {v.status === 'AVAILABLE' && <span className="px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full text-xs font-semibold">SẴN SÀNG</span>}
                {v.status === 'ON_DUTY' && <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-xs font-semibold">ĐANG CHỞ RÁC</span>}
                {v.status === 'MAINTENANCE' && <span className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-xs font-semibold">BẢO TRÌ</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

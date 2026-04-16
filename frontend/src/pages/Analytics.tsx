import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

export default function Analytics() {
  const [dataWeekly, setDataWeekly] = useState<any[]>([]);
  const [dataDistricts, setDataDistricts] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({ totalVolume: 0, recycleRate: 0, reportCount: 0 });
  const [loading, setLoading] = useState(true);

  // Hook lấy dữ liệu Động (Dynamic) từ Backend Enterprise/Analytics service (Khối 5 kết nối các khối khác)
  useEffect(() => {
    // Gọi THẲNG API tới Backend của Khối 5 (Service đang xử lý việc tính toán số liệu Thống kê)
    fetch('http://localhost:8086/api/v1/analytics/dashboard')
      .then(res => {
         if (!res.ok) throw new Error("Chưa bật Backend Java port 8086!");
         return res.json();
      })
      .then(data => {
         setDataWeekly(data.weekly || []);
         setDataDistricts(data.districts || []);
         setMetrics(data.metrics || { totalVolume: 0, recycleRate: 0, reportCount: 0 });
         setLoading(false);
      })
      .catch(err => {
         console.warn("Lỗi chưa thấy Service:", err);
         setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-purple-400 flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          Đang tổng hợp dữ liệu từ Hệ thống...
        </div>
      </div>
    );
  }
  return (
    <div className="h-full flex flex-col space-y-6 overflow-auto pr-2 pb-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Thống Kê Tổng Hợp (Analytics)</h1>
          <p className="text-gray-400">Giám sát Real-time hiệu năng thu gom & tái chế rác toàn hệ thống.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#161720]/80 p-6 rounded-3xl border border-white/5 backdrop-blur-md relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-[50px] -mr-10 -mt-10 group-hover:bg-purple-500/20 transition-all"></div>
          <p className="text-gray-400 text-sm tracking-wide font-medium">TỔNG KHỐI LƯỢNG RÁC (TUẦN)</p>
          <div className="mt-4 flex items-end space-x-4">
             <h2 className="text-4xl font-bold text-white">{metrics.totalVolume}<span className="text-xl text-gray-500"> Tấn</span></h2>
             <span className="text-green-400 text-sm mb-1 flex items-center bg-green-400/10 px-2 py-1 rounded-full border border-green-400/20">
               +12% <svg className="w-3 h-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
             </span>
          </div>
        </div>

        <div className="bg-[#161720]/80 p-6 rounded-3xl border border-white/5 backdrop-blur-md relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-[50px] -mr-10 -mt-10 group-hover:bg-green-500/20 transition-all"></div>
          <p className="text-gray-400 text-sm tracking-wide font-medium">TỈ LỆ RÁC TÁI CHẾ (RECYCLE)</p>
          <div className="mt-4 flex items-end space-x-4">
             <h2 className="text-4xl font-bold text-white">{metrics.recycleRate}<span className="text-xl text-gray-500">%</span></h2>
             <span className="text-purple-400 text-sm mb-1 flex items-center bg-purple-400/10 px-2 py-1 rounded-full border border-purple-400/20">
               +5% <svg className="w-3 h-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
             </span>
          </div>
        </div>

        <div className="bg-[#161720]/80 p-6 rounded-3xl border border-white/5 backdrop-blur-md relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[50px] -mr-10 -mt-10 group-hover:bg-blue-500/20 transition-all"></div>
          <p className="text-gray-400 text-sm tracking-wide font-medium">BÁO CÁO TỪ NGƯỜI DÂN</p>
          <div className="mt-4 flex items-end space-x-4">
             <h2 className="text-4xl font-bold text-white">{metrics.reportCount}<span className="text-xl text-gray-500"> Reports</span></h2>
             <span className="text-red-400 text-sm mb-1 flex items-center bg-red-400/10 px-2 py-1 rounded-full border border-red-400/20">
               -2% <svg className="w-3 h-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
             </span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[400px]">
        {/* Biểu đồ phân lượng Rác hàng ngày */}
        <div className="bg-[#161720]/80 p-6 rounded-3xl border border-white/5 backdrop-blur-md flex flex-col">
          <h3 className="text-lg font-bold text-white mb-6">Lưu lượng Thu Gom 7 Ngày Qua (kg)</h3>
          <div className="flex-1 w-full h-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dataWeekly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorOrganic" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRecycle" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value/1000}T`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2028', borderColor: '#2e303a', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="organic" name="Rác Hữu cơ" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorOrganic)" />
                <Area type="monotone" dataKey="recycle" name="Rác Tái chế" stroke="#a855f7" strokeWidth={3} fillOpacity={1} fill="url(#colorRecycle)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Biểu đồ theo Quận */}
        <div className="bg-[#161720]/80 p-6 rounded-3xl border border-white/5 backdrop-blur-md flex flex-col">
          <h3 className="text-lg font-bold text-white mb-6">Thống Kê Khối Lượng Theo Khu Vực (kg)</h3>
          <div className="flex-1 w-full h-full min-h-0">
             <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataDistricts} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value/1000}T`} />
                <Tooltip 
                  cursor={{fill: '#ffffff05'}}
                  contentStyle={{ backgroundColor: '#1f2028', borderColor: '#2e303a', borderRadius: '12px', color: '#fff' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }}/>
                <Bar dataKey="total" name="Tổng Lượng Rác" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

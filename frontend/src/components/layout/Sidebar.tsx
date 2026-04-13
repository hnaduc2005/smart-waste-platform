import React from 'react';

export default function Sidebar({ currentPage, onNavigate }: any) {
  const menuItems = [
    { id: 'map', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7', label: 'Bản Đồ Điều Phối' },
    { id: 'analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', label: 'Thống Kê Khối Lượng' },
    { id: 'fleet', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4', label: 'Đội Xe Công Ty' }
  ];

  return (
    <aside className="w-72 bg-[#161720]/95 backdrop-blur-3xl border-r border-white/5 flex flex-col z-20">
      <div className="h-20 flex items-center px-8 border-b border-white/5">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-green-400 to-blue-500 p-[1px] shadow-lg shadow-green-500/20">
            <div className="w-full h-full bg-[#161720] rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-transparent bg-clip-text bg-gradient-to-tr from-green-400 to-blue-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Eco<span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">Cycle</span></span>
        </div>
      </div>

      <nav className="flex-1 px-4 py-8 space-y-2">
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center space-x-4 px-4 py-3.5 rounded-xl transition-all duration-300 group
              ${currentPage === item.id 
                ? 'bg-white/10 text-white shadow-lg border border-white/10' 
                : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}`}
          >
            <div className={`${currentPage === item.id ? 'text-purple-400' : 'text-gray-500 group-hover:text-gray-400'}`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>
            </div>
            <span className="font-medium tracking-wide">{item.label}</span>
            {currentPage === item.id && (
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.8)]"></div>
            )}
          </button>
        ))}
      </nav>

      <div className="p-6">
        <div className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 border border-purple-500/20 p-5 rounded-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <h4 className="text-sm font-semibold text-white mb-1 relative z-10">Bạn cần hỗ trợ?</h4>
          <p className="text-xs text-gray-400 mb-4 relative z-10">Hệ thống AI phân phối luôn sẵn sàng.</p>
          <button className="w-full py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-lg transition-colors border border-white/10 relative z-10">Liên hệ AI</button>
        </div>
      </div>
    </aside>
  );
}

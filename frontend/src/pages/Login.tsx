 

export default function Login({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="min-h-screen bg-[#0a0a0e] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/30 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/30 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md bg-[#161720]/80 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl z-10">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-green-500/20">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">EcoCycle</h1>
          <p className="text-gray-400 mt-2 text-sm">Enterprise Management & Analytics Terminal</p>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Trạm quản lý (Email/Username)</label>
            <input 
              type="text" 
              className="w-full px-4 py-3 bg-[#0a0a0e]/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
              placeholder="admin@ecocycle.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Mã bảo mật</label>
            <input 
              type="password" 
              className="w-full px-4 py-3 bg-[#0a0a0e]/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
              placeholder="••••••••"
            />
          </div>
          <button 
            onClick={onLogin}
            className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-medium rounded-xl shadow-lg shadow-purple-500/25 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Kích hoạt hệ thống
          </button>
        </div>
      </div>
    </div>
  )
}

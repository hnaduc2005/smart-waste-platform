import React from 'react';
import Sidebar from './Sidebar';

export default function DashboardLayout({ children, currentPage, onNavigate }: any) {
  return (
    <div className="flex h-screen bg-[#0a0a0e] overflow-hidden text-gray-100">
      {/* Sidebar Navigation */}
      <Sidebar currentPage={currentPage} onNavigate={onNavigate} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Top Header */}
        <header className="h-16 px-8 flex items-center justify-between border-b border-white/5 bg-[#161720]/80 backdrop-blur-md z-10">
          <div className="flex items-center space-x-4">
            <div className="h-4 w-4 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
            <span className="text-sm font-medium tracking-wide text-gray-300">SYSTEM STATUS: <span className="text-green-400">ONLINE</span></span>
          </div>
          
          <div className="flex items-center space-x-6">
            <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-[#161720]"></span>
            </button>
            <div className="flex items-center space-x-3 border-l border-white/10 pl-6">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 p-[2px]">
                <div className="w-full h-full bg-[#161720] rounded-full overflow-hidden">
                   <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" alt="Admin" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold">Khối 5 Admin</span>
                <span className="text-xs text-gray-500 font-mono">ID: ENTERPRISE-01</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto relative">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          <div className="relative h-full p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

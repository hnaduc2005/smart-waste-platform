import WasteClassifierPage from './pages/WasteClassifierPage';

function App() {
  return (
    <div className="min-h-screen font-sans bg-slate-900 text-slate-100 flex flex-col relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-600/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none"></div>
      <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-purple-500/10 blur-[100px] rounded-full mix-blend-screen pointer-events-none"></div>
      
      {/* Main Content Area Container */}
      <main className="flex-1 w-full max-w-6xl mx-auto py-10 px-4 sm:px-6 relative z-10 flex flex-col items-center justify-center min-h-[90vh]">
        <WasteClassifierPage />
      </main>
      
      {/* Minimal Footer */}
      <footer className="text-center py-6 text-slate-500 text-sm z-10">
        <p>Powered by YOLOv11 & React 19 • Smart Waste Platform</p>
      </footer>
    </div>
  );
}

export default App;

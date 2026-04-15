import { Leaf, Recycle, Trash2, AlertTriangle } from 'lucide-react';
import type { PredictResponse } from '../../services/wasteAiApi';

interface ResultCardProps {
  result: PredictResponse | null;
}

export function ResultCardComponent({ result }: ResultCardProps) {
  if (!result) return null;

  // Configuration mapping based on YOLO class output for Dark Theme
  const classConfig: Record<string, { label: string, color: string, bg: string, border: string, icon: any, desc: string, glow: string }> = {
    'biodegradable': {
      label: 'Hữu Cơ (Sinh Học)',
      color: 'text-emerald-400',
      bg: 'bg-emerald-950/30',
      border: 'border-emerald-500/30',
      icon: Leaf,
      desc: 'Rác hữu cơ dễ phân hủy sinh học (thức ăn thừa, rau củ, lá cây). Nên phân loại riêng để ủ làm phân bón.',
      glow: 'shadow-[0_0_30px_rgba(16,185,129,0.15)]'
    },
    'recyclable': {
      label: 'Tái Chế',
      color: 'text-cyan-400',
      bg: 'bg-cyan-950/30',
      border: 'border-cyan-500/30',
      icon: Recycle,
      desc: 'Vật liệu tài nguyên (Nhựa sạch, giấy, kim loại, thủy tinh). Rửa sạch và phân loại vào thùng rác tái chế để giảm rác thải nhựa.',
      glow: 'shadow-[0_0_30px_rgba(6,182,212,0.15)]'
    },
    'residual': {
      label: 'Vô Cơ / Còn Lại',
      color: 'text-orange-400',
      bg: 'bg-orange-950/30',
      border: 'border-orange-500/30',
      icon: Trash2,
      desc: 'Rác thải sinh hoạt thông thường không tái chế được (túi nilon bẩn, hộp xốp, sành sứ vỡ). Sẽ được mang đi ép rác lấp hoặc đốt.',
      glow: 'shadow-[0_0_30px_rgba(249,115,22,0.15)]'
    },
    'special': {
      label: 'Rác Nguy Hại',
      color: 'text-red-400',
      bg: 'bg-red-950/30',
      border: 'border-red-500/30',
      icon: AlertTriangle,
      desc: 'Chứa chất độc hại (Pin, bóng đèn, hóa chất). TUYỆT ĐỐI không vứt chung hộp rác hữu cơ. Liên hệ điểm thu gom riêng.',
      glow: 'shadow-[0_0_30px_rgba(239,68,68,0.2)]'
    }
  };

  const currentClass = result.class_name.toLowerCase();
  
  // Fallback to residual if unknown class is returned
  const config = classConfig[currentClass] || classConfig['residual'];
  const Icon = config.icon;
  const isHighConfidence = result.confidence >= 0.7;

  return (
    <div className={`w-full h-full flex flex-col justify-center animate-in fade-in zoom-in-95 duration-500`}>
      <div className={`relative p-8 rounded-3xl border ${config.border} ${config.bg} backdrop-blur-xl ${config.glow} overflow-hidden group`}>
        
        {/* Background ambient light */}
        <div className={`absolute top-0 right-0 w-32 h-32 opacity-20 blur-[60px] rounded-full pointer-events-none transition-all duration-1000 ${config.bg.replace('/30', '')}`}></div>

        <div className="flex flex-col sm:flex-row items-start space-y-6 sm:space-y-0 sm:space-x-6 relative z-10">
          <div className={`p-5 rounded-2xl bg-slate-900/80 shadow-2xl border ${config.border} ${config.color} shrink-0 group-hover:scale-110 transition-transform duration-500`}>
            <Icon size={36} strokeWidth={1.5} />
          </div>
          
          <div className="flex-1 w-full">
            <div className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700 mb-3">
              <div className={`w-1.5 h-1.5 rounded-full mr-2 animate-pulse ${config.bg.replace('bg-', 'bg-').replace('/30', '0')}`} style={{backgroundColor: "currentColor", color: "inherit"}}></div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Phân tích hoàn tất</h3>
            </div>
            
            <p className={`text-3xl font-extrabold ${config.color} mb-4 tracking-tight drop-shadow-sm`}>{config.label}</p>
            
            <div className="mb-6 bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50">
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-medium text-slate-400">Độ Tự Tin (AI)</span>
                <span className={`text-lg font-bold font-mono ${isHighConfidence ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {(result.confidence * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden border border-slate-700">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden ${isHighConfidence ? 'bg-emerald-500' : 'bg-amber-500'}`}
                  style={{ width: `${Math.min(100, Math.max(0, result.confidence * 100))}%` }}
                >
                  <div className="absolute top-0 bottom-0 left-0 right-0 bg-white/20 w-full animate-[shimmer_2s_infinite]"></div>
                </div>
              </div>
            </div>
            
            <div className="p-5 bg-slate-900/80 rounded-2xl border border-slate-700/50 shadow-inner">
              <p className="text-sm text-slate-300 leading-relaxed font-medium">
                {config.desc}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

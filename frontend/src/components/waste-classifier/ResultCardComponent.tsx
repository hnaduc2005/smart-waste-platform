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
      desc: 'Vật liệu tài nguyên (Nhựa sạch, giấy, kim loại, thủy tinh). Rửa sạch và phân loại vào thùng rác để tái chế.',
      glow: 'shadow-[0_0_30px_rgba(6,182,212,0.15)]'
    },
    'residual': {
      label: 'Vô Cơ / Còn Lại',
      color: 'text-orange-400',
      bg: 'bg-orange-950/30',
      border: 'border-orange-500/30',
      icon: Trash2,
      desc: 'Rác thải sinh hoạt thông thường không tái chế được (túi nilon bẩn, hộp xốp, sành vỡ). Sẽ được mang đi ép rác lấp hoặc đốt.',
      glow: 'shadow-[0_0_30px_rgba(249,115,22,0.15)]'
    },
    'special': {
      label: 'Rác Nguy Hại',
      color: 'text-red-400',
      bg: 'bg-red-950/30',
      border: 'border-red-500/30',
      icon: AlertTriangle,
      desc: 'Chứa chất độc hại (Pin, bóng đèn, hóa chất). TUYỆT ĐỐI không vứt chung hộp rác hữu cơ. Cần xử lý riêng.',
      glow: 'shadow-[0_0_30px_rgba(239,68,68,0.2)]'
    }
  };

  const predictions = result.predictions || [];

  if (predictions.length === 0) {
    return (
      <div className="w-full h-full flex flex-col justify-center animate-in fade-in zoom-in-95 duration-500">
        <div className="p-8 rounded-3xl border border-slate-600/50 bg-slate-800/30 backdrop-blur-xl text-center">
          <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-slate-700 flex items-center justify-center">
            <Trash2 size={24} className="text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-300 mb-2">Không thấy đối tượng nào</h3>
          <p className="text-slate-500">AI hiện không phân biệt được thành phần trong ảnh.</p>
        </div>
      </div>
    );
  }

  // Group predictions by class_name
  const grouped: Record<string, { count: number, maxConf: number }> = {};
  predictions.forEach(p => {
    const c = p.class_name.toLowerCase();
    if (!grouped[c]) grouped[c] = { count: 0, maxConf: 0 };
    grouped[c].count += 1;
    if (p.confidence > grouped[c].maxConf) {
      grouped[c].maxConf = p.confidence;
    }
  });

  const groupedKeys = Object.keys(grouped).sort((a, b) => grouped[b].count - grouped[a].count);

  return (
    <div className="w-full max-h-[500px] overflow-y-auto pr-2 custom-scrollbar flex flex-col space-y-4 animate-in fade-in zoom-in-95 duration-500">
      <div className="sticky top-0 z-10 bg-slate-800/90 backdrop-blur-md pb-2 pt-1 border-b border-slate-700/50 mb-2 flex justify-between items-center">
        <h3 className="text-slate-200 font-semibold">Kết Quả Phân Tích</h3>
        <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold tracking-wide border border-emerald-500/30 shadow-inner">THẤY {predictions.length} VẬT THỂ</span>
      </div>
      
      {groupedKeys.map((currentClass, idx) => {
        const item = grouped[currentClass];
        const config = classConfig[currentClass] || classConfig['residual'];
        const Icon = config.icon;
        const isHighConfidence = item.maxConf >= 0.7;

        return (
          <div key={idx} className={`relative p-5 sm:p-6 rounded-2xl border ${config.border} ${config.bg} backdrop-blur-xl ${config.glow} overflow-hidden group`}>
            {/* Background ambient light */}
            <div className={`absolute top-0 right-0 w-24 h-24 opacity-20 blur-[40px] rounded-full pointer-events-none transition-all duration-1000 ${config.bg.replace('/30', '')}`}></div>

            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4 relative z-10">
              <div className={`p-4 rounded-2xl bg-slate-900/90 shadow-inner border ${config.border} ${config.color} shrink-0 relative group-hover:scale-105 transition-transform duration-500`}>
                <Icon size={28} strokeWidth={1.5} />
                {item.count > 1 && (
                  <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white bg-slate-800 border-2 ${config.border.replace('/30', '')} shadow-lg z-20`}>
                    x{item.count}
                  </div>
                )}
              </div>
              
              <div className="flex-1 w-full pl-2">
                <div className="flex justify-between items-start mb-1">
                  <p className={`text-xl font-bold ${config.color} tracking-tight drop-shadow-sm`}>{config.label}</p>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mb-0.5">Top Conf</span>
                    <span className={`text-sm font-bold font-mono px-2 py-0.5 flex items-center h-6 rounded bg-slate-900/80 shadow-inner border border-slate-700/50 ${isHighConfidence ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {(item.maxConf * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                
                <p className="text-xs text-slate-400/90 leading-relaxed font-medium mt-1 line-clamp-3">
                  {config.desc}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

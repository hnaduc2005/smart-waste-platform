import { Leaf, Recycle, Trash2, AlertTriangle, ScanSearch, TrendingUp } from 'lucide-react';
import type { PredictResponse, Prediction } from '../../services/wasteAiApi';

interface ResultCardProps {
  result: PredictResponse | null;
}

// ── Class config ──────────────────────────────────────────────────────────────
const classConfig: Record<
  string,
  { label: string; color: string; bg: string; border: string; icon: any; desc: string; glow: string; accent: string }
> = {
  biodegradable: {
    label: 'Hữu Cơ (Sinh Học)',
    color: 'text-emerald-400',
    bg: 'bg-emerald-950/30',
    border: 'border-emerald-500/30',
    accent: '#10b981',
    icon: Leaf,
    desc: 'Rác hữu cơ dễ phân hủy (thức ăn, rau củ, lá cây). Nên ủ làm phân bón.',
    glow: 'shadow-[0_0_20px_rgba(16,185,129,0.12)]',
  },
  recyclable: {
    label: 'Tái Chế',
    color: 'text-cyan-400',
    bg: 'bg-cyan-950/30',
    border: 'border-cyan-500/30',
    accent: '#06b6d4',
    icon: Recycle,
    desc: 'Nhựa sạch, giấy, kim loại, thủy tinh. Rửa sạch trước khi phân loại.',
    glow: 'shadow-[0_0_20px_rgba(6,182,212,0.12)]',
  },
  residual: {
    label: 'Vô Cơ / Còn Lại',
    color: 'text-orange-400',
    bg: 'bg-orange-950/30',
    border: 'border-orange-500/30',
    accent: '#f97316',
    icon: Trash2,
    desc: 'Rác không tái chế (túi nilon bẩn, hộp xốp, sành vỡ). Đưa vào lồng rác thường.',
    glow: 'shadow-[0_0_20px_rgba(249,115,22,0.12)]',
  },
  special: {
    label: 'Rác Nguy Hại',
    color: 'text-red-400',
    bg: 'bg-red-950/30',
    border: 'border-red-500/30',
    accent: '#ef4444',
    icon: AlertTriangle,
    desc: 'Chứa chất độc (pin, bóng đèn, hóa chất). KHÔNG vứt chung, cần xử lý riêng.',
    glow: 'shadow-[0_0_20px_rgba(239,68,68,0.15)]',
  },
};

const fallback = classConfig['residual'];

// ── Confidence bar ────────────────────────────────────────────────────────────
function ConfBar({ value, accent }: { value: number; accent: string }) {
  const pct = Math.round(value * 100);
  return (
    <div className="relative w-full h-1.5 rounded-full bg-slate-700/60 overflow-hidden mt-1.5">
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{ width: `${pct}%`, background: accent, boxShadow: `0 0 6px ${accent}88` }}
      />
    </div>
  );
}

// ── Single detection item ─────────────────────────────────────────────────────
function DetectionItem({ pred, index }: { pred: Prediction; index: number }) {
  const key = pred.class_name.toLowerCase();
  const cfg = classConfig[key] ?? fallback;
  const Icon = cfg.icon;
  const pct = Math.round(pred.confidence * 100);
  const isHigh = pred.confidence >= 0.7;
  const bb = pred.bounding_box;
  const bboxText = bb
    ? `[${Math.round(bb.xmin)}, ${Math.round(bb.ymin)}, ${Math.round(bb.xmax)}, ${Math.round(bb.ymax)}]`
    : null;

  return (
    <div
      className={`relative flex items-start gap-3 p-4 rounded-xl border ${cfg.border} ${cfg.bg} ${cfg.glow} overflow-hidden group transition-all duration-300 hover:scale-[1.01]`}
    >
      {/* Ambient glow blob */}
      <div
        className="absolute -top-4 -right-4 w-16 h-16 rounded-full opacity-15 blur-2xl pointer-events-none"
        style={{ background: cfg.accent }}
      />

      {/* Index pill */}
      <div
        className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shadow-md"
        style={{ background: cfg.accent }}
      >
        {index + 1}
      </div>

      {/* Icon */}
      <div
        className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${cfg.color} bg-slate-900/80 border ${cfg.border} shadow-inner`}
      >
        <Icon size={18} strokeWidth={1.5} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={`font-bold text-sm ${cfg.color} truncate`}>{cfg.label}</p>
          <span
            className={`shrink-0 text-xs font-mono font-bold px-2 py-0.5 rounded-md border ${
              isHigh ? 'text-emerald-400 border-emerald-500/30 bg-emerald-950/40' : 'text-amber-400 border-amber-500/30 bg-amber-950/40'
            }`}
          >
            {pct}%
          </span>
        </div>

        <ConfBar value={pred.confidence} accent={cfg.accent} />

        {bboxText && (
          <p className="mt-1.5 text-[10px] text-slate-500 font-mono truncate" title={`Bounding box: ${bboxText}`}>
            <span className="text-slate-600">bbox</span> {bboxText}
          </p>
        )}

        <p className="mt-1 text-[11px] text-slate-400/80 leading-relaxed line-clamp-2">{cfg.desc}</p>
      </div>
    </div>
  );
}

// ── Summary strip (grouped counts) ───────────────────────────────────────────
function SummaryStrip({ predictions }: { predictions: Prediction[] }) {
  const counts: Record<string, number> = {};
  predictions.forEach((p) => {
    const k = p.class_name.toLowerCase();
    counts[k] = (counts[k] ?? 0) + 1;
  });

  return (
    <div className="flex flex-wrap gap-2">
      {Object.entries(counts).map(([cls, n]) => {
        const cfg = classConfig[cls] ?? fallback;
        return (
          <span
            key={cls}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${cfg.border} ${cfg.bg} ${cfg.color}`}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: cfg.accent }}
            />
            {cfg.label} ×{n}
          </span>
        );
      })}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export function ResultCardComponent({ result }: ResultCardProps) {
  if (!result) return null;

  const predictions = result.predictions ?? [];

  if (predictions.length === 0) {
    return (
      <div className="w-full h-full flex flex-col justify-center animate-in fade-in zoom-in-95 duration-500">
        <div className="p-8 rounded-3xl border border-slate-600/50 bg-slate-800/30 backdrop-blur-xl text-center">
          <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-slate-700 flex items-center justify-center">
            <ScanSearch size={24} className="text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-300 mb-2">Không phát hiện đối tượng</h3>
          <p className="text-slate-500 text-sm">
            AI không nhận diện được rác thải trong ảnh. Hãy thử ảnh chụp rõ hơn hoặc chứa vật thể rõ ràng.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} className="text-emerald-400" />
          <h3 className="text-slate-200 font-semibold text-sm">Kết Quả Nhận Diện</h3>
        </div>
        <span className="bg-emerald-500/15 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold tracking-wide border border-emerald-500/25 shadow-inner">
          {predictions.length} VẬT THỂ
        </span>
      </div>

      {/* Summary tags */}
      <SummaryStrip predictions={predictions} />

      {/* Detection list */}
      <div className="flex flex-col gap-2.5 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
        {predictions.map((p, i) => (
          <DetectionItem key={i} pred={p} index={i} />
        ))}
      </div>

      {/* Footer note */}
      <p className="text-[10px] text-slate-600 text-center tracking-wide">
        Sắp xếp theo độ tin cậy giảm dần • Ngưỡng: {Math.round(((result as any).conf_threshold ?? 0.5) * 100)}%
      </p>
    </div>
  );
}

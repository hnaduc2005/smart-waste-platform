import { useState, useRef, useCallback } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import { UploadCloud, X, Image as ImageIcon } from 'lucide-react';

import type { PredictResponse } from '../../services/wasteAiApi';

interface ImageUploadProps {
  onImageSelect: (file: File) => void;
  isLoading: boolean;
  result?: PredictResponse | null;
}

// Color config for each waste class
const CLASS_COLORS: Record<string, { border: string; bg: string; badge: string; text: string }> = {
  biodegradable: { border: '#10b981', bg: 'rgba(16,185,129,0.15)', badge: '#10b981', text: '#fff' },
  recyclable:    { border: '#06b6d4', bg: 'rgba(6,182,212,0.15)',   badge: '#06b6d4', text: '#fff' },
  residual:      { border: '#f97316', bg: 'rgba(249,115,22,0.15)',  badge: '#f97316', text: '#fff' },
  special:       { border: '#ef4444', bg: 'rgba(239,68,68,0.15)',   badge: '#ef4444', text: '#fff' },
};

const DEFAULT_COLOR = { border: '#a855f7', bg: 'rgba(168,85,247,0.15)', badge: '#a855f7', text: '#fff' };

export function ImageUploadComponent({ onImageSelect, isLoading, result }: ImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  // Rendered image dimensions (after layout)
  const [renderedSize, setRenderedSize] = useState<{ w: number; h: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn một file hình ảnh hợp lệ (JPEG, PNG).');
      return;
    }
    setRenderedSize(null);
    const reader = new FileReader();
    reader.onload = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);
    onImageSelect(file);
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) handleFile(files[0]);
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(false); };
  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
  };

  const clearImage = () => {
    setPreviewUrl(null);
    setRenderedSize(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Called when the <img> finishes rendering — capture actual pixel size
  const onImgLoad = useCallback(() => {
    if (imgRef.current) {
      setRenderedSize({
        w: imgRef.current.offsetWidth,
        h: imgRef.current.offsetHeight,
      });
    }
  }, []);

  // Compute bounding box positions relative to the rendered image
  const getBBoxStyle = (p: NonNullable<PredictResponse['predictions']>[number]) => {
    if (!renderedSize || !result) return null;
    const scaleX = renderedSize.w / result.image_width;
    const scaleY = renderedSize.h / result.image_height;

    return {
      left:   p.bounding_box.xmin * scaleX,
      top:    p.bounding_box.ymin * scaleY,
      width:  (p.bounding_box.xmax - p.bounding_box.xmin) * scaleX,
      height: (p.bounding_box.ymax - p.bounding_box.ymin) * scaleY,
    };
  };

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div
        className={`w-full relative rounded-2xl p-2 transition-all duration-300 ease-out flex flex-col items-center justify-center text-center overflow-hidden h-full min-h-[320px]
          ${isDragging ? 'bg-emerald-500/10' : ''}
          ${previewUrl ? 'border-transparent' : 'border-2 border-dashed border-slate-600 hover:border-emerald-500 hover:bg-slate-800/50 cursor-pointer'}
          ${isLoading ? 'opacity-50 pointer-events-none grayscale-[50%]' : ''}
        `}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !previewUrl && fileInputRef.current?.click()}
      >
        <input
          type="file"
          className="hidden"
          ref={fileInputRef}
          onChange={onFileChange}
          accept="image/*"
        />

        {previewUrl ? (
          <div className="relative w-full rounded-xl overflow-hidden shadow-2xl group flex items-center justify-center bg-black/40"
               style={{ minHeight: '320px' }}>
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent z-10 pointer-events-none" />

            {/* Image + bounding boxes wrapper */}
            <div className="relative inline-block">
              <img
                ref={imgRef}
                src={previewUrl}
                alt="Preview"
                onLoad={onImgLoad}
                className="block max-w-full max-h-[400px] object-contain transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                style={{ display: 'block' }}
              />

              {/* Bounding boxes — rendered ONLY after image layout is known */}
              {renderedSize && result?.predictions?.map((p, i) => {
                const bboxStyle = getBBoxStyle(p);
                if (!bboxStyle) return null;
                const colors = CLASS_COLORS[p.class_name.toLowerCase()] ?? DEFAULT_COLOR;
                const pct = Math.round(p.confidence * 100);

                return (
                  <div
                    key={i}
                    className="absolute z-20"
                    style={{
                      left:   bboxStyle.left,
                      top:    bboxStyle.top,
                      width:  bboxStyle.width,
                      height: bboxStyle.height,
                      border: `2px solid ${colors.border}`,
                      background: colors.bg,
                      boxShadow: `0 0 12px ${colors.border}55`,
                      backdropFilter: 'blur(1px)',
                      pointerEvents: 'none',
                    }}
                  >
                    {/* Label badge */}
                    <span
                      className="absolute top-0 left-0 font-semibold text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded-br-md shadow-md leading-tight"
                      style={{
                        background: colors.badge,
                        color: colors.text,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {p.class_name} {pct}%
                    </span>
                    {/* Index badge */}
                    <span
                      className="absolute top-0 right-0 font-bold text-[9px] px-1 py-0.5 rounded-bl-md"
                      style={{ background: colors.badge, color: colors.text, opacity: 0.85 }}
                    >
                      #{i + 1}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Delete button */}
            {!isLoading && (
              <button
                onClick={(e) => { e.stopPropagation(); clearImage(); }}
                className="absolute top-4 right-4 p-2 bg-slate-900/60 backdrop-blur-md text-slate-300 rounded-full hover:bg-red-500/80 hover:text-white transition-all z-30 shadow-lg border border-white/10"
                title="Xóa ảnh"
              >
                <X size={18} />
              </button>
            )}

            {/* Loading overlay */}
            {isLoading && (
              <div className="absolute inset-0 z-30 bg-slate-900/70 backdrop-blur-sm flex flex-col items-center justify-center">
                <div className="relative w-16 h-16 flex items-center justify-center mb-4">
                  <div className="absolute inset-0 border-4 border-emerald-500/20 rounded-full" />
                  <div className="absolute inset-0 border-4 border-emerald-400 rounded-full border-t-transparent animate-spin" />
                </div>
                <div className="bg-slate-900/80 px-4 py-2 rounded-full border border-slate-700">
                  <p className="text-emerald-400 font-medium tracking-wide text-sm font-mono animate-pulse">DETECTING_OBJECTS...</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10">
            <div className="w-20 h-20 mb-6 rounded-full bg-slate-800 shadow-inner flex items-center justify-center text-slate-400 border border-slate-700">
              <UploadCloud size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-200 mb-2">Tải ảnh rác thải lên</h3>
            <p className="text-sm text-slate-500 mb-6 px-4 max-w-[250px] mx-auto leading-relaxed">
              Kéo thả hình ảnh vào đây hoặc click để chọn ảnh từ máy của bạn.
            </p>
            <div className="mt-2 flex items-center space-x-2 text-xs font-medium px-4 py-2 bg-slate-800 rounded-full border border-slate-700 text-slate-400">
              <ImageIcon size={14} className="text-emerald-500" />
              <span>Hỗ trợ JPG, PNG • Max 10MB</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

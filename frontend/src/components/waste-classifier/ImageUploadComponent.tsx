import { useState, useRef } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import { UploadCloud, X, Image as ImageIcon } from 'lucide-react';

import type { PredictResponse } from '../../services/wasteAiApi';

interface ImageUploadProps {
  onImageSelect: (file: File) => void;
  isLoading: boolean;
  result?: PredictResponse | null;
}

export function ImageUploadComponent({ onImageSelect, isLoading, result }: ImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn một file hình ảnh hợp lệ (JPEG, PNG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    onImageSelect(file);
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const clearImage = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
          <div className="relative w-full h-[320px] rounded-xl overflow-hidden shadow-2xl group flex items-center justify-center bg-black/40">
            {/* Background glow for the image */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent z-10 pointer-events-none"></div>
            
            <div className="relative max-w-full max-h-full inline-block">
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="max-w-full max-h-[320px] object-contain transition-transform duration-700 ease-out group-hover:scale-[1.02]"
              />
              
              {result && result.predictions && result.predictions.map((p, i) => {
                const left = (p.bounding_box.xmin / result.image_width) * 100;
                const top = (p.bounding_box.ymin / result.image_height) * 100;
                const width = ((p.bounding_box.xmax - p.bounding_box.xmin) / result.image_width) * 100;
                const height = ((p.bounding_box.ymax - p.bounding_box.ymin) / result.image_height) * 100;
                
                const c = p.class_name.toLowerCase();
                let colors = { border: 'border-orange-500', bg: 'bg-orange-500/20', badge: 'bg-orange-500' };
                if (c === 'biodegradable') colors = { border: 'border-emerald-500', bg: 'bg-emerald-500/20', badge: 'bg-emerald-500' };
                if (c === 'recyclable') colors = { border: 'border-cyan-500', bg: 'bg-cyan-500/20', badge: 'bg-cyan-500' };
                if (c === 'special') colors = { border: 'border-red-500', bg: 'bg-red-500/20', badge: 'bg-red-500' };

                return (
                  <div 
                    key={i}
                    className={`absolute border-2 ${colors.border} ${colors.bg} z-20 shadow-[0_0_15px_rgba(0,0,0,0.2)] backdrop-blur-[1px]`}
                    style={{
                      left: `${left}%`,
                      top: `${top}%`,
                      width: `${width}%`,
                      height: `${height}%`
                    }}
                  >
                    <div className={`absolute top-0 left-0 ${colors.badge} text-white font-medium text-[10px] sm:text-xs px-2 py-0.5 rounded-br opacity-95 shadow-md`}>
                      {p.class_name} {Math.round(p.confidence * 100)}%
                    </div>
                  </div>
                );
              })}
            </div>
            
            {!isLoading && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  clearImage();
                }}
                className="absolute top-4 right-4 p-2 bg-slate-900/60 backdrop-blur-md text-slate-300 rounded-full hover:bg-red-500/80 hover:text-white transition-all z-20 shadow-lg border border-white/10"
                title="Xóa ảnh"
              >
                <X size={18} />
              </button>
            )}
            
            {isLoading && (
              <div className="absolute inset-0 z-20 bg-slate-900/70 backdrop-blur-sm flex flex-col items-center justify-center">
                <div className="relative w-16 h-16 flex items-center justify-center mb-4">
                  <div className="absolute inset-0 border-4 border-emerald-500/20 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-emerald-400 rounded-full border-t-transparent animate-spin"></div>
                </div>
                <div className="bg-slate-900/80 px-4 py-2 rounded-full border border-slate-700">
                  <p className="text-emerald-400 font-medium tracking-wide text-sm font-mono animate-pulse">ANALYZING_IMAGE...</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10">
            <div className="w-20 h-20 mb-6 rounded-full bg-slate-800 shadow-inner flex items-center justify-center text-slate-400 group-hover:text-emerald-400 group-hover:bg-emerald-900/30 transition-colors border border-slate-700">
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

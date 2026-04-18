import { useState } from 'react';
import { Cpu, ScanLine } from 'lucide-react';
import { ImageUploadComponent } from '../components/waste-classifier/ImageUploadComponent';
import { ResultCardComponent } from '../components/waste-classifier/ResultCardComponent';
import { wasteAiApi } from '../services/wasteAiApi';
import type { PredictResponse } from '../services/wasteAiApi';

export default function WasteClassifierPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PredictResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImageSelect = async (file: File) => {
    setIsLoading(true);
    setResult(null);
    setError(null);
    try {
      const data = await wasteAiApi.predictWaste(file);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Header Section */}
      <div className="mb-12 text-center">
        <div className="inline-flex items-center justify-center p-2 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl mb-6">
          <div className="bg-gradient-to-tr from-emerald-400 to-cyan-500 rounded-xl p-3 shadow-lg shadow-emerald-500/25">
            <ScanLine className="text-slate-900" size={32} />
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
          EcoCycle AI Scanner
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed">
          Phân loại rác tự động cực chuẩn xác. Kéo thả bức ảnh của bạn vào hệ thống,{' '}
          AI sẽ nhận diện và đưa ra chỉ dẫn xử lý bảo vệ môi trường.
        </p>
      </div>

      {/* Interface Wrapper - Modern Glassmorphism panel */}
      <div className="bg-slate-800/40 backdrop-blur-2xl border border-slate-700/50 rounded-3xl p-6 md:p-8 shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-stretch">

          {/* Upload Section */}
          <div className="flex flex-col h-full">
            <div className="flex items-center space-x-2 text-slate-300 mb-6 font-semibold tracking-wide uppercase text-sm">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">1</span>
              <span>Tải Ảnh Phân Loại</span>
            </div>
            <div className="flex-1 bg-slate-900/50 rounded-2xl border border-slate-700/50 overflow-hidden shadow-inner flex flex-col pt-6 px-6 pb-8">
              <ImageUploadComponent
                onImageSelect={handleImageSelect}
                isLoading={isLoading}
                result={result}
              />
            </div>
          </div>

          {/* Result Section */}
          <div className="flex flex-col h-full mt-8 lg:mt-0">
            <div className="flex items-center space-x-2 text-slate-300 mb-6 font-semibold tracking-wide uppercase text-sm">
              <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs">2</span>
              <span>Phân Tích AI</span>
            </div>

            <div className="flex-1 flex flex-col justify-center">
              {!result && !isLoading && !error && (
                <div className="h-full min-h-[320px] flex flex-col items-center justify-center text-center bg-slate-900/30 rounded-2xl border border-dashed border-slate-700 p-8 shadow-inner">
                  <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mb-6 shadow-xl border border-slate-700">
                    <Cpu className="text-slate-600" size={36} />
                  </div>
                  <h3 className="text-xl font-medium text-slate-300 mb-2">Hệ thống đang chờ</h3>
                  <p className="text-slate-500 max-w-sm">Tải ảnh lên để khởi động tiến trình chạy thuật toán phân tích vật thể.</p>
                </div>
              )}

              {error && (
                <div className="p-6 bg-red-950/40 border border-red-900/50 rounded-2xl shadow-lg backdrop-blur-sm animate-in fade-in slide-in-from-top-4">
                  <div className="flex items-start">
                    <div className="w-10 h-10 rounded-full bg-red-900/30 flex items-center justify-center text-red-400 mr-4 shrink-0">
                      <span className="text-lg font-bold">!</span>
                    </div>
                    <div>
                      <h4 className="text-red-400 font-semibold mb-1 text-lg">Phân Tích Thất Bại</h4>
                      <p className="text-red-200/80 leading-relaxed text-sm">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              <ResultCardComponent result={result} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

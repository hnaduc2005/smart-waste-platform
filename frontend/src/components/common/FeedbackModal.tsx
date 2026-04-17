import { useState } from 'react';
import { Star, X } from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => void;
  collectorName?: string;
}

export default function FeedbackModal({ isOpen, onClose, onSubmit, collectorName = "Người thu gom" }: FeedbackModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Reset state when modal opens
  if (!isOpen) {
    if (rating !== 0) setRating(0);
    if (comment !== "") setComment("");
    if (isSuccess) setIsSuccess(false);
    return null;
  }

  const handleSubmit = async () => {
    if (rating > 0) {
      setIsSubmitting(true);
      await onSubmit(rating, comment);
      setIsSubmitting(false);
      setIsSuccess(true);
      
      // Auto close after success
      setTimeout(() => {
        onClose();
        setIsSuccess(false);
        setRating(0);
        setComment("");
      }, 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/80 backdrop-blur-md transition-opacity duration-300">
      <div 
        className="bg-slate-800 border border-slate-700/60 w-full max-w-md rounded-3xl p-8 shadow-[0_0_50px_rgba(16,185,129,0.15)] relative transform transition-all duration-500 scale-100 opacity-100 translate-y-0"
        style={{ animation: 'modalEntrance 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        <style>{`
          @keyframes modalEntrance {
            from { opacity: 0; transform: scale(0.95) translateY(20px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
          }
          @keyframes checkmark {
            0% { stroke-dashoffset: 50; opacity: 0; }
            100% { stroke-dashoffset: 0; opacity: 1; }
          }
        `}</style>

        {/* Nút tắt */}
        {!isSubmitting && !isSuccess && (
          <button 
            onClick={onClose} 
            className="absolute top-5 right-5 text-slate-500 hover:text-white bg-slate-800/80 hover:bg-slate-700/50 rounded-full p-1.5 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <path className="check-animated" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" style={{ strokeDasharray: 50, animation: 'checkmark 0.6s ease-out forwards' }} />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Tuyệt vời!</h3>
            <p className="text-emerald-400 font-medium pb-2">Đánh giá của bạn đã được ghi nhận.</p>
          </div>
        ) : (
          <>
            <h3 className="text-2xl font-bold text-center text-white mb-2">Đánh giá dịch vụ</h3>
            <p className="text-slate-400 text-center text-[15px] mb-8 leading-relaxed">
              Bạn cảm thấy thái độ và tốc độ của <strong className="text-emerald-400">{collectorName}</strong> thế nào?
            </p>

            {/* Khối Đánh Giá Sao */}
            <div className="flex justify-center gap-3 mb-8 relative">
              <div className="absolute inset-0 bg-yellow-400/20 blur-3xl rounded-full"></div>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-125 focus:outline-none relative z-10"
                >
                  <Star 
                    className={`w-11 h-11 transition-all duration-300 ${
                      star <= (hoverRating || rating) 
                        ? 'fill-yellow-400 text-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,0.8)] scale-110' 
                        : 'text-slate-600 hover:text-slate-500'
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Khối Nhập Comment */}
            <div className="mb-8">
              <textarea
                className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl p-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all resize-none shadow-inner"
                rows={3}
                placeholder="Để lại lời nhắn tĩnh viên cho tài xế nhé..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              ></textarea>
            </div>

            {/* Nút Gửi */}
            <button 
              onClick={handleSubmit}
              disabled={rating === 0 || isSubmitting}
              className={`w-full py-4 rounded-2xl font-bold text-[17px] transition-all duration-300 flex justify-center items-center gap-2 ${
                rating === 0 
                  ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed' 
                  : 'bg-emerald-500 text-slate-900 hover:bg-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:-translate-y-1 active:translate-y-0'
              }`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-slate-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang Xử Lý...
                </>
              ) : (
                'Gửi Đánh Giá'
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

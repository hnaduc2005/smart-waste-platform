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

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (rating > 0) {
      onSubmit(rating, comment);
      setRating(0);
      setComment("");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300">
      <div className="bg-slate-800 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl relative transform transition-transform duration-300 animate-in fade-in zoom-in-95">
        
        {/* Nút tắt */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-2xl font-bold text-center text-white mb-2">Đánh giá dịch vụ</h3>
        <p className="text-slate-400 text-center text-sm mb-6">
          Bạn đánh giá thế nào về thái độ và tốc độ của {collectorName}?
        </p>

        {/* Khối Đánh Giá Sao */}
        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
              className="transition-transform hover:scale-110 focus:outline-none"
            >
              <Star 
                className={`w-10 h-10 transition-colors duration-200 ${
                  star <= (hoverRating || rating) 
                    ? 'fill-yellow-400 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]' 
                    : 'text-slate-600'
                }`}
              />
            </button>
          ))}
        </div>

        {/* Khối Nhập Comment */}
        <div className="mb-6">
          <textarea
            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none"
            rows={3}
            placeholder="Để lại lời nhắn (Không bắt buộc)..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          ></textarea>
        </div>

        {/* Nút Gửi */}
        <button 
          onClick={handleSubmit}
          disabled={rating === 0}
          className={`w-full py-3 rounded-xl font-bold text-lg transition-all duration-300 ${
            rating === 0 
              ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
              : 'bg-gradient-to-r from-emerald-500 to-teal-400 text-white shadow-lg hover:shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98]'
          }`}
        >
          Gửi Đánh Giá
        </button>
      </div>
    </div>
  );
}

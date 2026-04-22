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
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)'
    }}>
      <div style={{
        background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)', width: '90%', maxWidth: 450, 
        borderRadius: 28, padding: 36, boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(16,185,129,0.15)', 
        position: 'relative', animation: 'modalEntrance 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
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
            style={{
              position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.05)', border: 'none',
              borderRadius: '50%', padding: 6, color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'white'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            <X size={20} />
          </button>
        )}

        {isSuccess ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 0' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', background: 'rgba(16,185,129,0.2)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16
            }}>
              <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" style={{ color: '#34d399' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" style={{ strokeDasharray: 50, animation: 'checkmark 0.6s ease-out forwards' }} />
              </svg>
            </div>
            <h3 style={{ fontSize: 24, fontWeight: 700, color: 'white', margin: '0 0 8px' }}>Tuyệt vời!</h3>
            <p style={{ color: '#34d399', fontWeight: 500, margin: 0 }}>Đánh giá của bạn đã được ghi nhận.</p>
          </div>
        ) : (
          <>
            <h3 style={{ fontSize: 24, fontWeight: 800, textAlign: 'center', color: 'white', margin: '0 0 8px' }}>Đánh giá dịch vụ</h3>
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: 15, lineHeight: 1.5, margin: '0 0 32px' }}>
              Bạn cảm thấy thái độ và tốc độ của <strong style={{ color: '#34d399', fontWeight: 600 }}>{collectorName}</strong> thế nào?
            </p>

            {/* Khối Đánh Giá Sao */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 32, position: 'relative' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(250,204,21,0.15)', filter: 'blur(30px)', borderRadius: '50%', zIndex: 0 }}></div>
              {[1, 2, 3, 4, 5].map((star) => {
                const isActive = star <= (hoverRating || rating);
                return (
                  <button
                    key={star}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    style={{
                      background: 'none', border: 'none', padding: 0, cursor: 'pointer', outline: 'none',
                      position: 'relative', zIndex: 10, transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                      transform: isActive ? 'scale(1.15)' : 'scale(1)'
                    }}
                  >
                    <Star 
                      size={44}
                      style={{
                        transition: 'all 0.3s ease',
                        fill: isActive ? '#facc15' : 'transparent',
                        color: isActive ? '#facc15' : 'rgba(255,255,255,0.2)',
                        filter: isActive ? 'drop-shadow(0 0 12px rgba(250,204,21,0.6))' : 'none'
                      }}
                    />
                  </button>
                );
              })}
            </div>

            {/* Khối Nhập Comment */}
            <div style={{ marginBottom: 32 }}>
              <textarea
                style={{
                  width: '100%', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(255,255,255,0.1)', 
                  borderRadius: 16, padding: 16, color: 'white', outline: 'none', resize: 'none', 
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)', transition: 'border-color 0.2s', fontFamily: 'inherit', fontSize: 15
                }}
                rows={3}
                placeholder="Để lại lời nhắn động viên cho nhân viên nhé..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onFocus={e => e.currentTarget.style.borderColor = 'rgba(16,185,129,0.5)'}
                onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
              ></textarea>
            </div>

            {/* Nút Gửi */}
            <button 
              onClick={handleSubmit}
              disabled={rating === 0 || isSubmitting}
              style={{
                width: '100%', padding: '16px', borderRadius: 16, fontWeight: 700, fontSize: 16, border: 'none',
                display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, transition: 'all 0.2s',
                background: rating === 0 ? 'rgba(255,255,255,0.05)' : '#10b981',
                color: rating === 0 ? 'rgba(255,255,255,0.3)' : '#022c22',
                cursor: rating === 0 ? 'not-allowed' : 'pointer',
                boxShadow: rating === 0 ? 'none' : '0 4px 14px rgba(16,185,129,0.3)'
              }}
              onMouseEnter={e => { if(rating > 0) e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { if(rating > 0) e.currentTarget.style.transform = 'translateY(0)' }}
            >
              {isSubmitting ? 'Đang Gửi...' : 'Gửi Đánh Giá'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

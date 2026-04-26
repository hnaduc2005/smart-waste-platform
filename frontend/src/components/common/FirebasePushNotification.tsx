import { useEffect, useState } from 'react';
import { requestFirebaseToken, onMessageListener } from '../../services/firebase';
import { useNavigate } from 'react-router-dom';
import { Info, Trophy, Truck, X } from 'lucide-react';
import axios from 'axios';

interface PushNotification {
  title: string;
  body: string;
  type: string;
}

export default function FirebasePushNotification() {
  const [notification, setNotification] = useState<PushNotification | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const validVapidKey = "BEO7taTVDswTEZ-jq90SZmdTSzhQI5vIha6TFgyVojmX94Xardobv-wn_Om4Qpdt6MmJjoO-Two3S8HNG4PGpnM";

    requestFirebaseToken(validVapidKey).then((token) => {

        if (token) {
          console.log('FCM Token sẵn sàng để Backend sử dụng:', token);

          // Tự động gọi API Backend để lưu Token
          // (Giả sử bạn đã có AuthContext và có userId, ở đây minh họa cách gửi)
          const userId = localStorage.getItem('userId'); // Hoặc lấy từ useAuth()
          if (userId) {
            axios.post(`/api/v1/device-tokens`, {
              userId: userId,
              token: token,
              deviceType: "WEB"
            }).then(() => console.log("Lưu token thành công vào DB"))
              .catch(err => console.error("Lỗi khi lưu token:", err));
          }
        }
      });

    // ==== 2. Lắng nghe Notify khi trình duyệt Đang Mở (Foreground) ====
    const unsubscribe = onMessageListener((payload) => {
      const title = payload?.notification?.title || "Có thông báo mới";
      const body = payload?.notification?.body || "Trạng thái hệ thống đã thay đổi.";

      // Động phân loại thông báo qua keywords ở title
      let type = 'info';
      if (title.toLowerCase().includes('thưởng') || title.toLowerCase().includes('điểm') || title.toLowerCase().includes('gamification')) {
        type = 'reward';
      } else if (title.toLowerCase().includes('thu gom') || title.toLowerCase().includes('rác') || title.toLowerCase().includes('đến nơi')) {
        type = 'collection';
      }

      setNotification({ title, body, type });
      console.log('Nhận Notify lúc màn hình Đang Mở:', payload);

      // (Tuỳ chọn) Tạo âm báo nhẹ khi có thông báo (Cần trình duyệt cho phép)
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(() => { }); // catch silent error nếu browser chặn autoplay
      } catch (e) { }

      // Cho Toast tắt tự động sau 5s
      setTimeout(() => setNotification(null), 5000);
    });

    // Cleanup listener khi component unmount
    return () => {
      if (unsubscribe) unsubscribe();
    };

  }, []);

  // Xử lý Click chuyển Page
  const handleNotificationClick = () => {
    if (!notification) return;

    // Điều hướng tuỳ thuộc vào loại gói tin
    if (notification.type === 'reward') {
      navigate('/gamification');
    } else if (notification.type === 'collection') {
      navigate('/dashboard');
    } else {
      navigate('/dashboard');
    }

    // Ẩn Pop-up sau khi ấn
    setNotification(null);
  };

  // UI Toast (Hiển thị góc trên bên phải)
  if (!notification) return null;

  // Màu sắc và Icon tương ứng
  let bgColor = "bg-blue-600";
  let Icon = Info;

  if (notification.type === 'reward') {
    bgColor = "bg-amber-500";
    Icon = Trophy;
  } else if (notification.type === 'collection') {
    bgColor = "bg-emerald-600";
    Icon = Truck;
  }

  return (
    <div
      onClick={handleNotificationClick}
      className={`fixed top-5 right-5 z-[9999] p-4 text-white rounded-xl shadow-2xl flex flex-col gap-2 min-w-[320px] max-w-[400px] cursor-pointer transform transition-all duration-300 ease-in-out animate-[bounce_1s_infinite] hover:scale-105 ${bgColor}`}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/25 rounded-full shadow-inner">
            <Icon size={24} className="text-white drop-shadow-md" />
          </div>
          <strong className="text-lg font-bold tracking-wide drop-shadow-sm line-clamp-1">{notification.title}</strong>
        </div>

        {/* Nút X tắt thông báo */}
        <button
          className="text-white/80 hover:text-white rounded-full p-1 hover:bg-white/30 transition-colors"
          onClick={(e) => {
            e.stopPropagation(); // Tránh kích hoạt click của cả khối
            setNotification(null);
          }}
        >
          <X size={20} />
        </button>
      </div>
      <span className="text-[15px] ml-[52px] leading-relaxed opacity-95 line-clamp-2">{notification.body}</span>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { requestFirebaseToken, onMessageListener } from '../../services/firebase';

export default function FirebasePushNotification() {
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    // ==== 1. Yêu cầu quyền Browser và Lấy Token ====
    // BẠN CẦN LẤY VAPID KEY Ở FIREBASE CONSOLE (Project Settings -> Cloud Messaging -> Web Push certificates)
    const validVapidKey = "BEO7taTVDswTEZ-jq90SZmdTSzhQI5vIha6TFgyVojmX94Xardobv-wn_Om4Qpdt6MmJjoO-Two3S8HNG4PGpnM";

    // Lưu ý: Chỉ yêu cầu token nếu key đã được điền để tránh văng lỗi đỏ
    if (validVapidKey !== "ĐIỀN_VAPID_KEY_CỦA_BẠN_VÀO_ĐÂY") {
      requestFirebaseToken(validVapidKey).then((token) => {
        if (token) {
          console.log('FCM Token sẵn sàng để Backend sử dụng:', token);
          // TODO (Dành cho bạn): Viết REST API gửi token này vào CSDL User để Backend Notification biết gửi cho ai
        }
      });
    }

    // ==== 2. Lắng nghe Notify khi trình duyệt Đang Mở (Foreground) ====
    const unsubscribe = onMessageListener((payload) => {
      setNotification({
        title: payload?.notification?.title || "Có thông báo",
        body: payload?.notification?.body || "Bạn có một sự kiện mới!"
      });
      console.log('Nhận Notify lúc màn hình Đang Mở:', payload);

      // Cho Toast tắt tự động sau 5s
      setTimeout(() => setNotification(null), 5000);
    });

    // Cleanup listener khi component unmount
    return () => {
      if (unsubscribe) unsubscribe();
    };

  }, []);

  // UI Toast (Hiển thị góc trên bên phải)
  if (!notification) return null;

  return (
    <div className="fixed top-5 right-5 z-[9999] p-4 bg-green-500 text-white rounded-lg shadow-2xl flex flex-col gap-1 min-w-[300px] animate-bounce">
      <div className="flex justify-between items-center">
        <strong className="text-lg">{notification.title}</strong>
        <button className="text-xl font-bold bg-green-600 rounded-full w-6 h-6 flex items-center justify-center cursor-pointer" onClick={() => setNotification(null)}>×</button>
      </div>
      <span className="text-sm">{notification.body}</span>
    </div>
  );
}

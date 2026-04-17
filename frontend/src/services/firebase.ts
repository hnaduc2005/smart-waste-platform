import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// Cấu hình Firebase cho Web (Sử dụng biến môi trường của Vite)
// Bạn cần tạo tài khoản Firebase và copy các thông số này vào file .env ở thư mục frontend
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Khởi tạo Firebase độc lập
export const app = initializeApp(firebaseConfig);

// Khởi tạo Messaging để nhận Push Notification
export const messaging = getMessaging(app);

/**
 * Hàm hỗ trợ lấy Token của Trình duyệt (Dùng để gửi lên Server)
 * @param vapidKey Đây là Web Push Certificate Key (lấy trong Firebase Console -> Project Settings -> Cloud Messaging)
 */
export const requestFirebaseToken = async (vapidKey) => {
  try {
    const currentToken = await getToken(messaging, { vapidKey });
    if (currentToken) {
      console.log('Firebase Web Token của bạn:', currentToken);
      // Thực tế sau này token này sẽ được gọi API lưu vào database của user
      return currentToken;
    } else {
      console.warn('Không lấy được token. Hãy yêu cầu quyền thông báo từ trình duyệt.');
      return null;
    }
  } catch (error) {
    console.error('Lỗi khi lấy token Firebase:', error);
    return null;
  }
};

/**
 * Hàm lắng nghe thông báo khi Web đang mở (Foreground)
 */
export const onMessageListener = (callback) => {
  return onMessage(messaging, (payload) => {
    callback(payload);
  });
};

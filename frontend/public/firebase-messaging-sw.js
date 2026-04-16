importScripts("https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js");

// Dán chính xác cấu hình giống với file .env (ở dạng code thô Javascript vì Service worker không tự đọc được .env của Vite)
const firebaseConfig = {
    // BẠN SẼ CẦN COPY SỐ LIỆU TỪ .env CHÉP VÀO ĐÂY TRƯỚC KHI DEPLOY
    apiKey: "AIzaSyAJB_G4kEnX2AmfbYMpvN2PJSO4672EdNc",
    authDomain: "ecocycle-smart-waste.firebaseapp.com",
    projectId: "ecocycle-smart-waste",
    storageBucket: "ecocycle-smart-waste.firebasestorage.app",
    messagingSenderId: "1008094282023",
    appId: "1:1008094282023:web:921e79babfa2f67925e902"
};

try {
    firebase.initializeApp(firebaseConfig);
    const messaging = firebase.messaging();

    // Lắng nghe Notification Background (khi user ẩn web / ẩn tab)
    messaging.onBackgroundMessage((payload) => {
        console.log('[firebase-messaging-sw.js] Nhận message background ', payload);

        const notificationTitle = payload.notification?.title || "Thông báo mới";
        const notificationOptions = {
            body: payload.notification?.body,
            icon: '/vite.svg', // Icon mặc định tạm thời sửa sau
        };

        self.registration.showNotification(notificationTitle, notificationOptions);
    });
} catch (error) {
    console.error("Lỗi khởi tạo Service Worker Firebase:", error);
}

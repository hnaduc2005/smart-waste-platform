package com.ecocycle.notification.service;

import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class FirebasePushService {

    /**
     * @param targetToken FCM Registration Token của thiết bị người dùng (Mobile App).
     *                    Trong đồ án, User ID sẽ cần được mapping thành FCM Token (thường lưu ở DB DeviceToken).
     *                    Ở đây tạm thời giả định chuỗi truyền vào là FCM token hợp lệ.
     */
    public void sendPushNotification(String targetToken, String title, String body) {
        log.info(">>>> PREPARING FIREBASE PUSH to Token [{}]: {} - {}", targetToken, title, body);

        try {
            Notification notification = Notification.builder()
                    .setTitle(title)
                    .setBody(body)
                    .build();

            Message message = Message.builder()
                    .setNotification(notification)
                    .setToken(targetToken)
                    .build();

            // Gọi API Firebase thật sự
            String response = FirebaseMessaging.getInstance().send(message);
            log.info("Successfully sent message to Firebase: {}", response);

        } catch (Exception e) {
            log.error("Failed to send Firebase push notification", e);
        }
    }
}

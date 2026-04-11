package com.ecocycle.notification.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class FirebasePushService {

    public void sendPushNotification(String userId, String title, String body) {
        // Mock sending push notification logic
        // In real app, we would use Firebase Messaging instance
        log.info(">>>> FIREBASE PUSH: Sending to User [{}] | Title: {} | Body: {}", userId, title, body);
    }
}

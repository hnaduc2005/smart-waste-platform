package com.ecocycle.notification.controller;

import com.ecocycle.notification.service.FirebasePushService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;


@RestController

@RequestMapping("/api/v1/test-firebase")
@RequiredArgsConstructor
public class FirebaseTestController {

    private final FirebasePushService firebasePushService;

    @GetMapping
    public ResponseEntity<String> testPush(
            @RequestParam(defaultValue = "dummy-token-123456789") String token,
            @RequestParam(defaultValue = "EcoCycle Test") String title,
            @RequestParam(defaultValue = "Đây là tin nhắn test từ hệ thống EcoCycle!") String body) {
        
        firebasePushService.sendPushNotification(token, title, body);
        return ResponseEntity.ok("Đã gửi yêu cầu Push Notification tới Firebase. Vui lòng kiểm tra log hệ thống.");
    }
}

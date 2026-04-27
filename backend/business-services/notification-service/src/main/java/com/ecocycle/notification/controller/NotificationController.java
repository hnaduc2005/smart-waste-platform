package com.ecocycle.notification.controller;

import com.ecocycle.notification.domain.models.Notification;
import com.ecocycle.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationRepository notificationRepository;

    @GetMapping("/my")
    public ResponseEntity<List<Notification>> getMyNotifications(@RequestHeader("X-User-Id") String userIdStr,
                                                                 @RequestHeader("X-User-Role") String role) {
        UUID userId = null;
        try {
            if (userIdStr != null && !userIdStr.isEmpty()) {
                userId = UUID.fromString(userIdStr);
            }
        } catch (Exception e) {
            // ignore invalid UUID
        }
        
        List<Notification> notifications = notificationRepository.findByUserIdOrTargetRole(userId, role);
        return ResponseEntity.ok(notifications);
    }

    @PostMapping
    public ResponseEntity<Notification> createNotification(@RequestBody Notification notification) {
        Notification saved = notificationRepository.save(notification);
        return ResponseEntity.ok(saved);
    }

    /** Endpoint nội bộ: nhận userId dạng String, không cần JWT — dùng cho inter-service call */
    @PostMapping("/internal")
    public ResponseEntity<Notification> createInternal(@RequestBody java.util.Map<String, Object> body) {
        System.out.println("RECEIVED INTERNAL NOTIFICATION: " + body);
        Notification n = new Notification();
        try {
            Object uid = body.get("userId");
            if (uid != null) n.setUserId(UUID.fromString(uid.toString()));
        } catch (Exception e) {
            System.err.println("FAILED TO PARSE UUID: " + e.getMessage());
        }
        n.setTitle(String.valueOf(body.getOrDefault("title", "Thông báo")));
        n.setMessage(String.valueOf(body.getOrDefault("message", "")));
        n.setType(String.valueOf(body.getOrDefault("type", "SYSTEM")));
        n.setIsRead(false);
        return ResponseEntity.ok(notificationRepository.save(n));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable UUID id) {
        notificationRepository.findById(id).ifPresent(n -> {
            n.setIsRead(true);
            notificationRepository.save(n);
        });
        return ResponseEntity.ok().build();
    }
    
    @PatchMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(@RequestHeader("X-User-Id") String userIdStr,
                                              @RequestHeader("X-User-Role") String role) {
        UUID userId = null;
        try {
            if (userIdStr != null && !userIdStr.isEmpty()) {
                userId = UUID.fromString(userIdStr);
            }
        } catch (Exception e) {}
        
        List<Notification> notifications = notificationRepository.findByUserIdOrTargetRole(userId, role);
        notifications.forEach(n -> n.setIsRead(true));
        notificationRepository.saveAll(notifications);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(@PathVariable UUID id) {
        notificationRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}

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

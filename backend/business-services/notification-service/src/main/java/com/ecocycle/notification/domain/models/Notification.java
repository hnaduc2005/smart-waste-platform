package com.ecocycle.notification.domain.models;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "target_role")
    private String targetRole;

    // Nếu targetRole = ENTERPRISE, field này chỉ định enterprise cụ thể nhận thông báo
    // null = broadcast cho toàn bộ role đó
    @Column(name = "target_user_id")
    private UUID targetUserId;

    @Column(nullable = false)
    private String type = "SYSTEM";


    @Column(nullable = false)
    private String title;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(name = "is_read", nullable = false)
    private Boolean isRead = false;
    
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}

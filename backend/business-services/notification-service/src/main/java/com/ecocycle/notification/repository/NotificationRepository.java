package com.ecocycle.notification.repository;

import com.ecocycle.notification.domain.models.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    
    @Query("""
        SELECT n FROM Notification n 
        WHERE n.userId = :userId 
           OR (n.targetRole = :role AND (n.targetUserId IS NULL OR n.targetUserId = :userId))
        ORDER BY n.createdAt DESC
        """)
    List<Notification> findByUserIdOrTargetRole(UUID userId, String role);
}

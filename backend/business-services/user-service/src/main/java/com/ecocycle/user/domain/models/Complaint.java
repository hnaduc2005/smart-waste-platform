package com.ecocycle.user.domain.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "complaints")
@Getter
@Setter
public class Complaint {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /** ID của citizen gửi khiếu nại */
    @Column(nullable = false)
    private UUID citizenId;

    /** Tên citizen (để hiển thị nhanh) */
    private String citizenName;

    /** ID đơn thu gom liên quan (tuỳ chọn) */
    private UUID requestId;

    /** Tiêu đề ngắn */
    @Column(nullable = false)
    private String title;

    /** Nội dung chi tiết */
    @Column(columnDefinition = "TEXT")
    private String description;

    /**
     * Loại khiếu nại:
     *   LATE_COLLECTION | QUALITY | BEHAVIOR | OTHER
     */
    @Column(nullable = false)
    private String type;

    /**
     * Trạng thái:
     *   OPEN | IN_PROGRESS | RESOLVED | CLOSED
     */
    @Column(nullable = false)
    private String status = "OPEN";

    /** Ghi chú xử lý của admin */
    @Column(columnDefinition = "TEXT")
    private String adminNote;

    /** Admin xử lý (UUID) */
    private UUID resolvedBy;

    @CreationTimestamp
    private LocalDateTime createdAt;

    private LocalDateTime resolvedAt;
}

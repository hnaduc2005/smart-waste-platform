package com.ecocycle.collection.domain.models;

import com.ecocycle.collection.domain.enums.RequestStatus;
import com.ecocycle.collection.domain.enums.WasteType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "waste_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class WasteRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "citizen_id", nullable = false)
    private UUID citizenId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private WasteType type;

    // Lưu trữ tọa độ dưới dạng String cho đơn giản (VD: "10.8231,106.6297")
    @Column(name = "location", nullable = false)
    private String location;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RequestStatus status = RequestStatus.PENDING;

    /** Tên quận/huyện, được tự động parse từ location khi tạo đơn */
    @Column(name = "district")
    private String district;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}

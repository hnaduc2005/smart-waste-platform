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

    // Use String/Text/WKT to store Geometry/Point or specialized library like Hibernate-Spatial
    @Column(columnDefinition = "geometry(Point,4326)")
    private String location;

    @Column(name = "image_url")
    private String imageUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RequestStatus status = RequestStatus.PENDING;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}

package com.ecocycle.enterprise.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "vehicles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Vehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String licensePlate; // Biển số xe

    /** Tải trọng chuyên chở tối đa (Đơn vị: Tấn) */
    @Column(nullable = false)
    private Double maxPayload;

    /**
     * Trạng thái: AVAILABLE (Sẵn sàng), ON_DUTY (Đang đi gom), MAINTENANCE (Bảo trì)
     */
    @Column(nullable = false)
    @Builder.Default
    private String currentStatus = "AVAILABLE";

    /** Loại xe: TRUCK, MOTORBIKE, VAN */
    @Column(name = "vehicle_type")
    @Builder.Default
    private String vehicleType = "TRUCK";

    /** userId của Collector được giao xe này (từ auth-service) */
    @Column(name = "assigned_collector_id")
    private String assignedCollectorId;

    // Chiếc xe này thuộc quyền quản lý của doanh nghiệp nào
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "enterprise_id", nullable = false)
    private Enterprise enterprise;
}

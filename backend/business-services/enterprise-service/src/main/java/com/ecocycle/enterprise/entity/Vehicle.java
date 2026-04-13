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

    @Column(nullable = false)
    private Double maxPayload; // Tải trọng chuyên chở tối đa (Đơn vị: Tấn)

    @Column(nullable = false)
    private String currentStatus; // Trạng thái: AVAILABLE (Sẵn sàng), ON_DUTY (Đang đi gom), MAINTENANCE (Bảo trì)

    // Chiếc xe này thuộc quyền quản lý của doanh nghiệp nào
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "enterprise_id", nullable = false)
    private Enterprise enterprise;
}

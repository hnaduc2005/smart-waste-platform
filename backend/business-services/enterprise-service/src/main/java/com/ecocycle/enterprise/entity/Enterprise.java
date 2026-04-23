package com.ecocycle.enterprise.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "enterprises")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Enterprise {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false, unique = true)
    private String licenseNumber; // Giấy phép kinh doanh xử lý rác

    @Column(nullable = false)
    private String address;

    /** Công suất xử lý tối đa hàng ngày (Đơn vị: Tấn) */
    @Column(nullable = false)
    private Double dailyCapacity;

    /**
     * Khu vực phục vụ .
     */
    @Column(name = "service_area")
    private String serviceArea;

    /**
     * Loại rác được tiếp nhận .
     */
    @Column(name = "accepted_waste_types")
    private String acceptedWasteTypes;

    /** Trạng thái hoạt động của doanh nghiệp */
    @Column(nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    /** Số điện thoại liên hệ */
    @Column(name = "phone")
    private String phone;

    /** Email liên hệ */
    @Column(name = "email")
    private String email;

    /** userId của tài khoản Enterprise (từ auth-service) */
    @Column(name = "owner_user_id", unique = true)
    private String ownerUserId;

    // Một doanh nghiệp sẽ quản lý nhiều xe chở rác
    @OneToMany(mappedBy = "enterprise", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Vehicle> vehicles;
}

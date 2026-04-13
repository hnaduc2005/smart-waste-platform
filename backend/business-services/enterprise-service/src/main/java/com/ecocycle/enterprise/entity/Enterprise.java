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

    @Column(nullable = false)
    private Double dailyCapacity; // Công suất xử lý tối đa hàng ngày (Đơn vị: Tấn)

    // Một doanh nghiệp sẽ quản lý nhiều xe chở rác
    @OneToMany(mappedBy = "enterprise", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Vehicle> vehicles;
}

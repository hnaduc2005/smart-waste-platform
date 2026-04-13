package com.ecocycle.enterprise.repository;

import com.ecocycle.enterprise.entity.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, Long> {
    
    // Tìm danh sách xe theo trạng thái (vd: tìm xe nào đang Rảnh rỗi)
    List<Vehicle> findByCurrentStatus(String currentStatus);
    
    // Tìm các xe thuộc về một công ty quản lý cụ thể
    List<Vehicle> findByEnterpriseId(Long enterpriseId);
}

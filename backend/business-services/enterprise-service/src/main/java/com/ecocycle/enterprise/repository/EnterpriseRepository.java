package com.ecocycle.enterprise.repository;

import com.ecocycle.enterprise.entity.Enterprise;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EnterpriseRepository extends JpaRepository<Enterprise, Long> {

    /** Tìm doanh nghiệp đang hoạt động */
    List<Enterprise> findByIsActiveTrue();

    /** Tìm doanh nghiệp theo tài khoản chủ sở hữu */
    Optional<Enterprise> findByOwnerUserId(String ownerUserId);

    /**
     * Tìm các doanh nghiệp có thể xử lý loại rác cụ thể.
     */
    @Query("SELECT e FROM Enterprise e WHERE e.isActive = true AND e.acceptedWasteTypes LIKE %:wasteType%")
    List<Enterprise> findActiveByWasteType(@Param("wasteType") String wasteType);

    /**
     * Tìm các doanh nghiệp phục vụ một khu vực cụ thể.
     */
    @Query("SELECT e FROM Enterprise e WHERE e.isActive = true AND e.serviceArea LIKE %:district%")
    List<Enterprise> findActiveByServiceArea(@Param("district") String district);
}

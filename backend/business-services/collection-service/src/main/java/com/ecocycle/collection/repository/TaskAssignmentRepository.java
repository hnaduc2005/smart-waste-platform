package com.ecocycle.collection.repository;

import com.ecocycle.collection.domain.enums.RequestStatus;
import com.ecocycle.collection.domain.models.TaskAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

@Repository
public interface TaskAssignmentRepository extends JpaRepository<TaskAssignment, UUID> {
    List<TaskAssignment> findByCollectorIdAndStatus(UUID collectorId, RequestStatus status);
    List<TaskAssignment> findByCollectorIdAndStatusIn(UUID collectorId, List<RequestStatus> statuses);
    List<TaskAssignment> findByCollectorId(UUID collectorId);
    List<TaskAssignment> findByRequestCitizenIdAndStatusIn(UUID citizenId, List<RequestStatus> statuses);
    List<TaskAssignment> findByStatus(RequestStatus status);

    /**
     * Lấy lịch sử đơn thu gom của doanh nghiệp:
     * - Ưu tiên: đơn có enterprise_name khớp (dữ liệu mới sau khi có cột này)
     * - Fallback: đơn của các tài xế HIỆN TẠI thuộc doanh nghiệp (dữ liệu cũ chưa có enterprise_name)
     */
    @Query("SELECT t FROM TaskAssignment t WHERE " +
           "t.status IN :statuses AND " +
           "(t.enterpriseName = :enterpriseName OR " +
           " (t.enterpriseName IS NULL AND t.collectorId IN :collectorIds))")
    List<TaskAssignment> findByEnterpriseNameOrCollectorIds(
        @Param("enterpriseName") String enterpriseName,
        @Param("collectorIds") List<UUID> collectorIds,
        @Param("statuses") List<RequestStatus> statuses);
}

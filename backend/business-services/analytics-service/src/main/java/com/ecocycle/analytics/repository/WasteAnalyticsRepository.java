package com.ecocycle.analytics.repository;

import com.ecocycle.analytics.entity.WasteAnalyticsRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WasteAnalyticsRepository extends JpaRepository<WasteAnalyticsRecord, Long> {

    @Query("SELECT r.district as name, SUM(r.weight) as total FROM WasteAnalyticsRecord r GROUP BY r.district")
    List<Object[]> findTotalWeightByDistrict();

    @Query("SELECT r.wasteType as name, SUM(r.weight) as total FROM WasteAnalyticsRecord r WHERE r.eventType = 'REPORTED' GROUP BY r.wasteType")
    List<Object[]> findWeeklyReportedWaste();

    @Query("SELECT r.wasteType as name, SUM(r.weight) as value FROM WasteAnalyticsRecord r WHERE r.userId = :userId GROUP BY r.wasteType")
    List<Map<String, Object>> findIndividualWasteDistribution(String userId);

    @Query("SELECT SUM(r.weight) FROM WasteAnalyticsRecord r WHERE r.userId = :userId")
    Double findTotalWeightByUser(String userId);

}

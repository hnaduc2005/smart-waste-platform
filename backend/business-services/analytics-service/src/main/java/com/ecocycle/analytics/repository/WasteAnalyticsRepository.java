package com.ecocycle.analytics.repository;

import com.ecocycle.analytics.entity.WasteAnalyticsRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Repository
public interface WasteAnalyticsRepository extends JpaRepository<WasteAnalyticsRecord, Long> {

    // ── DASHBOARD ──────────────────────────────────────────────────────────

    /**
     * Tổng khối lượng rác (kg) được báo cáo hoặc thu gom, nhóm theo quận/huyện.
     */
    @Query("SELECT r.district AS name, SUM(r.weight) AS total " +
           "FROM WasteAnalyticsRecord r " +
           "GROUP BY r.district")
    List<Object[]> findTotalWeightByDistrict();

    /**
     * Tỷ lệ hiệu suất thu gom theo quận: (tổng kg COLLECTED / tổng kg REPORTED) * 100.
     * Dùng native query vì cần CASE WHEN và NULLIF trên PostgreSQL.
     */
    @Query(value =
        "SELECT district, " +
        "  COALESCE(ROUND(100.0 * " +
        "    SUM(CASE WHEN event_type = 'COLLECTED' THEN weight ELSE 0 END) / " +
        "    NULLIF(SUM(CASE WHEN event_type = 'REPORTED' THEN weight ELSE 0 END), 0) " +
        "  ), 0) AS efficiency " +
        "FROM waste_analytics_records " +
        "GROUP BY district",
        nativeQuery = true)
    List<Object[]> findEfficiencyByDistrict();

    /**
     * Thống kê theo ngày trong tuần và loại rác, trong khoảng thời gian từ :since đến nay.
     * Trả về: [dayOfWeek(0=Sun..6=Sat), wasteType, totalWeight]
     */
    @Query(value =
        "SELECT EXTRACT(DOW FROM event_timestamp)::int AS dayOfWeek, " +
        "       waste_type AS wasteType, " +
        "       SUM(weight) AS weight " +
        "FROM waste_analytics_records " +
        "WHERE event_timestamp >= :since " +
        "GROUP BY EXTRACT(DOW FROM event_timestamp)::int, waste_type " +
        "ORDER BY dayOfWeek",
        nativeQuery = true)
    List<Object[]> findWeeklyStatsByType(@Param("since") LocalDateTime since);

    // ── USER ANALYTICS ─────────────────────────────────────────────────────

    /**
     * Phân bổ loại rác của một người dùng cụ thể (dùng cho biểu đồ tròn cá nhân).
     */
    @Query("SELECT r.wasteType AS name, SUM(r.weight) AS value " +
           "FROM WasteAnalyticsRecord r " +
           "WHERE r.userId = :userId " +
           "GROUP BY r.wasteType")
    List<Map<String, Object>> findIndividualWasteDistribution(@Param("userId") String userId);

    /**
     * Tổng khối lượng rác đã đóng góp bởi một người dùng.
     */
    @Query("SELECT SUM(r.weight) FROM WasteAnalyticsRecord r WHERE r.userId = :userId")
    Double findTotalWeightByUser(@Param("userId") String userId);

    // ── LEADERBOARD ────────────────────────────────────────────────────────

    /**
     * Top 10 người dùng đóng góp nhiều khối lượng rác nhất.
     * Nếu :district là NULL thì lấy toàn hệ thống, ngược lại lọc theo quận.
     * Trả về: [userId, totalWeight]
     */
    @Query(value =
        "SELECT user_id AS userId, SUM(weight) AS totalWeight " +
        "FROM waste_analytics_records " +
        "WHERE (:district IS NULL OR district = :district) " +
        "GROUP BY user_id " +
        "ORDER BY totalWeight DESC " +
        "LIMIT 10",
        nativeQuery = true)
    List<Object[]> findLeaderboard(@Param("district") String district);
}

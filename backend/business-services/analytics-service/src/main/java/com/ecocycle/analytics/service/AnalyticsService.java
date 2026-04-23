package com.ecocycle.analytics.service;

import com.ecocycle.analytics.repository.WasteAnalyticsRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class AnalyticsService {

    private final WasteAnalyticsRepository repository;

    /** Ánh xạ day-of-week (PostgreSQL: 0=CN, 1=T2 ... 6=T7)*/
    private static final Map<Integer, String> DAY_LABEL_VI = Map.of(
            0, "CN",
            1, "T2",
            2, "T3",
            3, "T4",
            4, "T5",
            5, "T6",
            6, "T7"
    );

    /** Thứ tự hiển thị: Thứ Hai -> Chủ Nhật */
    private static final int[] DAY_ORDER = {1, 2, 3, 4, 5, 6, 0};

    public AnalyticsService(WasteAnalyticsRepository repository) {
        this.repository = repository;
    }

    // ── DASHBOARD ───────────────────────────────────────────────────────

    public Map<String, Object> getDashboardData() {
        Map<String, Object> response = new HashMap<>();

        // 1. Tổng khối lượng theo quận
        List<Object[]> districtTotals = repository.findTotalWeightByDistrict();

        // 2. Hiệu suất thu gom theo quận
        List<Object[]> efficiencyRows = repository.findEfficiencyByDistrict();
        Map<String, Integer> efficiencyMap = new HashMap<>();
        for (Object[] row : efficiencyRows) {
            String district = (String) row[0];
            Number eff = (Number) row[1];
            efficiencyMap.put(district, eff != null ? eff.intValue() : 0);
        }

        // 3. Kết hợp hai tập dữ liệu
        List<Map<String, Object>> districtList = new ArrayList<>();
        for (Object[] row : districtTotals) {
            String name = (String) row[0];
            Number total = (Number) row[1];
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("name", name);
            entry.put("total", total != null ? total.doubleValue() : 0.0);
            entry.put("efficiency", efficiencyMap.getOrDefault(name, 0));
            districtList.add(entry);
        }
        // Sắp xếp giảm dần theo tổng khối lượng
        districtList.sort((a, b) -> Double.compare(
                (double) b.get("total"), (double) a.get("total")));

        response.put("districts", districtList.isEmpty()
                ? getEmptyDistrictData()
                : districtList);

        // 4. Dữ liệu tuần (7 ngày gần nhất, nhóm theo ngày-trong-tuần × loại rác)
        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);
        List<Object[]> weeklyRaw = repository.findWeeklyStatsByType(sevenDaysAgo);

        // Khởi tạo map theo thứ tự ngày trong tuần
        Map<Integer, Map<String, Object>> weeklyMap = new LinkedHashMap<>();
        for (int dow : DAY_ORDER) {
            Map<String, Object> day = new LinkedHashMap<>();
            day.put("name", DAY_LABEL_VI.get(dow));
            day.put("organic",   0.0);
            day.put("recycle",   0.0);
            day.put("hazardous", 0.0);
            weeklyMap.put(dow, day);
        }

        for (Object[] row : weeklyRaw) {
            int dow = ((Number) row[0]).intValue();
            String wasteType = (String) row[1];
            double weight = row[2] != null ? ((Number) row[2]).doubleValue() : 0.0;
            Map<String, Object> dayEntry = weeklyMap.get(dow);
            if (dayEntry == null) continue;
            if ("ORGANIC".equalsIgnoreCase(wasteType))         dayEntry.put("organic",   weight);
            else if ("RECYCLABLE".equalsIgnoreCase(wasteType)) dayEntry.put("recycle",   weight);
            else if ("HAZARDOUS".equalsIgnoreCase(wasteType))  dayEntry.put("hazardous", weight);
        }

        List<Map<String, Object>> weeklyList = new ArrayList<>(weeklyMap.values());
        response.put("weekly", weeklyList);

        return response;
    }


    public Map<String, Object> getUserAnalytics(String userId) {
        Map<String, Object> response = new HashMap<>();

        // 1. Phân bổ loại rác cá nhân
        List<Map<String, Object>> distribution = repository.findIndividualWasteDistribution(userId);
        response.put("personalDistribution", distribution.isEmpty()
                ? getEmptyPersonalDistribution()
                : distribution);

        // 2. Chỉ số tổng hợp
        Double totalWeight = repository.findTotalWeightByUser(userId);
        double weight = totalWeight != null ? totalWeight : 0.0;
        response.put("totalWeight", weight);
        // Mỗi kg tái chế tiết kiệm ~0.36 kg CO2 
        response.put("co2Saved", Math.round(weight * 0.36 * 100.0) / 100.0);

        // 3. So sánh với trung bình khu vực
        List<Object[]> districtData = repository.findTotalWeightByDistrict();
        List<Map<String, Object>> comparison = new ArrayList<>();
        
        comparison.add(Map.of("name", "Bạn", "user", weight, "average", 0.0));
        for (Object[] row : districtData) {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("name", row[0]);
            Number districtTotal = (Number) row[1];
            // Ước lượng trung bình hộ (chia cho 500 hộ/quận)
            entry.put("average", districtTotal != null ? districtTotal.doubleValue() / 500.0 : 0.0);
            entry.put("user", 0.0);
            comparison.add(entry);
        }
        response.put("comparisonData", comparison);

        return response;
    }

    // ── LEADERBOARD ────────────────────────────────────────────────────────

    
    public List<Map<String, Object>> getLeaderboard(String district) {
        String districtFilter = (district == null || district.isBlank()) ? null : district;
        List<Object[]> rawRows = repository.findLeaderboard(districtFilter);

        List<Map<String, Object>> leaderboard = new ArrayList<>();
        int rank = 1;
        for (Object[] row : rawRows) {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("rank",        rank++);
            entry.put("userId",      row[0] != null ? row[0].toString() : "unknown");
            Number totalWeight = (Number) row[1];
            entry.put("totalWeight", totalWeight != null ? totalWeight.doubleValue() : 0.0);
            leaderboard.add(entry);
        }
        return leaderboard;
    }

    // ── Empty-state helpers ────────────────────────────────────────────────


    private List<Map<String, Object>> getEmptyDistrictData() {
        return Collections.emptyList();
    }

    private List<Map<String, Object>> getEmptyPersonalDistribution() {
        return List.of(
                Map.of("name", "Tái chế", "value", 0.0),
                Map.of("name", "Hữu cơ",  "value", 0.0),
                Map.of("name", "Độc hại",  "value", 0.0)
        );
    }
}

package com.ecocycle.analytics.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/analytics")
public class AnalyticsController {

    /**
     * API này cung cấp dữ liệu cho Web Dashboard Khối 5 vẽ biểu đồ.
     * Tương lai: Dữ liệu này sẽ được tính toán REAL-TIME dựa vào các message 
     * báo cáo rác (Khối 2) và thu gom (Khối 3) được bắn qua Kafka.
     */
    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboardData() {
        Map<String, Object> response = new HashMap<>();

        // Danh sách Khối lượng rác theo Quận (Sau này dùng lệnh SQL Aggregate GROUP BY District)
        response.put("districts", Arrays.asList(
                Map.of("name", "Q1", "total", 4000, "efficiency", 86),
                Map.of("name", "Q3", "total", 3000, "efficiency", 72),
                Map.of("name", "Q10", "total", 5000, "efficiency", 90),
                Map.of("name", "Tân Bình", "total", 2780, "efficiency", 65)
        ));

        // Phân loại khối lượng rác biến động theo tuần (Lấy từ bảng WasteRequest của Khối 2)
        response.put("weekly", Arrays.asList(
                Map.of("name", "T2", "organic", 4000, "recycle", 2400),
                Map.of("name", "T3", "organic", 3000, "recycle", 1398),
                Map.of("name", "T4", "organic", 2000, "recycle", 9800),
                Map.of("name", "T5", "organic", 2780, "recycle", 3908),
                Map.of("name", "T6", "organic", 1890, "recycle", 4800)
        ));

        return ResponseEntity.ok(response);
    }
}

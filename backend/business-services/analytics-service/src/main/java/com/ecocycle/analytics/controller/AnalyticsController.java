package com.ecocycle.analytics.controller;

import com.ecocycle.analytics.service.AnalyticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    /**
     * GET /api/v1/analytics/dashboard
     * Dữ liệu tổng quan hệ thống: phân bổ theo quận + biểu đồ tuần.
     */
    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboardData() {
        return ResponseEntity.ok(analyticsService.getDashboardData());
    }

    /**
     * GET /api/v1/analytics/user/{userId}
     * Phân tích cá nhân: phân bổ loại rác, tổng kg, CO2 tiết kiệm, so sánh khu vực.
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<Map<String, Object>> getUserAnalytics(@PathVariable String userId) {
        return ResponseEntity.ok(analyticsService.getUserAnalytics(userId));
    }

    /**
     * GET /api/v1/analytics/leaderboard?district=Q1
     * Bảng xếp hạng Top 10 người dùng đóng góp nhiều rác nhất.
     * Nếu không truyền district thì lấy toàn hệ thống.
     */
    @GetMapping("/leaderboard")
    public ResponseEntity<List<Map<String, Object>>> getLeaderboard(
            @RequestParam(required = false) String district) {
        return ResponseEntity.ok(analyticsService.getLeaderboard(district));
    }
}

package com.ecocycle.admin.controller;

import com.ecocycle.admin.client.AnalyticsClient;
import com.ecocycle.admin.client.AuthClient;
import com.ecocycle.admin.client.RewardClient;
import com.ecocycle.admin.client.UserProfileClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/dashboard")
public class AdminController {

    private final AuthClient authClient;
    private final AnalyticsClient analyticsClient;
    private final RewardClient rewardClient;
    private final UserProfileClient userProfileClient;

    public AdminController(AuthClient authClient, AnalyticsClient analyticsClient,
                           RewardClient rewardClient, UserProfileClient userProfileClient) {
        this.authClient = authClient;
        this.analyticsClient = analyticsClient;
        this.rewardClient = rewardClient;
        this.userProfileClient = userProfileClient;
    }

    // ─── Dashboard Stats ──────────────────────────────────────────────────

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        Map<String, Object> totalUsersMap = authClient.getTotalUsers();
        Map<String, Object> dashboardData = analyticsClient.getDashboardData();
        List<Map<String, Object>> leaderboard = rewardClient.getLeaderboard();
        double totalRewards = leaderboard.stream()
                .mapToDouble(entry -> {
                    Object val = entry.get("totalPoints");
                    return val != null ? Double.parseDouble(val.toString()) : 0.0;
                }).sum();
        double totalWaste = 0.0;
        if (dashboardData.get("districts") instanceof List<?> districts) {
            totalWaste = districts.stream().mapToDouble(d -> {
                if (d instanceof Map<?, ?> districtMap) {
                    Object val = districtMap.get("total");
                    return val != null ? Double.parseDouble(val.toString()) : 0.0;
                }
                return 0.0;
            }).sum();
        }
        return ResponseEntity.ok(Map.of(
            "totalUsers", totalUsersMap,
            "wasteCollected", Map.of("count", totalWaste),
            "rewardsClaimed", Map.of("count", totalRewards)
        ));
    }

    @GetMapping("/charts")
    public ResponseEntity<Map<String, Object>> getCharts() {
        List<Map<String, Object>> userGrowth = authClient.getUserGrowth();
        Map<String, Object> dashboardData = analyticsClient.getDashboardData();
        List<?> wasteWeekly = (List<?>) dashboardData.get("weekly");
        return ResponseEntity.ok(Map.of(
            "wasteDemographics", wasteWeekly != null ? wasteWeekly : List.of(),
            "userGrowth", userGrowth != null ? userGrowth : List.of()
        ));
    }

    @GetMapping("/users/recent")
    public ResponseEntity<List<Map<String, Object>>> getRecentUsers() {
        return ResponseEntity.ok(authClient.getRecentUsers());
    }

    // ─── Quản lý tài khoản ────────────────────────────────────────────────

    /** Lấy toàn bộ user (từ auth-service, bao gồm email, status, role) */
    @GetMapping("/users")
    public ResponseEntity<List<Map<String, Object>>> getAllUsersByRole(
            @RequestParam(defaultValue = "ALL") String role) {
        return ResponseEntity.ok(authClient.getAllUsers(role));
    }

    /** Khoá / mở khoá tài khoản */
    @PutMapping("/users/{userId}/lock")
    public ResponseEntity<Map<String, Object>> lockUser(
            @PathVariable String userId,
            @RequestBody Map<String, Boolean> body) {
        return ResponseEntity.ok(authClient.setUserLocked(userId, body));
    }

    /** Đổi role (phân quyền) */
    @PutMapping("/users/{userId}/role")
    public ResponseEntity<Map<String, Object>> changeRole(
            @PathVariable String userId,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(authClient.changeRole(userId, body));
    }

    // ─── Khiếu nại ────────────────────────────────────────────────────────

    /** Danh sách khiếu nại */
    @GetMapping("/complaints")
    public ResponseEntity<List<Object>> getComplaints() {
        return ResponseEntity.ok(userProfileClient.getAllComplaints());
    }

    /** Admin giải quyết khiếu nại */
    @PutMapping("/complaints/{id}/resolve")
    public ResponseEntity<Object> resolveComplaint(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(userProfileClient.resolveComplaint(id, body));
    }
}

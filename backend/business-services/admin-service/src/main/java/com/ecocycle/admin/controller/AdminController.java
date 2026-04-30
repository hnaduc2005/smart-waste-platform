package com.ecocycle.admin.controller;

import com.ecocycle.admin.client.AnalyticsClient;
import com.ecocycle.admin.client.AuthClient;
import com.ecocycle.admin.client.RewardClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/dashboard")
public class AdminController {

    private final AuthClient authClient;
    private final AnalyticsClient analyticsClient;
    private final RewardClient rewardClient;

    public AdminController(AuthClient authClient, AnalyticsClient analyticsClient, RewardClient rewardClient) {
        this.authClient = authClient;
        this.analyticsClient = analyticsClient;
        this.rewardClient = rewardClient;
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        // Fetch from real services
        Map<String, Object> totalUsersMap = authClient.getTotalUsers();
        Map<String, Object> dashboardData = analyticsClient.getDashboardData();
        
        List<Map<String, Object>> leaderboard = rewardClient.getLeaderboard();
        double totalRewards = leaderboard.stream()
                .mapToDouble(entry -> {
                    Object val = entry.get("totalPoints");
                    return val != null ? Double.parseDouble(val.toString()) : 0.0;
                }).sum();

        // WasteCollected: sum from dashboardData
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
            "wasteCollected", Map.of("count", totalWaste, "trend", 5.0), 
            "activeScans", Map.of("count", 1520, "trend", 10.0), // Need AI stat later
            "rewardsClaimed", Map.of("count", totalRewards, "trend", 1.5)
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
}

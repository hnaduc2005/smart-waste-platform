package com.ecocycle.admin.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/dashboard")
public class AdminController {

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        // Default mocked aggregations replacing frontend hardcode
        return ResponseEntity.ok(Map.of(
            "totalUsers", Map.of("count", 1890, "trend", 12.5),
            "wasteCollected", Map.of("count", 45200, "trend", 8.2), // kg
            "activeScans", Map.of("count", 12450, "trend", 24.0),
            "rewardsClaimed", Map.of("count", 8320, "trend", -1.0)
        ));
    }

    @GetMapping("/charts")
    public ResponseEntity<Map<String, Object>> getCharts() {
        return ResponseEntity.ok(Map.of(
            "wasteDemographics", List.of(
                Map.of("name", "Mon", "plastic", 400, "organic", 240, "glass", 240),
                Map.of("name", "Tue", "plastic", 300, "organic", 139, "glass", 221),
                Map.of("name", "Wed", "plastic", 200, "organic", 380, "glass", 229),
                Map.of("name", "Thu", "plastic", 278, "organic", 390, "glass", 200),
                Map.of("name", "Fri", "plastic", 189, "organic", 480, "glass", 218),
                Map.of("name", "Sat", "plastic", 239, "organic", 380, "glass", 250),
                Map.of("name", "Sun", "plastic", 349, "organic", 430, "glass", 210)
            ),
            "userGrowth", List.of(
                Map.of("name", "Jan", "users", 400),
                Map.of("name", "Feb", "users", 600),
                Map.of("name", "Mar", "users", 850),
                Map.of("name", "Apr", "users", 1100),
                Map.of("name", "May", "users", 1540),
                Map.of("name", "Jun", "users", 1890)
            )
        ));
    }

    @GetMapping("/users/recent")
    public ResponseEntity<List<Map<String, Object>>> getRecentUsers() {
        return ResponseEntity.ok(List.of(
            Map.of("id", 4058, "name", "John Doe", "email", "john.doe@example.com", "dateJoined", "Oct 24, 2023", "status", "Active", "avatar", "https://ui-avatars.com/api/?name=John+Doe&background=22c55e&color=fff"),
            Map.of("id", 4059, "name", "Jane Smith", "email", "jane.smith@example.com", "dateJoined", "Oct 23, 2023", "status", "Pending", "avatar", "https://ui-avatars.com/api/?name=Jane+Smith&background=14b8a6&color=fff"),
            Map.of("id", 4060, "name", "Mike Johnson", "email", "mike.j@example.com", "dateJoined", "Oct 21, 2023", "status", "Active", "avatar", "https://ui-avatars.com/api/?name=Mike+Johnson&background=f59e0b&color=fff")
        ));
    }
}

package com.ecocycle.admin.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@FeignClient(name = "auth-service", path = "/api/v1/auth/admin/users")
public interface AuthClient {

    @GetMapping("/count")
    Map<String, Object> getTotalUsers();

    @GetMapping("/stats/growth")
    List<Map<String, Object>> getUserGrowth();

    @GetMapping("/recent")
    List<Map<String, Object>> getRecentUsers();

    /** Lấy tất cả users, lọc theo role (ALL | CITIZEN | COLLECTOR | ENTERPRISE) */
    @GetMapping("")
    List<Map<String, Object>> getAllUsers(@RequestParam("role") String role);

    /** Khoá / mở khoá tài khoản */
    @PutMapping("/{userId}/lock")
    Map<String, Object> setUserLocked(@PathVariable("userId") String userId,
                                      @RequestBody Map<String, Boolean> body);

    /** Đổi role (phân quyền) */
    @PutMapping("/{userId}/role")
    Map<String, Object> changeRole(@PathVariable("userId") String userId,
                                   @RequestBody Map<String, String> body);
}


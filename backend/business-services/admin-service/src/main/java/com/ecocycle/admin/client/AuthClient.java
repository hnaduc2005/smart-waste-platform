package com.ecocycle.admin.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

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
}

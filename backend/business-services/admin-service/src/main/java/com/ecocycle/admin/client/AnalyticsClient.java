package com.ecocycle.admin.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.Map;

@FeignClient(name = "analytics-service", path = "/api/v1/analytics")
public interface AnalyticsClient {

    @GetMapping("/dashboard")
    Map<String, Object> getDashboardData();
}

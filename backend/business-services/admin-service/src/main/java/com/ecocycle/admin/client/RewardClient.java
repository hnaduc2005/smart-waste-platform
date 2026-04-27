package com.ecocycle.admin.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.List;
import java.util.Map;

@FeignClient(name = "reward-service", path = "/api/v1/rewards")
public interface RewardClient {

    @GetMapping("/leaderboard")
    List<Map<String, Object>> getLeaderboard();
}

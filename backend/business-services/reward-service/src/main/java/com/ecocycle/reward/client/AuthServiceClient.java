package com.ecocycle.reward.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.Map;
import java.util.UUID;

@FeignClient(name = "auth-service", path = "/api/v1/auth")
public interface AuthServiceClient {

    @GetMapping("/users/{id}")
    Map<String, String> getUserEmail(@PathVariable("id") UUID id);
}

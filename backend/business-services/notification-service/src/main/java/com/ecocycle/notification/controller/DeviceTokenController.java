package com.ecocycle.notification.controller;

import com.ecocycle.notification.domain.models.DeviceToken;
import com.ecocycle.notification.dto.DeviceTokenRequest;
import com.ecocycle.notification.service.DeviceTokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/device-tokens")
@RequiredArgsConstructor
public class DeviceTokenController {

    private final DeviceTokenService deviceTokenService;

    @PostMapping
    public ResponseEntity<DeviceToken> saveDeviceToken(@RequestBody DeviceTokenRequest request) {
        DeviceToken savedToken = deviceTokenService.saveOrUpdateDeviceToken(
                request.getUserId(),
                request.getToken(),
                request.getDeviceType()
        );
        return ResponseEntity.ok(savedToken);
    }
}

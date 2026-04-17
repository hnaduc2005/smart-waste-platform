package com.ecocycle.notification.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class DeviceTokenRequest {
    private UUID userId;
    private String token;
    private String deviceType;
}

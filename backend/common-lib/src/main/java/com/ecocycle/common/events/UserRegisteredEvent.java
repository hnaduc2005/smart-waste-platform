package com.ecocycle.common.events;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserRegisteredEvent {
    /** UUID của user vừa được tạo trong auth-service */
    private String userId;
    private String username;
    private String email;
    /** CITIZEN | COLLECTOR | ENTERPRISE */
    private String role;
    private Instant registeredAt;
}

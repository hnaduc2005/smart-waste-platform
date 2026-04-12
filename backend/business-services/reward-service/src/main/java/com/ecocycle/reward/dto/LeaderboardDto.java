package com.ecocycle.reward.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaderboardDto {
    private UUID citizenId;
    private Double totalPoints;
    // Tên công dân có thể được query bổ sung hoặc gọi qua user-service (Frontend có thể làm việc này hoặc API Gateway join lại)
    private String citizenName;
}

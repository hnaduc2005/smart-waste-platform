package com.ecocycle.collection.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CitizenHistoryItemDto {
    private UUID taskId;
    private UUID requestId;
    private UUID collectorId;
    private String wasteType;
    private Double weight;
    private String photoUrl;
    private String completedAt; // ISO format string
}

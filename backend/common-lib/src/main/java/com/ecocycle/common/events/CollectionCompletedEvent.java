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
public class CollectionCompletedEvent {
    private String wasteRequestId;
    private String citizenId;
    private String collectorId;
    private String wasteType; // e.g. "RECYCLABLE", "ORGANIC", "HAZARDOUS"
    private Double weightInKg;
    private Instant completedAt;
    private String location;  // "lat,lng" hoặc địa chỉ dạng text
    private String district;  // Tên quận/huyện (nếu có)
}

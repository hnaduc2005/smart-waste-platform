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
public class CollectorArrivingEvent {
    private String wasteRequestId;
    private String citizenId;
    private String collectorName;
    private String estimatedArrivalTime;
    private Instant dispatchedAt;
}

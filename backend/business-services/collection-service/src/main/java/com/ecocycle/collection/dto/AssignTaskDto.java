package com.ecocycle.collection.dto;

import java.util.UUID;

public class AssignTaskDto {
    private UUID requestId;
    private UUID collectorId;

    public AssignTaskDto() {}
    public AssignTaskDto(UUID requestId, UUID collectorId) {
        this.requestId = requestId;
        this.collectorId = collectorId;
    }

    public UUID getRequestId() { return requestId; }
    public void setRequestId(UUID requestId) { this.requestId = requestId; }

    public UUID getCollectorId() { return collectorId; }
    public void setCollectorId(UUID collectorId) { this.collectorId = collectorId; }
}

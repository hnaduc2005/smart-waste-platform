package com.ecocycle.collection.dto;

import java.util.UUID;

public class AssignTaskDto {
    private UUID requestId;
    private UUID collectorId;
    private String enterpriseName;

    public AssignTaskDto() {}
    public AssignTaskDto(UUID requestId, UUID collectorId, String enterpriseName) {
        this.requestId = requestId;
        this.collectorId = collectorId;
        this.enterpriseName = enterpriseName;
    }

    public UUID getRequestId() { return requestId; }
    public void setRequestId(UUID requestId) { this.requestId = requestId; }

    public UUID getCollectorId() { return collectorId; }
    public void setCollectorId(UUID collectorId) { this.collectorId = collectorId; }

    public String getEnterpriseName() { return enterpriseName; }
    public void setEnterpriseName(String enterpriseName) { this.enterpriseName = enterpriseName; }
}

package com.ecocycle.analytics.dto;

public class WasteReportEventDto {
    private String reportId;
    private String userId;
    private String wasteType;
    private Double estimatedWeight;
    private String district;
    private String timestamp;

    public String getReportId() { return reportId; }
    public void setReportId(String reportId) { this.reportId = reportId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getWasteType() { return wasteType; }
    public void setWasteType(String wasteType) { this.wasteType = wasteType; }

    public Double getEstimatedWeight() { return estimatedWeight; }
    public void setEstimatedWeight(Double estimatedWeight) { this.estimatedWeight = estimatedWeight; }

    public String getDistrict() { return district; }
    public void setDistrict(String district) { this.district = district; }

    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
}

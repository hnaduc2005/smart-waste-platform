package com.ecocycle.collection.dto;

import com.ecocycle.collection.domain.enums.WasteType;
import java.util.UUID;

public class CreateWasteRequestDto {
    private UUID citizenId;
    private WasteType type;
    private String location;
    private String imageUrl;
    private String description;

    public CreateWasteRequestDto() {}

    public UUID getCitizenId() { return citizenId; }
    public void setCitizenId(UUID citizenId) { this.citizenId = citizenId; }

    public WasteType getType() { return type; }
    public void setType(WasteType type) { this.type = type; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}

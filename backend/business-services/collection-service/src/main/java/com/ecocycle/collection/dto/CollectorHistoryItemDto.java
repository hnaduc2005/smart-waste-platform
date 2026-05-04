package com.ecocycle.collection.dto;

import lombok.*;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CollectorHistoryItemDto {
    private UUID taskId;
    private String status;

    // WasteRequest info
    private UUID requestId;
    private String wasteType;
    private String location;
    private String description;

    // CollectionProof info (null if no proof yet)
    private String photoUrl;
    private Double weight;
    private String completedAt;
    private String district;
}

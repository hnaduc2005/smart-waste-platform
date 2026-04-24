package com.ecocycle.collection.dto.ai;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class PredictionItem {
    @JsonProperty("class_id")
    private Integer classId;

    @JsonProperty("class_name")
    private String className;

    private Double confidence;

    @JsonProperty("bounding_box")
    private BoundingBox boundingBox;

    @Data
    public static class BoundingBox {
        private Double xmin;
        private Double ymin;
        private Double xmax;
        private Double ymax;
    }
}

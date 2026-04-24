package com.ecocycle.collection.dto.ai;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

@Data
public class AiPredictionResponse {
    private String filename;

    private List<PredictionItem> predictions;

    @JsonProperty("image_width")
    private Integer imageWidth;

    @JsonProperty("image_height")
    private Integer imageHeight;

    @JsonProperty("conf_threshold")
    private Double confThreshold;

    @JsonProperty("total_detections")
    private Integer totalDetections;
}

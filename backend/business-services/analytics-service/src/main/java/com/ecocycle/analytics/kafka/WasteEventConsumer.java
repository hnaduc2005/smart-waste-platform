package com.ecocycle.analytics.kafka;

import com.ecocycle.analytics.dto.WasteReportEventDto;
import com.ecocycle.analytics.entity.WasteAnalyticsRecord;
import com.ecocycle.analytics.repository.WasteAnalyticsRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class WasteEventConsumer {

    private static final Logger log = LoggerFactory.getLogger(WasteEventConsumer.class);
    private final WasteAnalyticsRepository repository;
    private final ObjectMapper objectMapper;

    public WasteEventConsumer(WasteAnalyticsRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }


    @KafkaListener(topics = "waste_reported", groupId = "ecocycle-analytics-group")
    public void consumeWasteReportEvent(String messagePayload) {
        log.info("📥 [KAFKA PIPELINE] - Hút dữ liệu từ Khối 2 (Có người báo rác): {}", messagePayload);
        try {
            WasteReportEventDto event = objectMapper.readValue(messagePayload, WasteReportEventDto.class);
            WasteAnalyticsRecord record = new WasteAnalyticsRecord();
            record.setEventType("REPORTED");
            record.setDistrict(event.getDistrict() != null ? event.getDistrict() : "Unknown");
            record.setWasteType(event.getWasteType() != null ? event.getWasteType() : "MIXED");
            record.setWeight(event.getEstimatedWeight() != null ? event.getEstimatedWeight() : 0.0);
            record.setEventTimestamp(LocalDateTime.now());
            record.setUserId(event.getUserId());
            repository.save(record);
            log.info("✅ Đã lưu WasteAnalyticsRecord từ sự kiện báo rác. ID={}, UserID={}", record.getId(), record.getUserId());
        } catch (Exception e) {
            log.error("❌ Lỗi khi phân tích sự kiện waste_reported: {}", e.getMessage());
        }
    }

    
    @KafkaListener(topics = "waste.collection.completed", groupId = "ecocycle-analytics-group")
    public void consumeWasteCollectedEvent(String messagePayload) {
        log.info("🚚 [KAFKA PIPELINE] - Hút dữ liệu từ Khối 3 (Đã gom xong rác): {}", messagePayload);
        try {
            com.ecocycle.common.events.CollectionCompletedEvent event = objectMapper.readValue(messagePayload, com.ecocycle.common.events.CollectionCompletedEvent.class);
            WasteAnalyticsRecord record = new WasteAnalyticsRecord();
            record.setEventType("COLLECTED");

            // Dùng district từ event (đã được tính từ collection-service); fallback "TP.HCM"
            String district = event.getDistrict();
            if (district == null || district.isBlank() || "Unknown".equalsIgnoreCase(district)) {
                // Thử parse lại từ location nếu có
                String loc = event.getLocation();
                if (loc != null && !loc.isBlank()) {
                    district = parseDistrictFromLocation(loc);
                } else {
                    district = "TP.HCM";
                }
            }
            record.setDistrict(district);
            record.setWasteType(event.getWasteType() != null ? event.getWasteType() : "MIXED");
            record.setWeight(event.getWeightInKg() != null ? event.getWeightInKg() : 0.0);
            record.setEventTimestamp(LocalDateTime.now());
            record.setUserId(event.getCitizenId());
            repository.save(record);
            log.info("✅ Đã lưu WasteAnalyticsRecord từ sự kiện thu gom rác. ID={}, CitizenID={}, District={}", record.getId(), record.getUserId(), district);
        } catch (Exception e) {
            log.error("❌ Lỗi khi phân tích sự kiện waste.collection.completed: {}", e.getMessage());
        }
    }

    /** Fallback: parse district từ location string trong analytics-service */
    private String parseDistrictFromLocation(String location) {
        if (location.matches("^[0-9.,\\s]+$")) {
            try {
                String[] parts = location.split(",");
                if (parts.length >= 2) {
                    double lat = Double.parseDouble(parts[0].trim());
                    double lng = Double.parseDouble(parts[1].trim());
                    // Bảng bounding box các quận TP.HCM
                    if (lat >= 10.775 && lat <= 10.790 && lng >= 106.695 && lng <= 106.710) return "Quận 1";
                    if (lat >= 10.760 && lat <= 10.780 && lng >= 106.720 && lng <= 106.760) return "Quận 2";
                    if (lat >= 10.782 && lat <= 10.800 && lng >= 106.680 && lng <= 106.700) return "Quận 3";
                    if (lat >= 10.748 && lat <= 10.765 && lng >= 106.700 && lng <= 106.720) return "Quận 4";
                    if (lat >= 10.750 && lat <= 10.775 && lng >= 106.656 && lng <= 106.680) return "Quận 5";
                    if (lat >= 10.800 && lat <= 10.840 && lng >= 106.700 && lng <= 106.730) return "Bình Thạnh";
                    if (lat >= 10.820 && lat <= 10.860 && lng >= 106.655 && lng <= 106.690) return "Gò Vấp";
                    if (lat >= 10.790 && lat <= 10.810 && lng >= 106.678 && lng <= 106.700) return "Phú Nhuận";
                    if (lat >= 10.790 && lat <= 10.820 && lng >= 106.630 && lng <= 106.660) return "Tân Bình";
                    if (lat >= 10.780 && lat <= 10.810 && lng >= 106.595 && lng <= 106.632) return "Tân Phú";
                }
            } catch (NumberFormatException ignored) {}
            return "TP.HCM";
        }
        // Địa chỉ text
        String lc = location.toLowerCase();
        for (String kw : new String[]{"quận 1","quận 2","quận 3","quận 4","quận 5","quận 6","quận 7","quận 8","quận 9","quận 10","quận 11","quận 12","bình thạnh","gò vấp","phú nhuận","tân bình","tân phú"}) {
            if (lc.contains(kw)) return Character.toUpperCase(kw.charAt(0)) + kw.substring(1);
        }
        return "TP.HCM";
    }
}

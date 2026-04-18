package com.ecocycle.analytics.kafka;

import com.ecocycle.analytics.dto.WasteCollectedEventDto;
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
            repository.save(record);
            log.info("✅ Đã lưu WasteAnalyticsRecord từ sự kiện báo rác. ID={}", record.getId());
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
            record.setDistrict("Unknown"); // District not in event currently
            record.setWasteType(event.getWasteType() != null ? event.getWasteType() : "MIXED");
            record.setWeight(event.getWeightInKg() != null ? event.getWeightInKg() : 0.0);
            record.setEventTimestamp(LocalDateTime.now());
            repository.save(record);
            log.info("✅ Đã lưu WasteAnalyticsRecord từ sự kiện thu gom rác. ID={}", record.getId());
        } catch (Exception e) {
            log.error("❌ Lỗi khi phân tích sự kiện waste.collection.completed: {}", e.getMessage());
        }
    }
}

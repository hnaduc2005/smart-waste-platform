package com.ecocycle.analytics.kafka;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
public class WasteEventConsumer {

    private static final Logger log = LoggerFactory.getLogger(WasteEventConsumer.class);

    /**
     * THE DATA PIPELINE: Hứng sự kiện từ Khối 2 (Waste Report Service)
     * Khi người dân thấy rác và bấm Báo cáo trên Mobile App, dữ liệu sẽ chạy qua ống này.
     */
    @KafkaListener(topics = "waste_reported", groupId = "ecocycle-analytics-group")
    public void consumeWasteReportEvent(String messagePayload) {
        log.info("📥 [KAFKA PIPELINE] - Hút dữ liệu từ Khối 2 (Có người báo rác): {}", messagePayload);
        
    }

    /**
     * THE DATA PIPELINE: Hứng sự kiện từ Khối 3 (Collection / Dispatch Service)
     * Khi tài xế bấm "Hoàn thành thu gom" và nhập số Kilogram rác.
     */
    @KafkaListener(topics = "waste_collected", groupId = "ecocycle-analytics-group")
    public void consumeWasteCollectedEvent(String messagePayload) {
        log.info("🚚 [KAFKA PIPELINE] - Hút dữ liệu từ Khối 3 (Đã gom xong rác): {}", messagePayload);

    }
}

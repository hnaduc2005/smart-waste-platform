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
        
        // TODO (Nhiệm vụ tiếp theo của bạn):
        // 1. Dùng ObjectMapper (Jackson) chuyển chuỗi 'messagePayload' Json sang Java Object
        // 2. Chọc vào Database (Repository) để cộng dồn (+1) vào bảng Thống kê "BÁO CÁO TỪ NGƯỜI DÂN"
        // 3. Web Dashboard gọi API sẽ thấy con số này nhảy lên tự động!
    }

    /**
     * THE DATA PIPELINE: Hứng sự kiện từ Khối 3 (Collection / Dispatch Service)
     * Khi tài xế bấm "Hoàn thành thu gom" và nhập số Kilogram rác.
     */
    @KafkaListener(topics = "waste_collected", groupId = "ecocycle-analytics-group")
    public void consumeWasteCollectedEvent(String messagePayload) {
        log.info("🚚 [KAFKA PIPELINE] - Hút dữ liệu từ Khối 3 (Đã gom xong rác): {}", messagePayload);

        // TODO (Nhiệm vụ tiếp theo của bạn):
        // 1. Parse JSON lấy ra số 'Kilogram' và loại rác (Hữu cơ hay Tái chế).
        // 2. Cộng dồn số Kilogram đó vào biến Tổng của khu vực (Quận) tương ứng.
        // 3. Lúc này biểu đồ AreaChart (Thống Kê Khối Lượng Theo Tuần) trên ReactJS sẽ biến động mượt mà!
    }
}

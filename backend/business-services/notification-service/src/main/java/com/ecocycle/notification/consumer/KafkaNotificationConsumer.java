package com.ecocycle.notification.consumer;

import com.ecocycle.common.events.CollectorArrivingEvent;
import com.ecocycle.common.events.PointsAwardedEvent;
import com.ecocycle.notification.service.FirebasePushService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@Slf4j
@RequiredArgsConstructor
public class KafkaNotificationConsumer {

    private final FirebasePushService firebasePushService;

    @KafkaListener(topics = "user.points.awarded", groupId = "notification-service-group")
    public void consumePointsAwardedEvent(PointsAwardedEvent event) {
        log.info("Received PointsAwardedEvent for citizen: {}", event.getCitizenId());

        String title = "Chúc mừng! Bạn vượt được nhận được điểm thưởng";
        String body = String.format("Bạn vừa nhận được %.2f điểm. %s. Tổng điểm tài khoản: %.2f",
                event.getPointsAdded(), event.getReason(), event.getTotalPoints());

        firebasePushService.sendPushNotification(event.getCitizenId(), title, body);
    }

    @KafkaListener(topics = "waste.collection.arriving", groupId = "notification-service-group")
    public void consumeCollectorArrivingEvent(CollectorArrivingEvent event) {
        log.info("Received CollectorArrivingEvent for citizen: {}", event.getCitizenId());

        String title = "Người thu gom rác đang tới!";
        String body = String.format("Anh/chị %s sẽ có mặt vào khoảng %s. Vui lòng chuẩn bị rác để thu gom.",
                event.getCollectorName(), event.getEstimatedArrivalTime());

        firebasePushService.sendPushNotification(event.getCitizenId(), title, body);
    }
}

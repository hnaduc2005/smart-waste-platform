package com.ecocycle.reward.consumer;

import com.ecocycle.common.events.CollectionCompletedEvent;
import com.ecocycle.reward.service.RewardCalculatorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@Slf4j
@RequiredArgsConstructor
public class KafkaRewardConsumer {

    private final RewardCalculatorService rewardCalculatorService;

    @KafkaListener(topics = "waste.collection.completed", groupId = "reward-service-group")
    public void consumeCollectionCompletedEvent(CollectionCompletedEvent event) {
        log.info("Received CollectionCompletedEvent: {}", event);
        rewardCalculatorService.calculateAndAwardPoints(event);
    }
}

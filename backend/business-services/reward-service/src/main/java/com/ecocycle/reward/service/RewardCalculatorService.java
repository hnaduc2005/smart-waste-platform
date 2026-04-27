package com.ecocycle.reward.service;

import com.ecocycle.common.events.CollectionCompletedEvent;
import com.ecocycle.common.events.PointsAwardedEvent;
import com.ecocycle.reward.domain.enums.WasteType;
import com.ecocycle.reward.domain.models.GlobalRewardRule;
import com.ecocycle.reward.domain.models.PointTransaction;
import com.ecocycle.reward.repository.GlobalRewardRuleRepository;
import com.ecocycle.reward.repository.PointTransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class RewardCalculatorService {

    private final PointTransactionRepository pointTransactionRepository;
    private final GlobalRewardRuleRepository globalRewardRuleRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    private static final String POINTS_AWARDED_TOPIC = "user.points.awarded";

    @Transactional
    public void calculateAndAwardPoints(CollectionCompletedEvent event) {
        log.info("Calculating points for event: {}", event.getWasteRequestId());

        try {
            WasteType wasteType = WasteType.valueOf(event.getWasteType().toUpperCase());
            GlobalRewardRule rule = globalRewardRuleRepository.findByType(wasteType)
                    .orElseThrow(() -> new IllegalArgumentException("No rule found for waste type: " + wasteType));

            double pointsEarned = event.getWeightInKg() * rule.getPointsPerKg();

            PointTransaction transaction = new PointTransaction();
            transaction.setCitizenId(UUID.fromString(event.getCitizenId()));
            transaction.setAmount(pointsEarned);
            transaction.setReason("Phan loai rac: " + wasteType.name() + " (" + event.getWeightInKg() + "kg)");
            pointTransactionRepository.save(transaction);

            // Fetch total points for the citizen to send in the event
            // Simple way: sum from pointTransactionRepository
            double totalPoints = pointTransactionRepository.findByCitizenIdOrderByCreatedAtDesc(UUID.fromString(event.getCitizenId()))
                    .stream().mapToDouble(PointTransaction::getAmount).sum();

            PointsAwardedEvent pointsAwardedEvent = PointsAwardedEvent.builder()
                    .citizenId(event.getCitizenId())
                    .pointsAdded(pointsEarned)
                    .totalPoints(totalPoints)
                    .reason(transaction.getReason())
                    .awardedAt(Instant.now())
                    .build();

            kafkaTemplate.send(POINTS_AWARDED_TOPIC, pointsAwardedEvent);
            log.info("Points awarded: {} to citizen: {}", pointsEarned, event.getCitizenId());
            
        } catch (Exception e) {
            log.error("Failed to calculate points for event: {}", event.getWasteRequestId(), e);
        }
    }
}

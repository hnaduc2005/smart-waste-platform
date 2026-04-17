package com.ecocycle.reward.controller;

import com.ecocycle.reward.domain.models.PointTransaction;
import com.ecocycle.reward.dto.LeaderboardDto;
import com.ecocycle.reward.repository.PointTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@CrossOrigin("*")
@RequestMapping("/api/v1/rewards")
@RequiredArgsConstructor
public class RewardController {

    private final PointTransactionRepository pointTransactionRepository;
    private final org.springframework.kafka.core.KafkaTemplate<String, Object> kafkaTemplate;

    @GetMapping("/leaderboard")
    public ResponseEntity<List<LeaderboardDto>> getLeaderboard() {
        // Simple Leaderboard memory calculation (In production should use aggregation query in repository)
        List<PointTransaction> allTransactions = pointTransactionRepository.findAll();
        
        Map<UUID, Double> groupedByCitizen = allTransactions.stream()
                .collect(Collectors.groupingBy(
                        PointTransaction::getCitizenId,
                        Collectors.summingDouble(PointTransaction::getAmount)
                ));

        List<LeaderboardDto> leaderboard = groupedByCitizen.entrySet().stream()
                .map(entry -> LeaderboardDto.builder()
                        .citizenId(entry.getKey())
                        .totalPoints(entry.getValue())
                        .citizenName("Citizen " + entry.getKey().toString().substring(0, 5)) // Mock name
                        .build())
                .sorted((a, b) -> Double.compare(b.getTotalPoints(), a.getTotalPoints()))
                .limit(10)
                .collect(Collectors.toList());

        return ResponseEntity.ok(leaderboard);
    }

    @GetMapping("/{citizenId}/history")
    public ResponseEntity<List<PointTransaction>> getPointHistory(@PathVariable UUID citizenId) {
        List<PointTransaction> history = pointTransactionRepository.findByCitizenIdOrderByCreatedAtDesc(citizenId);
        return ResponseEntity.ok(history);
    }

    // --- API DÀNH RIÊNG CHO VIỆC TEST --- //

    @PostMapping("/mock-event")
    public ResponseEntity<String> mockGenerateCollectionEvent() {
        com.ecocycle.common.events.CollectionCompletedEvent mockEvent = com.ecocycle.common.events.CollectionCompletedEvent.builder()
                .wasteRequestId(UUID.randomUUID().toString())
                .citizenId(UUID.randomUUID().toString())
                .collectorId(UUID.randomUUID().toString())
                .wasteType("RECYCLABLE")
                .weightInKg(5.5)
                .completedAt(java.time.Instant.now())
                .build();

        // Đảm bảo là có sẵn 1 Rule trong logic trước 
        // Nếu DB chưa có rule "RECYCLABLE", hãy cấu hình sẵn hoặc insert tạm
        
        kafkaTemplate.send("waste.collection.completed", mockEvent);
        return ResponseEntity.ok("Mô phỏng thành công! Đã ném event vào Kafka topic 'waste.collection.completed'. Hãy xem log của reward-service và notification-service.");
    }
}

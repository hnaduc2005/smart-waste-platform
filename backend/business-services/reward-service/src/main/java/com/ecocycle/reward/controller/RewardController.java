package com.ecocycle.reward.controller;

import com.ecocycle.reward.domain.models.PointTransaction;
import com.ecocycle.reward.dto.LeaderboardDto;
import com.ecocycle.reward.repository.PointTransactionRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/rewards")
@Slf4j
public class RewardController {

    private final PointTransactionRepository pointTransactionRepository;
    private final org.springframework.kafka.core.KafkaTemplate<String, Object> kafkaTemplate;

    private final RestTemplate restTemplate;

    public RewardController(PointTransactionRepository pointTransactionRepository,
                            org.springframework.kafka.core.KafkaTemplate<String, Object> kafkaTemplate) {
        this.pointTransactionRepository = pointTransactionRepository;
        this.kafkaTemplate = kafkaTemplate;
        this.restTemplate = new RestTemplate();
    }

    private String fetchCitizenName(UUID citizenId) {
        try {
            // Call user-service through the internal docker network
            String url = "http://ecocycle-user:8082/api/v1/users/" + citizenId;
            Map<?, ?> profile = restTemplate.getForObject(url, Map.class);
            if (profile != null) {
                // CitizenProfile uses fullName, CollectorProfile also uses fullName
                Object fullName = profile.get("fullName");
                if (fullName != null && !fullName.toString().isBlank()) {
                    return fullName.toString();
                }
                Object companyName = profile.get("companyName");
                if (companyName != null && !companyName.toString().isBlank()) {
                    return companyName.toString();
                }
            }
        } catch (Exception e) {
            log.warn("Could not fetch name for citizen {}: {}", citizenId, e.getMessage());
        }
        return "User " + citizenId.toString().substring(0, 8);
    }

    @GetMapping("/leaderboard")
    public ResponseEntity<List<LeaderboardDto>> getLeaderboard() {
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
                        .citizenName(fetchCitizenName(entry.getKey()))
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

        kafkaTemplate.send("waste.collection.completed", mockEvent);
        return ResponseEntity.ok("Mô phỏng thành công!");
    }
}

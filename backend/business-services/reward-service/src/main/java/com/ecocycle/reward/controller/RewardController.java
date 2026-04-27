package com.ecocycle.reward.controller;

import com.ecocycle.reward.domain.models.PointTransaction;
import com.ecocycle.reward.domain.models.GlobalRewardRule;
import com.ecocycle.reward.dto.LeaderboardDto;
import com.ecocycle.reward.repository.GlobalRewardRuleRepository;
import com.ecocycle.reward.repository.PointTransactionRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import com.ecocycle.reward.client.UserServiceClient;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/rewards")
@Slf4j
public class RewardController {

    private final PointTransactionRepository pointTransactionRepository;
    private final GlobalRewardRuleRepository globalRewardRuleRepository;
    private final org.springframework.kafka.core.KafkaTemplate<String, Object> kafkaTemplate;
    private final UserServiceClient userServiceClient;
    private final com.ecocycle.reward.service.EmailService emailService;

    private final RestTemplate restTemplate;

    public RewardController(PointTransactionRepository pointTransactionRepository,
                            GlobalRewardRuleRepository globalRewardRuleRepository,
                            org.springframework.kafka.core.KafkaTemplate<String, Object> kafkaTemplate,
                            UserServiceClient userServiceClient,
                            com.ecocycle.reward.service.EmailService emailService) {
        this.pointTransactionRepository = pointTransactionRepository;
        this.globalRewardRuleRepository = globalRewardRuleRepository;
        this.kafkaTemplate = kafkaTemplate;
        this.userServiceClient = userServiceClient;
        this.emailService = emailService;
        this.restTemplate = new RestTemplate();
    }

    private String fetchCitizenName(UUID citizenId) {
        try {
            // Call user-service through FeignClient (via Eureka load balancer)
            Map<?, ?> profile = userServiceClient.getUserProfile(citizenId);
            if (profile != null) {
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
                .filter(t -> t.getAmount() > 0) // Chỉ tính điểm cộng (điểm tích lũy trọn đời)
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

    @PostMapping("/redeem")
    public ResponseEntity<?> redeemReward(@RequestBody Map<String, Object> body) {
        try {
            UUID citizenId = UUID.fromString(body.get("citizenId").toString());
            double cost = Double.parseDouble(body.get("cost").toString());
            String rewardTitle = body.get("rewardTitle").toString();

            // Lấy tổng điểm hiện tại
            List<PointTransaction> allTx = pointTransactionRepository.findByCitizenIdOrderByCreatedAtDesc(citizenId);
            double currentPoints = allTx.stream().mapToDouble(PointTransaction::getAmount).sum();

            if (currentPoints < cost) {
                return ResponseEntity.badRequest().body("Số điểm không đủ!");
            }

            // Ghi nhận giao dịch trừ điểm
            PointTransaction spendTx = new PointTransaction();
            spendTx.setCitizenId(citizenId);
            spendTx.setAmount(-cost);
            spendTx.setReason("Đổi quà: " + rewardTitle);
            pointTransactionRepository.save(spendTx);

            // Fetch citizen email using user-service
            String url = "http://ecocycle-user:8082/api/v1/users/" + citizenId;
            Map<?, ?> profile = restTemplate.getForObject(url, Map.class);
            if (profile != null) {
                Object emailObj = profile.get("email");
                Object nameObj = profile.get("fullName");
                if (emailObj != null && !emailObj.toString().isBlank()) {
                    String email = emailObj.toString();
                    String name = nameObj != null ? nameObj.toString() : "Citizen";
                    emailService.sendRewardEmail(email, name, rewardTitle);
                } else {
                    log.warn("Citizen {} does not have an email. Cannot send reward email.", citizenId);
                }
            }

            return ResponseEntity.ok(Map.of("message", "Đổi thưởng thành công!"));
        } catch (Exception e) {
            log.error("Error redeeming reward: ", e);
            return ResponseEntity.internalServerError().body("Lỗi hệ thống khi đổi thưởng.");
        }
    }

    // --- API DÀNH RIÊNG CHO VIỆC TEST --- //

    @PostMapping("/mock-event")
    public ResponseEntity<String> mockGenerateCollectionEvent() {
        com.ecocycle.common.events.CollectionCompletedEvent mockEvent = com.ecocycle.common.events.CollectionCompletedEvent.builder()
                .wasteRequestId(java.util.UUID.randomUUID().toString())
                .citizenId(java.util.UUID.randomUUID().toString())
                .collectorId(java.util.UUID.randomUUID().toString())
                .wasteType("RECYCLABLE")
                .weightInKg(5.5)
                .completedAt(java.time.Instant.now())
                .build();

        kafkaTemplate.send("waste.collection.completed", mockEvent);
        return ResponseEntity.ok("Mô phỏng thành công!");
    }
    // --- REWARD RULES (Enterprise Config) --- //

    /** GET /api/v1/rewards/rules — Lấy tất cả quy tắc điểm thưởng */
    @GetMapping("/rules")
    public ResponseEntity<java.util.List<GlobalRewardRule>> getAllRules() {
        return ResponseEntity.ok(globalRewardRuleRepository.findAll());
    }

    /** PUT /api/v1/rewards/rules/{wasteType} — Cập nhật điểm/kg cho loại rác */
    @PutMapping("/rules/{wasteType}")
    public ResponseEntity<GlobalRewardRule> updateRule(
            @PathVariable String wasteType,
            @org.springframework.web.bind.annotation.RequestBody java.util.Map<String, Double> body) {
        com.ecocycle.reward.domain.enums.WasteType type;
        try {
            type = com.ecocycle.reward.domain.enums.WasteType.valueOf(wasteType.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
        Double pointsPerKg = body.get("pointsPerKg");
        if (pointsPerKg == null || pointsPerKg < 0) return ResponseEntity.badRequest().build();

        GlobalRewardRule rule = globalRewardRuleRepository.findByType(type).orElseGet(() -> {
            GlobalRewardRule r = new GlobalRewardRule();
            r.setType(type);
            return r;
        });
        rule.setPointsPerKg(pointsPerKg);
        return ResponseEntity.ok(globalRewardRuleRepository.save(rule));
    }
}

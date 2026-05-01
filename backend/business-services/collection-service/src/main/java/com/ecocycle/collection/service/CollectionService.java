package com.ecocycle.collection.service;

import com.ecocycle.collection.domain.enums.RequestStatus;
import com.ecocycle.collection.domain.models.CollectionProof;
import com.ecocycle.collection.domain.models.TaskAssignment;
import com.ecocycle.collection.domain.models.WasteRequest;
import com.ecocycle.collection.dto.AssignTaskDto;
import com.ecocycle.collection.dto.ConfirmCollectionDto;
import com.ecocycle.collection.dto.CreateWasteRequestDto;
import com.ecocycle.collection.repository.CollectionProofRepository;
import com.ecocycle.collection.repository.TaskAssignmentRepository;
import com.ecocycle.collection.repository.WasteRequestRepository;
import com.ecocycle.common.events.CollectionCompletedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ecocycle.collection.domain.enums.WasteType;
import com.ecocycle.collection.dto.ai.AiPredictionResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CollectionService {

    private final WasteRequestRepository requestRepository;
    private final TaskAssignmentRepository taskRepository;
    private final CollectionProofRepository proofRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final RestTemplate restTemplate;

    @Value("${app.ai-service.url}")
    private String aiServiceUrl;

    @Value("${app.enterprise-service.url:http://ecocycle-enterprise:8087}")
    private String enterpriseServiceUrl;

    @Value("${app.notification-service.url:http://ecocycle-notification:8085}")
    private String notificationServiceUrl;

    @Transactional
    public WasteRequest createWasteRequest(CreateWasteRequestDto dto) {
        log.info("Creating waste request for citizen: {}", dto.getCitizenId());
        WasteRequest request = new WasteRequest();
        request.setCitizenId(dto.getCitizenId());
        request.setType(dto.getType());
        request.setLocation(dto.getLocation());
        request.setDistrict(extractDistrict(dto.getLocation()));
        request.setImageUrl(dto.getImageUrl());
        request.setDescription(dto.getDescription());
        request.setStatus(RequestStatus.PENDING);

        WasteRequest saved = requestRepository.save(request);

        // Emit waste_reported event
        try {
            java.util.Map<String, Object> reportEvent = new java.util.HashMap<>();
            reportEvent.put("reportId", saved.getId().toString());
            reportEvent.put("userId", saved.getCitizenId().toString());
            reportEvent.put("wasteType", saved.getType().name());
            reportEvent.put("estimatedWeight", 2.0); // Estimated weight
            reportEvent.put("district", extractDistrict(saved.getLocation()));
            reportEvent.put("timestamp", java.time.Instant.now().toString());
            kafkaTemplate.send("waste_reported", reportEvent);
        } catch (Exception e) {
            log.error("Failed to emit waste_reported event", e);
        }

        // Thong bao cho doanh nghiep phu trach khu vuc
        notifyEnterpriseNewRequest(saved);

        return saved;
    }

    @Transactional
    public WasteRequest detectAndCreateWasteRequest(UUID citizenId, String location, String description, MultipartFile image) {
        log.info("Receiving image for AI detection and creating waste request for citizen: {}", citizenId);

        WasteType finalWasteType = WasteType.RECYCLABLE; // Default

        try {
            // Forward image to AI-Service
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            ByteArrayResource fileResource = new ByteArrayResource(image.getBytes()) {
                @Override
                public String getFilename() {
                    return image.getOriginalFilename() != null ? image.getOriginalFilename() : "upload.jpg";
                }
            };

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", fileResource);

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

            ResponseEntity<AiPredictionResponse> response = restTemplate.postForEntity(
                    aiServiceUrl + "/predict",
                    requestEntity,
                    AiPredictionResponse.class);

            AiPredictionResponse aiResponse = response.getBody();
            if (aiResponse != null && aiResponse.getPredictions() != null) {
                // Determine the primary waste type from predictions
                boolean hasOrganic = aiResponse.getPredictions().stream()
                        .anyMatch(p -> p.getClassName().toLowerCase().contains("organic"));
                boolean hasHazardous = aiResponse.getPredictions().stream()
                        .anyMatch(p -> p.getClassName().toLowerCase().contains("battery")
                                || p.getClassName().toLowerCase().contains("hazardous"));

                if (hasOrganic)
                    finalWasteType = WasteType.ORGANIC;
                else if (hasHazardous)
                    finalWasteType = WasteType.HAZARDOUS;
            }

        } catch (Exception e) {
            log.error("Failed to connect or process AI service prediction. Falling back to RECYCLABLE", e);
        }

        WasteRequest request = new WasteRequest();
        request.setCitizenId(citizenId);
        request.setType(finalWasteType);
        request.setLocation(location);
        request.setDescription(description);
        // For production, image should be uploaded to S3. Here we put a placeholder or
        // basic string.
        request.setImageUrl("https://via.placeholder.com/300?text=Auto+AI+Processed");
        request.setStatus(RequestStatus.PENDING);

        WasteRequest saved = requestRepository.save(request);

        // Emit waste_reported event
        try {
            java.util.Map<String, Object> reportEvent = new java.util.HashMap<>();
            reportEvent.put("reportId", saved.getId().toString());
            reportEvent.put("userId", saved.getCitizenId().toString());
            reportEvent.put("wasteType", saved.getType().name());
            reportEvent.put("estimatedWeight", 2.0); // Estimated weight
            reportEvent.put("district", extractDistrict(saved.getLocation()));
            reportEvent.put("timestamp", java.time.Instant.now().toString());
            kafkaTemplate.send("waste_reported", reportEvent);
        } catch (Exception e) {
            log.error("Failed to emit waste_reported event", e);
        }

        // Thong bao cho doanh nghiep phu trach khu vuc
        notifyEnterpriseNewRequest(saved);

        return saved;
    }

    public List<WasteRequest> getPendingRequests() {
        return requestRepository.findByStatus(RequestStatus.PENDING);
    }

    public List<WasteRequest> getAllRequests() {
        return requestRepository.findAll();
    }

    public List<WasteRequest> getRequestsByStatus(RequestStatus status) {
        return requestRepository.findByStatus(status);
    }

    /** Lấy tất cả đơn thuộc quận/huyện cụ thể (dùng cho enterprise filter theo serviceArea) */
    public List<WasteRequest> getRequestsByDistrict(String district) {
        return requestRepository.findByDistrict(district);
    }

    /** Lấy đơn theo trạng thái + quận (dùng cho enterprise) */
    public List<WasteRequest> getRequestsByStatusAndDistrict(RequestStatus status, String district) {
        return requestRepository.findByStatusAndDistrict(status, district);
    }

    /** Lấy đơn theo danh sách quận (serviceArea có thể là "Toàn TP.HCM" hoặc nhiều quận) */
    public List<WasteRequest> getRequestsByDistricts(List<String> districts) {
        // Nếu "Toàn TP.HCM", trả về tất cả
        if (districts.contains("Toàn TP.HCM") || districts.isEmpty()) {
            return requestRepository.findAll();
        }
        return requestRepository.findByDistrictIn(districts);
    }

    @Transactional
    public java.util.Optional<WasteRequest> rejectRequest(UUID requestId) {
        return requestRepository.findById(requestId).map(req -> {
            req.setStatus(RequestStatus.CANCELLED);
            return requestRepository.save(req);
        });
    }

    public List<WasteRequest> getCitizenRequests(UUID citizenId) {
        return requestRepository.findByCitizenId(citizenId);
    }

    @Transactional
    public TaskAssignment assignTask(AssignTaskDto dto) {
        WasteRequest request = requestRepository.findById(dto.getRequestId())
                .orElseThrow(() -> new RuntimeException("WasteRequest not found"));

        if (request.getStatus() != RequestStatus.PENDING) {
            throw new RuntimeException("Request is not in PENDING status");
        }

        request.setStatus(RequestStatus.ASSIGNED);
        requestRepository.save(request);

        TaskAssignment task = new TaskAssignment();
        task.setRequest(request);
        task.setCollectorId(dto.getCollectorId());
        task.setStatus(RequestStatus.ASSIGNED);

        return taskRepository.save(task);
    }

    public List<TaskAssignment> getCollectorTasks(UUID collectorId) {
        return taskRepository.findByCollectorIdAndStatusIn(collectorId,
            java.util.List.of(RequestStatus.ASSIGNED, RequestStatus.ON_THE_WAY));
    }

    /** Lấy tất cả TaskAssignment đang ON_THE_WAY (dùng cho enterprise fleet status) */
    public List<TaskAssignment> getActiveOnTheWayTasks() {
        return taskRepository.findByStatus(RequestStatus.ON_THE_WAY);
    }

    public List<com.ecocycle.collection.dto.CollectorHistoryItemDto> getCollectorHistory(UUID collectorId) {
        List<TaskAssignment> completedTasks = taskRepository.findByCollectorIdAndStatusIn(collectorId,
            java.util.List.of(RequestStatus.COMPLETED, RequestStatus.COLLECTED));

        return completedTasks.stream().map(task -> {
            com.ecocycle.collection.domain.models.CollectionProof proof =
                proofRepository.findByTask(task).orElse(null);

            return com.ecocycle.collection.dto.CollectorHistoryItemDto.builder()
                .taskId(task.getId())
                .status(task.getStatus().name())
                .requestId(task.getRequest() != null ? task.getRequest().getId() : null)
                .wasteType(task.getRequest() != null ? task.getRequest().getType().name() : null)
                .location(task.getRequest() != null ? task.getRequest().getLocation() : null)
                .description(task.getRequest() != null ? task.getRequest().getDescription() : null)
                .photoUrl(proof != null ? proof.getPhotoUrl() : null)
                .weight(proof != null ? proof.getWeight() : null)
                .build();
        }).toList();
    }

    public List<com.ecocycle.collection.dto.CitizenHistoryItemDto> getCitizenCompletedTasks(UUID citizenId) {
        List<TaskAssignment> completedTasks = taskRepository.findByRequestCitizenIdAndStatusIn(citizenId,
            java.util.List.of(RequestStatus.COMPLETED, RequestStatus.COLLECTED));
            
        return completedTasks.stream().map(task -> {
            com.ecocycle.collection.domain.models.CollectionProof proof =
                proofRepository.findByTask(task).orElse(null);

            return com.ecocycle.collection.dto.CitizenHistoryItemDto.builder()
                .taskId(task.getId())
                .requestId(task.getRequest() != null ? task.getRequest().getId() : null)
                .collectorId(task.getCollectorId())
                .wasteType(task.getRequest() != null ? task.getRequest().getType().name() : null)
                .photoUrl(proof != null ? proof.getPhotoUrl() : null)
                .weight(proof != null ? proof.getWeight() : null)
                .completedAt(task.getRequest() != null ? task.getRequest().getCreatedAt().toString() : null)
                .build();
        }).toList();
    }


    @Transactional
    public TaskAssignment updateTaskStatus(UUID taskId, RequestStatus newStatus) {
        TaskAssignment task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("TaskAssignment not found"));
        
        task.setStatus(newStatus);
        
        // Cập nhật luôn trạng thái của WasteRequest để đồng bộ UI cho Citizen và Enterprise
        WasteRequest request = task.getRequest();
        if (request != null) {
            request.setStatus(newStatus);
            requestRepository.save(request);
        }
        
        return taskRepository.save(task);
    }

    @Transactional
    public CollectionProof confirmCollection(UUID taskId, ConfirmCollectionDto dto) {
        TaskAssignment task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("TaskAssignment not found"));

        if (task.getStatus() == RequestStatus.COMPLETED) {
            throw new RuntimeException("Task already completed");
        }

        task.setStatus(RequestStatus.COMPLETED);
        taskRepository.save(task);

        WasteRequest request = task.getRequest();
        request.setStatus(RequestStatus.COLLECTED);
        requestRepository.save(request);

        CollectionProof proof = new CollectionProof();
        proof.setTask(task);
        proof.setPhotoUrl(dto.getPhotoUrl());
        proof.setWeight(dto.getWeight());

        CollectionProof savedProof = proofRepository.save(proof);

        // Parse district từ location string (dạng "lat,lng" hoặc text địa chỉ)
        String location = request.getLocation() != null ? request.getLocation() : "";
        String district = extractDistrict(location);

        // Trigger a Kafka event to reward points to the citizen
        CollectionCompletedEvent event = CollectionCompletedEvent.builder()
                .wasteRequestId(request.getId().toString())
                .citizenId(request.getCitizenId().toString())
                .collectorId(task.getCollectorId().toString())
                .wasteType(request.getType().name())
                .weightInKg(dto.getWeight())
                .completedAt(java.time.Instant.now())
                .location(location)
                .district(district)
                .build();

        kafkaTemplate.send("waste.collection.completed", event);
        log.info("Emitted CollectionCompletedEvent for request {} district={}", request.getId(), district);

        // Thông báo cho doanh nghiệp biết đơn đã hoàn thành
        notifyEnterpriseCompletion(request, dto.getWeight());

        return savedProof;
    }

    /**
     * Trích xuất tên quận từ chuỗi location.
     * Nếu location là "lat,lng" thì dùng bảng ánh xạ toạ độ gần đúng.
     * Nếu location là địa chỉ text, tìm từ khoá "Quận" / "Huyện".
     */
    private String extractDistrict(String location) {
        if (location == null || location.isBlank()) return "Chưa xác định";

        // Kiểm tra nếu là địa chỉ text chứa từ khoá quận/huyện
        if (!location.matches("^[0-9.,\\s]+$")) {
            String lc = location.toLowerCase();

            if (lc.contains("quận 2") || lc.contains("quận 9") || lc.contains("thủ đức") || lc.contains("thu duc") || lc.contains("tp. thủ đức") || lc.contains("tp.thủ đức") || lc.contains("thành phố thủ đức")) {
                return "Thành phố Thủ Đức";
            }

            // Đưa các quận 2 chữ số lên trước để tránh việc "quận 1" ăn mất "quận 10", "quận 11", "quận 12"
            String[] keywords = {
                    "quận 10", "quận 11", "quận 12",
                    "quận 1", "quận 3", "quận 4", "quận 5",
                    "quận 6", "quận 7", "quận 8", 
                    "bình thạnh", "gò vấp", "phú nhuận", "tân bình", "tân phú",
                    "bình tân", "hóc môn", "củ chi", "bình chánh",
                    "nhà bè", "cần giờ"};
            for (String kw : keywords) {
                if (lc.contains(kw)) {
                    // Viết hoa chữ cái đầu của mỗi từ
                    String[] words = kw.split(" ");
                    StringBuilder sb = new StringBuilder();
                    for(String w : words) {
                        if (w.length() > 0) {
                            sb.append(Character.toUpperCase(w.charAt(0))).append(w.substring(1)).append(" ");
                        }
                    }
                    return sb.toString().trim();
                }
            }
            return "Khác";
        }

        // Trường hợp location dạng "lat,lng" — ánh xạ theo toạ độ trung tâm TP.HCM
        try {
            String[] parts = location.split(",");
            if (parts.length < 2) return "Chưa xác định";
            double lat = Double.parseDouble(parts[0].trim());
            double lng = Double.parseDouble(parts[1].trim());
            return mapCoordsToDistrict(lat, lng);
        } catch (NumberFormatException e) {
            return "Chưa xác định";
        }
    }

    /** Ánh xạ toạ độ tới tên quận/huyện TP.HCM theo bounding box mở rộng, phủ toàn bộ thành phố */
    private String mapCoordsToDistrict(double lat, double lng) {
        // Quận nội thành (mở rộng bounding box để khớp thực tế GPS)
        if (lat >= 10.768 && lat <= 10.795 && lng >= 106.688 && lng <= 106.715) return "Quận 1";
        if (lat >= 10.755 && lat <= 10.800 && lng >= 106.715 && lng <= 106.780) return "Thành phố Thủ Đức";
        if (lat >= 10.778 && lat <= 10.805 && lng >= 106.672 && lng <= 106.700) return "Quận 3";
        if (lat >= 10.740 && lat <= 10.772 && lng >= 106.692 && lng <= 106.728) return "Quận 4";
        if (lat >= 10.745 && lat <= 10.780 && lng >= 106.648 && lng <= 106.685) return "Quận 5";
        if (lat >= 10.728 && lat <= 10.760 && lng >= 106.615 && lng <= 106.665) return "Quận 6";
        if (lat >= 10.710 && lat <= 10.758 && lng >= 106.690 && lng <= 106.745) return "Quận 7";
        if (lat >= 10.712 && lat <= 10.752 && lng >= 106.605 && lng <= 106.668) return "Quận 8";
        if (lat >= 10.820 && lat <= 10.900 && lng >= 106.720 && lng <= 106.810) return "Thành phố Thủ Đức";
        if (lat >= 10.762 && lat <= 10.797 && lng >= 106.648 && lng <= 106.690) return "Quận 10";
        if (lat >= 10.748 && lat <= 10.785 && lng >= 106.625 && lng <= 106.668) return "Quận 11";
        if (lat >= 10.832 && lat <= 10.895 && lng >= 106.668 && lng <= 106.720) return "Quận 12";
        // Quận ngoại thành / huyện
        if (lat >= 10.795 && lat <= 10.845 && lng >= 106.690 && lng <= 106.745) return "Bình Thạnh";
        if (lat >= 10.808 && lat <= 10.870 && lng >= 106.638 && lng <= 106.700) return "Gò Vấp";
        if (lat >= 10.782 && lat <= 10.808 && lng >= 106.670 && lng <= 106.700) return "Phú Nhuận";
        if (lat >= 10.785 && lat <= 10.832 && lng >= 106.618 && lng <= 106.668) return "Tân Bình";
        if (lat >= 10.772 && lat <= 10.820 && lng >= 106.578 && lng <= 106.625) return "Tân Phú";
        if (lat >= 10.685 && lat <= 10.745 && lng >= 106.560 && lng <= 106.628) return "Bình Tân";
        if (lat >= 10.820 && lat <= 10.920 && lng >= 106.755 && lng <= 106.850) return "Thành phố Thủ Đức";
        if (lat >= 10.860 && lat <= 10.990 && lng >= 106.590 && lng <= 106.700) return "Hóc Môn";
        if (lat >= 10.900 && lat <= 11.150 && lng >= 106.350 && lng <= 106.620) return "Củ Chi";
        if (lat >= 10.620 && lat <= 10.720 && lng >= 106.540 && lng <= 106.670) return "Bình Chánh";
        if (lat >= 10.620 && lat <= 10.720 && lng >= 106.680 && lng <= 106.800) return "Nhà Bè";
        if (lat >= 10.350 && lat <= 10.640 && lng >= 106.700 && lng <= 107.050) return "Cần Giờ";
        // Nếu vẫn thuộc vùng TP.HCM chung (hoặc nằm ngoài hẳn 24 quận huyện)
        return "Ngoài TP.HCM";
    }

    /**
     * Tìm doanh nghiệp phục vụ khu vực của đơn và gửi thông báo "Đơn mới"
     */
    private void notifyEnterpriseNewRequest(WasteRequest request) {
        try {
            String district = request.getDistrict();
            if (district == null || district.isBlank()) return;

            // Gọi enterprise-service tìm doanh nghiệp theo quận
            java.net.URI searchUri = org.springframework.web.util.UriComponentsBuilder
                .fromHttpUrl(enterpriseServiceUrl)
                .path("/api/v1/enterprises/search")
                .queryParam("district", district)
                .queryParam("wasteType", request.getType().name())
                .encode()
                .build().toUri();

            org.springframework.core.ParameterizedTypeReference<List<java.util.Map<String, Object>>> typeRef =
                new org.springframework.core.ParameterizedTypeReference<>() {};
            org.springframework.http.ResponseEntity<List<java.util.Map<String, Object>>> resp =
                restTemplate.exchange(searchUri, org.springframework.http.HttpMethod.GET, null, typeRef);

            List<java.util.Map<String, Object>> enterprises = resp.getBody();
            if (enterprises == null || enterprises.isEmpty()) return;

            for (java.util.Map<String, Object> ent : enterprises) {
                Object ownerUserId = ent.get("ownerUserId");
                if (ownerUserId == null) continue;

                java.util.Map<String, Object> notification = new java.util.HashMap<>();
                notification.put("userId", ownerUserId.toString());
                notification.put("title", "🚨 Đơn thu gom mới trong khu vực!");
                notification.put("message", String.format(
                    "Đầu việc ID: %s — Loại rác: %s — Quận: %s. Hãy vào Bản đồ điều phối để xử lý!",
                    request.getId().toString().substring(0, 8),
                    request.getType().name(),
                    district
                ));
                notification.put("type", "COLLECTION");
                notification.put("isRead", false);

                org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
                headers.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);
                org.springframework.http.HttpEntity<java.util.Map<String, Object>> requestEntity = 
                    new org.springframework.http.HttpEntity<>(notification, headers);

                restTemplate.postForObject(
                    notificationServiceUrl + "/api/v1/notifications/internal",
                    requestEntity,
                    Object.class
                );
                log.info("📨 Gửi thông báo đơn mới cho enterprise owner: {}", ownerUserId);
            }
        } catch (Exception e) {
            log.warn("Không gửi được thông báo enterprise (non-critical): {}", e.getMessage());
        }
    }

    /**
     * Thông báo cho doanh nghiệp khi đơn thu gom hoàn thành
     */
    private void notifyEnterpriseCompletion(WasteRequest request, Double weight) {
        try {
            String district = request.getDistrict();
            if (district == null || district.isBlank()) return;

            java.net.URI searchUri = org.springframework.web.util.UriComponentsBuilder
                .fromHttpUrl(enterpriseServiceUrl)
                .path("/api/v1/enterprises/search")
                .queryParam("district", district)
                .queryParam("wasteType", request.getType().name())
                .encode()
                .build().toUri();

            org.springframework.core.ParameterizedTypeReference<List<java.util.Map<String, Object>>> typeRef =
                new org.springframework.core.ParameterizedTypeReference<>() {};
            org.springframework.http.ResponseEntity<List<java.util.Map<String, Object>>> resp =
                restTemplate.exchange(searchUri, org.springframework.http.HttpMethod.GET, null, typeRef);

            List<java.util.Map<String, Object>> enterprises = resp.getBody();
            if (enterprises == null || enterprises.isEmpty()) return;

            for (java.util.Map<String, Object> ent : enterprises) {
                Object ownerUserId = ent.get("ownerUserId");
                if (ownerUserId == null) continue;

                java.util.Map<String, Object> notification = new java.util.HashMap<>();
                notification.put("userId", ownerUserId.toString());
                notification.put("title", "✅ Đơn thu gom đã hoàn thành!");
                notification.put("message", String.format(
                    "Đơn ID: %s — Quận: %s — Khối lượng: %.1f kg. Dữ liệu đã được cập nhật vào thống kê.",
                    request.getId().toString().substring(0, 8),
                    district,
                    weight != null ? weight : 0.0
                ));
                notification.put("type", "SYSTEM");
                notification.put("isRead", false);

                org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
                headers.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);
                org.springframework.http.HttpEntity<java.util.Map<String, Object>> requestEntity = 
                    new org.springframework.http.HttpEntity<>(notification, headers);

                restTemplate.postForObject(
                    notificationServiceUrl + "/api/v1/notifications/internal",
                    requestEntity,
                    Object.class
                );
                log.info("📨 Gửi thông báo hoàn thành đơn cho enterprise owner: {}", ownerUserId);
            }
        } catch (Exception e) {
            log.warn("Không gửi được thông báo hoàn thành (non-critical): {}", e.getMessage());
        }
    }
}

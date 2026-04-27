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

    @Transactional
    public WasteRequest createWasteRequest(CreateWasteRequestDto dto) {
        log.info("Creating waste request for citizen: {}", dto.getCitizenId());
        WasteRequest request = new WasteRequest();
        request.setCitizenId(dto.getCitizenId());
        request.setType(dto.getType());
        request.setLocation(dto.getLocation());
        request.setImageUrl(dto.getImageUrl());
        request.setDescription(dto.getDescription());
        request.setStatus(RequestStatus.PENDING);

        return requestRepository.save(request);
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

        return requestRepository.save(request);
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

        // Trigger a Kafka event to reward points to the citizen
        CollectionCompletedEvent event = CollectionCompletedEvent.builder()
                .wasteRequestId(request.getId().toString())
                .citizenId(request.getCitizenId().toString())
                .collectorId(task.getCollectorId().toString())
                .wasteType(request.getType().name())
                .weightInKg(dto.getWeight())
                .completedAt(java.time.Instant.now())
                .build();

        kafkaTemplate.send("waste.collection.completed", event);
        log.info("Emitted CollectionCompletedEvent for request {}", request.getId());

        return savedProof;
    }
}

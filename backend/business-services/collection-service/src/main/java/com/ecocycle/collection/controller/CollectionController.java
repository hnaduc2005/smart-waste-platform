package com.ecocycle.collection.controller;

import com.ecocycle.collection.domain.models.CollectionProof;
import com.ecocycle.collection.domain.models.TaskAssignment;
import com.ecocycle.collection.domain.models.WasteRequest;
import com.ecocycle.collection.dto.AssignTaskDto;
import com.ecocycle.collection.dto.ConfirmCollectionDto;
import com.ecocycle.collection.dto.CreateWasteRequestDto;
import com.ecocycle.collection.repository.WasteRequestRepository;
import com.ecocycle.collection.service.CollectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/collections")
@RequiredArgsConstructor

public class CollectionController {

    private final CollectionService collectionService;
    private final WasteRequestRepository requestRepository;

    // --- Citizen APIs ---
    @PostMapping({"/requests", "/request"})
    public ResponseEntity<WasteRequest> createWasteRequest(@RequestBody CreateWasteRequestDto dto) {
        System.out.println("DEBUG: createWasteRequest called for citizen " + dto.getCitizenId());
        return new ResponseEntity<>(collectionService.createWasteRequest(dto), HttpStatus.CREATED);
    }

    @PostMapping(value = "/requests/with-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<WasteRequest> createWasteRequestWithImage(
            @RequestParam("citizenId") UUID citizenId,
            @RequestParam("location") String location,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam("image") MultipartFile image) {
        System.out.println("DEBUG: createWasteRequestWithImage called for citizen " + citizenId + ", location " + location);
        return new ResponseEntity<>(collectionService.detectAndCreateWasteRequest(citizenId, location, description, image), HttpStatus.CREATED);
    }

    @GetMapping("/requests/citizen/{citizenId}")
    public ResponseEntity<List<WasteRequest>> getCitizenRequests(@PathVariable UUID citizenId) {
        return ResponseEntity.ok(collectionService.getCitizenRequests(citizenId));
    }

    @GetMapping("/tasks/citizen/{citizenId}/history")
    public ResponseEntity<List<com.ecocycle.collection.dto.CitizenHistoryItemDto>> getCitizenCompletedTasks(
            @PathVariable UUID citizenId) {
        return ResponseEntity.ok(collectionService.getCitizenCompletedTasks(citizenId));
    }

    // --- Enterprise APIs ---

    @GetMapping("/requests")
    public ResponseEntity<List<WasteRequest>> getAllRequests(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String district) {

        // Nếu có lọc district
        if (district != null && !district.isBlank()) {
            // Normalize: "Quận Bình Thạnh" -> "Bình Thạnh", nhưng "Quận 1" giữ nguyên
            List<String> rawDistricts = List.of(district.split(","));
            List<String> districts = rawDistricts.stream()
                .map(String::trim)
                .flatMap(d -> {
                    // Tạo cả 2 biến thể: có và không có "Quận " prefix để match linh hoạt
                    java.util.Set<String> variants = new java.util.LinkedHashSet<>();
                    variants.add(d);
                    if (d.startsWith("Quận ") && !d.matches("Quận \\d+")) {
                        variants.add(d.substring(5)); // "Quận Bình Thạnh" -> "Bình Thạnh"
                    } else if (!d.startsWith("Quận ") && !d.matches("\\d+")) {
                        variants.add("Quận " + d); // "Bình Thạnh" -> "Quận Bình Thạnh"
                    }
                    return variants.stream();
                })
                .collect(java.util.stream.Collectors.toList());
            if (status != null) {
                try {
                    com.ecocycle.collection.domain.enums.RequestStatus s =
                        com.ecocycle.collection.domain.enums.RequestStatus.valueOf(status);
                    return ResponseEntity.ok(
                        requestRepository.findByStatusAndDistrictIn(s, districts));
                } catch (IllegalArgumentException e) {
                    return ResponseEntity.badRequest().build();
                }
            }
            return ResponseEntity.ok(requestRepository.findByDistrictIn(districts));
        }

        // Không có district → filter theo status hoặc lấy tất cả
        if (status != null) {
            try {
                com.ecocycle.collection.domain.enums.RequestStatus s =
                    com.ecocycle.collection.domain.enums.RequestStatus.valueOf(status);
                return ResponseEntity.ok(collectionService.getRequestsByStatus(s));
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().build();
            }
        }
        return ResponseEntity.ok(collectionService.getAllRequests());
    }

    @GetMapping("/requests/pending")
    public ResponseEntity<List<WasteRequest>> getPendingRequests() {
        return ResponseEntity.ok(collectionService.getPendingRequests());
    }

    @PatchMapping("/requests/{requestId}/reject")
    public ResponseEntity<WasteRequest> rejectRequest(@PathVariable UUID requestId) {
        return collectionService.rejectRequest(requestId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/tasks/assign")
    public ResponseEntity<TaskAssignment> assignTask(@RequestBody AssignTaskDto dto) {
        return ResponseEntity.ok(collectionService.assignTask(dto));
    }

    // --- Collector APIs ---

    @GetMapping("/tasks/collector/{collectorId}")
    public ResponseEntity<List<TaskAssignment>> getCollectorTasks(@PathVariable UUID collectorId) {
        return ResponseEntity.ok(collectionService.getCollectorTasks(collectorId));
    }

    /** GET /tasks/active — Lấy tất cả TaskAssignment đang ON_THE_WAY (dùng cho enterprise fleet status) */
    @GetMapping("/tasks/active")
    public ResponseEntity<List<TaskAssignment>> getActiveOnTheWayTasks() {
        return ResponseEntity.ok(collectionService.getActiveOnTheWayTasks());
    }

    @GetMapping("/tasks/collector/{collectorId}/history")
    public ResponseEntity<List<com.ecocycle.collection.dto.CollectorHistoryItemDto>> getCollectorHistory(
            @PathVariable UUID collectorId) {
        return ResponseEntity.ok(collectionService.getCollectorHistory(collectorId));
    }


    @PatchMapping("/tasks/{taskId}/status")
    public ResponseEntity<TaskAssignment> updateTaskStatus(
            @PathVariable UUID taskId,
            @RequestParam String status) {
        com.ecocycle.collection.domain.enums.RequestStatus newStatus = com.ecocycle.collection.domain.enums.RequestStatus.valueOf(status);
        return ResponseEntity.ok(collectionService.updateTaskStatus(taskId, newStatus));
    }

    @PostMapping("/tasks/{taskId}/confirm")
    public ResponseEntity<CollectionProof> confirmCollection(
            @PathVariable UUID taskId,
            @RequestBody ConfirmCollectionDto dto) {
        return ResponseEntity.ok(collectionService.confirmCollection(taskId, dto));
    }

}

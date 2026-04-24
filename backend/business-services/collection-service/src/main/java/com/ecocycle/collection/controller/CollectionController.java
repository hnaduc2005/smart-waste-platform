package com.ecocycle.collection.controller;

import com.ecocycle.collection.domain.models.CollectionProof;
import com.ecocycle.collection.domain.models.TaskAssignment;
import com.ecocycle.collection.domain.models.WasteRequest;
import com.ecocycle.collection.dto.AssignTaskDto;
import com.ecocycle.collection.dto.ConfirmCollectionDto;
import com.ecocycle.collection.dto.CreateWasteRequestDto;
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
@CrossOrigin(origins = "*")
public class CollectionController {

    private final CollectionService collectionService;

    // --- Citizen APIs ---

    @PostMapping({"/requests", "/request"})
    public ResponseEntity<WasteRequest> createWasteRequest(@RequestBody CreateWasteRequestDto dto) {
        return new ResponseEntity<>(collectionService.createWasteRequest(dto), HttpStatus.CREATED);
    }

    @PostMapping(value = "/requests/with-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<WasteRequest> createWasteRequestWithImage(
            @RequestParam("citizenId") UUID citizenId,
            @RequestParam("location") String location,
            @RequestPart("image") MultipartFile image) {
        return new ResponseEntity<>(collectionService.detectAndCreateWasteRequest(citizenId, location, image), HttpStatus.CREATED);
    }

    @GetMapping("/requests/citizen/{citizenId}")
    public ResponseEntity<List<WasteRequest>> getCitizenRequests(@PathVariable UUID citizenId) {
        return ResponseEntity.ok(collectionService.getCitizenRequests(citizenId));
    }

    // --- Enterprise APIs ---

    @GetMapping("/requests/pending")
    public ResponseEntity<List<WasteRequest>> getPendingRequests() {
        return ResponseEntity.ok(collectionService.getPendingRequests());
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

    @PostMapping("/tasks/{taskId}/confirm")
    public ResponseEntity<CollectionProof> confirmCollection(
            @PathVariable UUID taskId,
            @RequestBody ConfirmCollectionDto dto) {
        return ResponseEntity.ok(collectionService.confirmCollection(taskId, dto));
    }

}

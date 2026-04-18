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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CollectionService {

    private final WasteRequestRepository requestRepository;
    private final TaskAssignmentRepository taskRepository;
    private final CollectionProofRepository proofRepository;

    @Transactional
    public WasteRequest createWasteRequest(CreateWasteRequestDto dto) {
        log.info("Creating waste request for citizen: {}", dto.getCitizenId());
        WasteRequest request = new WasteRequest();
        request.setCitizenId(dto.getCitizenId());
        request.setType(dto.getType());
        request.setLocation(dto.getLocation());
        request.setImageUrl(dto.getImageUrl());
        request.setStatus(RequestStatus.PENDING);
        
        return requestRepository.save(request);
    }

    public List<WasteRequest> getPendingRequests() {
        return requestRepository.findByStatus(RequestStatus.PENDING);
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
        return taskRepository.findByCollectorIdAndStatus(collectorId, RequestStatus.ASSIGNED);
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

        // Here we could also trigger a Kafka event to reward points to the citizen
        // e.g. kafkaTemplate.send("waste-collected-event", ...)

        return proofRepository.save(proof);
    }
}

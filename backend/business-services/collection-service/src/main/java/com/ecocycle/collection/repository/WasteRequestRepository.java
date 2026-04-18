package com.ecocycle.collection.repository;

import com.ecocycle.collection.domain.enums.RequestStatus;
import com.ecocycle.collection.domain.models.WasteRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface WasteRequestRepository extends JpaRepository<WasteRequest, UUID> {
    List<WasteRequest> findByCitizenId(UUID citizenId);
    List<WasteRequest> findByStatus(RequestStatus status);
}

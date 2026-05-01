package com.ecocycle.user.repository;

import com.ecocycle.user.domain.models.Complaint;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ComplaintRepository extends JpaRepository<Complaint, UUID> {
    List<Complaint> findAllByOrderByCreatedAtDesc();
    List<Complaint> findByCitizenIdOrderByCreatedAtDesc(UUID citizenId);
}

package com.ecocycle.user.service;

import com.ecocycle.user.domain.models.Complaint;
import com.ecocycle.user.repository.ComplaintRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ComplaintService {

    private final ComplaintRepository complaintRepository;

    public List<Complaint> getAll() {
        return complaintRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<Complaint> getMyCitizenComplaints(UUID citizenId) {
        return complaintRepository.findByCitizenIdOrderByCreatedAtDesc(citizenId);
    }

    @Transactional
    public Complaint create(Map<String, Object> body) {
        Complaint c = new Complaint();
        c.setCitizenId(UUID.fromString((String) body.get("citizenId")));
        c.setCitizenName((String) body.getOrDefault("citizenName", ""));
        c.setTitle((String) body.get("title"));
        c.setDescription((String) body.getOrDefault("description", ""));
        c.setType((String) body.getOrDefault("type", "OTHER"));
        if (body.get("requestId") != null)
            c.setRequestId(UUID.fromString((String) body.get("requestId")));
        return complaintRepository.save(c);
    }

    @Transactional
    public Complaint resolve(UUID id, Map<String, String> body) {
        Complaint c = complaintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Complaint not found: " + id));
        c.setStatus(body.getOrDefault("status", "RESOLVED"));
        c.setAdminNote(body.getOrDefault("adminNote", ""));
        if (body.get("resolvedBy") != null)
            c.setResolvedBy(UUID.fromString(body.get("resolvedBy")));
        c.setResolvedAt(LocalDateTime.now());
        return complaintRepository.save(c);
    }
}

package com.ecocycle.user.controller;

import com.ecocycle.user.domain.models.Complaint;
import com.ecocycle.user.domain.models.UserProfileBase;
import com.ecocycle.user.domain.enums.Role;
import com.ecocycle.user.repository.UserProfileRepository;
import com.ecocycle.user.service.ComplaintService;
import com.ecocycle.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final ComplaintService complaintService;
    private final UserProfileRepository userProfileRepository;

    // ─── Profile endpoints ────────────────────────────────────────────────

    @GetMapping("/users/{id}")
    public ResponseEntity<UserProfileBase> getUserProfile(@PathVariable UUID id) {
        return ResponseEntity.ok(userService.getUserProfile(id));
    }

    @GetMapping("/users/collectors")
    public ResponseEntity<List<UserProfileBase>> getCollectors() {
        return ResponseEntity.ok(userService.getCollectors());
    }

    @GetMapping("/users/enterprises")
    public ResponseEntity<List<UserProfileBase>> getEnterprises() {
        return ResponseEntity.ok(userService.getEnterprises());
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<UserProfileBase> updateUserProfile(
            @PathVariable UUID id,
            @RequestBody Map<String, Object> updates) {
        return ResponseEntity.ok(userService.updateProfile(id, updates));
    }

    /** Admin: lấy tất cả users theo role */
    @GetMapping("/users/all")
    public ResponseEntity<List<UserProfileBase>> getAllByRole(
            @RequestParam(defaultValue = "CITIZEN") String role) {
        try {
            Role r = Role.valueOf(role.toUpperCase());
            return ResponseEntity.ok(userProfileRepository.findByRole(r));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.ok(userProfileRepository.findAll());
        }
    }

    // ─── Complaint endpoints ──────────────────────────────────────────────

    /** Citizen tạo khiếu nại */
    @PostMapping("/complaints")
    public ResponseEntity<Complaint> createComplaint(@RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(complaintService.create(body));
    }

    /** Admin: xem tất cả khiếu nại */
    @GetMapping("/complaints")
    public ResponseEntity<List<Complaint>> getAllComplaints() {
        return ResponseEntity.ok(complaintService.getAll());
    }

    /** Citizen: xem khiếu nại của mình */
    @GetMapping("/complaints/me/{citizenId}")
    public ResponseEntity<List<Complaint>> getMyCitizenComplaints(@PathVariable UUID citizenId) {
        return ResponseEntity.ok(complaintService.getMyCitizenComplaints(citizenId));
    }

    /** Admin: giải quyết khiếu nại */
    @PutMapping("/complaints/{id}/resolve")
    public ResponseEntity<Complaint> resolveComplaint(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(complaintService.resolve(id, body));
    }
}

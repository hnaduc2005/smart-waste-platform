package com.ecocycle.user.service;

import com.ecocycle.common.events.UserRegisteredEvent;
import com.ecocycle.user.domain.enums.Role;
import com.ecocycle.user.domain.models.CitizenProfile;
import com.ecocycle.user.domain.models.CollectorProfile;
import com.ecocycle.user.domain.models.EnterpriseProfile;
import com.ecocycle.user.domain.models.UserProfileBase;
import com.ecocycle.user.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserProfileRepository userProfileRepository;

    @Transactional
    public void createUserProfileFromEvent(UserRegisteredEvent event) {
        log.info("Processing UserRegisteredEvent for user: {}", event.getUserId());
        UUID userId = UUID.fromString(event.getUserId());
        
        Optional<UserProfileBase> existingProfile = userProfileRepository.findById(userId);
        if (existingProfile.isPresent()) {
            log.warn("Profile already exists for user: {}", userId);
            return;
        }

        Role role;
        try {
            role = Role.valueOf(event.getRole());
        } catch (IllegalArgumentException e) {
            log.error("Unknown role {} for user {}", event.getRole(), userId);
            return;
        }

        UserProfileBase profile;
        switch (role) {
            case CITIZEN:
                CitizenProfile cp = new CitizenProfile();
                cp.setId(userId);
                cp.setRole(role);
                cp.setFullName(event.getUsername());
                profile = cp;
                break;
            case COLLECTOR:
                CollectorProfile colp = new CollectorProfile();
                colp.setId(userId);
                colp.setRole(role);
                colp.setFullName(event.getUsername());
                profile = colp;
                break;
            case ENTERPRISE:
                EnterpriseProfile ep = new EnterpriseProfile();
                ep.setId(userId);
                ep.setRole(role);
                ep.setCompanyName(event.getUsername());
                profile = ep;
                break;
            default:
                log.error("Unhandled role {} for user {}", role, userId);
                return;
        }

        userProfileRepository.save(profile);
        log.info("Successfully created {} profile for user: {}", role, userId);
    }

    public UserProfileBase getUserProfile(UUID userId) {
        return userProfileRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Profile not found for user: " + userId));
    }
}

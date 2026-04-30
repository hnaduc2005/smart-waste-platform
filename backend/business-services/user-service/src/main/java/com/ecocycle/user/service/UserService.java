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
import java.util.Map;

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

    public java.util.List<UserProfileBase> getCollectors() {
        return userProfileRepository.findByRole(Role.COLLECTOR);
    }

    public java.util.List<UserProfileBase> getEnterprises() {
        return userProfileRepository.findByRole(Role.ENTERPRISE);
    }

    @Transactional
    public UserProfileBase updateProfile(UUID userId, Map<String, Object> updates) {
        UserProfileBase profile = getUserProfile(userId);
        
        if (profile instanceof CitizenProfile) {
            CitizenProfile cp = (CitizenProfile) profile;
            if (updates.containsKey("fullName")) cp.setFullName((String) updates.get("fullName"));
            if (updates.containsKey("address")) cp.setAddress((String) updates.get("address"));
        } else if (profile instanceof CollectorProfile) {
            CollectorProfile cp = (CollectorProfile) profile;
            if (updates.containsKey("fullName")) cp.setFullName((String) updates.get("fullName"));
            if (updates.containsKey("vehiclePlate")) cp.setVehiclePlate((String) updates.get("vehiclePlate"));
            if (updates.containsKey("isOnline")) cp.setIsOnline((Boolean) updates.get("isOnline"));
            if (updates.containsKey("latitude")) cp.setLatitude(((Number) updates.get("latitude")).doubleValue());
            if (updates.containsKey("longitude")) cp.setLongitude(((Number) updates.get("longitude")).doubleValue());
            if (updates.containsKey("companyName")) cp.setCompanyName((String) updates.get("companyName"));
        } else if (profile instanceof EnterpriseProfile) {
            EnterpriseProfile ep = (EnterpriseProfile) profile;
            if (updates.containsKey("companyName")) ep.setCompanyName((String) updates.get("companyName"));
            if (updates.containsKey("name")) ep.setCompanyName((String) updates.get("name")); // frontend uses "name"
            if (updates.containsKey("licenseNumber")) ep.setLicenseNumber((String) updates.get("licenseNumber"));
            if (updates.containsKey("dailyCapacity")) {
                Object capacity = updates.get("dailyCapacity");
                if (capacity instanceof Number) {
                    ep.setDailyCapacity(((Number) capacity).doubleValue());
                } else if (capacity instanceof String && !((String) capacity).isEmpty()) {
                    ep.setDailyCapacity(Double.parseDouble((String) capacity));
                }
            }
            if (updates.containsKey("serviceArea")) ep.setServiceArea((String) updates.get("serviceArea"));
            if (updates.containsKey("acceptedWasteTypes")) ep.setAcceptedWasteTypes((String) updates.get("acceptedWasteTypes"));
            if (updates.containsKey("phone")) ep.setPhone((String) updates.get("phone"));
            if (updates.containsKey("email")) ep.setEmail((String) updates.get("email"));
            if (updates.containsKey("address")) ep.setAddress((String) updates.get("address"));
        }
        
        return userProfileRepository.save(profile);
    }
}

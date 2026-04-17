package com.ecocycle.notification.service;

import com.ecocycle.notification.domain.models.DeviceToken;
import com.ecocycle.notification.repository.DeviceTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class DeviceTokenService {

    private final DeviceTokenRepository deviceTokenRepository;

    public DeviceToken saveOrUpdateDeviceToken(UUID userId, String token, String deviceType) {
        Optional<DeviceToken> existingToken = deviceTokenRepository.findByToken(token);
        
        if (existingToken.isPresent()) {
            DeviceToken dt = existingToken.get();
            dt.setUserId(userId);
            dt.setDeviceType(deviceType);
            log.info("Updating existing device token for user: {}", userId);
            return deviceTokenRepository.save(dt);
        } else {
            DeviceToken newToken = DeviceToken.builder()
                    .userId(userId)
                    .token(token)
                    .deviceType(deviceType)
                    .build();
            log.info("Saving new device token for user: {}", userId);
            return deviceTokenRepository.save(newToken);
        }
    }
    
    public List<DeviceToken> getTokensByUserId(UUID userId) {
        return deviceTokenRepository.findByUserId(userId);
    }
}

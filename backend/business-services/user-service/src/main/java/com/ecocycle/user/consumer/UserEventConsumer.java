package com.ecocycle.user.consumer;

import com.ecocycle.common.events.UserRegisteredEvent;
import com.ecocycle.user.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class UserEventConsumer {

    private final UserService userService;

    @KafkaListener(topics = "user.registered", groupId = "${spring.kafka.consumer.group-id}")
    public void consumeUserRegisteredEvent(UserRegisteredEvent event) {
        log.info("Received UserRegisteredEvent: {}", event);
        try {
            userService.createUserProfileFromEvent(event);
        } catch (Exception e) {
            log.error("Error processing UserRegisteredEvent: {}", e.getMessage(), e);
        }
    }
}

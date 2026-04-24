package com.ecocycle.user.controller;

import com.ecocycle.user.domain.models.UserProfileBase;
import com.ecocycle.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class UserController {

    private final UserService userService;

    @GetMapping("/{id}")
    public ResponseEntity<UserProfileBase> getUserProfile(@PathVariable UUID id) {
        UserProfileBase profile = userService.getUserProfile(id);
        return ResponseEntity.ok(profile);
    }
}

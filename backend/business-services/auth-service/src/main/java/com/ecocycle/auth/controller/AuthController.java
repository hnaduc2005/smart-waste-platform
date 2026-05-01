package com.ecocycle.auth.controller;

import com.ecocycle.auth.dto.AuthResponse;
import com.ecocycle.auth.dto.LoginRequest;
import com.ecocycle.auth.dto.RefreshTokenRequest;
import com.ecocycle.auth.dto.RegisterRequest;
import com.ecocycle.auth.security.JwtUtils;
import com.ecocycle.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * REST Controller cho các luồng xác thực.
 * Base path: /api/v1/auth
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthService authService;
    private final JwtUtils jwtUtils;

    /**
     * POST /api/v1/auth/register
     * Đăng ký tài khoản mới và trả về JWT ngay lập tức.
     */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        log.info("Register request for username: {}", request.username());
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * POST /api/v1/auth/login
     * Đăng nhập bằng username + password, trả về accessToken + refreshToken.
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        log.info("Login request for username: {}", request.username());
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/v1/auth/refresh-token
     * Dùng refreshToken để lấy accessToken mới (token rotation).
     */
    @PostMapping("/refresh-token")
    public ResponseEntity<AuthResponse> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        AuthResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/v1/auth/logout
     * Blacklist accessToken hiện tại và xóa toàn bộ refreshToken của user.
     * Yêu cầu Bearer token hợp lệ trong header Authorization.
     */
    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(
            @RequestHeader("Authorization") String authHeader,
            @AuthenticationPrincipal UserDetails userDetails) {

        if (!StringUtils.hasText(authHeader) || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Authorization header không hợp lệ"));
        }

        String token = authHeader.substring(7);
        authService.logout(token, userDetails.getUsername());
        return ResponseEntity.ok(Map.of("message", "Đăng xuất thành công"));
    }

    /**
     * GET /api/v1/auth/me
     * Lấy thông tin user hiện tại dựa trên JWT (dùng để test token).
     */
    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getCurrentUser(
            @RequestHeader("Authorization") String authHeader) {

        String token = authHeader.substring(7);
        String username = jwtUtils.extractUsername(token);
        String userId = jwtUtils.extractUserId(token);
        String role = jwtUtils.extractRole(token);

        return ResponseEntity.ok(Map.of(
                "userId", userId,
                "username", username,
                "role", role
        ));
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<Map<String, String>> getUserById(@PathVariable java.util.UUID id) {
        return authService.getUserById(id)
                .map(user -> ResponseEntity.ok(Map.of("email", user.getEmail())))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * PUT /api/v1/auth/users/{id}/email
     * Cập nhật email của user.
     */
    @PutMapping("/users/{id}/email")
    public ResponseEntity<Map<String, String>> updateUserEmail(
            @PathVariable java.util.UUID id, 
            @RequestBody Map<String, String> request) {
        String newEmail = request.get("email");
        authService.updateUserEmail(id, newEmail);
        return ResponseEntity.ok(Map.of("message", "Cập nhật email thành công"));
    }

    /**
     * POST /api/v1/auth/forgot-password
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        authService.forgotPassword(email);
        return ResponseEntity.ok(Map.of("message", "Mã OTP đã được gửi đến email của bạn"));
    }

    /**
     * POST /api/v1/auth/reset-password
     */
    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String otp = request.get("otp");
        String newPassword = request.get("newPassword");
        
        authService.resetPassword(email, otp, newPassword);
        return ResponseEntity.ok(Map.of("message", "Đặt lại mật khẩu thành công"));
    }

    // ─────────────────────────────────────────────────────────────
    // ADMIN ENDPOINTS
    // ─────────────────────────────────────────────────────────────

    @GetMapping("/admin/users/stats/growth")
    public ResponseEntity<java.util.List<Map<String, Object>>> getUserGrowth() {
        return ResponseEntity.ok(authService.getUserGrowth());
    }

    @GetMapping("/admin/users/recent")
    public ResponseEntity<java.util.List<Map<String, Object>>> getRecentUsers() {
        return ResponseEntity.ok(authService.getRecentUsers());
    }

    @GetMapping("/admin/users/count")
    public ResponseEntity<Map<String, Object>> getTotalUsers() {
        return ResponseEntity.ok(authService.getTotalUsers());
    }

    @PutMapping("/admin/users/{userId}/lock")
    public ResponseEntity<Map<String, Object>> setUserLocked(
            @PathVariable java.util.UUID userId,
            @RequestBody Map<String, Boolean> body) {
        boolean locked = Boolean.TRUE.equals(body.get("locked"));
        return ResponseEntity.ok(authService.setUserLocked(userId, locked));
    }

    @PutMapping("/admin/users/{userId}/role")
    public ResponseEntity<Map<String, Object>> changeUserRole(
            @PathVariable java.util.UUID userId,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(authService.changeRole(userId, body.get("role")));
    }

    @GetMapping("/admin/users")
    public ResponseEntity<java.util.List<Map<String, Object>>> getAllUsers(
            @RequestParam(defaultValue = "ALL") String role) {
        return ResponseEntity.ok(authService.getAllUsersByRole(role));
    }
}

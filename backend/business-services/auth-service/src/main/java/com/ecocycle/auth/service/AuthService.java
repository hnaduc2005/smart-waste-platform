package com.ecocycle.auth.service;

import com.ecocycle.auth.domain.enums.UserStatus;
import com.ecocycle.auth.domain.models.RefreshToken;
import com.ecocycle.auth.domain.models.UserAuth;
import com.ecocycle.auth.dto.AuthResponse;
import com.ecocycle.auth.dto.LoginRequest;
import com.ecocycle.auth.dto.RefreshTokenRequest;
import com.ecocycle.auth.dto.RegisterRequest;
import com.ecocycle.auth.repository.RefreshTokenRepository;
import com.ecocycle.auth.repository.UserAuthRepository;
import com.ecocycle.auth.security.JwtUtils;
import com.ecocycle.common.events.UserRegisteredEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.concurrent.TimeUnit;
import java.util.Map;

/**
 * Core business logic cho toàn bộ luồng xác thực:
 * register → login → refresh-token → logout.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private static final String USER_REGISTERED_TOPIC = "user.registered";
    private static final String BLACKLIST_PREFIX = "blacklist:";

    private final UserAuthRepository userAuthRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final StringRedisTemplate redisTemplate;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${jwt.expiration-ms}")
    private long jwtExpirationMs;

    @Value("${jwt.refresh-expiration-ms}")
    private long refreshExpirationMs;

    // ─────────────────────────────────────────────────────────────
    // 1. ĐĂNG KÝ
    // ─────────────────────────────────────────────────────────────

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (userAuthRepository.existsByUsername(req.username())) {
            throw new IllegalArgumentException("Username đã tồn tại: " + req.username());
        }
        if (userAuthRepository.existsByEmail(req.email())) {
            throw new IllegalArgumentException("Email đã được đăng ký: " + req.email());
        }

        UserAuth newUser = UserAuth.builder()
                .username(req.username())
                .email(req.email())
                .passwordHash(passwordEncoder.encode(req.password()))
                .role(req.role())
                .status(UserStatus.ACTIVE)
                .build();

        UserAuth savedUser = userAuthRepository.save(newUser);
        log.info("User mới đã đăng ký: {} [{}]", savedUser.getUsername(), savedUser.getRole());

        // Bắn Kafka event để user-service tạo profile tương ứng
        UserRegisteredEvent event = UserRegisteredEvent.builder()
                .userId(savedUser.getId().toString())
                .username(savedUser.getUsername())
                .email(savedUser.getEmail())
                .role(savedUser.getRole().name())
                .registeredAt(Instant.now())
                .build();
        kafkaTemplate.send(USER_REGISTERED_TOPIC, savedUser.getId().toString(), event);
        log.info("Đã bắn event UserRegistered lên Kafka cho userId: {}", savedUser.getId());

        return buildAuthResponse(savedUser);
    }

    // ─────────────────────────────────────────────────────────────
    // 2. ĐĂNG NHẬP
    // ─────────────────────────────────────────────────────────────

    @Transactional
    public AuthResponse login(LoginRequest req) {
        // Để Spring Security xác thực username/password – sẽ throw nếu sai
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.username(), req.password())
        );

        UserAuth user = userAuthRepository.findByUsername(req.username())
                .orElseThrow(() -> new IllegalArgumentException("User không tồn tại"));

        if (user.getStatus() == UserStatus.LOCKED) {
            throw new IllegalStateException("Tài khoản đã bị khóa");
        }

        return buildAuthResponse(user);
    }

    // ─────────────────────────────────────────────────────────────
    // 3. LÀM MỚI TOKEN
    // ─────────────────────────────────────────────────────────────

    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest req) {
        RefreshToken storedToken = refreshTokenRepository.findByToken(req.refreshToken())
                .orElseThrow(() -> new IllegalArgumentException("Refresh token không hợp lệ hoặc đã hết hạn"));

        if (storedToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            refreshTokenRepository.delete(storedToken);
            throw new IllegalArgumentException("Refresh token đã hết hạn, vui lòng đăng nhập lại");
        }

        UserAuth user = storedToken.getUser();
        // Xóa refresh token cũ, tạo mới (rotation)
        refreshTokenRepository.delete(storedToken);

        return buildAuthResponse(user);
    }

    // ─────────────────────────────────────────────────────────────
    // 4. ĐĂNG XUẤT
    // ─────────────────────────────────────────────────────────────

    @Transactional
    public void logout(String accessToken, String username) {
        // Blacklist access token trên Redis cho đến khi hết hạn
        long remainingMs = jwtUtils.extractExpiration(accessToken).getTime() - System.currentTimeMillis();
        if (remainingMs > 0) {
            redisTemplate.opsForValue().set(
                    BLACKLIST_PREFIX + accessToken,
                    "logout",
                    remainingMs,
                    TimeUnit.MILLISECONDS
            );
        }

        // Xóa toàn bộ refresh token của user trong DB
        userAuthRepository.findByUsername(username).ifPresent(user -> {
            int deleted = refreshTokenRepository.deleteByUser(user);
            log.info("Xóa {} refresh token của user: {}", deleted, username);
        });

        log.info("User {} đã logout thành công", username);
    }

    // ─────────────────────────────────────────────────────────────
    // 5. QUÊN MẬT KHẨU
    // ─────────────────────────────────────────────────────────────

    @Transactional
    public void forgotPassword(String email) {
        if (!userAuthRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email không tồn tại");
        }

        String otp = String.format("%06d", new java.util.Random().nextInt(999999));
        log.info("MOCK EMAIL SENT: [OTP={}] cho user {}", otp, email);
        
        redisTemplate.opsForValue().set(
                "OTP:" + email,
                otp,
                5,
                TimeUnit.MINUTES
        );
    }

    @Transactional
    public void resetPassword(String email, String otp, String newPassword) {
        String storedOtp = redisTemplate.opsForValue().get("OTP:" + email);
        if (storedOtp == null || !storedOtp.equals(otp)) {
            throw new IllegalArgumentException("OTP không hợp lệ hoặc đã hết hạn");
        }

        UserAuth user = userAuthRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Email không tồn tại"));

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userAuthRepository.save(user);

        redisTemplate.delete("OTP:" + email);
        log.info("User {} đã đặt lại mật khẩu thành công", email);
    }

    // ─────────────────────────────────────────────────────────────
    // PRIVATE HELPERS
    // ─────────────────────────────────────────────────────────────

    private AuthResponse buildAuthResponse(UserAuth user) {
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getUsername());

        String accessToken = jwtUtils.generateAccessToken(
                userDetails, user.getId().toString(), user.getRole().name());

        // Tạo refresh token mới và lưu vào DB
        String rawRefreshToken = java.util.UUID.randomUUID().toString();
        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(rawRefreshToken)
                .expiryDate(LocalDateTime.now().plus(refreshExpirationMs, ChronoUnit.MILLIS))
                .build();
        refreshTokenRepository.save(refreshToken);

        return AuthResponse.of(
                accessToken,
                rawRefreshToken,
                jwtExpirationMs,
                user.getId().toString(),
                user.getUsername(),
                user.getRole().name()
        );
    }

    // ─────────────────────────────────────────────────────────────
    // 6. ADMIN STATS
    // ─────────────────────────────────────────────────────────────

    public java.util.List<Map<String, Object>> getRecentUsers() {
        return userAuthRepository.findTopRecentUsers().stream().map(user -> 
             Map.<String, Object>of(
                 "id", user.getId(),
                 "username", user.getUsername(),
                 "email", user.getEmail(),
                 "createdAt", user.getCreatedAt().toString(),
                 "status", user.getStatus().name()
             )
        ).toList();
    }

    public java.util.List<Map<String, Object>> getUserGrowth() {
        return userAuthRepository.findUserGrowthLast6Months().stream().map(row ->
             Map.<String, Object>of(
                 "name", (String) row[0],
                 "users", ((Number) row[1]).intValue()
             )
        ).toList();
    }

    public java.util.Optional<UserAuth> getUserById(java.util.UUID id) {
        return userAuthRepository.findById(id);
    }

    @Transactional
    public void updateUserEmail(java.util.UUID id, String newEmail) {
        UserAuth user = userAuthRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setEmail(newEmail);
        userAuthRepository.save(user);
    }

    public Map<String, Object> getTotalUsers() {
        long total = userAuthRepository.count();
        return Map.of("count", total, "trend", 0.0); // Trend có thể tính bằng công thức tháng trước
    }
}

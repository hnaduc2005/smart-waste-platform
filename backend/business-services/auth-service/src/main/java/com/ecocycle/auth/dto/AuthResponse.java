package com.ecocycle.auth.dto;

/**
 * Response trả về sau đăng ký / đăng nhập thành công.
 */
public record AuthResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        long expiresIn,
        String userId,
        String username,
        String role
) {
    public static AuthResponse of(String accessToken, String refreshToken,
                                   long expiresIn, String userId,
                                   String username, String role) {
        return new AuthResponse(accessToken, refreshToken, "Bearer", expiresIn, userId, username, role);
    }
}

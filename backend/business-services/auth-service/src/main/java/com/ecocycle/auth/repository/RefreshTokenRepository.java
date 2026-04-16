package com.ecocycle.auth.repository;

import com.ecocycle.auth.domain.models.RefreshToken;
import com.ecocycle.auth.domain.models.UserAuth;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {

    Optional<RefreshToken> findByToken(String token);

    /**
     * Xóa tất cả refresh token cũ khi user logout hoặc đổi mật khẩu.
     */
    @Modifying
    int deleteByUser(UserAuth user);
}

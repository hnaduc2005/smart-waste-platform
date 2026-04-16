package com.ecocycle.auth.repository;

import com.ecocycle.auth.domain.models.UserAuth;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserAuthRepository extends JpaRepository<UserAuth, UUID> {

    Optional<UserAuth> findByUsername(String username);

    Optional<UserAuth> findByEmail(String email);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);
}

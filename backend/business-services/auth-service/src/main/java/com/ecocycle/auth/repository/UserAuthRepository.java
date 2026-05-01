package com.ecocycle.auth.repository;

import com.ecocycle.auth.domain.models.UserAuth;
import com.ecocycle.auth.domain.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserAuthRepository extends JpaRepository<UserAuth, UUID> {

    Optional<UserAuth> findByUsername(String username);
    Optional<UserAuth> findByEmail(String email);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);

    List<UserAuth> findByRole(Role role);

    @Query(value = "SELECT * FROM users_auth ORDER BY created_at DESC LIMIT 10", nativeQuery = true)
    List<UserAuth> findTopRecentUsers();

    @Query(value = "SELECT to_char(created_at, 'Mon') AS month, COUNT(*) AS count_users FROM users_auth WHERE created_at >= NOW() - INTERVAL '6 months' GROUP BY to_char(created_at, 'Mon'), date_trunc('month', created_at) ORDER BY date_trunc('month', created_at)", nativeQuery = true)
    List<Object[]> findUserGrowthLast6Months();
}

package com.ecocycle.user.repository;

import com.ecocycle.user.domain.models.UserProfileBase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

import java.util.List;
import com.ecocycle.user.domain.enums.Role;

@Repository
public interface UserProfileRepository extends JpaRepository<UserProfileBase, UUID> {
    List<UserProfileBase> findByRole(Role role);
}

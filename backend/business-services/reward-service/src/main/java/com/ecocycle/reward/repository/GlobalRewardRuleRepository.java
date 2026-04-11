package com.ecocycle.reward.repository;

import com.ecocycle.reward.domain.models.GlobalRewardRule;
import com.ecocycle.reward.domain.enums.WasteType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface GlobalRewardRuleRepository extends JpaRepository<GlobalRewardRule, UUID> {
    Optional<GlobalRewardRule> findByType(WasteType type);
}

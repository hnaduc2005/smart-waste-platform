package com.ecocycle.reward.domain.models;

import com.ecocycle.reward.domain.enums.WasteType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "global_reward_rules")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class GlobalRewardRule {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, unique = true)
    private WasteType type;

    @Column(name = "points_per_kg", nullable = false)
    private Double pointsPerKg;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}

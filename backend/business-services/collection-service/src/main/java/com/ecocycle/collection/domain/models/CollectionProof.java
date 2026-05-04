package com.ecocycle.collection.domain.models;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "collection_proofs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CollectionProof {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private TaskAssignment task;

    @Column(name = "photo_url", nullable = true, columnDefinition = "TEXT")
    private String photoUrl;

    @Column(nullable = false)
    private Double weight;
}

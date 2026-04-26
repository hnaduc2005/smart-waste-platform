package com.ecocycle.collection.domain.models;

import com.ecocycle.collection.domain.enums.RequestStatus;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "task_assignments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TaskAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "request_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private WasteRequest request;

    @Column(name = "collector_id", nullable = false)
    private UUID collectorId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RequestStatus status;
}

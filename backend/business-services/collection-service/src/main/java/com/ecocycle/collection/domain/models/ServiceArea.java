package com.ecocycle.collection.domain.models;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "service_areas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ServiceArea {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "enterprise_id", nullable = false)
    private UUID enterpriseId;

    @Column(columnDefinition = "geometry(Polygon,4326)")
    private String boundary;
}

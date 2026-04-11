package com.ecocycle.user.domain.models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "citizen_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CitizenProfile extends UserProfileBase {

    @Column(name = "full_name")
    private String fullName;

    @Column
    private String address;

    @Column(name = "balance_points")
    private Double balancePoints = 0.0;
}

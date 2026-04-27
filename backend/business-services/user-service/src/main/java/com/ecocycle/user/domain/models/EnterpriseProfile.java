package com.ecocycle.user.domain.models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "enterprise_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EnterpriseProfile extends UserProfileBase {

    @Column(name = "company_name")
    private String companyName;

    @Column(name = "tax_code")
    private String taxCode;

    @Column(name = "license_number")
    private String licenseNumber;

    @Column(name = "daily_capacity")
    private Double dailyCapacity;

    @Column(name = "service_area")
    private String serviceArea;

    @Column(name = "accepted_waste_types")
    private String acceptedWasteTypes;

    @Column(name = "phone")
    private String phone;

    @Column(name = "email")
    private String email;

    @Column(name = "address")
    private String address;
}

package com.ecocycle.user.domain.models;

import com.ecocycle.user.domain.enums.Role;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "user_profiles_base")
@Inheritance(strategy = InheritanceType.JOINED)
@Getter
@Setter
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "profileType", defaultImpl = UserProfileBase.class)
@JsonSubTypes({
    @JsonSubTypes.Type(value = CitizenProfile.class,   name = "CITIZEN"),
    @JsonSubTypes.Type(value = CollectorProfile.class, name = "COLLECTOR"),
    @JsonSubTypes.Type(value = EnterpriseProfile.class, name = "ENTERPRISE")
})
public abstract class UserProfileBase {

    @Id
    // Do not generate UUID here if we want to sync perfectly with Auth Service ID. 
    // We should manually assign the ID coming from Auth Service upon registration.
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;
}

package com.ecocycle.collection.repository;

import com.ecocycle.collection.domain.models.CollectionProof;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface CollectionProofRepository extends JpaRepository<CollectionProof, UUID> {
    java.util.Optional<CollectionProof> findByTask(com.ecocycle.collection.domain.models.TaskAssignment task);
}

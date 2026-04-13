package com.ecocycle.enterprise.controller;

import com.ecocycle.enterprise.entity.Enterprise;
import com.ecocycle.enterprise.repository.EnterpriseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/enterprises")
@RequiredArgsConstructor
public class EnterpriseController {

    private final EnterpriseRepository enterpriseRepository;

    @GetMapping
    public ResponseEntity<List<Enterprise>> getAllEnterprises() {
        return ResponseEntity.ok(enterpriseRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<Enterprise> createEnterprise(@RequestBody Enterprise enterprise) {
        return ResponseEntity.ok(enterpriseRepository.save(enterprise));
    }
}

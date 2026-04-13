package com.ecocycle.enterprise.controller;

import com.ecocycle.enterprise.entity.Vehicle;
import com.ecocycle.enterprise.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/vehicles")
@RequiredArgsConstructor
public class VehicleController {

    private final VehicleRepository vehicleRepository;

    // API: GET /api/v1/vehicles
    // Hoặc GET /api/v1/vehicles?status=AVAILABLE
    @GetMapping
    public ResponseEntity<List<Vehicle>> getVehicles(@RequestParam(required = false) String status) {
        if (status != null) {
            // Dành cho team Frontend: Kéo thả rác gọi API này lấy xe rảnh
            return ResponseEntity.ok(vehicleRepository.findByCurrentStatus(status.toUpperCase()));
        }
        return ResponseEntity.ok(vehicleRepository.findAll());
    }

    // API: POST /api/v1/vehicles
    @PostMapping
    public ResponseEntity<Vehicle> registerVehicle(@RequestBody Vehicle vehicle) {
        return ResponseEntity.ok(vehicleRepository.save(vehicle));
    }
}

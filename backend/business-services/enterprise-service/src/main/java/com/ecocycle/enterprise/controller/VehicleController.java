package com.ecocycle.enterprise.controller;

import com.ecocycle.enterprise.entity.Vehicle;
import com.ecocycle.enterprise.repository.VehicleRepository;
import com.ecocycle.enterprise.repository.EnterpriseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/vehicles")
@RequiredArgsConstructor
public class VehicleController {

    private final VehicleRepository vehicleRepository;
    private final EnterpriseRepository enterpriseRepository;

    /** GET /api/v1/vehicles — Tất cả xe, có thể lọc theo status */
    @GetMapping
    public ResponseEntity<List<Vehicle>> getVehicles(
            @RequestParam(required = false) String status) {
        if (status != null) {
            return ResponseEntity.ok(vehicleRepository.findByCurrentStatus(status.toUpperCase()));
        }
        return ResponseEntity.ok(vehicleRepository.findAll());
    }

    /** GET /api/v1/vehicles/enterprise/{enterpriseId} — Xe theo doanh nghiệp */
    @GetMapping("/enterprise/{enterpriseId}")
    public ResponseEntity<List<Vehicle>> getByEnterprise(@PathVariable Long enterpriseId) {
        return ResponseEntity.ok(vehicleRepository.findByEnterpriseId(enterpriseId));
    }

    /** GET /api/v1/vehicles/{id} — Chi tiết một xe */
    @GetMapping("/{id}")
    public ResponseEntity<Vehicle> getById(@PathVariable Long id) {
        return vehicleRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** POST /api/v1/vehicles — Đăng ký xe mới cho một doanh nghiệp */
    @PostMapping
    public ResponseEntity<?> registerVehicle(@RequestBody Vehicle vehicle) {
        if (vehicle.getEnterprise() == null || vehicle.getEnterprise().getId() == null) {
            return ResponseEntity.badRequest().body("enterpriseId is required");
        }
        return enterpriseRepository.findById(vehicle.getEnterprise().getId())
                .map(enterprise -> {
                    vehicle.setEnterprise(enterprise);
                    vehicle.setCurrentStatus("AVAILABLE");
                    return ResponseEntity.ok(vehicleRepository.save(vehicle));
                })
                .orElse(ResponseEntity.badRequest().build());
    }

    /**
     * PATCH /api/v1/vehicles/{id}/status
     * Cập nhật trạng thái xe: AVAILABLE | ON_DUTY | MAINTENANCE
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id,
                                          @RequestBody Map<String, String> body) {
        String newStatus = body.get("status");
        if (newStatus == null) {
            return ResponseEntity.badRequest().body("Field 'status' is required");
        }
        return vehicleRepository.findById(id).map(vehicle -> {
            vehicle.setCurrentStatus(newStatus.toUpperCase());
            return ResponseEntity.ok(vehicleRepository.save(vehicle));
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * PATCH /api/v1/vehicles/{id}/assign
     * Gán xe cho một Collector cụ thể.
     */
    @PatchMapping("/{id}/assign")
    public ResponseEntity<?> assignCollector(@PathVariable Long id,
                                             @RequestBody Map<String, String> body) {
        String collectorId = body.get("collectorId");
        if (collectorId == null) {
            return ResponseEntity.badRequest().body("Field 'collectorId' is required");
        }
        return vehicleRepository.findById(id).map(vehicle -> {
            vehicle.setAssignedCollectorId(collectorId);
            return ResponseEntity.ok(vehicleRepository.save(vehicle));
        }).orElse(ResponseEntity.notFound().build());
    }

    /** DELETE /api/v1/vehicles/{id} — Xóa xe */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteVehicle(@PathVariable Long id) {
        if (!vehicleRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        vehicleRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}

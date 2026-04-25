package com.ecocycle.enterprise.controller;

import com.ecocycle.enterprise.entity.Vehicle;
import com.ecocycle.enterprise.service.VehicleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/vehicles")
@RequiredArgsConstructor
public class VehicleController {

    private final VehicleService vehicleService;

    /** GET /api/v1/vehicles — Tất cả xe, có thể lọc theo status */
    @GetMapping
    public ResponseEntity<List<Vehicle>> getVehicles(
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(vehicleService.getVehicles(status));
    }

    /** GET /api/v1/vehicles/enterprise/{enterpriseId} — Xe theo doanh nghiệp */
    @GetMapping("/enterprise/{enterpriseId}")
    public ResponseEntity<List<Vehicle>> getByEnterprise(@PathVariable Long enterpriseId) {
        return ResponseEntity.ok(vehicleService.getByEnterprise(enterpriseId));
    }

    /** GET /api/v1/vehicles/{id} — Chi tiết một xe */
    @GetMapping("/{id}")
    public ResponseEntity<Vehicle> getById(@PathVariable Long id) {
        return vehicleService.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** POST /api/v1/vehicles — Đăng ký xe mới cho một doanh nghiệp */
    @PostMapping
    public ResponseEntity<?> registerVehicle(@RequestBody Vehicle vehicle) {
        try {
            return ResponseEntity.ok(vehicleService.registerVehicle(vehicle));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * PATCH /api/v1/vehicles/{id}/status
     * Cập nhật trạng thái xe: AVAILABLE | ON_DUTY | MAINTENANCE
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id,
                                          @RequestBody Map<String, String> body) {
        try {
            return vehicleService.updateStatus(id, body.get("status"))
                    .map(ResponseEntity::ok)
                    .orElseGet(() -> ResponseEntity.notFound().build());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * PATCH /api/v1/vehicles/{id}/assign
     * Gán xe cho một Collector cụ thể.
     */
    @PatchMapping("/{id}/assign")
    public ResponseEntity<?> assignCollector(@PathVariable Long id,
                                             @RequestBody Map<String, String> body) {
        try {
            return vehicleService.assignCollector(id, body.get("collectorId"))
                    .map(ResponseEntity::ok)
                    .orElseGet(() -> ResponseEntity.notFound().build());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /** DELETE /api/v1/vehicles/{id} — Xóa xe */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteVehicle(@PathVariable Long id) {
        if (vehicleService.deleteVehicle(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}

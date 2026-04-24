package com.ecocycle.enterprise.controller;

import com.ecocycle.enterprise.entity.Enterprise;
import com.ecocycle.enterprise.service.EnterpriseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/enterprises")
@RequiredArgsConstructor
public class EnterpriseController {

    private final EnterpriseService enterpriseService;

    /** GET /api/v1/enterprises — Lấy tất cả doanh nghiệp */
    @GetMapping
    public ResponseEntity<List<Enterprise>> getAllEnterprises() {
        return ResponseEntity.ok(enterpriseService.getAllEnterprises());
    }

    /** GET /api/v1/enterprises/{id} — Lấy chi tiết một doanh nghiệp */
    @GetMapping("/{id}")
    public ResponseEntity<Enterprise> getById(@PathVariable Long id) {
        return enterpriseService.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** GET /api/v1/enterprises/owner/{userId} — Lấy doanh nghiệp theo tài khoản Enterprise */
    @GetMapping("/owner/{userId}")
    public ResponseEntity<Enterprise> getByOwner(@PathVariable String userId) {
        return enterpriseService.getByOwnerUserId(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** GET /api/v1/enterprises/search?wasteType=ORGANIC — Tìm theo loại rác xử lý */
    @GetMapping("/search")
    public ResponseEntity<List<Enterprise>> search(
            @RequestParam(required = false) String wasteType,
            @RequestParam(required = false) String district) {
        if (wasteType != null) {
            return ResponseEntity.ok(enterpriseService.findByWasteType(wasteType));
        }
        if (district != null) {
            return ResponseEntity.ok(enterpriseService.findByDistrict(district));
        }
        return ResponseEntity.ok(enterpriseService.getAllEnterprises());
    }

    /** POST /api/v1/enterprises — Đăng ký doanh nghiệp mới */
    @PostMapping
    public ResponseEntity<Enterprise> create(@RequestBody Enterprise enterprise) {
        return ResponseEntity.ok(enterpriseService.createEnterprise(enterprise));
    }

    /** PUT /api/v1/enterprises/{id} — Cập nhật thông tin và năng lực */
    @PutMapping("/{id}")
    public ResponseEntity<Enterprise> update(@PathVariable Long id, @RequestBody Enterprise updated) {
        return enterpriseService.updateEnterprise(id, updated)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** DELETE /api/v1/enterprises/{id} — Vô hiệu hóa doanh nghiệp */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivate(@PathVariable Long id) {
        return enterpriseService.deactivateEnterprise(id)
                ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }

    // ── Phân tích năng lực ───────────────────────────────────────────────────

    /**
     * GET /api/v1/enterprises/{id}/capacity
     * Phân tích năng lực: tải trọng đội xe, tỷ lệ sử dụng, công suất còn trống.
     */
    @GetMapping("/{id}/capacity")
    public ResponseEntity<Map<String, Object>> getCapacityAnalysis(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(enterpriseService.getCapacityAnalysis(id));
        } catch (java.util.NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * GET /api/v1/enterprises/overview
     * Tổng quan năng lực toàn hệ thống: số doanh nghiệp, xe, công suất.
     */
    @GetMapping("/overview")
    public ResponseEntity<Map<String, Object>> getSystemOverview() {
        return ResponseEntity.ok(enterpriseService.getSystemCapacityOverview());
    }
}

package com.ecocycle.enterprise.service;

import com.ecocycle.enterprise.entity.Enterprise;
import com.ecocycle.enterprise.entity.Vehicle;
import com.ecocycle.enterprise.repository.EnterpriseRepository;
import com.ecocycle.enterprise.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class EnterpriseService {

    private final EnterpriseRepository enterpriseRepository;
    private final VehicleRepository vehicleRepository;

    // ── CRUD Enterprise ─────────────────────────────────────────────────────

    public List<Enterprise> getAllEnterprises() {
        return enterpriseRepository.findAll();
    }

    public Optional<Enterprise> getById(Long id) {
        return enterpriseRepository.findById(id);
    }

    public Optional<Enterprise> getByOwnerUserId(String userId) {
        return enterpriseRepository.findByOwnerUserId(userId);
    }

    @Transactional
    public Enterprise createEnterprise(Enterprise enterprise) {
        enterprise.setIsActive(true);
        return enterpriseRepository.save(enterprise);
    }

    @Transactional
    public Optional<Enterprise> updateEnterprise(Long id, Enterprise updated) {
        return enterpriseRepository.findById(id).map(existing -> {
            existing.setName(updated.getName());
            existing.setLicenseNumber(updated.getLicenseNumber());
            existing.setAddress(updated.getAddress());
            existing.setPhone(updated.getPhone());
            existing.setEmail(updated.getEmail());
            existing.setDailyCapacity(updated.getDailyCapacity());
            existing.setServiceArea(updated.getServiceArea());
            existing.setAcceptedWasteTypes(updated.getAcceptedWasteTypes());
            return enterpriseRepository.save(existing);
        });
    }

    @Transactional
    public boolean deactivateEnterprise(Long id) {
        return enterpriseRepository.findById(id).map(e -> {
            e.setIsActive(false);
            enterpriseRepository.save(e);
            return true;
        }).orElse(false);
    }

    // ── Tìm kiếm theo năng lực ─────────────────────────────────────────────

    /** Tìm doanh nghiệp có thể nhận loại rác cụ thể */
    public List<Enterprise> findByWasteType(String wasteType) {
        return enterpriseRepository.findActiveByWasteType(wasteType.toUpperCase());
    }

    /** Tìm doanh nghiệp phục vụ một khu vực cụ thể */
    public List<Enterprise> findByDistrict(String district) {
        return enterpriseRepository.findActiveByServiceArea(district);
    }

    // ── Phân tích năng lực ─────────────────────────────────────────────────

    /**
     * Phân tích năng lực tổng hợp của một doanh nghiệp:
     * - Tổng tải trọng đội xe
     * - Số xe theo trạng thái
     * - Tỷ lệ sử dụng đội xe
     * - Công suất còn trống ước tính
     */
    public Map<String, Object> getCapacityAnalysis(Long enterpriseId) {
        Enterprise enterprise = enterpriseRepository.findById(enterpriseId)
                .orElseThrow(() -> new NoSuchElementException("Enterprise not found: " + enterpriseId));

        List<Vehicle> vehicles = vehicleRepository.findByEnterpriseId(enterpriseId);

        // Đếm xe theo từng trạng thái
        long availableCount = vehicles.stream().filter(v -> "AVAILABLE".equals(v.getCurrentStatus())).count();
        long onDutyCount    = vehicles.stream().filter(v -> "ON_DUTY".equals(v.getCurrentStatus())).count();
        long maintenanceCount = vehicles.stream().filter(v -> "MAINTENANCE".equals(v.getCurrentStatus())).count();

        // Tổng tải trọng đội xe (tấn)
        double totalFleetPayload = vehicles.stream()
                .mapToDouble(v -> v.getMaxPayload() != null ? v.getMaxPayload() : 0.0)
                .sum();

        // Tải trọng xe đang sẵn sàng
        double availablePayload = vehicles.stream()
                .filter(v -> "AVAILABLE".equals(v.getCurrentStatus()))
                .mapToDouble(v -> v.getMaxPayload() != null ? v.getMaxPayload() : 0.0)
                .sum();

        // Tỷ lệ sử dụng đội xe (%)
        double utilizationRate = vehicles.isEmpty() ? 0.0
                : Math.round((double) onDutyCount / vehicles.size() * 100.0);

        // Công suất còn trống: min(dailyCapacity, availablePayload * 1000 kg)
        double remainingCapacity = Math.min(
                enterprise.getDailyCapacity() != null ? enterprise.getDailyCapacity() * 1000 : 0,
                availablePayload * 1000
        );

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("enterpriseId",      enterprise.getId());
        result.put("enterpriseName",    enterprise.getName());
        result.put("dailyCapacityTon",  enterprise.getDailyCapacity());
        result.put("serviceArea",       enterprise.getServiceArea());
        result.put("acceptedWasteTypes", enterprise.getAcceptedWasteTypes());
        result.put("totalVehicles",     vehicles.size());
        result.put("availableVehicles", availableCount);
        result.put("onDutyVehicles",    onDutyCount);
        result.put("maintenanceVehicles", maintenanceCount);
        result.put("totalFleetPayloadTon", totalFleetPayload);
        result.put("availablePayloadTon",  availablePayload);
        result.put("remainingCapacityKg",  remainingCapacity);
        result.put("utilizationRatePct",   utilizationRate);

        return result;
    }

    /**
     * Tổng quan năng lực toàn bộ doanh nghiệp đang hoạt động trong hệ thống.
     */
    public Map<String, Object> getSystemCapacityOverview() {
        List<Enterprise> active = enterpriseRepository.findByIsActiveTrue();
        List<Vehicle> allVehicles = vehicleRepository.findAll();

        long totalAvailable  = allVehicles.stream().filter(v -> "AVAILABLE".equals(v.getCurrentStatus())).count();
        long totalOnDuty     = allVehicles.stream().filter(v -> "ON_DUTY".equals(v.getCurrentStatus())).count();
        long totalMaintenance = allVehicles.stream().filter(v -> "MAINTENANCE".equals(v.getCurrentStatus())).count();

        double totalDailyCapacityTon = active.stream()
                .mapToDouble(e -> e.getDailyCapacity() != null ? e.getDailyCapacity() : 0.0)
                .sum();

        Map<String, Object> overview = new LinkedHashMap<>();
        overview.put("totalActiveEnterprises",  active.size());
        overview.put("totalVehicles",            allVehicles.size());
        overview.put("availableVehicles",        totalAvailable);
        overview.put("onDutyVehicles",           totalOnDuty);
        overview.put("maintenanceVehicles",      totalMaintenance);
        overview.put("totalDailyCapacityTon",    totalDailyCapacityTon);
        overview.put("systemUtilizationPct",
                allVehicles.isEmpty() ? 0.0
                        : Math.round((double) totalOnDuty / allVehicles.size() * 100.0));

        // Danh sách doanh nghiệp kèm số xe sẵn sàng
        List<Map<String, Object>> enterpriseList = new ArrayList<>();
        for (Enterprise e : active) {
            List<Vehicle> ev = vehicleRepository.findByEnterpriseId(e.getId());
            long avail = ev.stream().filter(v -> "AVAILABLE".equals(v.getCurrentStatus())).count();
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("id",               e.getId());
            entry.put("name",             e.getName());
            entry.put("serviceArea",      e.getServiceArea());
            entry.put("acceptedWasteTypes", e.getAcceptedWasteTypes());
            entry.put("dailyCapacityTon", e.getDailyCapacity());
            entry.put("totalVehicles",    ev.size());
            entry.put("availableVehicles", avail);
            enterpriseList.add(entry);
        }
        overview.put("enterprises", enterpriseList);

        return overview;
    }
}

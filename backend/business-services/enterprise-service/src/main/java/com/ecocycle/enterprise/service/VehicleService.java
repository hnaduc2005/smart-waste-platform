package com.ecocycle.enterprise.service;

import com.ecocycle.enterprise.entity.Vehicle;
import com.ecocycle.enterprise.repository.EnterpriseRepository;
import com.ecocycle.enterprise.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class VehicleService {

    private final VehicleRepository vehicleRepository;
    private final EnterpriseRepository enterpriseRepository;

    public List<Vehicle> getVehicles(String status) {
        if (status != null && !status.isEmpty()) {
            return vehicleRepository.findByCurrentStatus(status.toUpperCase());
        }
        return vehicleRepository.findAll();
    }

    public List<Vehicle> getByEnterprise(Long enterpriseId) {
        return vehicleRepository.findByEnterpriseId(enterpriseId);
    }

    public Optional<Vehicle> getById(Long id) {
        return vehicleRepository.findById(id);
    }

    @Transactional
    public Vehicle registerVehicle(Vehicle vehicle) {
        if (vehicle.getEnterprise() == null || vehicle.getEnterprise().getId() == null) {
            throw new IllegalArgumentException("enterpriseId is required");
        }
        
        return enterpriseRepository.findById(vehicle.getEnterprise().getId())
                .map(enterprise -> {
                    vehicle.setEnterprise(enterprise);
                    vehicle.setCurrentStatus("AVAILABLE");
                    return vehicleRepository.save(vehicle);
                })
                .orElseThrow(() -> new IllegalArgumentException("Enterprise not found"));
    }

    @Transactional
    public Optional<Vehicle> updateStatus(Long id, String newStatus) {
        if (newStatus == null || newStatus.isEmpty()) {
            throw new IllegalArgumentException("Field 'status' is required");
        }
        return vehicleRepository.findById(id).map(vehicle -> {
            vehicle.setCurrentStatus(newStatus.toUpperCase());
            return vehicleRepository.save(vehicle);
        });
    }

    @Transactional
    public Optional<Vehicle> assignCollector(Long id, String collectorId) {
        if (collectorId == null || collectorId.isEmpty()) {
            throw new IllegalArgumentException("Field 'collectorId' is required");
        }
        return vehicleRepository.findById(id).map(vehicle -> {
            vehicle.setAssignedCollectorId(collectorId);
            return vehicleRepository.save(vehicle);
        });
    }

    @Transactional
    public boolean deleteVehicle(Long id) {
        if (vehicleRepository.existsById(id)) {
            vehicleRepository.deleteById(id);
            return true;
        }
        return false;
    }
}

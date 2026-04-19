package com.ecocycle.analytics.service;

import com.ecocycle.analytics.repository.WasteAnalyticsRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AnalyticsService {
    
    private final WasteAnalyticsRepository repository;

    public AnalyticsService(WasteAnalyticsRepository repository) {
        this.repository = repository;
    }
    
    public Map<String, Object> getDashboardData() {
        Map<String, Object> response = new HashMap<>();

        List<Object[]> districtData = repository.findTotalWeightByDistrict();
        List<Map<String, Object>> districtList = new ArrayList<>();
        
        for (Object[] row : districtData) {
            Map<String, Object> map = new HashMap<>();
            map.put("name", row[0]);
            Number totalWeight = (Number) row[1];
            map.put("total", totalWeight != null ? totalWeight.doubleValue() : 0.0);
            map.put("efficiency", calculateEfficiency()); 
            districtList.add(map);
        }
        
        response.put("districts", districtList.isEmpty() ? getFallbackDistrictData() : districtList);
        response.put("weekly", getFallbackWeeklyData());
        
        return response;
    }

    public Map<String, Object> getUserAnalytics(String userId) {
        Map<String, Object> response = new HashMap<>();

        // 1. Personal Waste Distribution (Pie Chart)
        List<Map<String, Object>> personalDistribution = repository.findIndividualWasteDistribution(userId);
        response.put("personalDistribution", personalDistribution.isEmpty() ? getFallbackPersonalDistribution() : personalDistribution);

        // 2. Metrics (Total weight, etc)
        Double totalWeight = repository.findTotalWeightByUser(userId);
        response.put("totalWeight", totalWeight != null ? totalWeight : 0.0);
        response.put("co2Saved", (totalWeight != null ? totalWeight * 0.36 : 0.0)); 

        // 3. Neighborhood Comparison (Bar Chart)
        List<Object[]> districtAverages = repository.findTotalWeightByDistrict();
        List<Map<String, Object>> comparison = new ArrayList<>();
        
        // Add User data first
        comparison.add(Map.of("name", "Bạn", "user", totalWeight != null ? totalWeight : 0.0, "average", 0.0));
        
        for (Object[] row : districtAverages) {
            Map<String, Object> map = new HashMap<>();
            map.put("name", row[0]);
            Number districtTotal = (Number) row[1];
            // Normalize district total to an "average" per household (simulated factor of 500)
            map.put("average", districtTotal != null ? districtTotal.doubleValue() / 500 : 0.0);
            comparison.add(map);
        }
        
        response.put("comparisonData", comparison);

        return response;
    }

    private List<Map<String, Object>> getFallbackPersonalDistribution() {
        return List.of(
            Map.of("name", "Tái chế", "value", 0.0),
            Map.of("name", "Hữu cơ", "value", 0.0),
            Map.of("name", "Độc hại", "value", 0.0)
        );
    }
    
    private int calculateEfficiency() {
        return (int) (Math.random() * 30 + 60); 
    }

    private List<Map<String, Object>> getFallbackDistrictData() {
        return List.of(
                Map.of("name", "Q1", "total", 4000, "efficiency", 86),
                Map.of("name", "Q3", "total", 3000, "efficiency", 72),
                Map.of("name", "Q10", "total", 5000, "efficiency", 90),
                Map.of("name", "Tân Bình", "total", 2780, "efficiency", 65)
        );
    }
    
    private List<Map<String, Object>> getFallbackWeeklyData() {
        return List.of(
                Map.of("name", "T2", "organic", 4000, "recycle", 2400),
                Map.of("name", "T3", "organic", 3000, "recycle", 1398),
                Map.of("name", "T4", "organic", 2000, "recycle", 9800),
                Map.of("name", "T5", "organic", 2780, "recycle", 3908),
                Map.of("name", "T6", "organic", 1890, "recycle", 4800)
        );
    }
}

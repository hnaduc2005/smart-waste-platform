package com.ecocycle.reward;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.context.annotation.Bean;
import org.springframework.boot.CommandLineRunner;

import com.ecocycle.reward.domain.enums.WasteType;
import com.ecocycle.reward.domain.models.GlobalRewardRule;
import com.ecocycle.reward.repository.GlobalRewardRuleRepository;

@SpringBootApplication
@EnableDiscoveryClient
public class RewardServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(RewardServiceApplication.class, args);
    }
    
    @Bean
    CommandLineRunner initDatabase(GlobalRewardRuleRepository repository) {
        return args -> {
            if (repository.count() == 0) {
                GlobalRewardRule recyclable = new GlobalRewardRule();
                recyclable.setType(WasteType.RECYCLABLE);
                recyclable.setPointsPerKg(10.0);
                repository.save(recyclable);

                GlobalRewardRule organic = new GlobalRewardRule();
                organic.setType(WasteType.ORGANIC);
                organic.setPointsPerKg(5.0);
                repository.save(organic);
                
                System.out.println(">>> Sinh dữ liệu giả: Đã nạp thành công bộ công thức tính điểm vào Database!");
            }
        };
    }
}

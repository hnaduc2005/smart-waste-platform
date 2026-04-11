package com.ecocycle.reward;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
public class RewardServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(RewardServiceApplication.class, args);
    }
}

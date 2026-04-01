package com.ecocycle.discovery;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.server.EnableEurekaServer;

/**
 * Điểm bắt đầu (Entry point) của máy chủ Eureka Discovery.
 * Annotation @EnableEurekaServer biến dự án Spring Boot thành một Service Registry.
 * Giúp tự động nhận diện các Microservices khác trong nền tảng Ecocycle.
 */
@SpringBootApplication
@EnableEurekaServer // <--- Thần chú kích hoạt Eureka
public class DiscoveryServerApplication {

    public static void main(String[] args) {
        SpringApplication.run(DiscoveryServerApplication.class, args);
    }
}

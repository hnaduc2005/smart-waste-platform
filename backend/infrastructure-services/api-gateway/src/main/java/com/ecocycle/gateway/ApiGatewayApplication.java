package com.ecocycle.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

/**
 * Điện toán ranh giới (Edge Service) của toàn bộ nền tảng EcoCycle.
 * Tất cả các yêu cầu từ Mobile App (Citizen, Collector) và Web Portal (Admin)
 * đều phải đi qua cánh cửa này trước khi đổ vào các Microservice bên trong.
 */
@SpringBootApplication
@EnableDiscoveryClient // Khai báo tôi là một thành viên (Client) để báo danh với Eureka
public class ApiGatewayApplication {

    public static void main(String[] args) {
        // Cần lưu ý: Spring Cloud Gateway xây dựng trên nền tảng WebFlux (Non-blocking)
        // Nên nó chạy Netty Server chứ không phải Tomcat thông thường.
        SpringApplication.run(ApiGatewayApplication.class, args);
    }
}

package com.ecocycle.admin.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@FeignClient(name = "user-service", path = "/api/v1")
public interface UserProfileClient {

    /** Lấy tất cả users theo role */
    @GetMapping("/users/all")
    List<Object> getUsersByRole(@RequestParam("role") String role);

    /** Danh sách khiếu nại */
    @GetMapping("/complaints")
    List<Object> getAllComplaints();

    /** Giải quyết khiếu nại */
    @PutMapping("/complaints/{id}/resolve")
    Object resolveComplaint(@PathVariable("id") String id,
                            @RequestBody Map<String, String> body);
}

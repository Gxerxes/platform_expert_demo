package com.company.palette.bff.system;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/palette/api/v1/system/health")
public class HealthController {

    @GetMapping("/live")
    public Map<String, String> liveness() {
        return Map.of("status", "UP");
    }

    @GetMapping("/ready")
    public Map<String, String> readiness() {
        return Map.of("status", "UP");
    }
}

package com.company.palette.bff.config;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.company.palette.bff.common.ApiResponse;

@RestController
@RequestMapping("/palette/api/v1/config")
public class ConfigController {

    private final PaletteProperties properties;

    public ConfigController(PaletteProperties properties) {
        this.properties = properties;
    }

    @GetMapping
    public ApiResponse<Map<String, Object>> config() {
        Map<String, Object> config = Map.of(
                "application", properties.getApplication().getName(),
                "version", properties.getApplication().getVersion(),
                "environment", properties.getApplication().getEnvironment(),
                "features", Map.of()
        );

        return ApiResponse.success(config);
    }
}

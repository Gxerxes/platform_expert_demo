package com.company.palette.bff.system;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.company.palette.bff.config.PaletteProperties;

@RestController
@RequestMapping("/palette/api/v1/system")
public class InfoController {

    private final PaletteProperties properties;

    public InfoController(PaletteProperties properties) {
        this.properties = properties;
    }

    @GetMapping("/info")
    public Map<String, String> info() {
        return Map.of(
                "application", properties.getApplication().getName(),
                "version", properties.getApplication().getVersion(),
                "buildTime", properties.getApplication().getBuildTime()
        );
    }
}

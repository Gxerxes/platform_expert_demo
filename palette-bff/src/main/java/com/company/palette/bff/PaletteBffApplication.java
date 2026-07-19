package com.company.palette.bff;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableAsync;

import com.company.palette.bff.config.PaletteProperties;

@SpringBootApplication
@EnableConfigurationProperties(PaletteProperties.class)
@EnableAsync
public class PaletteBffApplication {

    public static void main(String[] args) {
        SpringApplication.run(PaletteBffApplication.class, args);
    }
}

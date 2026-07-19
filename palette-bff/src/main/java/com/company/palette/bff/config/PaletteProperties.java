package com.company.palette.bff.config;

import java.util.ArrayList;
import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;

import lombok.Data;

@Data
@ConfigurationProperties(prefix = "palette")
public class PaletteProperties {

    private Application application = new Application();
    private Security security = new Security();
    private Gateway gateway = new Gateway();

    @Data
    public static class Application {
        private String name = "palette-bff";
        private String version = "1.0.0";
        private String environment = "UAT";
        private String buildTime = "unknown";
    }

    @Data
    public static class Security {
        private Cookie cookie = new Cookie();
        private Cors cors = new Cors();
    }

    @Data
    public static class Cookie {
        private String name = "PALETTE_SESSION";
        private String domain = "";
        private int maxAge = 28800;
    }

    @Data
    public static class Cors {
        private String allowedOrigins = "http://localhost:3000";
        private String allowedMethods = "GET,POST,PUT,DELETE,PATCH,OPTIONS";
        private String allowedHeaders = "*";
        private boolean allowCredentials = true;
        private long maxAge = 3600;
    }

    @Data
    public static class Gateway {
        private int connectTimeout = 5000;
        private int readTimeout = 30000;
        private List<Route> routes = new ArrayList<>();
    }

    @Data
    public static class Route {
        private String name;
        private String path;
        private String target;
    }
}

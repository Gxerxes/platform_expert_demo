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
    private Eidp eidp = new Eidp();
    private Session session = new Session();

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
        /** Frontend application URL for post-login redirect */
        private String frontendUrl = "https://localhost:3000";
    }

    @Data
    public static class Cookie {
        private String name = "PALETTE_SESSION";
        private String domain = "";
        private int maxAge = 28800;
    }

    @Data
    public static class Cors {
        private String allowedOrigins = "https://localhost:3000";
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
        private RateLimit rateLimit = new RateLimit();
    }

    @Data
    public static class Route {
        private String name;
        private String path;
        private String target;
        /** Whether this route is enabled */
        private boolean enabled = true;
        /** Allowed HTTP methods (empty = all) */
        private List<String> allowedMethods = new ArrayList<>();
        /** Strip matched prefix before forwarding */
        private boolean stripPrefix = true;
    }

    @Data
    public static class RateLimit {
        /** Whether rate limiting is enabled */
        private boolean enabled = true;
        /** Max requests per minute for authenticated users */
        private int authenticatedLimit = 200;
        /** Max requests per minute for anonymous/IP-based requests */
        private int anonymousLimit = 60;
        /** Max requests per minute for admin users */
        private int adminLimit = 500;
    }

    @Data
    public static class Eidp {
        /** eIDP end_session_endpoint for OIDC RP-Initiated Logout */
        private String logoutUri = "";
        /** Post-logout redirect URI (where eIDP redirects back after logout) */
        private String postLogoutRedirectUri = "";
    }

    @Data
    public static class Session {
        /** Session store type: redis or memory */
        private String storeType = "redis";
    }
}

package com.company.palette.bff.context;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientService;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.company.palette.bff.common.ApiResponse;
import com.company.palette.bff.config.PaletteProperties;

@RestController
@RequestMapping("/palette/api/v1/context")
public class ContextController {

    private final PaletteProperties properties;
    private final OAuth2AuthorizedClientService authorizedClientService;

    /** Simulated tenant registry for MVP. Replace with DB lookup in production. */
    private static final List<Map<String, Object>> DEMO_TENANTS = List.of(
            Map.of("id", "default", "displayName", "Default Organization", "code", "DEF", "status", "active"),
            Map.of("id", "clearing", "displayName", "Clearing Department", "code", "CLR", "status", "active"),
            Map.of("id", "risk-mgmt", "displayName", "Risk Management", "code", "RSK", "status", "active")
    );

    public ContextController(PaletteProperties properties,
                             OAuth2AuthorizedClientService authorizedClientService) {
        this.properties = properties;
        this.authorizedClientService = authorizedClientService;
    }

    @GetMapping
    public ApiResponse<Map<String, Object>> context() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        Map<String, Object> userInfo = extractUserInfo(authentication);

        Map<String, Object> context = new HashMap<>();
        context.put("user", userInfo);
        context.put("environment", properties.getApplication().getEnvironment());
        context.put("locale", "en-US");
        context.put("timezone", "Asia/Shanghai");

        return ApiResponse.success(context);
    }

    /**
     * GET /context/tenants — List available tenants for the current user.
     */
    @GetMapping("/tenants")
    public ApiResponse<List<Map<String, Object>>> tenants() {
        // In production: resolve from user's eIDP claims or DB
        return ApiResponse.success(new ArrayList<>(DEMO_TENANTS));
    }

    /**
     * POST /context/tenant — Switch active tenant.
     */
    @PostMapping("/tenant")
    public ApiResponse<Map<String, Object>> switchTenant(@RequestBody Map<String, String> body) {
        String tenantId = body.get("tenantId");

        // Validate tenant access
        boolean hasAccess = DEMO_TENANTS.stream()
                .anyMatch(t -> t.get("id").equals(tenantId));

        if (!hasAccess) {
            // Return error response with null data
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("success", false);
            errorResult.put("error", "No access to tenant: " + tenantId);
            return ApiResponse.success(errorResult);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("tenantId", tenantId);

        // In production: store tenant selection in session/Redis
        return ApiResponse.success(result);
    }

    private Map<String, Object> extractUserInfo(Authentication authentication) {
        if (authentication instanceof OAuth2AuthenticationToken oauthToken) {
            if (oauthToken.getPrincipal() instanceof OidcUser oidcUser) {
                return Map.of(
                        "id", oidcUser.getSubject(),
                        "username", oidcUser.getPreferredUsername() != null
                                ? oidcUser.getPreferredUsername() : oidcUser.getSubject(),
                        "displayName", oidcUser.getFullName() != null
                                ? oidcUser.getFullName() : oidcUser.getPreferredUsername(),
                        "email", oidcUser.getEmail() != null ? oidcUser.getEmail() : ""
                );
            }
        }

        return Map.of(
                "id", authentication != null ? authentication.getName() : "anonymous",
                "username", authentication != null ? authentication.getName() : "anonymous",
                "displayName", "Anonymous User",
                "email", ""
        );
    }
}

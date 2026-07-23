package com.company.palette.bff.gateway;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Represents a dynamic gateway route that can be managed at runtime.
 *
 * <p>Unlike static routes defined in {@code application.yml}, dynamic routes
 * can be added, removed, enabled, or disabled without restarting the BFF.
 * This is essential for enterprise scenarios where backend services are
 * frequently added or decommissioned.
 *
 * <p>Routes are matched in order of priority (lower = higher priority).
 * The first matching route wins.
 *
 * <p>Example:
 * <pre>
 * {
 *   "id": "clearing-service",
 *   "name": "Clearing Backend",
 *   "path": "/backend/clearing/**",
 *   "target": "http://clearing-service:8081",
 *   "enabled": true,
 *   "priority": 100,
 *   "allowedMethods": ["GET", "POST"],
 *   "stripPrefix": true,
 *   "description": "Routes to the clearing backend service"
 * }
 * </pre>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class GatewayRoute {

    /** Unique route identifier */
    private String id;

    /** Human-readable route name */
    private String name;

    /**
     * URL path pattern to match.
     * Supports Ant-style patterns: /backend/service/**
     */
    private String path;

    /** Target backend service base URL */
    private String target;

    /** Whether this route is currently active */
    @Builder.Default
    private boolean enabled = true;

    /**
     * Priority for route matching (lower = higher priority).
     * Default is 100. Static routes have priority 0.
     */
    @Builder.Default
    private int priority = 100;

    /** Allowed HTTP methods. Empty/null means all methods allowed. */
    @Builder.Default
    private List<String> allowedMethods = new ArrayList<>();

    /** Whether to strip the matched prefix before forwarding */
    @Builder.Default
    private boolean stripPrefix = true;

    /** Request timeout override in milliseconds (null = use global default) */
    private Integer timeoutMs;

    /** Human-readable description */
    private String description;

    /** Route creation timestamp */
    private Instant createdAt;

    /** Route last modification timestamp */
    private Instant updatedAt;

    /**
     * Checks if the given HTTP method is allowed by this route.
     *
     * @param method the HTTP method to check
     * @return true if the method is allowed or no method restrictions are configured
     */
    public boolean isMethodAllowed(String method) {
        if (allowedMethods == null || allowedMethods.isEmpty()) {
            return true;
        }
        return allowedMethods.stream()
                .anyMatch(m -> m.equalsIgnoreCase(method));
    }

    /**
     * Checks if the given request path matches this route's path pattern.
     *
     * @param requestPath the incoming request path
     * @return true if the path matches
     */
    public boolean matchesPath(String requestPath) {
        if (path == null || path.isEmpty()) {
            return false;
        }
        String pattern = path.replace("/**", "");
        return requestPath.startsWith(pattern);
    }

    /**
     * Computes the target URL for the given request path.
     *
     * @param requestPath the full incoming request path
     * @param queryString the query string (may be null)
     * @return the complete target URL
     */
    public String buildTargetUrl(String requestPath, String queryString) {
        String subPath = requestPath;
        if (stripPrefix) {
            String prefix = path.replace("/**", "");
            subPath = requestPath.replaceFirst(prefix, "");
        }
        if (subPath.isEmpty()) {
            subPath = "/";
        }

        String url = target + subPath;
        if (queryString != null && !queryString.isEmpty()) {
            url += "?" + queryString;
        }
        return url;
    }
}

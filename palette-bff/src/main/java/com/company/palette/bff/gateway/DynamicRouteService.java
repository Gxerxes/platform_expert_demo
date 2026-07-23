package com.company.palette.bff.gateway;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Stream;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.company.palette.bff.config.PaletteProperties;

/**
 * Manages dynamic gateway routes that can be added, removed, enabled,
 * or disabled at runtime without restarting the BFF.
 *
 * <p>Route resolution merges static routes (from application.yml) with
 * dynamic routes (managed via this service). Static routes always take
 * priority over dynamic routes with the same path pattern.
 *
 * <p>This service is thread-safe — routes can be modified concurrently
 * from management endpoints or scheduled tasks.
 */
@Service
public class DynamicRouteService {

    private static final Logger log = LoggerFactory.getLogger(DynamicRouteService.class);

    /** Static routes from application.yml (immutable after init) */
    private final List<GatewayRoute> staticRoutes;

    /** Dynamic routes managed at runtime (thread-safe) */
    private final Map<String, GatewayRoute> dynamicRoutes = new ConcurrentHashMap<>();

    public DynamicRouteService(PaletteProperties properties) {
        // Convert static Route config into GatewayRoute objects (priority 0)
        this.staticRoutes = properties.getGateway().getRoutes().stream()
                .map(route -> GatewayRoute.builder()
                        .id("static-" + route.getName())
                        .name(route.getName())
                        .path(route.getPath())
                        .target(route.getTarget())
                        .enabled(true)
                        .priority(0) // static routes have highest priority
                        .stripPrefix(true)
                        .description("Static route from application.yml")
                        .createdAt(Instant.now())
                        .build())
                .toList();

        log.info("Initialized DynamicRouteService with {} static routes", staticRoutes.size());
    }

    /**
     * Resolves the best matching route for the given request path.
     * Static routes are checked first (priority 0), then dynamic routes.
     *
     * @param requestPath the incoming request path
     * @param method      the HTTP method (for method filtering)
     * @return the matched route, or empty if no match
     */
    public Optional<GatewayRoute> resolveRoute(String requestPath, String method) {
        // Merge static + dynamic routes, sorted by priority
        return getAllRoutes().stream()
                .filter(route -> route.isEnabled() && route.matchesPath(requestPath))
                .filter(route -> route.isMethodAllowed(method))
                .min(Comparator.comparingInt(GatewayRoute::getPriority));
    }

    /**
     * Returns all routes (static + dynamic) sorted by priority.
     */
    public List<GatewayRoute> getAllRoutes() {
        return Stream.concat(
                staticRoutes.stream(),
                dynamicRoutes.values().stream()
        ).sorted(Comparator.comparingInt(GatewayRoute::getPriority))
         .toList();
    }

    /**
     * Adds or updates a dynamic route.
     *
     * @param route the route to add/update
     * @return the previous route with the same ID, or null
     */
    public GatewayRoute addRoute(GatewayRoute route) {
        if (route.getId() == null || route.getId().isBlank()) {
            throw new IllegalArgumentException("Route ID is required");
        }
        if (route.getPath() == null || route.getPath().isBlank()) {
            throw new IllegalArgumentException("Route path is required");
        }
        if (route.getTarget() == null || route.getTarget().isBlank()) {
            throw new IllegalArgumentException("Route target is required");
        }

        route.setUpdatedAt(Instant.now());
        if (route.getCreatedAt() == null) {
            route.setCreatedAt(Instant.now());
        }

        GatewayRoute previous = dynamicRoutes.put(route.getId(), route);
        log.info("Dynamic route {}: {} -> {} (priority={})",
                previous == null ? "added" : "updated",
                route.getPath(), route.getTarget(), route.getPriority());
        return previous;
    }

    /**
     * Removes a dynamic route by ID.
     *
     * @param routeId the route ID to remove
     * @return the removed route, or empty if not found
     */
    public Optional<GatewayRoute> removeRoute(String routeId) {
        GatewayRoute removed = dynamicRoutes.remove(routeId);
        if (removed != null) {
            log.info("Dynamic route removed: id={}, path={}", routeId, removed.getPath());
        } else {
            log.warn("Attempted to remove non-existent dynamic route: {}", routeId);
        }
        return Optional.ofNullable(removed);
    }

    /**
     * Enables or disables a dynamic route.
     *
     * @param routeId the route ID
     * @param enabled whether to enable or disable
     * @return the updated route, or empty if not found
     */
    public Optional<GatewayRoute> setRouteEnabled(String routeId, boolean enabled) {
        GatewayRoute route = dynamicRoutes.get(routeId);
        if (route == null) {
            return Optional.empty();
        }
        route.setEnabled(enabled);
        route.setUpdatedAt(Instant.now());
        log.info("Dynamic route {} {}: id={}", enabled ? "enabled" : "disabled", routeId, route.getPath());
        return Optional.of(route);
    }

    /**
     * Gets a dynamic route by ID.
     *
     * @param routeId the route ID
     * @return the route, or empty if not found
     */
    public Optional<GatewayRoute> getRoute(String routeId) {
        return Optional.ofNullable(dynamicRoutes.get(routeId));
    }

    /**
     * Returns only the dynamic routes (excludes static routes).
     */
    public List<GatewayRoute> getDynamicRoutes() {
        return new ArrayList<>(dynamicRoutes.values());
    }

    /**
     * Clears all dynamic routes. Static routes are not affected.
     */
    public void clearAllDynamicRoutes() {
        int count = dynamicRoutes.size();
        dynamicRoutes.clear();
        log.info("All {} dynamic routes cleared", count);
    }
}

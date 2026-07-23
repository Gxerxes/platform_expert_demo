package com.company.palette.bff.gateway;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.company.palette.bff.config.PaletteProperties;
import com.company.palette.bff.exception.ErrorCode;
import com.company.palette.bff.exception.ErrorResponse;
import com.company.palette.bff.tracing.TracingContext;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Enterprise-grade rate limiting filter for the Palette BFF gateway.
 *
 * <p>Implements a sliding-window rate limiter with per-user and per-IP
 * granularity. Protects backend services from abuse and ensures fair
 * resource allocation across users.
 *
 * <p>Rate limit tiers:
 * <ul>
 *   <li><b>Authenticated users</b> — higher limit (configurable, default 200/min)</li>
 *   <li><b>Anonymous/IP-based</b> — lower limit (configurable, default 60/min)</li>
 *   <li><b>Admin users</b> — elevated limit (configurable, default 500/min)</li>
 * </ul>
 *
 * <p>Response headers:
 * <pre>
 * X-RateLimit-Limit: 200
 * X-RateLimit-Remaining: 195
 * X-RateLimit-Reset: 1700000060
 * </pre>
 *
 * <p>When rate limit is exceeded, returns HTTP 429 with a JSON error body.
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(RateLimitFilter.class);

    /** Window size in seconds */
    private static final int WINDOW_SECONDS = 60;

    /** Sliding window buckets: each bucket covers WINDOW_SECONDS / BUCKETS seconds */
    private static final int BUCKETS = 6;
    private static final int BUCKET_DURATION_SECONDS = WINDOW_SECONDS / BUCKETS;

    private final PaletteProperties properties;
    private final ObjectMapper objectMapper;

    /**
     * Rate limit counters: key → bucket-index → count.
     * Uses a simple fixed-window-per-bucket approach to approximate sliding window.
     */
    private final Map<String, AtomicInteger[]> rateLimitCounters = new ConcurrentHashMap<>();

    /** Tracks the bucket index timestamp for each key */
    private final Map<String, long[]> bucketTimestamps = new ConcurrentHashMap<>();

    public RateLimitFilter(PaletteProperties properties, ObjectMapper objectMapper) {
        this.properties = properties;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String requestUri = request.getRequestURI();

        // Only apply rate limiting to gateway-proxied requests
        if (!requestUri.startsWith("/palette/api/v1/backend/")) {
            filterChain.doFilter(request, response);
            return;
        }

        PaletteProperties.RateLimit rateLimitConfig = properties.getGateway().getRateLimit();
        if (!rateLimitConfig.isEnabled()) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientKey = resolveClientKey(request);
        int limit = resolveLimit(clientKey, rateLimitConfig);

        if (!tryAcquire(clientKey, limit)) {
            log.warn("Rate limit exceeded: key={}, limit={}, uri={}", clientKey, limit, requestUri);
            writeRateLimitExceeded(response, limit);
            return;
        }

        // Add rate limit headers
        int remaining = getRemaining(clientKey, limit);
        long resetTime = Instant.now().getEpochSecond() + WINDOW_SECONDS;
        response.setHeader("X-RateLimit-Limit", String.valueOf(limit));
        response.setHeader("X-RateLimit-Remaining", String.valueOf(Math.max(0, remaining)));
        response.setHeader("X-RateLimit-Reset", String.valueOf(resetTime));

        filterChain.doFilter(request, response);
    }

    /**
     * Resolves the client identifier for rate limiting.
     * Prefers authenticated user ID, falls back to IP address.
     */
    private String resolveClientKey(HttpServletRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()
                && !"anonymousUser".equals(authentication.getName())) {
            return "user:" + authentication.getName();
        }
        // Fall back to IP address
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return "ip:" + xForwardedFor.split(",")[0].trim();
        }
        return "ip:" + request.getRemoteAddr();
    }

    /**
     * Resolves the rate limit for the given client key.
     */
    private int resolveLimit(String clientKey, PaletteProperties.RateLimit config) {
        if (clientKey.startsWith("user:")) {
            // Check if admin
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equalsIgnoreCase("ROLE_ADMIN"))) {
                return config.getAdminLimit();
            }
            return config.getAuthenticatedLimit();
        }
        return config.getAnonymousLimit();
    }

    /**
     * Attempts to acquire a rate limit token using a bucket-based sliding window.
     *
     * @return true if the request is allowed, false if rate limit exceeded
     */
    private synchronized boolean tryAcquire(String key, int limit) {
        long now = Instant.now().getEpochSecond();
        int currentBucket = (int) (now / BUCKET_DURATION_SECONDS) % BUCKETS;

        AtomicInteger[] counters = rateLimitCounters.computeIfAbsent(key,
                k -> new AtomicInteger[BUCKETS]);
        long[] timestamps = bucketTimestamps.computeIfAbsent(key,
                k -> new long[BUCKETS]);

        // Reset expired buckets
        for (int i = 0; i < BUCKETS; i++) {
            if (now - timestamps[i] >= WINDOW_SECONDS) {
                counters[i].set(0);
                timestamps[i] = now;
            }
        }

        // Count total requests in the window
        int total = 0;
        for (AtomicInteger counter : counters) {
            total += counter.get();
        }

        if (total >= limit) {
            return false;
        }

        // Increment current bucket
        counters[currentBucket].incrementAndGet();
        timestamps[currentBucket] = now;
        return true;
    }

    /**
     * Returns the approximate remaining requests in the current window.
     */
    private synchronized int getRemaining(String key, int limit) {
        AtomicInteger[] counters = rateLimitCounters.get(key);
        if (counters == null) {
            return limit;
        }
        int total = 0;
        for (AtomicInteger counter : counters) {
            total += counter.get();
        }
        return limit - total;
    }

    /**
     * Writes a 429 Too Many Requests response.
     */
    private void writeRateLimitExceeded(HttpServletResponse response, int limit) throws IOException {
        response.setStatus(429);
        response.setContentType("application/json");
        response.setHeader("Retry-After", String.valueOf(WINDOW_SECONDS));

        ErrorResponse errorResponse = ErrorResponse.builder()
                .code("PALETTE_RATE_LIMIT_EXCEEDED")
                .message("Rate limit exceeded. Limit: " + limit + " requests per " + WINDOW_SECONDS + "s")
                .traceId(TracingContext.getRequestId())
                .timestamp(Instant.now())
                .build();

        response.getWriter().write(objectMapper.writeValueAsString(errorResponse));
    }
}

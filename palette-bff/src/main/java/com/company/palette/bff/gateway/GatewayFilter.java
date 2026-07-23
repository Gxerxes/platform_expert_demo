package com.company.palette.bff.gateway;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Enumeration;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.OAuth2AuthorizeRequest;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientManager;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
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

@Component
public class GatewayFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(GatewayFilter.class);
    private static final String BACKEND_PATH_PREFIX = "/palette/api/v1/backend/";

    private final PaletteProperties properties;
    private final OAuth2AuthorizedClientManager authorizedClientManager;
    private final ObjectMapper objectMapper;
    private final DynamicRouteService dynamicRouteService;
    private final HttpClient httpClient;

    public GatewayFilter(PaletteProperties properties,
                         OAuth2AuthorizedClientManager authorizedClientManager,
                         ObjectMapper objectMapper,
                         DynamicRouteService dynamicRouteService) {
        this.properties = properties;
        this.authorizedClientManager = authorizedClientManager;
        this.objectMapper = objectMapper;
        this.dynamicRouteService = dynamicRouteService;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofMillis(properties.getGateway().getConnectTimeout()))
                .build();
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String requestUri = request.getRequestURI();

        if (!requestUri.startsWith(BACKEND_PATH_PREFIX)) {
            filterChain.doFilter(request, response);
            return;
        }

        // Try dynamic routes first (includes static routes merged)
        Optional<GatewayRoute> matchedRoute = dynamicRouteService.resolveRoute(requestUri, request.getMethod());
        if (matchedRoute.isEmpty()) {
            writeError(response, ErrorCode.NOT_FOUND, "No route configured for: " + requestUri);
            return;
        }

        GatewayRoute route = matchedRoute.get();
        String targetUrl = route.buildTargetUrl(requestUri, request.getQueryString());

        try {
            int timeout = route.getTimeoutMs() != null
                    ? route.getTimeoutMs()
                    : properties.getGateway().getReadTimeout();
            HttpRequest.Builder httpRequestBuilder = HttpRequest.newBuilder()
                    .uri(URI.create(targetUrl))
                    .timeout(Duration.ofMillis(timeout));

            copyHeaders(request, httpRequestBuilder);
            enrichWithAuthAndContext(request, httpRequestBuilder);
            setHttpMethod(request, httpRequestBuilder);

            HttpRequest httpRequest = httpRequestBuilder.build();
            HttpResponse<String> httpResponse = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());

            response.setStatus(httpResponse.statusCode());
            response.setContentType(httpResponse.headers().firstValue("Content-Type").orElse("application/json"));
            response.getWriter().write(httpResponse.body());

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            writeError(response, ErrorCode.GATEWAY_ERROR, "Request interrupted");
        } catch (Exception e) {
            log.error("Gateway forwarding failed: uri={}, error={}", targetUrl, e.getMessage(), e);
            writeError(response, ErrorCode.GATEWAY_ERROR, "Backend service unavailable");
        }
    }

    // Dynamic routes are managed via DynamicRouteService

    private void copyHeaders(HttpServletRequest request, HttpRequest.Builder builder) {
        Enumeration<String> headerNames = request.getHeaderNames();
        List<String> skipHeaders = List.of("host", "connection", "cookie", "authorization");

        while (headerNames.hasMoreElements()) {
            String headerName = headerNames.nextElement();
            if (!skipHeaders.contains(headerName.toLowerCase())) {
                builder.header(headerName, request.getHeader(headerName));
            }
        }
    }

    private void enrichWithAuthAndContext(HttpServletRequest request, HttpRequest.Builder builder) {
        String requestId = TracingContext.getRequestId();
        if (requestId != null) {
            builder.header("X-Request-ID", requestId);
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication instanceof OAuth2AuthenticationToken oauthToken) {
            String userId = oauthToken.getName();
            builder.header("X-User-ID", userId);

            // Use OAuth2AuthorizedClientManager which automatically refreshes expired tokens
            OAuth2AuthorizeRequest authorizeRequest = OAuth2AuthorizeRequest
                    .withClientRegistrationId(oauthToken.getAuthorizedClientRegistrationId())
                    .principal(userId)
                    .build();

            OAuth2AuthorizedClient authorizedClient =
                    authorizedClientManager.authorize(authorizeRequest);

            if (authorizedClient != null && authorizedClient.getAccessToken() != null) {
                builder.header("Authorization", "Bearer " + authorizedClient.getAccessToken().getTokenValue());
            }
        }

        builder.header("X-Application-ID", properties.getApplication().getName());
        builder.header("X-Channel", "WEB");
    }

    private void setHttpMethod(HttpServletRequest request, HttpRequest.Builder builder) {
        String method = request.getMethod();
        HttpRequest.BodyPublisher bodyPublisher = HttpRequest.BodyPublishers.noBody();

        if ("POST".equalsIgnoreCase(method) || "PUT".equalsIgnoreCase(method) || "PATCH".equalsIgnoreCase(method)) {
            try {
                bodyPublisher = HttpRequest.BodyPublishers.ofString(request.getReader().lines()
                        .reduce("", (a, b) -> a + b));
            } catch (IOException e) {
                log.warn("Failed to read request body", e);
            }
        }

        builder.method(method, bodyPublisher);
    }

    private void writeError(HttpServletResponse response, ErrorCode errorCode, String message) throws IOException {
        response.setStatus(errorCode.getHttpStatus().value());
        response.setContentType("application/json");

        ErrorResponse errorResponse = ErrorResponse.builder()
                .code(errorCode.getCode())
                .message(message)
                .traceId(TracingContext.getRequestId())
                .timestamp(java.time.Instant.now())
                .build();

        response.getWriter().write(objectMapper.writeValueAsString(errorResponse));
    }
}

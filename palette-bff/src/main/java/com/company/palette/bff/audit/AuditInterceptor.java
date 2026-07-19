package com.company.palette.bff.audit;

import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.company.palette.bff.tracing.TracingContext;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class AuditInterceptor extends OncePerRequestFilter {

    private static final List<String> AUDIT_PATHS = List.of(
            "/palette/api/v1/auth/",
            "/palette/api/v1/auth/me",
            "/palette/api/v1/context",
            "/palette/api/v1/backend/"
    );

    private final AuditService auditService;

    public AuditInterceptor(AuditService auditService) {
        this.auditService = auditService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, java.io.IOException {
        String uri = request.getRequestURI();

        filterChain.doFilter(request, response);

        if (shouldAudit(uri)) {
            String userId = resolveUserId();
            String requestId = TracingContext.getRequestId();
            String ipAddress = getClientIp(request);
            String details = request.getMethod() + " " + uri + " -> " + response.getStatus();

            auditService.recordApiAccess(userId, requestId, details, ipAddress);
        }
    }

    private boolean shouldAudit(String uri) {
        return AUDIT_PATHS.stream().anyMatch(uri::startsWith);
    }

    private String resolveUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            return authentication.getName();
        }
        return "anonymous";
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}

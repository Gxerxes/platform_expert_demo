package com.company.palette.bff.controller;

import java.time.Instant;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.company.palette.bff.auth.EidpLogoutService;
import com.company.palette.bff.auth.UserInfo;
import com.company.palette.bff.auth.UserInfoException;
import com.company.palette.bff.auth.UserInfoService;
import com.company.palette.bff.audit.AuditService;
import com.company.palette.bff.config.PaletteProperties;
import com.company.palette.bff.common.ApiResponse;
import com.company.palette.bff.exception.ErrorCode;
import com.company.palette.bff.exception.PaletteException;
import com.company.palette.bff.session.SessionRepository;
import com.company.palette.bff.tracing.TracingContext;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/palette/api/v1/auth")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);
    private static final String LOGIN_URL = "/palette/api/v1/auth/login";

    private final SessionRepository sessionRepository;
    private final UserInfoService userInfoService;
    private final EidpLogoutService eidpLogoutService;
    private final AuditService auditService;
    private final PaletteProperties properties;

    public AuthController(SessionRepository sessionRepository,
                          UserInfoService userInfoService,
                          EidpLogoutService eidpLogoutService,
                          AuditService auditService,
                          PaletteProperties properties) {
        this.sessionRepository = sessionRepository;
        this.userInfoService = userInfoService;
        this.eidpLogoutService = eidpLogoutService;
        this.auditService = auditService;
        this.properties = properties;
    }

    @GetMapping("/login")
    public void login(HttpServletResponse response) throws java.io.IOException {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()
                && !(authentication.getName().equals("anonymousUser"))) {
            // Already authenticated — redirect to dashboard
            response.sendRedirect(properties.getSecurity().getFrontendUrl() + "/dashboard");
            return;
        }
        // Redirect to Spring Security OAuth2 authorization endpoint
        // Spring Security will intercept this and redirect to eIDP login page
        response.sendRedirect("/oauth2/authorization/eidp");
    }

    @GetMapping("/session")
    public ApiResponse<Map<String, Object>> session(HttpServletRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication != null && authentication.isAuthenticated()
                && !(authentication.getName().equals("anonymousUser"))) {

            HttpSession httpSession = request.getSession(false);
            Instant expiresAt = httpSession != null
                    ? Instant.now().plusSeconds(httpSession.getMaxInactiveInterval())
                    : Instant.now().plusSeconds(1800);

            Map<String, Object> data = Map.of(
                    "authenticated", true,
                    "expiresAt", expiresAt.toString()
            );
            return ApiResponse.success(data);
        }

        Map<String, Object> data = Map.of(
                "authenticated", false,
                "loginUrl", LOGIN_URL
        );
        return ApiResponse.success(data);
    }

    /**
     * GET /palette/api/v1/auth/me
     *
     * Returns real-time user information by calling eIDP's UserInfo endpoint.
     * The BFF uses its stored OAuth2 Access Token to call eIDP on behalf of the user.
     * React never communicates directly with eIDP.
     */
    @GetMapping("/me")
    public ApiResponse<UserInfo> me() {
        try {
            UserInfo userInfo = userInfoService.fetchCurrentUserInfo();
            return ApiResponse.success(userInfo);
        } catch (UserInfoException e) {
            log.warn("Failed to fetch user info from eIDP: {}", e.getMessage());
            throw new PaletteException(ErrorCode.UNAUTHORIZED, "Unable to retrieve user info: " + e.getMessage());
        }
    }

    /**
     * GET /palette/api/v1/auth/logout
     *
     * Simple logout: invalidate session, clear cookie, redirect to landing page.
     */
    @GetMapping("/logout")
    public void logout(HttpServletRequest request,
                       HttpServletResponse response) throws java.io.IOException {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userId = authentication != null ? authentication.getName() : "anonymous";

        // 1. Invalidate HTTP session
        HttpSession session = request.getSession(false);
        if (session != null) {
            log.info("Invalidating session: {}", session.getId());
            session.invalidate();
        }

        // 2. Clear security context
        SecurityContextHolder.clearContext();

        // 3. Clear session cookie
        ResponseCookie cookie = ResponseCookie.from(properties.getSecurity().getCookie().getName(), "")
                .path("/")
                .maxAge(0)
                .httpOnly(true)
                .secure(true)
                .sameSite("Lax")
                .build();
        response.addHeader("Set-Cookie", cookie.toString());
        log.info("Logout: userId={}, cookie cleared, redirecting to {}", userId, properties.getSecurity().getFrontendUrl());

        // 4. Record audit
        auditService.recordLogout(userId, TracingContext.getRequestId(), getClientIp(request));

        // 5. Redirect directly to landing page
        response.sendRedirect(properties.getSecurity().getFrontendUrl());
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}

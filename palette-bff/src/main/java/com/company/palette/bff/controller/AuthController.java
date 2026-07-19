package com.company.palette.bff.controller;

import java.time.Instant;
import java.util.Map;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.company.palette.bff.common.ApiResponse;
import com.company.palette.bff.session.SessionRepository;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/palette/api/v1/auth")
public class AuthController {

    private static final String LOGIN_URL = "/palette/api/v1/auth/login";

    private final SessionRepository sessionRepository;

    public AuthController(SessionRepository sessionRepository) {
        this.sessionRepository = sessionRepository;
    }

    @GetMapping("/login")
    public Map<String, String> login() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()
                && !(authentication.getName().equals("anonymousUser"))) {
            return Map.of("redirect", "/");
        }
        return Map.of("loginUrl", "/oauth2/authorization/eidp");
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

    @PostMapping("/logout")
    public ApiResponse<Map<String, Boolean>> logout(HttpServletRequest request,
                                                     HttpServletResponse response) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }

        SecurityContextHolder.clearContext();

        response.setHeader("Set-Cookie",
                "PALETTE_SESSION=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax");

        return ApiResponse.success(Map.of("success", true));
    }
}

package com.company.palette.bff.context;

import java.util.Map;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientService;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.company.palette.bff.common.ApiResponse;
import com.company.palette.bff.config.PaletteProperties;

@RestController
@RequestMapping("/palette/api/v1/context")
public class ContextController {

    private final PaletteProperties properties;
    private final OAuth2AuthorizedClientService authorizedClientService;

    public ContextController(PaletteProperties properties,
                             OAuth2AuthorizedClientService authorizedClientService) {
        this.properties = properties;
        this.authorizedClientService = authorizedClientService;
    }

    @GetMapping
    public ApiResponse<Map<String, Object>> context() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        Map<String, Object> userInfo = extractUserInfo(authentication);

        Map<String, Object> context = Map.of(
                "user", userInfo,
                "environment", properties.getApplication().getEnvironment(),
                "locale", "en-US",
                "timezone", "Asia/Shanghai"
        );

        return ApiResponse.success(context);
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

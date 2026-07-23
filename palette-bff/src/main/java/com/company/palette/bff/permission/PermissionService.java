package com.company.palette.bff.permission;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.OAuth2AuthorizeRequest;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientManager;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;

/**
 * Enterprise-grade permission service that extracts user permissions and roles
 * from eIDP (Enterprise Identity Provider) token claims.
 *
 * <p>Supports multiple claim structures commonly used by OIDC providers:
 * <ul>
 *   <li>{@code realm_access.roles} — Keycloak realm-level roles</li>
 *   <li>{@code resource_access.{client}.roles} — Keycloak client-level roles</li>
 *   <li>{@code roles} — Simple flat role list</li>
 *   <li>{@code groups} — Group-based roles (LDAP-style)</li>
 *   <li>{@code permissions} — Direct permission claims (custom)</li>
 *   <li>{@code scope} — OAuth2 scope-based permissions</li>
 * </ul>
 *
 * <p>The extracted permissions are used by the frontend {@code @palette/auth}
 * package for fine-grained access control.
 */
@Service
public class PermissionService {

    private static final Logger log = LoggerFactory.getLogger(PermissionService.class);

    /** Default admin role name (case-insensitive match) */
    private static final String ADMIN_ROLE = "ADMIN";

    /** Default Palette client ID for resource_access extraction */
    private static final String PALETTE_CLIENT = "palette-bff";

    private final OAuth2AuthorizedClientManager authorizedClientManager;

    public PermissionService(OAuth2AuthorizedClientManager authorizedClientManager) {
        this.authorizedClientManager = authorizedClientManager;
    }

    /**
     * Extracts permissions and roles for the currently authenticated user.
     *
     * @return UserPermission with extracted permissions, roles, and admin flag
     * @throws IllegalStateException if no OAuth2 authentication is available
     */
    public UserPermission extractCurrentUserPermissions() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (!(authentication instanceof OAuth2AuthenticationToken oauthToken)) {
            throw new IllegalStateException("No OAuth2 authentication available in security context");
        }

        String userId = oauthToken.getName();
        String registrationId = oauthToken.getAuthorizedClientRegistrationId();

        // Attempt to get OIDC user principal (available right after login)
        OidcUser oidcUser = null;
        if (oauthToken.getPrincipal() instanceof OidcUser oidc) {
            oidcUser = oidc;
        }

        // Extract claims from OIDC token or fall back to UserInfo endpoint
        Map<String, Object> claims;
        if (oidcUser != null) {
            claims = oidcUser.getClaims();
        } else {
            claims = fetchClaimsFromUserInfo(registrationId, userId);
        }

        return buildUserPermission(userId, claims);
    }

    /**
     * Builds a UserPermission from raw eIDP claims.
     *
     * @param userId the user's subject identifier
     * @param claims the raw OIDC claims map
     * @return populated UserPermission
     */
    public UserPermission buildUserPermission(String userId, Map<String, Object> claims) {
        List<String> roles = extractRoles(claims);
        List<String> permissions = extractPermissions(claims);
        boolean isAdmin = roles.stream()
                .anyMatch(role -> role.equalsIgnoreCase(ADMIN_ROLE));

        log.debug("Extracted permissions for user={}: roles={}, permissions={}, admin={}",
                userId, roles, permissions, isAdmin);

        return UserPermission.builder()
                .userId(userId)
                .username(getClaimAsString(claims, "preferred_username"))
                .permissions(permissions)
                .roles(roles)
                .admin(isAdmin)
                .rawAuthorities(buildRawAuthorities(claims))
                .build();
    }

    // ─── Role Extraction ─────────────────────────────────────────

    /**
     * Extracts roles from multiple possible claim structures.
     */
    private List<String> extractRoles(Map<String, Object> claims) {
        List<String> roles = new ArrayList<>();

        // 1. Keycloak realm_access.roles
        extractFromNestedPath(claims, "realm_access", "roles", roles);

        // 2. Keycloak resource_access.{client}.roles
        extractFromNestedPath(claims, "resource_access", PALETTE_CLIENT, "roles", roles);

        // 3. Flat "roles" claim (space-separated string or list)
        extractFlatClaim(claims, "roles", roles);

        // 4. Groups as roles (LDAP-style providers)
        extractFlatClaim(claims, "groups", roles);

        return roles.stream().distinct().toList();
    }

    // ─── Permission Extraction ───────────────────────────────────

    /**
     * Extracts permissions from claims. Permissions are typically derived
     * from roles (ROLE_ prefix convention) or explicit permission claims.
     */
    private List<String> extractPermissions(Map<String, Object> claims) {
        List<String> permissions = new ArrayList<>();

        // 1. Direct "permissions" claim
        extractFlatClaim(claims, "permissions", permissions);

        // 2. Derive from roles: ROLE_TRADE_VIEW → TRADE_VIEW
        extractRolesAsPermissions(claims, permissions);

        // 3. OAuth2 scopes as permissions
        extractScopesAsPermissions(claims, permissions);

        return permissions.stream().distinct().toList();
    }

    /**
     * Converts roles with ROLE_ prefix to permission strings.
     * e.g., ROLE_TRADE_VIEW → TRADE_VIEW
     */
    private void extractRolesAsPermissions(Map<String, Object> claims, List<String> permissions) {
        List<String> roles = new ArrayList<>();
        extractFromNestedPath(claims, "realm_access", "roles", roles);
        extractFlatClaim(claims, "roles", roles);

        for (String role : roles) {
            if (role.toUpperCase().startsWith("ROLE_")) {
                permissions.add(role.substring(5).toUpperCase());
            }
        }
    }

    /**
     * Extracts OAuth2 scope values as permissions.
     */
    private void extractScopesAsPermissions(Map<String, Object> claims, List<String> permissions) {
        Object scopeObj = claims.get("scope");
        if (scopeObj instanceof String scopeStr) {
            for (String scope : scopeStr.split("\\s+")) {
                if (!scope.isBlank()) {
                    permissions.add(scope.toUpperCase());
                }
            }
        } else if (scopeObj instanceof List<?> scopeList) {
            for (Object s : scopeList) {
                if (s != null && !s.toString().isBlank()) {
                    permissions.add(s.toString().toUpperCase());
                }
            }
        }
    }

    // ─── Claim Parsing Utilities ─────────────────────────────────

    /**
     * Extracts string values from a claim that can be either a List or
     * a space-separated string.
     */
    @SuppressWarnings("unchecked")
    private void extractFlatClaim(Map<String, Object> claims, String key, List<String> target) {
        Object value = claims.get(key);
        if (value instanceof List<?> list) {
            for (Object item : list) {
                if (item != null) {
                    target.add(item.toString());
                }
            }
        } else if (value instanceof String str) {
            for (String item : str.split("[,\\s]+")) {
                if (!item.isBlank()) {
                    target.add(item.trim());
                }
            }
        }
    }

    /**
     * Extracts roles from a nested claim path: claims.path1.path2 → List of strings.
     * Supports 2-level and 3-level nesting.
     */
    @SuppressWarnings("unchecked")
    private void extractFromNestedPath(Map<String, Object> claims, String path1, String path2,
                                        List<String> target) {
        Object level1 = claims.get(path1);
        if (level1 instanceof Map<?, ?> map1) {
            Object level2 = map1.get(path2);
            if (level2 instanceof List<?> list) {
                for (Object item : list) {
                    if (item != null) {
                        target.add(item.toString());
                    }
                }
            } else if (level2 instanceof String str) {
                for (String item : str.split("[,\\s]+")) {
                    if (!item.isBlank()) {
                        target.add(item.trim());
                    }
                }
            }
        }
    }

    /**
     * 3-level nested path extraction: claims.path1.path2.path3
     */
    @SuppressWarnings("unchecked")
    private void extractFromNestedPath(Map<String, Object> claims, String path1, String path2,
                                        String path3, List<String> target) {
        Object level1 = claims.get(path1);
        if (level1 instanceof Map<?, ?> map1) {
            Object level2 = map1.get(path2);
            if (level2 instanceof Map<?, ?> map2) {
                extractFlatClaim((Map<String, Object>) map2, path3, target);
            }
        }
    }

    /**
     * Builds a reduced "raw authorities" map containing only security-relevant
     * claims (excludes PII like name, email, etc.).
     */
    private Map<String, Object> buildRawAuthorities(Map<String, Object> claims) {
        return Map.of(
                "roles", Optional.ofNullable(claims.get("realm_access")).orElse(Map.of()),
                "resource_access", Optional.ofNullable(claims.get("resource_access")).orElse(Map.of()),
                "scope", Optional.ofNullable(claims.get("scope")).orElse("")
        );
    }

    private String getClaimAsString(Map<String, Object> claims, String key) {
        Object value = claims.get(key);
        return value != null ? value.toString() : null;
    }

    /**
     * Falls back to fetching claims from the UserInfo endpoint when
     * the OIDC principal is not directly available (e.g., session restored from Redis).
     */
    private Map<String, Object> fetchClaimsFromUserInfo(String registrationId, String userId) {
        try {
            OAuth2AuthorizeRequest authorizeRequest = OAuth2AuthorizeRequest
                    .withClientRegistrationId(registrationId)
                    .principal(userId)
                    .build();

            OAuth2AuthorizedClient client = authorizedClientManager.authorize(authorizeRequest);
            if (client == null || client.getAccessToken() == null) {
                log.warn("Cannot obtain access token for permission extraction: userId={}", userId);
                return Collections.emptyMap();
            }

            // Decode JWT payload without calling external endpoint
            String tokenValue = client.getAccessToken().getTokenValue();
            return decodeJwtPayload(tokenValue);
        } catch (Exception e) {
            log.error("Failed to fetch claims for permission extraction: userId={}, error={}",
                    userId, e.getMessage());
            return Collections.emptyMap();
        }
    }

    /**
     * Decodes the JWT payload (without signature verification) to extract claims.
     * This is safe because the token was already validated by Spring Security.
     */
    @SuppressWarnings("unchecked")
    private Map<String, Object> decodeJwtPayload(String jwt) {
        try {
            String[] parts = jwt.split("\\.");
            if (parts.length < 2) {
                return Collections.emptyMap();
            }
            String payload = new String(java.util.Base64.getUrlDecoder().decode(parts[1]));
            return new com.fasterxml.jackson.databind.ObjectMapper().readValue(payload, Map.class);
        } catch (Exception e) {
            log.warn("Failed to decode JWT payload: {}", e.getMessage());
            return Collections.emptyMap();
        }
    }
}

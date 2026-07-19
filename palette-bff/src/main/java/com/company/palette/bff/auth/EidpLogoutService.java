package com.company.palette.bff.auth;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.oidc.OidcIdToken;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;
import org.springframework.web.util.UriComponentsBuilder;

import com.company.palette.bff.config.PaletteProperties;

/**
 * Service that handles eIDP logout (RP-Initiated Logout per OIDC spec).
 * Generates the eIDP end_session_endpoint URL with id_token_hint for the frontend to redirect.
 */
@Service
public class EidpLogoutService {

    private static final Logger log = LoggerFactory.getLogger(EidpLogoutService.class);

    private final PaletteProperties properties;

    public EidpLogoutService(PaletteProperties properties) {
        this.properties = properties;
    }

    /**
     * Performs eIDP logout by generating the end_session_endpoint URL.
     * This implements OIDC RP-Initiated Logout 1.0.
     *
     * The frontend should redirect the browser to this URL to complete SSO logout.
     *
     * @param idTokenHint the ID token value to include as hint (extract before session invalidation)
     * @return the eIDP logout URL if configured, null otherwise
     */
    public String performEidpLogout(String idTokenHint) {
        String logoutUri = properties.getEidp().getLogoutUri();

        if (logoutUri == null || logoutUri.isBlank()) {
            log.info("eIDP logout URI not configured, skipping eIDP logout");
            return null;
        }

        // Build the logout URL with id_token_hint and post_logout_redirect_uri
        UriComponentsBuilder builder = UriComponentsBuilder.fromUriString(logoutUri);

        if (idTokenHint != null && !idTokenHint.isBlank()) {
            builder.queryParam("id_token_hint", idTokenHint);
        }

        String postLogoutRedirectUri = properties.getEidp().getPostLogoutRedirectUri();
        if (postLogoutRedirectUri != null && !postLogoutRedirectUri.isBlank()) {
            builder.queryParam("post_logout_redirect_uri", postLogoutRedirectUri);
        }

        String eidpLogoutUrl = builder.build().toUriString();
        log.info("eIDP logout URL generated for end_session_endpoint: {}", logoutUri);

        return eidpLogoutUrl;
    }

    /**
     * Extracts the id_token from the current authentication.
     * Must be called BEFORE session invalidation / security context clearing.
     *
     * @return the id_token value, or null if not available
     */
    public String extractIdTokenHint() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication instanceof OAuth2AuthenticationToken oauthToken) {
            if (oauthToken.getPrincipal() instanceof OidcUser oidcUser) {
                OidcIdToken idToken = oidcUser.getIdToken();
                if (idToken != null) {
                    return idToken.getTokenValue();
                }
            }
        }
        log.warn("Unable to extract id_token_hint: no OAuth2AuthenticationToken or OidcUser available");
        return null;
    }

    /**
     * Checks if eIDP logout is configured.
     */
    public boolean isEidpLogoutConfigured() {
        String logoutUri = properties.getEidp().getLogoutUri();
        return logoutUri != null && !logoutUri.isBlank();
    }
}

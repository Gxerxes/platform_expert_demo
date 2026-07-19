package com.company.palette.bff.session;

import java.io.IOException;

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

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Filter that proactively refreshes OAuth2 access tokens before they expire.
 * Runs after Spring Security OAuth2 authentication for all authenticated requests.
 *
 * Uses OAuth2AuthorizedClientManager which internally checks token expiry
 * and performs refresh_token grant when the access token is expired or about to expire.
 * The refreshed token is stored in Spring Security's OAuth2AuthorizedClientRepository,
 * making it available to GatewayFilter and UserInfoService for subsequent token relay.
 */
@Component
public class TokenRefreshFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(TokenRefreshFilter.class);

    private final OAuth2AuthorizedClientManager authorizedClientManager;

    public TokenRefreshFilter(OAuth2AuthorizedClientManager authorizedClientManager) {
        this.authorizedClientManager = authorizedClientManager;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication instanceof OAuth2AuthenticationToken oauthToken
                && authentication.isAuthenticated()) {

            String principalName = oauthToken.getName();
            String registrationId = oauthToken.getAuthorizedClientRegistrationId();

            try {
                // OAuth2AuthorizedClientManager.authorize() internally checks token expiry
                // and automatically performs refresh_token grant if the token is expired
                // or about to expire (within the configured clock skew).
                // The refreshed token is stored in OAuth2AuthorizedClientRepository.
                OAuth2AuthorizeRequest authorizeRequest = OAuth2AuthorizeRequest
                        .withClientRegistrationId(registrationId)
                        .principal(principalName)
                        .build();

                OAuth2AuthorizedClient authorizedClient =
                        authorizedClientManager.authorize(authorizeRequest);

                if (authorizedClient != null && authorizedClient.getAccessToken() != null) {
                    log.debug("Token valid for user={}, expiresAt={}",
                            principalName,
                            authorizedClient.getAccessToken().getExpiresAt());
                }
            } catch (Exception e) {
                log.warn("Token refresh check failed for user={}: {}", principalName, e.getMessage());
            }
        }

        filterChain.doFilter(request, response);
    }
}

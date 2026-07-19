package com.company.palette.bff.session;

import java.time.Instant;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.oauth2.client.OAuth2AuthorizeRequest;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientManager;
import org.springframework.stereotype.Service;

@Service
public class TokenRefreshService {

    private static final Logger log = LoggerFactory.getLogger(TokenRefreshService.class);

    private final OAuth2AuthorizedClientManager authorizedClientManager;
    private final SessionRepository sessionRepository;

    public TokenRefreshService(OAuth2AuthorizedClientManager authorizedClientManager,
                               SessionRepository sessionRepository) {
        this.authorizedClientManager = authorizedClientManager;
        this.sessionRepository = sessionRepository;
    }

    public PaletteSession refreshIfNeeded(PaletteSession session) {
        if (!session.isTokenExpiringSoon()) {
            return session;
        }

        log.info("Token expiring soon for user={}, attempting refresh", session.getUserId());

        try {
            OAuth2AuthorizeRequest authorizeRequest = OAuth2AuthorizeRequest
                    .withClientRegistrationId("eidp")
                    .principal(session.getUserId())
                    .build();

            OAuth2AuthorizedClient authorizedClient = authorizedClientManager.authorize(authorizeRequest);

            if (authorizedClient != null && authorizedClient.getAccessToken() != null) {
                session.setAccessToken(authorizedClient.getAccessToken().getTokenValue());

                if (authorizedClient.getRefreshToken() != null) {
                    session.setRefreshToken(authorizedClient.getRefreshToken().getTokenValue());
                }

                Instant expiresAt = authorizedClient.getAccessToken().getExpiresAt() != null
                        ? authorizedClient.getAccessToken().getExpiresAt()
                        : Instant.now().plusSeconds(3600);
                session.setTokenExpiresAt(expiresAt);

                sessionRepository.save(session);
                log.info("Token refreshed successfully for user={}", session.getUserId());
            }
        } catch (Exception e) {
            log.error("Failed to refresh token for user={}: {}", session.getUserId(), e.getMessage());
        }

        return session;
    }
}

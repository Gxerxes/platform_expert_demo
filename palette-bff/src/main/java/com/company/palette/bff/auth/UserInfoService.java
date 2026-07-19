package com.company.palette.bff.auth;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.OAuth2AuthorizeRequest;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientManager;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

/**
 * Service that calls eIDP's UserInfo endpoint to retrieve real-time user information.
 * Uses the OAuth2 Access Token owned by BFF to call eIDP on behalf of the user.
 */
@Service
public class UserInfoService {

    private static final Logger log = LoggerFactory.getLogger(UserInfoService.class);

    private final OAuth2AuthorizedClientManager authorizedClientManager;
    private final RestClient restClient;
    private final String userInfoUri;

    public UserInfoService(OAuth2AuthorizedClientManager authorizedClientManager,
                           @Value("${spring.security.oauth2.client.provider.eidp.user-info-uri}") String userInfoUri) {
        this.authorizedClientManager = authorizedClientManager;
        this.userInfoUri = userInfoUri;
        this.restClient = RestClient.builder()
                .baseUrl(userInfoUri)
                .build();
    }

    /**
     * Fetches user info from eIDP using the current user's access token.
     *
     * @return UserInfo object with user details from eIDP
     */
    public UserInfo fetchCurrentUserInfo() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (!(authentication instanceof OAuth2AuthenticationToken oauthToken)) {
            throw new UserInfoException("No OAuth2 authentication available");
        }

        String registrationId = oauthToken.getAuthorizedClientRegistrationId();
        String principalName = oauthToken.getName();

        OAuth2AuthorizeRequest authorizeRequest = OAuth2AuthorizeRequest
                .withClientRegistrationId(registrationId)
                .principal(principalName)
                .build();

        OAuth2AuthorizedClient authorizedClient =
                authorizedClientManager.authorize(authorizeRequest);

        if (authorizedClient == null || authorizedClient.getAccessToken() == null) {
            throw new UserInfoException("No access token available for user: " + principalName);
        }

        return fetchUserInfo(authorizedClient.getAccessToken().getTokenValue());
    }

    /**
     * Fetches user info from eIDP using the provided access token.
     *
     * @param accessToken OAuth2 access token
     * @return UserInfo from eIDP
     */
    public UserInfo fetchUserInfo(String accessToken) {
        try {
            Map<String, Object> response = restClient.get()
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                    .accept(MediaType.APPLICATION_JSON)
                    .retrieve()
                    .body(Map.class);

            if (response == null) {
                throw new UserInfoException("Empty response from eIDP UserInfo endpoint");
            }

            return mapToUserInfo(response);
        } catch (UserInfoException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to call eIDP UserInfo endpoint: {}", e.getMessage(), e);
            throw new UserInfoException("Failed to retrieve user info from eIDP: " + e.getMessage(), e);
        }
    }

    private UserInfo mapToUserInfo(Map<String, Object> claims) {
        return UserInfo.builder()
                .sub(getClaimAsString(claims, "sub"))
                .name(getClaimAsString(claims, "name"))
                .preferredUsername(getClaimAsString(claims, "preferred_username"))
                .email(getClaimAsString(claims, "email"))
                .emailVerified((Boolean) claims.get("email_verified"))
                .phoneNumber(getClaimAsString(claims, "phone_number"))
                .picture(getClaimAsString(claims, "picture"))
                .locale(getClaimAsString(claims, "locale"))
                .zoneinfo(getClaimAsString(claims, "zoneinfo"))
                .updatedAt(claims.get("updated_at"))
                .rawClaims(claims)
                .build();
    }

    private String getClaimAsString(Map<String, Object> claims, String key) {
        Object value = claims.get(key);
        return value != null ? value.toString() : null;
    }
}

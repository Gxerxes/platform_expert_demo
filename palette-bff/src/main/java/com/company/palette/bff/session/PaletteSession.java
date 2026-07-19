package com.company.palette.bff.session;

import java.io.Serializable;
import java.time.Instant;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaletteSession implements Serializable {

    private static final long serialVersionUID = 1L;

    private String sessionId;
    private String userId;
    private String username;
    private String displayName;
    private String email;
    private String accessToken;
    private String refreshToken;
    private Instant tokenExpiresAt;
    private Instant expireAt;

    public boolean isExpired() {
        return expireAt != null && Instant.now().isAfter(expireAt);
    }

    public boolean isTokenExpiringSoon() {
        if (tokenExpiresAt == null) {
            return true;
        }
        return Instant.now().plusSeconds(60).isAfter(tokenExpiresAt);
    }
}

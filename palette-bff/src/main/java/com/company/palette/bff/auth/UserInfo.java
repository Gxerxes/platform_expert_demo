package com.company.palette.bff.auth;

import java.util.Map;

import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Represents user information returned from eIDP's UserInfo endpoint.
 * Maps standard OIDC claims.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserInfo {

    /** Subject - unique user identifier (sub claim) */
    private String sub;

    /** Full name */
    private String name;

    /** Username / login name */
    private String preferredUsername;

    /** Email address */
    private String email;

    /** Whether email is verified */
    private Boolean emailVerified;

    /** Phone number */
    private String phoneNumber;

    /** Profile picture URL */
    private String picture;

    /** User locale preference */
    private String locale;

    /** User timezone */
    private String zoneinfo;

    /** Last update timestamp */
    private Object updatedAt;

    /** Raw claims from eIDP for extensibility */
    private Map<String, Object> rawClaims;
}

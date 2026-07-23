package com.company.palette.bff.permission;

import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Represents a user's permissions and roles extracted from eIDP token claims.
 * Used by the frontend to perform permission-based access control.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserPermission {

    /** User ID (subject claim) */
    private String userId;

    /** Username */
    private String username;

    /** Granted permissions (e.g., ["TRADE_VIEW", "TRADE_CREATE", "CLEARING_ADMIN"]) */
    private List<String> permissions;

    /** Assigned roles (e.g., ["CLEARING_USER", "ADMIN"]) */
    private List<String> roles;

    /** Whether the user has admin privileges */
    private boolean admin;

    /** Raw authority claims from eIDP for extensibility */
    private Map<String, Object> rawAuthorities;
}

package com.company.palette.bff.permission;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.company.palette.bff.common.ApiResponse;
import com.company.palette.bff.exception.ErrorCode;
import com.company.palette.bff.exception.PaletteException;

/**
 * REST controller exposing the current user's permissions and roles.
 *
 * <p>Endpoint: {@code GET /palette/api/v1/auth/permissions}
 *
 * <p>The frontend {@code @palette/auth} AuthProvider calls this endpoint
 * after session validation to populate the permission context used by
 * {@code usePermission()}, {@code RequirePermission}, etc.
 *
 * <p>Response example:
 * <pre>
 * {
 *   "data": {
 *     "userId": "a1b2c3d4",
 *     "username": "trader1",
 *     "permissions": ["TRADE_VIEW", "TRADE_CREATE", "CLEARING_VIEW"],
 *     "roles": ["CLEARING_USER", "TRADER"],
 *     "admin": false,
 *     "rawAuthorities": { ... }
 *   }
 * }
 * </pre>
 */
@RestController
@RequestMapping("/palette/api/v1/auth")
public class PermissionController {

    private static final Logger log = LoggerFactory.getLogger(PermissionController.class);

    private final PermissionService permissionService;

    public PermissionController(PermissionService permissionService) {
        this.permissionService = permissionService;
    }

    /**
     * GET /palette/api/v1/auth/permissions
     *
     * Returns the current user's permissions and roles extracted from eIDP token claims.
     * Requires an authenticated session (enforced by SecurityConfig).
     *
     * @return ApiResponse wrapping UserPermission
     */
    @GetMapping("/permissions")
    public ApiResponse<UserPermission> getPermissions() {
        try {
            UserPermission permissions = permissionService.extractCurrentUserPermissions();
            log.debug("Returning permissions for userId={}", permissions.getUserId());
            return ApiResponse.success(permissions);
        } catch (IllegalStateException e) {
            log.warn("Failed to extract permissions: {}", e.getMessage());
            throw new PaletteException(ErrorCode.UNAUTHORIZED,
                    "Unable to extract permissions: " + e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected error extracting permissions", e);
            throw new PaletteException(ErrorCode.INTERNAL_ERROR,
                    "Failed to extract permissions");
        }
    }
}

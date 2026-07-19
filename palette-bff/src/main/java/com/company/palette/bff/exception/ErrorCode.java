package com.company.palette.bff.exception;

import org.springframework.http.HttpStatus;

import lombok.Getter;

@Getter
public enum ErrorCode {

    BAD_REQUEST(HttpStatus.BAD_REQUEST, "PALETTE_BAD_REQUEST", "Bad request"),
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "PALETTE_UNAUTHORIZED", "Authentication required"),
    FORBIDDEN(HttpStatus.FORBIDDEN, "PALETTE_FORBIDDEN", "Access denied"),
    NOT_FOUND(HttpStatus.NOT_FOUND, "PALETTE_NOT_FOUND", "Resource not found"),
    METHOD_NOT_ALLOWED(HttpStatus.METHOD_NOT_ALLOWED, "PALETTE_METHOD_NOT_ALLOWED", "Method not allowed"),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "PALETTE_INTERNAL_ERROR", "Internal server error"),
    SERVICE_UNAVAILABLE(HttpStatus.SERVICE_UNAVAILABLE, "PALETTE_SERVICE_UNAVAILABLE", "Service unavailable"),
    GATEWAY_ERROR(HttpStatus.BAD_GATEWAY, "PALETTE_GATEWAY_ERROR", "Backend service unavailable"),
    GATEWAY_TIMEOUT(HttpStatus.GATEWAY_TIMEOUT, "PALETTE_GATEWAY_TIMEOUT", "Backend service timeout"),
    SESSION_EXPIRED(HttpStatus.UNAUTHORIZED, "PALETTE_SESSION_EXPIRED", "Session has expired");

    private final HttpStatus httpStatus;
    private final String code;
    private final String defaultMessage;

    ErrorCode(HttpStatus httpStatus, String code, String defaultMessage) {
        this.httpStatus = httpStatus;
        this.code = code;
        this.defaultMessage = defaultMessage;
    }
}

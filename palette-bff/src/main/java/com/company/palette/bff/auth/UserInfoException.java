package com.company.palette.bff.auth;

/**
 * Exception thrown when user info retrieval from eIDP fails.
 */
public class UserInfoException extends RuntimeException {

    public UserInfoException(String message) {
        super(message);
    }

    public UserInfoException(String message, Throwable cause) {
        super(message, cause);
    }
}

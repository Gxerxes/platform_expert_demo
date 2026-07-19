package com.company.palette.bff.exception;

import lombok.Getter;

@Getter
public class PaletteException extends RuntimeException {

    private final ErrorCode errorCode;

    public PaletteException(ErrorCode errorCode) {
        super(errorCode.getDefaultMessage());
        this.errorCode = errorCode;
    }

    public PaletteException(ErrorCode errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public PaletteException(ErrorCode errorCode, Throwable cause) {
        super(errorCode.getDefaultMessage(), cause);
        this.errorCode = errorCode;
    }

    public PaletteException(ErrorCode errorCode, String message, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
    }
}

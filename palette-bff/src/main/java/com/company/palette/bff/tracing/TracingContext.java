package com.company.palette.bff.tracing;

import org.slf4j.MDC;

public final class TracingContext {

    private static final String REQUEST_ID_KEY = "requestId";
    private static final ThreadLocal<String> REQUEST_ID = new ThreadLocal<>();
    private static final ThreadLocal<String> USER_ID = new ThreadLocal<>();

    private TracingContext() {
    }

    public static void setRequestId(String requestId) {
        REQUEST_ID.set(requestId);
        MDC.put(REQUEST_ID_KEY, requestId);
    }

    public static String getRequestId() {
        return REQUEST_ID.get();
    }

    public static void setUserId(String userId) {
        USER_ID.set(userId);
    }

    public static String getUserId() {
        return USER_ID.get();
    }

    public static void clear() {
        REQUEST_ID.remove();
        USER_ID.remove();
        MDC.remove(REQUEST_ID_KEY);
    }
}

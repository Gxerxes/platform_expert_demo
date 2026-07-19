package com.company.palette.bff.tracing;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

class TracingContextTest {

    @AfterEach
    void cleanup() {
        TracingContext.clear();
    }

    @Test
    void shouldSetAndGetRequestId() {
        TracingContext.setRequestId("TEST-123");
        assertEquals("TEST-123", TracingContext.getRequestId());
    }

    @Test
    void shouldSetAndGetUserId() {
        TracingContext.setUserId("user-456");
        assertEquals("user-456", TracingContext.getUserId());
    }

    @Test
    void shouldClearAllContext() {
        TracingContext.setRequestId("TEST-123");
        TracingContext.setUserId("user-456");

        TracingContext.clear();

        assertNull(TracingContext.getRequestId());
        assertNull(TracingContext.getUserId());
    }

    @Test
    void shouldReturnNullWhenNotSet() {
        assertNull(TracingContext.getRequestId());
        assertNull(TracingContext.getUserId());
    }
}

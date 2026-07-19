package com.company.palette.bff.audit;

import java.time.Instant;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuditEvent {

    private String userId;
    private AuditEventType action;
    private String requestId;
    private String details;
    private Instant timestamp;
    private String ipAddress;
    private String userAgent;
}

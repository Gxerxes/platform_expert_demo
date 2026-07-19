package com.company.palette.bff.audit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class AuditService {

    private static final Logger log = LoggerFactory.getLogger(AuditService.class);

    @Async
    public void record(AuditEvent event) {
        log.info("AUDIT: userId={} action={} requestId={} ip={} timestamp={}",
                event.getUserId(),
                event.getAction(),
                event.getRequestId(),
                event.getIpAddress(),
                event.getTimestamp());
    }

    public void recordLogin(String userId, String requestId, String ipAddress) {
        record(AuditEvent.builder()
                .userId(userId)
                .action(AuditEventType.LOGIN)
                .requestId(requestId)
                .ipAddress(ipAddress)
                .timestamp(java.time.Instant.now())
                .build());
    }

    public void recordLogout(String userId, String requestId, String ipAddress) {
        record(AuditEvent.builder()
                .userId(userId)
                .action(AuditEventType.LOGOUT)
                .requestId(requestId)
                .ipAddress(ipAddress)
                .timestamp(java.time.Instant.now())
                .build());
    }

    public void recordApiAccess(String userId, String requestId, String details, String ipAddress) {
        record(AuditEvent.builder()
                .userId(userId)
                .action(AuditEventType.API_ACCESS)
                .requestId(requestId)
                .details(details)
                .ipAddress(ipAddress)
                .timestamp(java.time.Instant.now())
                .build());
    }
}

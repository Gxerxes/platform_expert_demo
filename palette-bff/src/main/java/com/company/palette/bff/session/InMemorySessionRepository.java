package com.company.palette.bff.session;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Repository;

/**
 * In-memory session repository for development environments.
 * Not suitable for production - use RedisSessionRepository instead.
 */
@Repository
@ConditionalOnProperty(name = "palette.session.store-type", havingValue = "memory")
public class InMemorySessionRepository implements SessionRepository {

    private static final Logger log = LoggerFactory.getLogger(InMemorySessionRepository.class);

    private final Map<String, PaletteSession> sessions = new ConcurrentHashMap<>();

    @Override
    public void save(PaletteSession session) {
        sessions.put(session.getSessionId(), session);
        log.debug("Session saved (in-memory): sessionId={}", session.getSessionId());
    }

    @Override
    public Optional<PaletteSession> findById(String sessionId) {
        PaletteSession session = sessions.get(sessionId);
        if (session == null) {
            return Optional.empty();
        }
        if (session.isExpired()) {
            delete(sessionId);
            return Optional.empty();
        }
        return Optional.of(session);
    }

    @Override
    public void delete(String sessionId) {
        sessions.remove(sessionId);
        log.debug("Session deleted (in-memory): sessionId={}", sessionId);
    }

    @Override
    public boolean exists(String sessionId) {
        return sessions.containsKey(sessionId);
    }
}

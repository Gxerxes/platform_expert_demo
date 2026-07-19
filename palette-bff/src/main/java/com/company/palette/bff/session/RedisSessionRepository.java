package com.company.palette.bff.session;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Repository;

@Repository
@ConditionalOnProperty(name = "palette.session.store-type", havingValue = "redis", matchIfMissing = true)
public class RedisSessionRepository implements SessionRepository {

    private static final Logger log = LoggerFactory.getLogger(RedisSessionRepository.class);
    private static final String KEY_PREFIX = "palette:session:";
    private static final Duration DEFAULT_TTL = Duration.ofHours(8);

    private final RedisTemplate<String, Object> redisTemplate;

    public RedisSessionRepository(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @Override
    public void save(PaletteSession session) {
        String key = KEY_PREFIX + session.getSessionId();
        Duration ttl = calculateTTL(session);
        redisTemplate.opsForValue().set(key, session, ttl);
        log.debug("Session saved: sessionId={}, ttl={}", session.getSessionId(), ttl);
    }

    @Override
    public Optional<PaletteSession> findById(String sessionId) {
        String key = KEY_PREFIX + sessionId;
        Object value = redisTemplate.opsForValue().get(key);
        if (value instanceof PaletteSession session) {
            if (session.isExpired()) {
                delete(sessionId);
                return Optional.empty();
            }
            return Optional.of(session);
        }
        return Optional.empty();
    }

    @Override
    public void delete(String sessionId) {
        String key = KEY_PREFIX + sessionId;
        Boolean deleted = redisTemplate.delete(key);
        log.debug("Session deleted: sessionId={}, success={}", sessionId, deleted);
    }

    @Override
    public boolean exists(String sessionId) {
        String key = KEY_PREFIX + sessionId;
        Boolean exists = redisTemplate.hasKey(key);
        return Boolean.TRUE.equals(exists);
    }

    private Duration calculateTTL(PaletteSession session) {
        if (session.getExpireAt() != null) {
            Duration ttl = Duration.between(Instant.now(), session.getExpireAt());
            return ttl.isPositive() ? ttl : DEFAULT_TTL;
        }
        return DEFAULT_TTL;
    }
}

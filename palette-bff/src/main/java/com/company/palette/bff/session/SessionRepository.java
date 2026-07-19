package com.company.palette.bff.session;

import java.util.Optional;

public interface SessionRepository {

    void save(PaletteSession session);

    Optional<PaletteSession> findById(String sessionId);

    void delete(String sessionId);

    boolean exists(String sessionId);
}

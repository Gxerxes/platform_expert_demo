# ============================================================
# Palette BFF - Dockerfile
# ============================================================
# Build strategy: local Gradle build, Docker only packages runtime
# This avoids downloading dependencies inside the container.
#
# Usage:
#   ./gradlew clean bootJar -x test
#   docker build -t palette-bff:latest .
# ============================================================

ARG REGISTRY=docker.m.daocloud.io

FROM ${REGISTRY}/eclipse-temurin:21-jre-alpine

WORKDIR /app

RUN addgroup -S palette && adduser -S palette -G palette

COPY build/libs/*.jar app.jar

RUN chown -R palette:palette /app

USER palette

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD wget -q --spider http://localhost:8080/palette/api/v1/system/health/live || exit 1

ENTRYPOINT ["java", \
    "-XX:+UseContainerSupport", \
    "-XX:MaxRAMPercentage=75.0", \
    "-Djava.security.egd=file:/dev/./urandom", \
    "-Dspring.profiles.active=docker", \
    "-jar", "app.jar"]

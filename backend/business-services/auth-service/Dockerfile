# Stage 1: Build
FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /app
COPY . .
RUN --mount=type=cache,target=/root/.m2 mvn -pl common-lib,business-services/auth-service -am install -DskipTests -q

# Stage 2: Runtime (alpine JRE nhẹ ~200MB)
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=builder /app/business-services/auth-service/target/*.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]


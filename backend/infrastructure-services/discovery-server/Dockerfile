# Stage 1: Build
FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /app
# Copy parent pom và common-lib trước để cache layer dependency
COPY pom.xml .
COPY common-lib ./common-lib
COPY infrastructure-services/discovery-server ./infrastructure-services/discovery-server
RUN mvn -pl common-lib,infrastructure-services/discovery-server -am install -DskipTests -q

# Stage 2: Runtime
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=builder /app/infrastructure-services/discovery-server/target/*.jar app.jar
EXPOSE 8761
ENTRYPOINT ["java", "-jar", "app.jar"]

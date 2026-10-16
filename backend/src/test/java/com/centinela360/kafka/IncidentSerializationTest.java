package com.centinela360.kafka;

import com.centinela360.config.KafkaProducerConfig;
import com.centinela360.config.R2dbcConfig;
import com.centinela360.controller.dto.IncidentResponse;
import com.centinela360.domain.Incident;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.locationtech.jts.geom.Point;

import java.time.OffsetDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class IncidentSerializationTest {

    private final ObjectMapper mapper = new KafkaProducerConfig().kafkaObjectMapper();

    @Test
    void shouldSerializeIncidentWithoutInfiniteRecursion() throws Exception {
        Point point = R2dbcConfig.makePoint(-79.8374, -6.7714);
        Incident incident = Incident.builder()
                .id(UUID.randomUUID())
                .category("ROBO")
                .status("ABIERTO")
                .location(point)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build();

        String json = mapper.writeValueAsString(incident);
        assertNotNull(json);
        assertTrue(json.contains("\"latitude\":-6.7714"));
        assertTrue(json.contains("\"longitude\":-79.8374"));
    }

    @Test
    void shouldSerializeEventEnvelopeWithIncidentResponse() throws Exception {
        Point point = R2dbcConfig.makePoint(-79.8374, -6.7714);
        Incident incident = Incident.builder()
                .id(UUID.randomUUID())
                .category("ROBO")
                .status("ABIERTO")
                .location(point)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build();

        IncidentResponse response = IncidentResponse.from(incident, "CREATED");
        EventEnvelope<Object> event = EventEnvelope.of(
                "incidents.updated",
                "consolidation-service",
                incident.getId(),
                response
        );

        String json = mapper.writeValueAsString(event);
        assertNotNull(json);
        assertTrue(json.contains("\"eventType\":\"incidents.updated\""));
        assertTrue(json.contains("\"latitude\":-6.7714"));
        assertTrue(json.contains("\"changeType\":\"CREATED\""));
    }
}

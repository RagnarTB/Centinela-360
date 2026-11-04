package com.centinela360.domain;

import io.r2dbc.postgresql.codec.Json;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Table;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("incident_events")
public class IncidentEvent {
    @Id
    private UUID id;
    private UUID incidentId;
    private String eventType;
    private Json payload;
    private OffsetDateTime createdAt;

    public static IncidentEvent create(UUID incidentId, String eventType, String jsonString) {
        return IncidentEvent.builder()
                .incidentId(incidentId)
                .eventType(eventType)
                .payload(jsonString != null ? Json.of(jsonString) : null)
                .createdAt(OffsetDateTime.now())
                .build();
    }

    public String getPayloadAsString() {
        return payload != null ? payload.asString() : null;
    }
}
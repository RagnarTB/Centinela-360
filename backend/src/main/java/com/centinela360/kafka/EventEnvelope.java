package com.centinela360.kafka;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventEnvelope<T> {
    private UUID eventId;
    private String eventType;      // ej. "reports.created"
    private OffsetDateTime occurredAt;
    private String source;         // ej. "report-service"
    private UUID correlationId;    // para rastrear un flujo completo (ej. el ID del reporte)
    private T payload;

    public static <T> EventEnvelope<T> of(String eventType, String source, UUID correlationId, T payload) {
        return EventEnvelope.<T>builder()
                .eventId(UUID.randomUUID())
                .eventType(eventType)
                .occurredAt(OffsetDateTime.now())
                .source(source)
                .correlationId(correlationId)
                .payload(payload)
                .build();
    }
}
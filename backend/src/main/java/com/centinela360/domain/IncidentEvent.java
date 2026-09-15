package com.centinela360.domain;

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
    private String payload; // JSONB como String por ahora; se tipa mejor si hace falta más adelante
    private OffsetDateTime createdAt;
}
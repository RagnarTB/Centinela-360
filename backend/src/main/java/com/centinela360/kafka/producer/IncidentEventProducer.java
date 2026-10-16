package com.centinela360.kafka.producer;

import com.centinela360.controller.dto.IncidentResponse;
import com.centinela360.domain.Incident;
import com.centinela360.kafka.EventEnvelope;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class IncidentEventProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void publishIncidentUpdated(UUID incidentId, String changeType, Object payload) {
        // changeType puede ser "CREATED" o "REPORT_ASSOCIATED"
        Object eventPayload = payload;
        if (payload instanceof Incident incident) {
            eventPayload = IncidentResponse.from(incident, changeType);
        }

        EventEnvelope<Object> event = EventEnvelope.of(
                "incidents.updated",
                "consolidation-service",
                incidentId,
                eventPayload
        );
        kafkaTemplate.send("incidents.updated", incidentId.toString(), event);
    }
}
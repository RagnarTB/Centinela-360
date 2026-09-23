package com.centinela360.kafka.producer;

import com.centinela360.controller.dto.UnitResponse;
import com.centinela360.kafka.EventEnvelope;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class UnitLocationEventProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void publishLocationUpdated(UnitResponse unit) {
        EventEnvelope<UnitResponse> event = EventEnvelope.of(
                "units.location.updated",
                "location-service",
                unit.id(),
                unit
        );
        kafkaTemplate.send("units.location.updated", unit.id().toString(), event);
    }
}
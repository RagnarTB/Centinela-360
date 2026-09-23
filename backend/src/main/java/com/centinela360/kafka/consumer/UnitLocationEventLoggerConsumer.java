package com.centinela360.kafka.consumer;

import com.centinela360.kafka.EventEnvelope;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class UnitLocationEventLoggerConsumer {

    @SuppressWarnings("rawtypes")
    @KafkaListener(topics = "units.location.updated", groupId = "centinela360-backend")
    public void onLocationUpdated(EventEnvelope event) {
        System.out.println(">>> EVENTO RECIBIDO: " + event.getEventType() + " | payload: " + event.getPayload());
    }
}
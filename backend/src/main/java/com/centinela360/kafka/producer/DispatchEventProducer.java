package com.centinela360.kafka.producer;

import com.centinela360.domain.Dispatch;
import com.centinela360.kafka.EventEnvelope;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class DispatchEventProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void publishDispatchCreated(Dispatch dispatch) {
        EventEnvelope<Dispatch> event = EventEnvelope.of(
                "dispatch.created",
                "dispatch-service",
                dispatch.getId(),
                dispatch
        );
        kafkaTemplate.send("dispatch.created", dispatch.getId().toString(), event);
    }

    public void publishDispatchStatusUpdated(Dispatch dispatch) {
        EventEnvelope<Dispatch> event = EventEnvelope.of(
                "dispatch.status.updated",
                "dispatch-service",
                dispatch.getId(),
                dispatch
        );
        kafkaTemplate.send("dispatch.status.updated", dispatch.getId().toString(), event);
    }
}

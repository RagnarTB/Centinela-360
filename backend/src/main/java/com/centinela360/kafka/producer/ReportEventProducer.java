package com.centinela360.kafka.producer;

import com.centinela360.controller.dto.ReportResponse;
import com.centinela360.kafka.EventEnvelope;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ReportEventProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void publishReportCreated(ReportResponse report) {
        EventEnvelope<ReportResponse> event = EventEnvelope.of(
                "reports.created",
                "report-service",
                report.id(),
                report
        );
        kafkaTemplate.send("reports.created", report.id().toString(), event);
    }
}
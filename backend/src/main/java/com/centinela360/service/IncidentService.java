package com.centinela360.service;

import com.centinela360.controller.dto.IncidentDetailResponse;
import com.centinela360.controller.dto.IncidentSummaryResponse;
import com.centinela360.controller.dto.ReportResponse;
import com.centinela360.controller.dto.ReviewIncidentRequest;
import com.centinela360.domain.Incident;
import com.centinela360.domain.IncidentEvent;
import com.centinela360.kafka.producer.IncidentEventProducer;
import com.centinela360.repository.IncidentEventRepository;
import com.centinela360.repository.IncidentRepository;
import com.centinela360.repository.ReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class IncidentService {

    private final IncidentRepository incidentRepository;
    private final ReportRepository reportRepository;
    private final IncidentEventRepository incidentEventRepository;
    private final IncidentEventProducer incidentEventProducer;

    public Flux<IncidentSummaryResponse> getAllIncidents() {
        return incidentRepository.findAll().map(this::toSummary);
    }

    public Mono<IncidentDetailResponse> getIncidentById(UUID id) {
        return incidentRepository.findById(id)
                .switchIfEmpty(Mono.error(
                        new ResponseStatusException(HttpStatus.NOT_FOUND, "Incidente no encontrado: " + id)
                ))
                .flatMap(incident -> reportRepository.findReportsByIncidentId(id)
                        .map(ReportResponse::from)
                        .collectList()
                        .map(reports -> toDetail(incident, reports)));
    }

    private IncidentSummaryResponse toSummary(Incident i) {
        return new IncidentSummaryResponse(
                i.getId(), i.getCategory(), i.getStatus(), i.getTrustScore(),
                i.getLocation().getY(), i.getLocation().getX(), i.getCreatedAt()
        );
    }

    private IncidentDetailResponse toDetail(Incident i, List<ReportResponse> reports) {
        return new IncidentDetailResponse(
                i.getId(), i.getCategory(), i.getStatus(), i.getTrustScore(),
                i.getLocation().getY(), i.getLocation().getX(),
                i.getCreatedAt(), i.getUpdatedAt(),
                reports
        );
    }

    @Transactional
    public Mono<IncidentDetailResponse> reviewIncident(UUID id, ReviewIncidentRequest request) {
        return incidentRepository.findById(id)
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Incidente no encontrado: " + id)))
                .flatMap(incident -> {
                    String action = request.action().toUpperCase();
                    if ("CONFIRMAR".equals(action)) {
                        incident.setStatus("CONFIRMADO");
                        incident.setTrustScore(BigDecimal.valueOf(100.00).setScale(2, RoundingMode.HALF_UP));
                    } else if ("DESCARTAR".equals(action)) {
                        incident.setStatus("DESCARTADO");
                        incident.setTrustScore(BigDecimal.valueOf(0.00).setScale(2, RoundingMode.HALF_UP));
                    }
                    incident.setUpdatedAt(OffsetDateTime.now());

                    IncidentEvent event = IncidentEvent.builder()
                            .incidentId(incident.getId())
                            .eventType("INCIDENT_" + action)
                            .payload(String.format("{\"notes\":\"%s\",\"operatorId\":\"%s\"}",
                                    request.notes() != null ? request.notes() : "",
                                    request.operatorId() != null ? request.operatorId() : ""))
                            .createdAt(OffsetDateTime.now())
                            .build();

                    return incidentRepository.save(incident)
                            .then(incidentEventRepository.save(event))
                            .then(getIncidentById(id))
                            .doOnSuccess(detail -> incidentEventProducer.publishIncidentUpdated(id, "REVIEWED_" + action, incident));
                });
    }
}
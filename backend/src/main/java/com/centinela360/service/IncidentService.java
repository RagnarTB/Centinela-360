package com.centinela360.service;

import com.centinela360.controller.dto.IncidentDetailResponse;
import com.centinela360.controller.dto.IncidentSummaryResponse;
import com.centinela360.controller.dto.ReportResponse;
import com.centinela360.domain.Incident;
import com.centinela360.repository.IncidentRepository;
import com.centinela360.repository.ReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class IncidentService {

    private final IncidentRepository incidentRepository;
    private final ReportRepository reportRepository;

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
}
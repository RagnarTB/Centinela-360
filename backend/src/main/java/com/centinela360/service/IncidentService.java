package com.centinela360.service;

import com.centinela360.controller.dto.IncidentDetailResponse;
import com.centinela360.controller.dto.IncidentSummaryResponse;
import com.centinela360.domain.Incident;
import com.centinela360.repository.IncidentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Collections;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class IncidentService {

    private final IncidentRepository incidentRepository;

    public Flux<IncidentSummaryResponse> getAllIncidents() {
        return incidentRepository.findAll().map(this::toSummary);
    }

    public Mono<IncidentDetailResponse> getIncidentById(UUID id) {
        return incidentRepository.findById(id)
                .map(this::toDetail)
                .switchIfEmpty(Mono.error(
                        new ResponseStatusException(HttpStatus.NOT_FOUND, "Incidente no encontrado: " + id)
                ));
    }

    private IncidentSummaryResponse toSummary(Incident i) {
        return new IncidentSummaryResponse(
                i.getId(), i.getCategory(), i.getStatus(), i.getTrustScore(),
                i.getLocation().getY(), i.getLocation().getX(), i.getCreatedAt()
        );
    }

    private IncidentDetailResponse toDetail(Incident i) {
        return new IncidentDetailResponse(
                i.getId(), i.getCategory(), i.getStatus(), i.getTrustScore(),
                i.getLocation().getY(), i.getLocation().getX(),
                i.getCreatedAt(), i.getUpdatedAt(),
                Collections.emptyList() // TODO (Fase 5): llenar con reportes reales via incident_reports
        );
    }
}
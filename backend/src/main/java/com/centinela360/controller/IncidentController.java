package com.centinela360.controller;

import com.centinela360.controller.dto.IncidentDetailResponse;
import com.centinela360.controller.dto.IncidentSummaryResponse;
import com.centinela360.service.IncidentService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/incidents")
@RequiredArgsConstructor
public class IncidentController {

    private final IncidentService incidentService;

    @GetMapping
    public Flux<IncidentSummaryResponse> getAllIncidents() {
        return incidentService.getAllIncidents();
    }

    @GetMapping("/{id}")
    public Mono<IncidentDetailResponse> getIncidentById(@PathVariable UUID id) {
        return incidentService.getIncidentById(id);
    }
}
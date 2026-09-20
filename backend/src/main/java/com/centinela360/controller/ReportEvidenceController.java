package com.centinela360.controller;

import com.centinela360.controller.dto.CreateEvidenceRequest;
import com.centinela360.controller.dto.EvidenceResponse;
import com.centinela360.service.ReportEvidenceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/reports/{reportId}/evidence")
@RequiredArgsConstructor
public class ReportEvidenceController {

    private final ReportEvidenceService evidenceService;

    @PostMapping
    public Mono<ResponseEntity<EvidenceResponse>> addEvidence(
            @PathVariable UUID reportId,
            @Valid @RequestBody CreateEvidenceRequest request) {
        return evidenceService.addEvidence(reportId, request)
                .map(response -> ResponseEntity.status(HttpStatus.CREATED).body(response));
    }

    @GetMapping
    public Flux<EvidenceResponse> getEvidence(@PathVariable UUID reportId) {
        return evidenceService.getEvidenceByReport(reportId);
    }
}
package com.centinela360.service;

import com.centinela360.controller.dto.CreateEvidenceRequest;
import com.centinela360.controller.dto.EvidenceResponse;
import com.centinela360.domain.ReportEvidence;
import com.centinela360.repository.ReportEvidenceRepository;
import com.centinela360.repository.ReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.OffsetDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReportEvidenceService {

    private final ReportEvidenceRepository evidenceRepository;
    private final ReportRepository reportRepository;

    public Mono<EvidenceResponse> addEvidence(UUID reportId, CreateEvidenceRequest request) {
        return reportRepository.findById(reportId)
                .switchIfEmpty(Mono.error(
                        new ResponseStatusException(HttpStatus.NOT_FOUND, "Reporte no encontrado: " + reportId)
                ))
                .flatMap(report -> {
                    ReportEvidence evidence = ReportEvidence.builder()
                            .reportId(reportId)
                            .storageRef(request.storageRef())
                            .mediaType(request.mediaType())
                            .createdAt(OffsetDateTime.now())
                            .build();
                    return evidenceRepository.save(evidence);
                })
                .map(this::toResponse);
    }

    public Flux<EvidenceResponse> getEvidenceByReport(UUID reportId) {
        return evidenceRepository.findByReportId(reportId)
                .map(this::toResponse);
    }

    private EvidenceResponse toResponse(ReportEvidence e) {
        return new EvidenceResponse(e.getId(), e.getReportId(), e.getStorageRef(), e.getMediaType(), e.getCreatedAt());
    }
}
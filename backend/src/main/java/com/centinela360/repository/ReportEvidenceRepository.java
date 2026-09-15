package com.centinela360.repository;

import com.centinela360.domain.Report;
import com.centinela360.domain.ReportEvidence;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;

import java.util.UUID;

public interface ReportEvidenceRepository extends ReactiveCrudRepository<ReportEvidence, UUID> {
    Flux<ReportEvidence> findByReportId(UUID reportId);
}

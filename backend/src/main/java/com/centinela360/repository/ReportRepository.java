package com.centinela360.repository;

import com.centinela360.domain.Report;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;

import java.util.UUID;

public interface ReportRepository extends ReactiveCrudRepository<Report, UUID> {
    Flux<Report> findByUserId(UUID userId);

    Flux<Report> findByStatus(String status);

    @Query("""
            SELECT r.* FROM reports r
            JOIN incident_reports ir ON ir.report_id = r.id
            WHERE ir.incident_id = :incidentId
            ORDER BY r.created_at
            """)
    Flux<Report> findReportsByIncidentId(@Param("incidentId") UUID incidentId);
}
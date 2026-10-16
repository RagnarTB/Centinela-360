package com.centinela360.repository;

import com.centinela360.domain.Incident;
import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.OffsetDateTime;
import java.util.UUID;

public interface IncidentRepository extends ReactiveCrudRepository<Incident, UUID> {

    Flux<Incident> findByStatus(String status);

    @Query("""
            SELECT * FROM incidents
            WHERE status <> 'ATENDIDO'
              AND category = :category
              AND updated_at >= :since
              AND ST_DWithin(
                    location::geography,
                    ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
                    :distanceMeters
                  )
            ORDER BY ST_Distance(
                    location::geography,
                    ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography
                  ) ASC
            LIMIT 1
            """)
    Mono<Incident> findNearestCandidate(
            @Param("category") String category,
            @Param("latitude") double latitude,
            @Param("longitude") double longitude,
            @Param("distanceMeters") double distanceMeters,
            @Param("since") OffsetDateTime since
    );

    @Modifying
    @Query("""
            INSERT INTO incident_reports (incident_id, report_id, relation_type)
            VALUES (:incidentId, :reportId, :relationType)
            ON CONFLICT (incident_id, report_id) DO NOTHING
            """)
    Mono<Integer> linkReportToIncident(
            @Param("incidentId") UUID incidentId,
            @Param("reportId") UUID reportId,
            @Param("relationType") String relationType
    );
}
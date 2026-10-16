package com.centinela360.service;

import com.centinela360.config.ConsolidationProperties;
import com.centinela360.config.R2dbcConfig;
import com.centinela360.domain.Incident;
import com.centinela360.kafka.EventEnvelope;
import com.centinela360.kafka.producer.IncidentEventProducer;
import com.centinela360.repository.IncidentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.locationtech.jts.geom.Point;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ConsolidationService {

        private final IncidentRepository incidentRepository;
        private final ConsolidationProperties props;
        private final IncidentEventProducer incidentEventProducer;

        @SuppressWarnings("rawtypes")
        @KafkaListener(topics = "reports.created", groupId = "centinela360-consolidation-group")
        public void onReportCreated(EventEnvelope event) {
                try {
                        // El payload llega como LinkedHashMap por la deserialización genérica
                        LinkedHashMap payload = (LinkedHashMap) event.getPayload();
                        if (payload == null)
                                return;

                        UUID reportId = UUID.fromString((String) payload.get("id"));
                        String category = (String) payload.get("category");
                        Number latNum = (Number) payload.get("latitude");
                        Number lonNum = (Number) payload.get("longitude");
                        Double latitude = latNum != null ? latNum.doubleValue() : null;
                        Double longitude = lonNum != null ? lonNum.doubleValue() : null;

                        if (latitude == null || longitude == null) {
                                log.warn("Reporte {} sin coordenadas válidas para consolidación", reportId);
                                return;
                        }

                        OffsetDateTime since = OffsetDateTime.now().minusMinutes(props.timeWindowMinutes());

                        // Ejecutamos el flujo reactivo bloqueando la suscripción de forma controlada
                        // o suscribiéndonos de manera reactiva pura (en @KafkaListener se recomienda
                        processConsolidation(reportId, category, latitude, longitude, since)
                                        .subscribe(
                                                        null,
                                                        err -> log.error("Error durante consolidación reactiva para el reporte {}", reportId, err));

                } catch (Exception e) {
                        log.error("Error procesando evento reports.created en consolidación", e);
                }
        }

        private Mono<Void> processConsolidation(UUID reportId, String category, double lat, double lon,
                        OffsetDateTime since) {
                return incidentRepository.findNearestCandidate(category, lat, lon, props.distanceMeters(), since)
                                .flatMap(existingIncident -> {
                                        // CASO A: Encontró candidato cercano -> ASOCIAR
                                        log.info("Asociando reporte {} al incidente existente {}", reportId,
                                                        existingIncident.getId());
                                        existingIncident.setUpdatedAt(OffsetDateTime.now());
                                        return incidentRepository.save(existingIncident)
                                                        .flatMap(savedIncident -> incidentRepository
                                                                        .linkReportToIncident(
                                                                                        savedIncident.getId(),
                                                                                        reportId,
                                                                                        "ASOCIADO")
                                                                        .then(Mono.just(savedIncident)))
                                                        .doOnSuccess(savedIncident -> incidentEventProducer
                                                                        .publishIncidentUpdated(
                                                                                        savedIncident.getId(),
                                                                                        "REPORT_ASSOCIATED",
                                                                                        savedIncident));
                                })
                                .switchIfEmpty(
                                                // CASO B: No encontró candidato -> CREAR NUEVO INCIDENTE
                                                Mono.defer(() -> {
                                                        log.info("Creando nuevo incidente para el reporte {}",
                                                                        reportId);
                                                        Point point = R2dbcConfig.makePoint(lon, lat);

                                                        Incident newIncident = Incident.builder()
                                                                        .category(category)
                                                                        .status("ABIERTO")
                                                                        .trustScore(null) // NULL hasta Fase 6
                                                                        .location(point)
                                                                        .createdAt(OffsetDateTime.now())
                                                                        .updatedAt(OffsetDateTime.now())
                                                                        .build();

                                                        return incidentRepository.save(newIncident)
                                                                        .flatMap(savedIncident -> incidentRepository
                                                                                        .linkReportToIncident(
                                                                                                        savedIncident.getId(),
                                                                                                        reportId,
                                                                                                        "ORIGEN")
                                                                                        .then(Mono.just(savedIncident)))
                                                                        .doOnSuccess(savedIncident -> incidentEventProducer
                                                                                        .publishIncidentUpdated(
                                                                                                        savedIncident.getId(),
                                                                                                        "CREATED",
                                                                                                        savedIncident));
                                                }))
                                .then();
        }
}
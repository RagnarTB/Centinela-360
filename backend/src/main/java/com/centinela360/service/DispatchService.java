package com.centinela360.service;

import com.centinela360.controller.dto.CreateDispatchRequest;
import com.centinela360.controller.dto.DispatchResponse;
import com.centinela360.controller.dto.UnitRecommendationResponse;
import com.centinela360.controller.dto.UpdateDispatchStatusRequest;
import com.centinela360.domain.Dispatch;
import com.centinela360.domain.Incident;
import com.centinela360.domain.IncidentEvent;
import com.centinela360.domain.PatrolUnit;
import com.centinela360.kafka.producer.DispatchEventProducer;
import com.centinela360.kafka.producer.IncidentEventProducer;
import com.centinela360.repository.DispatchRepository;
import com.centinela360.repository.IncidentEventRepository;
import com.centinela360.repository.IncidentRepository;
import com.centinela360.repository.PatrolUnitRepository;
import com.centinela360.repository.UnitLocationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class DispatchService {

    private final DispatchRepository dispatchRepository;
    private final IncidentRepository incidentRepository;
    private final PatrolUnitRepository patrolUnitRepository;
    private final UnitLocationRepository unitLocationRepository;
    private final IncidentEventRepository incidentEventRepository;
    private final DispatchEventProducer dispatchEventProducer;
    private final IncidentEventProducer incidentEventProducer;

    /**
     * Motor de recomendación de unidad (DSP-01 / HU-CEN-08).
     * Selecciona la unidad disponible con menor tiempo de llegada estimado (ETA)
     * basado en la distancia geodésica a la incidencia y velocidad urbana promedio.
     */
    public Mono<UnitRecommendationResponse> recommendUnit(UUID incidentId) {
        return incidentRepository.findById(incidentId)
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Incidente no encontrado: " + incidentId)))
                .flatMap(incident -> {
                    double incLat = incident.getLocation().getY();
                    double incLon = incident.getLocation().getX();

                    return patrolUnitRepository.findAll()
                            .filter(u -> "DISPONIBLE".equalsIgnoreCase(u.getStatus()))
                            .flatMap(unit -> unitLocationRepository.findByUnitIdOrderByRecordedAtDesc(unit.getId())
                                    .next()
                                    .map(loc -> {
                                        double unitLat = loc.getLocation().getY();
                                        double unitLon = loc.getLocation().getX();
                                        double distMeters = calculateHaversineDistance(incLat, incLon, unitLat, unitLon);
                                        // Velocidad urbana media de patrullaje en Chiclayo: ~30 km/h = 500 m/min
                                        int etaMinutes = Math.max(1, (int) Math.ceil(distMeters / 500.0));
                                        return new UnitCandidate(unit, unitLat, unitLon, distMeters, etaMinutes);
                                    })
                            )
                            .collectList()
                            .flatMap(candidates -> {
                                if (candidates.isEmpty()) {
                                    return Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND,
                                            "No hay unidades de patrulla disponibles con ubicación GPS reciente"));
                                }

                                UnitCandidate best = candidates.stream()
                                        .min(Comparator.comparingDouble(UnitCandidate::distanceMeters))
                                        .orElseThrow();

                                String rationale = String.format(
                                        "Unidad %s seleccionada por menor distancia (%d m) y ETA estimado de %d min",
                                        best.unit.getCode(), (long) best.distanceMeters, best.etaMinutes
                                );

                                return Mono.just(new UnitRecommendationResponse(
                                        best.unit.getId(),
                                        best.unit.getCode(),
                                        best.unit.getStatus(),
                                        best.latitude,
                                        best.longitude,
                                        Math.round(best.distanceMeters * 100.0) / 100.0,
                                        best.etaMinutes,
                                        rationale
                                ));
                            });
                });
    }

    /**
     * Despacho y asignación de unidad (DSP-02 / HU-CEN-09).
     */
    @Transactional
    public Mono<DispatchResponse> createDispatch(CreateDispatchRequest request) {
        return incidentRepository.findById(request.incidentId())
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Incidente no encontrado: " + request.incidentId())))
                .flatMap(incident -> {
                    if ("DESCARTADO".equalsIgnoreCase(incident.getStatus())) {
                        return Mono.error(new ResponseStatusException(HttpStatus.BAD_REQUEST, "No se puede despachar un incidente descartado"));
                    }
                    if ("ATENDIDO".equalsIgnoreCase(incident.getStatus())) {
                        return Mono.error(new ResponseStatusException(HttpStatus.BAD_REQUEST, "El incidente ya ha sido atendido"));
                    }

                    return patrolUnitRepository.findById(request.unitId())
                            .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Unidad no encontrada: " + request.unitId())))
                            .flatMap(unit -> {
                                Dispatch dispatch = Dispatch.builder()
                                        .incidentId(incident.getId())
                                        .unitId(unit.getId())
                                        .status("ASIGNADO")
                                        .createdAt(OffsetDateTime.now())
                                        .updatedAt(OffsetDateTime.now())
                                        .build();

                                return dispatchRepository.save(dispatch)
                                        .flatMap(savedDispatch -> {
                                            // Actualiza estado de incidente
                                            incident.setStatus("ASIGNADO");
                                            incident.setUpdatedAt(OffsetDateTime.now());

                                            // Actualiza estado de unidad
                                            unit.setStatus("EN_CAMINO");

                                            IncidentEvent event = IncidentEvent.create(
                                                    incident.getId(),
                                                    "DISPATCH_CREATED",
                                                    String.format("{\"dispatchId\":\"%s\",\"unitCode\":\"%s\"}", savedDispatch.getId(), unit.getCode())
                                            );

                                            return incidentRepository.save(incident)
                                                    .then(patrolUnitRepository.save(unit))
                                                    .then(incidentEventRepository.save(event))
                                                    .thenReturn(savedDispatch)
                                                    .doOnSuccess(d -> {
                                                        dispatchEventProducer.publishDispatchCreated(d);
                                                        incidentEventProducer.publishIncidentUpdated(incident.getId(), "DISPATCHED", incident);
                                                    })
                                                    .map(d -> DispatchResponse.from(d, unit.getCode()));
                                        });
                            });
                });
    }

    /**
     * Actualización de estados del patrullero y despacho (DSP-03 / PAT-02 / HU-PAT-07).
     * Transiciones: ACEPTADO -> EN_CAMINO -> EN_SITIO -> ATENDIDO / RECHAZADO.
     */
    @Transactional
    public Mono<DispatchResponse> updateDispatchStatus(UUID dispatchId, UpdateDispatchStatusRequest request) {
        return dispatchRepository.findById(dispatchId)
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Despacho no encontrado: " + dispatchId)))
                .flatMap(dispatch -> {
                    String newStatus = request.status().toUpperCase();
                    dispatch.setStatus(newStatus);
                    dispatch.setUpdatedAt(OffsetDateTime.now());

                    return patrolUnitRepository.findById(dispatch.getUnitId())
                            .flatMap(unit -> incidentRepository.findById(dispatch.getIncidentId())
                                    .flatMap(incident -> {
                                        switch (newStatus) {
                                            case "ACEPTADO", "EN_CAMINO" -> {
                                                unit.setStatus("EN_CAMINO");
                                                incident.setStatus("ASIGNADO");
                                            }
                                            case "EN_SITIO" -> {
                                                unit.setStatus("EN_SITIO");
                                                incident.setStatus("EN_ATENCION");
                                            }
                                            case "ATENDIDO" -> {
                                                unit.setStatus("DISPONIBLE");
                                                incident.setStatus("ATENDIDO");
                                            }
                                            case "RECHAZADO" -> {
                                                unit.setStatus("DISPONIBLE");
                                                incident.setStatus("CONFIRMADO");
                                            }
                                        }

                                        incident.setUpdatedAt(OffsetDateTime.now());

                                        IncidentEvent event = IncidentEvent.create(
                                                incident.getId(),
                                                "DISPATCH_STATUS_" + newStatus,
                                                String.format("{\"notes\":\"%s\"}", request.notes() != null ? request.notes() : "")
                                        );

                                        return dispatchRepository.save(dispatch)
                                                .then(patrolUnitRepository.save(unit))
                                                .then(incidentRepository.save(incident))
                                                .then(incidentEventRepository.save(event))
                                                .thenReturn(dispatch)
                                                .doOnSuccess(d -> {
                                                    dispatchEventProducer.publishDispatchStatusUpdated(d);
                                                    incidentEventProducer.publishIncidentUpdated(incident.getId(), "DISPATCH_STATUS_UPDATED", incident);
                                                })
                                                .map(d -> DispatchResponse.from(d, unit.getCode()));
                                    })
                            );
                });
    }

    public Mono<DispatchResponse> getLatestDispatchForIncident(UUID incidentId) {
        return dispatchRepository.findFirstByIncidentIdOrderByCreatedAtDesc(incidentId)
                .flatMap(d -> patrolUnitRepository.findById(d.getUnitId())
                        .map(u -> DispatchResponse.from(d, u.getCode()))
                        .defaultIfEmpty(DispatchResponse.from(d, "N/A")));
    }

    public Flux<DispatchResponse> getDispatchesForUnit(UUID unitId) {
        return dispatchRepository.findByUnitId(unitId)
                .flatMap(d -> patrolUnitRepository.findById(d.getUnitId())
                        .map(u -> DispatchResponse.from(d, u.getCode())));
    }

    private double calculateHaversineDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371000; // Radio de la Tierra en metros
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private record UnitCandidate(PatrolUnit unit, double latitude, double longitude, double distanceMeters, int etaMinutes) {}
}

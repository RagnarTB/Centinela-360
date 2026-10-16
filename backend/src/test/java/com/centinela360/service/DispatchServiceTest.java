package com.centinela360.service;

import com.centinela360.config.R2dbcConfig;
import com.centinela360.controller.dto.UnitRecommendationResponse;
import com.centinela360.domain.Incident;
import com.centinela360.domain.PatrolUnit;
import com.centinela360.domain.UnitLocation;
import com.centinela360.kafka.producer.DispatchEventProducer;
import com.centinela360.kafka.producer.IncidentEventProducer;
import com.centinela360.repository.DispatchRepository;
import com.centinela360.repository.IncidentEventRepository;
import com.centinela360.repository.IncidentRepository;
import com.centinela360.repository.PatrolUnitRepository;
import com.centinela360.repository.UnitLocationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.OffsetDateTime;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DispatchServiceTest {

    @Mock
    private DispatchRepository dispatchRepository;
    @Mock
    private IncidentRepository incidentRepository;
    @Mock
    private PatrolUnitRepository patrolUnitRepository;
    @Mock
    private UnitLocationRepository unitLocationRepository;
    @Mock
    private IncidentEventRepository incidentEventRepository;
    @Mock
    private DispatchEventProducer dispatchEventProducer;
    @Mock
    private IncidentEventProducer incidentEventProducer;

    private DispatchService dispatchService;

    @BeforeEach
    void setUp() {
        dispatchService = new DispatchService(
                dispatchRepository,
                incidentRepository,
                patrolUnitRepository,
                unitLocationRepository,
                incidentEventRepository,
                dispatchEventProducer,
                incidentEventProducer
        );
    }

    @Test
    void shouldRecommendNearestAvailableUnit() {
        UUID incidentId = UUID.randomUUID();
        // Incidente en Parque Principal de Chiclayo (-6.7714, -79.8409)
        Incident incident = Incident.builder()
                .id(incidentId)
                .category("ROBO")
                .status("ABIERTO")
                .location(R2dbcConfig.makePoint(-79.8409, -6.7714))
                .build();

        UUID u1Id = UUID.randomUUID();
        PatrolUnit u1 = PatrolUnit.builder().id(u1Id).code("U-01").status("DISPONIBLE").build();
        // U-01 a ~300 metros
        UnitLocation loc1 = UnitLocation.builder().unitId(u1Id).location(R2dbcConfig.makePoint(-79.8390, -6.7720)).recordedAt(OffsetDateTime.now()).build();

        UUID u2Id = UUID.randomUUID();
        PatrolUnit u2 = PatrolUnit.builder().id(u2Id).code("U-02").status("DISPONIBLE").build();
        // U-02 a ~2000 metros
        UnitLocation loc2 = UnitLocation.builder().unitId(u2Id).location(R2dbcConfig.makePoint(-79.8250, -6.7850)).recordedAt(OffsetDateTime.now()).build();

        when(incidentRepository.findById(incidentId)).thenReturn(Mono.just(incident));
        when(patrolUnitRepository.findAll()).thenReturn(Flux.just(u1, u2));
        when(unitLocationRepository.findByUnitIdOrderByRecordedAtDesc(u1Id)).thenReturn(Flux.just(loc1));
        when(unitLocationRepository.findByUnitIdOrderByRecordedAtDesc(u2Id)).thenReturn(Flux.just(loc2));

        StepVerifier.create(dispatchService.recommendUnit(incidentId))
                .assertNext((UnitRecommendationResponse rec) -> {
                    org.junit.jupiter.api.Assertions.assertEquals(u1Id, rec.unitId());
                    org.junit.jupiter.api.Assertions.assertEquals("U-01", rec.code());
                    org.junit.jupiter.api.Assertions.assertTrue(rec.distanceMeters() < 1000.0);
                    org.junit.jupiter.api.Assertions.assertTrue(rec.estimatedArrivalMinutes() >= 1);
                })
                .verifyComplete();
    }
}

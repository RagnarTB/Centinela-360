package com.centinela360.service;

import com.centinela360.controller.dto.AlertResponse;
import com.centinela360.controller.dto.CreateAlertRequest;
import com.centinela360.domain.Alert;
import com.centinela360.repository.AlertRepository;
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
class AlertServiceTest {

    @Mock
    private AlertRepository alertRepository;

    private AlertService alertService;

    @BeforeEach
    void setUp() {
        alertService = new AlertService(alertRepository);
    }

    @Test
    void shouldCreateAlertSuccessfully() {
        CreateAlertRequest request = new CreateAlertRequest(
                "Congestión por manifestación pacífica",
                "Avenida Balta con Bolognesi, tránsito lento.",
                OffsetDateTime.now().plusHours(4)
        );

        Alert saved = Alert.builder()
                .id(UUID.randomUUID())
                .title(request.title())
                .body(request.body())
                .expiresAt(request.expiresAt())
                .createdAt(OffsetDateTime.now())
                .build();

        when(alertRepository.save(any(Alert.class))).thenReturn(Mono.just(saved));

        StepVerifier.create(alertService.createAlert(request))
                .assertNext((AlertResponse res) -> {
                    org.junit.jupiter.api.Assertions.assertEquals(request.title(), res.title());
                    org.junit.jupiter.api.Assertions.assertNotNull(res.expiresAt());
                })
                .verifyComplete();
    }

    @Test
    void shouldReturnActiveAlerts() {
        Alert a1 = Alert.builder().id(UUID.randomUUID()).title("Alerta 1").build();
        when(alertRepository.findActiveAlerts()).thenReturn(Flux.just(a1));

        StepVerifier.create(alertService.getActiveAlerts())
                .expectNextCount(1)
                .verifyComplete();
    }
}

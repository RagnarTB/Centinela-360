package com.centinela360.service;

import com.centinela360.controller.dto.AlertResponse;
import com.centinela360.controller.dto.CreateAlertRequest;
import com.centinela360.domain.Alert;
import com.centinela360.repository.AlertRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.OffsetDateTime;

@Service
@RequiredArgsConstructor
public class AlertService {

    private final AlertRepository alertRepository;

    public Flux<AlertResponse> getActiveAlerts() {
        return alertRepository.findActiveAlerts()
                .map(AlertResponse::from);
    }

    public Mono<AlertResponse> createAlert(CreateAlertRequest request) {
        Alert alert = Alert.builder()
                .title(request.title())
                .body(request.body())
                .expiresAt(request.expiresAt() != null ? request.expiresAt() : OffsetDateTime.now().plusDays(1))
                .createdAt(OffsetDateTime.now())
                .build();

        return alertRepository.save(alert)
                .map(AlertResponse::from);
    }
}

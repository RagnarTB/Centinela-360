package com.centinela360.controller;

import com.centinela360.controller.dto.AlertResponse;
import com.centinela360.controller.dto.CreateAlertRequest;
import com.centinela360.service.AlertService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/v1/alerts")
@RequiredArgsConstructor
public class AlertController {

    private final AlertService alertService;

    @GetMapping
    public Flux<AlertResponse> getActiveAlerts() {
        return alertService.getActiveAlerts();
    }

    @PostMapping
    public Mono<ResponseEntity<AlertResponse>> createAlert(@Valid @RequestBody CreateAlertRequest request) {
        return alertService.createAlert(request)
                .map(response -> ResponseEntity.status(HttpStatus.CREATED).body(response));
    }
}

package com.centinela360.controller;

import com.centinela360.controller.dto.CreateDispatchRequest;
import com.centinela360.controller.dto.DispatchResponse;
import com.centinela360.controller.dto.UnitRecommendationResponse;
import com.centinela360.controller.dto.UpdateDispatchStatusRequest;
import com.centinela360.service.DispatchService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class DispatchController {

    private final DispatchService dispatchService;

    @GetMapping("/incidents/{incidentId}/recommend-unit")
    public Mono<UnitRecommendationResponse> recommendUnit(@PathVariable UUID incidentId) {
        return dispatchService.recommendUnit(incidentId);
    }

    @PostMapping("/dispatches")
    public Mono<ResponseEntity<DispatchResponse>> createDispatch(@Valid @RequestBody CreateDispatchRequest request) {
        return dispatchService.createDispatch(request)
                .map(response -> ResponseEntity.status(HttpStatus.CREATED).body(response));
    }

    @PatchMapping("/dispatches/{id}/status")
    public Mono<DispatchResponse> updateDispatchStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateDispatchStatusRequest request) {
        return dispatchService.updateDispatchStatus(id, request);
    }

    @GetMapping("/dispatches/incident/{incidentId}")
    public Mono<ResponseEntity<DispatchResponse>> getLatestDispatchForIncident(@PathVariable UUID incidentId) {
        return dispatchService.getLatestDispatchForIncident(incidentId)
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @GetMapping("/dispatches/unit/{unitId}")
    public Flux<DispatchResponse> getDispatchesForUnit(@PathVariable UUID unitId) {
        return dispatchService.getDispatchesForUnit(unitId);
    }
}

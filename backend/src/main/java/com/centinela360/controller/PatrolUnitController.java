package com.centinela360.controller;

import com.centinela360.controller.dto.UnitResponse;
import com.centinela360.service.PatrolUnitService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;
import com.centinela360.controller.dto.UpdateLocationRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import reactor.core.publisher.Mono;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/units")
@RequiredArgsConstructor
public class PatrolUnitController {

    private final PatrolUnitService unitService;

    @GetMapping
    public Flux<UnitResponse> getAllUnits() {
        return unitService.getAllUnits();
    }

    @PostMapping("/{id}/location")
    public Mono<UnitResponse> updateLocation(@PathVariable UUID id, @Valid @RequestBody UpdateLocationRequest request) {
        return unitService.updateLocation(id, request);
    }
}
package com.centinela360.controller;

import com.centinela360.controller.dto.UnitResponse;
import com.centinela360.service.PatrolUnitService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;

@RestController
@RequestMapping("/api/v1/units")
@RequiredArgsConstructor
public class PatrolUnitController {

    private final PatrolUnitService unitService;

    @GetMapping
    public Flux<UnitResponse> getAllUnits() {
        return unitService.getAllUnits();
    }
}
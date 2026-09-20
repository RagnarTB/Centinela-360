package com.centinela360.service;

import com.centinela360.controller.dto.UnitResponse;
import com.centinela360.domain.PatrolUnit;
import com.centinela360.repository.PatrolUnitRepository;
import com.centinela360.repository.UnitLocationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

@Service
@RequiredArgsConstructor
public class PatrolUnitService {

    private final PatrolUnitRepository unitRepository;
    private final UnitLocationRepository unitLocationRepository;

    public Flux<UnitResponse> getAllUnits() {
        return unitRepository.findAll()
                .flatMap(this::toResponseWithLastLocation);
    }

    private reactor.core.publisher.Mono<UnitResponse> toResponseWithLastLocation(PatrolUnit unit) {
        return unitLocationRepository.findByUnitIdOrderByRecordedAtDesc(unit.getId())
                .next() // toma solo la más reciente
                .map(loc -> new UnitResponse(
                        unit.getId(), unit.getCode(), unit.getStatus(),
                        loc.getLocation().getY(), loc.getLocation().getX(), loc.getRecordedAt()
                ))
                .defaultIfEmpty(new UnitResponse(
                        unit.getId(), unit.getCode(), unit.getStatus(), null, null, null
                ));
    }
}
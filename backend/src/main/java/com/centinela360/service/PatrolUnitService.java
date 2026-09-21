package com.centinela360.service;

import com.centinela360.controller.dto.UnitResponse;
import com.centinela360.domain.PatrolUnit;
import com.centinela360.repository.PatrolUnitRepository;
import com.centinela360.repository.UnitLocationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import com.centinela360.config.R2dbcConfig;
import com.centinela360.controller.dto.UpdateLocationRequest;
import com.centinela360.domain.UnitLocation;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;

import java.time.OffsetDateTime;
import java.util.UUID;

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

    public Mono<UnitResponse> updateLocation(UUID unitId, UpdateLocationRequest request) {
        return unitRepository.findById(unitId)
                .switchIfEmpty(Mono.error(
                        new ResponseStatusException(HttpStatus.NOT_FOUND, "Unidad no encontrada: " + unitId)
                ))
                .flatMap(unit -> {
                    UnitLocation location = UnitLocation.builder()
                            .unitId(unitId)
                            .location(R2dbcConfig.makePoint(request.longitude(), request.latitude()))
                            .recordedAt(OffsetDateTime.now())
                            .build();

                    return unitLocationRepository.save(location)
                            .map(saved -> new UnitResponse(
                                    unit.getId(), unit.getCode(), unit.getStatus(),
                                    request.latitude(), request.longitude(), saved.getRecordedAt()
                            ));
                });
    }
}
// repository/UnitLocationRepository.java
package com.centinela360.repository;

import com.centinela360.domain.UnitLocation;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;

import java.util.UUID;

public interface UnitLocationRepository extends ReactiveCrudRepository<UnitLocation, UUID> {
    Flux<UnitLocation> findByUnitIdOrderByRecordedAtDesc(UUID unitId);
}
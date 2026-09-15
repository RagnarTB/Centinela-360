package com.centinela360.repository;

import com.centinela360.domain.PatrolUnit;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Mono;

import java.util.UUID;

public interface PatrolUnitRepository extends ReactiveCrudRepository<PatrolUnit, UUID> {
    Mono<PatrolUnit> findByCode(String code);
}
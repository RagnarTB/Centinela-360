package com.centinela360.repository;

import com.centinela360.domain.Dispatch;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

public interface DispatchRepository extends ReactiveCrudRepository<Dispatch, UUID> {
    Flux<Dispatch> findByIncidentId(UUID incidentId);

    Flux<Dispatch> findByUnitId(UUID unitId);

    Mono<Dispatch> findFirstByIncidentIdOrderByCreatedAtDesc(UUID incidentId);

    Mono<Dispatch> findFirstByUnitIdAndStatusIn(UUID unitId, java.util.Collection<String> statuses);
}

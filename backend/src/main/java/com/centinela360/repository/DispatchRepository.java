package com.centinela360.repository;

import com.centinela360.domain.Dispatch;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;

import java.util.UUID;

public interface DispatchRepository extends ReactiveCrudRepository<Dispatch, UUID> {
    Flux<Dispatch> findByIncidentId(UUID incidentId);

}

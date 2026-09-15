package com.centinela360.repository;

import com.centinela360.domain.Incident;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;

import java.util.UUID;

public interface IncidentRepository extends ReactiveCrudRepository<Incident, UUID> {
    Flux<Incident> findByStatus(String status);
}

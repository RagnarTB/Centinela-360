// repository/IncidentEventRepository.java
package com.centinela360.repository;

import com.centinela360.domain.IncidentEvent;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;

import java.util.UUID;

public interface IncidentEventRepository extends ReactiveCrudRepository<IncidentEvent, UUID> {
    Flux<IncidentEvent> findByIncidentIdOrderByCreatedAtDesc(UUID incidentId);
}
package com.centinela360.repository;

import com.centinela360.domain.Alert;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;

import java.util.UUID;

public interface AlertRepository extends ReactiveCrudRepository<Alert, UUID> {

    @Query("SELECT id, title, body, expires_at, created_at FROM alerts WHERE expires_at IS NULL OR expires_at > now() ORDER BY created_at DESC")
    Flux<Alert> findActiveAlerts();
}

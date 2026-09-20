package com.centinela360.repository;

import com.centinela360.domain.Report;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;

import java.util.UUID;

public interface ReportRepository extends ReactiveCrudRepository<Report, UUID> {
    Flux<Report> findByUserId(UUID userId);
    Flux<Report> findByStatus(String status);


}
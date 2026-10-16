package com.centinela360.repository;

import com.centinela360.domain.News;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;

import java.util.UUID;

public interface NewsRepository extends ReactiveCrudRepository<News, UUID> {

    @Query("SELECT * FROM news ORDER BY published_at DESC")
    Flux<News> findAllOrderByPublishedAtDesc();
}
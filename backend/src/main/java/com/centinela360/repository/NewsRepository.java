// repository/NewsRepository.java
package com.centinela360.repository;

import com.centinela360.domain.News;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;

import java.util.UUID;

public interface NewsRepository extends ReactiveCrudRepository<News, UUID> {
}
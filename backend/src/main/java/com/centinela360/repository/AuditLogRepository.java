// repository/AuditLogRepository.java
package com.centinela360.repository;

import com.centinela360.domain.AuditLog;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;

import java.util.UUID;

public interface AuditLogRepository extends ReactiveCrudRepository<AuditLog, UUID> {
}
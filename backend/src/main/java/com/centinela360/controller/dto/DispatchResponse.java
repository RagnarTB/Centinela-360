package com.centinela360.controller.dto;

import com.centinela360.domain.Dispatch;

import java.time.OffsetDateTime;
import java.util.UUID;

public record DispatchResponse(
        UUID id,
        UUID incidentId,
        UUID unitId,
        String unitCode,
        String status,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static DispatchResponse from(Dispatch d, String unitCode) {
        return new DispatchResponse(
                d.getId(),
                d.getIncidentId(),
                d.getUnitId(),
                unitCode,
                d.getStatus(),
                d.getCreatedAt(),
                d.getUpdatedAt()
        );
    }
}

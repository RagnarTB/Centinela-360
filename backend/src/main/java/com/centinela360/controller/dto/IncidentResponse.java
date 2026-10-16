package com.centinela360.controller.dto;

import com.centinela360.domain.Incident;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record IncidentResponse(
        UUID id,
        String category,
        String status,
        BigDecimal trustScore,
        Double latitude,
        Double longitude,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt,
        String changeType
) {
    public static IncidentResponse from(Incident i, String changeType) {
        Double lat = (i.getLocation() != null) ? i.getLocation().getY() : null;
        Double lon = (i.getLocation() != null) ? i.getLocation().getX() : null;
        return new IncidentResponse(
                i.getId(),
                i.getCategory(),
                i.getStatus(),
                i.getTrustScore(),
                lat,
                lon,
                i.getCreatedAt(),
                i.getUpdatedAt(),
                changeType
        );
    }
}

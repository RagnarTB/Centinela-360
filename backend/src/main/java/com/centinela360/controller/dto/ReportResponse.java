package com.centinela360.controller.dto;

import com.centinela360.domain.Report;

import java.time.OffsetDateTime;
import java.util.UUID;

public record ReportResponse(
        UUID id,
        String channel,
        String category,
        String description,
        String status,
        Double latitude,
        Double longitude,
        OffsetDateTime createdAt
) {
    public static ReportResponse from(Report r) {
        return new ReportResponse(
                r.getId(), r.getChannel(), r.getCategory(), r.getDescription(), r.getStatus(), r.getLocation().getY(), r.getLocation().getX(), r.getCreatedAt()
        );
    }
}
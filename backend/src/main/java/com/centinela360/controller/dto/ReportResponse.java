package com.centinela360.controller.dto;

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
}
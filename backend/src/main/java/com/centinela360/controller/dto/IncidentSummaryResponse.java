package com.centinela360.controller.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record IncidentSummaryResponse(
        UUID id,
        String category,
        String status,
        BigDecimal trustScore,
        Double latitude,
        Double longitude,
        OffsetDateTime createdAt
) {}
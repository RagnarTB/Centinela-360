package com.centinela360.controller.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record IncidentDetailResponse(
        UUID id,
        String category,
        String status,
        BigDecimal trustScore,
        Double latitude,
        Double longitude,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt,
        List<ReportResponse> relatedReports // vacía por ahora, se llena en Fase 5
) {
}
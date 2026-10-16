package com.centinela360.controller.dto;

import java.util.UUID;

public record UnitRecommendationResponse(
        UUID unitId,
        String code,
        String status,
        Double unitLatitude,
        Double unitLongitude,
        Double distanceMeters,
        Integer estimatedArrivalMinutes,
        String rationale
) {
}

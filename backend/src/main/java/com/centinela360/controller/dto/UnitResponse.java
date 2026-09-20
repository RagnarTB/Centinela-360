package com.centinela360.controller.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record UnitResponse(
        UUID id,
        String code,
        String status,
        Double latitude,   // nullable: puede no tener ubicación registrada aún
        Double longitude,
        OffsetDateTime lastLocationAt
) {
}
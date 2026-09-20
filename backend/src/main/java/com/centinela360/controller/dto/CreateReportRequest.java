package com.centinela360.controller.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreateReportRequest(
        UUID userId,
        @NotBlank String channel,      // APP | LLAMADA | PATRULLA
        @NotBlank String category,     // ROBO | ACCIDENTE | DISTURBIO...
        String description,
        @NotNull LocationDto location
) {
    public record LocationDto(
            @NotNull Double latitude,
            @NotNull Double longitude
    ) {
    }
}
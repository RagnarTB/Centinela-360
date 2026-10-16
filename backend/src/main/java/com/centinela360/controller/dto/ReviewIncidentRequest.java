package com.centinela360.controller.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

import java.util.UUID;

public record ReviewIncidentRequest(
        @NotBlank(message = "La acción de revisión es obligatoria")
        @Pattern(regexp = "CONFIRMAR|DESCARTAR", message = "La acción debe ser CONFIRMAR o DESCARTAR")
        String action,
        UUID operatorId,
        String notes
) {
}

package com.centinela360.controller.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record UpdateDispatchStatusRequest(
        @NotBlank(message = "El nuevo estado es obligatorio")
        @Pattern(regexp = "ACEPTADO|EN_CAMINO|EN_SITIO|ATENDIDO|RECHAZADO",
                message = "El estado debe ser ACEPTADO, EN_CAMINO, EN_SITIO, ATENDIDO o RECHAZADO")
        String status,
        String notes
) {
}

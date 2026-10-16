package com.centinela360.controller.dto;

import jakarta.validation.constraints.NotBlank;
import java.time.OffsetDateTime;

public record CreateAlertRequest(
        @NotBlank(message = "El título de la alerta es obligatorio")
        String title,
        @NotBlank(message = "El contenido de la alerta es obligatorio")
        String body,
        OffsetDateTime expiresAt
) {
}

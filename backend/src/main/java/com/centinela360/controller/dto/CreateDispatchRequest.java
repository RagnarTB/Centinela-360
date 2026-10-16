package com.centinela360.controller.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record CreateDispatchRequest(
        @NotNull(message = "El incidentId es obligatorio")
        UUID incidentId,
        @NotNull(message = "El unitId es obligatorio")
        UUID unitId,
        UUID operatorId,
        String notes
) {
}

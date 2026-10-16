package com.centinela360.controller.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record CreateNewsRequest(
        @NotBlank(message = "El título de la noticia es obligatorio")
        String title,
        @NotBlank(message = "El cuerpo de la noticia es obligatorio")
        String body,
        @NotBlank(message = "La etiqueta es obligatoria")
        @Pattern(regexp = "OFICIAL|PREVENTIVO|INFORMATIVO",
                message = "La etiqueta debe ser OFICIAL, PREVENTIVO o INFORMATIVO")
        String tag
) {
}

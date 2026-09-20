package com.centinela360.controller.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateEvidenceRequest(
        @NotBlank String storageRef,
        @NotBlank String mediaType   // PHOTO | AUDIO | VIDEO
) {
}
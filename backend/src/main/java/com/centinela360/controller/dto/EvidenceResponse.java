package com.centinela360.controller.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record EvidenceResponse(
        UUID id,
        UUID reportId,
        String storageRef,
        String mediaType,
        OffsetDateTime createdAt
) {
}
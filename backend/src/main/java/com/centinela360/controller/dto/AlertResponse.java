package com.centinela360.controller.dto;

import com.centinela360.domain.Alert;

import java.time.OffsetDateTime;
import java.util.UUID;

public record AlertResponse(
        UUID id,
        String title,
        String body,
        OffsetDateTime expiresAt,
        OffsetDateTime createdAt
) {
    public static AlertResponse from(Alert a) {
        return new AlertResponse(
                a.getId(),
                a.getTitle(),
                a.getBody(),
                a.getExpiresAt(),
                a.getCreatedAt()
        );
    }
}

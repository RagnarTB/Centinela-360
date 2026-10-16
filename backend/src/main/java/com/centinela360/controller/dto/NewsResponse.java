package com.centinela360.controller.dto;

import com.centinela360.domain.News;

import java.time.OffsetDateTime;
import java.util.UUID;

public record NewsResponse(
        UUID id,
        String title,
        String body,
        String tag,
        OffsetDateTime publishedAt
) {
    public static NewsResponse from(News n) {
        return new NewsResponse(
                n.getId(),
                n.getTitle(),
                n.getBody(),
                n.getTag(),
                n.getPublishedAt()
        );
    }
}

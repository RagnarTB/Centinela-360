package com.centinela360.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.locationtech.jts.geom.Point;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Table;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("reports")
public class Report {
    @Id
    private UUID id;
    private UUID userId;
    private String channel;
    private String category;
    private String description;
    private String status;
    private Point location;
    private OffsetDateTime createdAt;
}
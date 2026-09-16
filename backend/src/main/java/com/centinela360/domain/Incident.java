package com.centinela360.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.locationtech.jts.geom.Point;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Table;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("incidents")
public class Incident {
    @Id
    private UUID id;
    private String category;
    private String status;
    private BigDecimal trustScore;
    private Point location;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
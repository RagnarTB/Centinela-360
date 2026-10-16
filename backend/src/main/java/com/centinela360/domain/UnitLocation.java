package com.centinela360.domain;

import com.centinela360.config.JtsPointSerializer;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
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
@Table("unit_locations")
public class UnitLocation {
    @Id
    private UUID id;
    private UUID unitId;
    @JsonSerialize(using = JtsPointSerializer.class)
    private Point location;
    private OffsetDateTime recordedAt;
}
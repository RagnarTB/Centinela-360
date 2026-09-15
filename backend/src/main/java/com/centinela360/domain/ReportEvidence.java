package com.centinela360.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Table;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("report_evidence")
public class ReportEvidence {
    @Id
    private UUID id;
    private UUID reportId;
    private String storageRef;
    private String mediaType;
    private OffsetDateTime createdAt;
}
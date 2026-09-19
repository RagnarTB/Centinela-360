package com.centinela360.service;

import com.centinela360.config.R2dbcConfig;
import com.centinela360.controller.dto.CreateReportRequest;
import com.centinela360.controller.dto.ReportResponse;
import com.centinela360.domain.Report;
import com.centinela360.repository.ReportRepository;
import lombok.RequiredArgsConstructor;
import org.locationtech.jts.geom.Point;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final ReportRepository reportRepository;

    public Mono<ReportResponse> createReport(CreateReportRequest request) {
        Point point = R2dbcConfig.makePoint(
                request.location().longitude(),
                request.location().latitude()
        );

        Report report = Report.builder()
                .channel(request.channel())
                .category(request.category())
                .description(request.description())
                .status("RECIBIDO")
                .location(point)
                .build();

        return reportRepository.save(report)
                .map(this::toResponse);
    }

    private ReportResponse toResponse(Report r) {
        return new ReportResponse(
                r.getId(),
                r.getChannel(),
                r.getCategory(),
                r.getDescription(),
                r.getStatus(),
                r.getLocation().getY(), // latitude
                r.getLocation().getX(), // longitude
                r.getCreatedAt()
        );
    }
}
package com.centinela360.service;

import com.centinela360.config.R2dbcConfig;
import com.centinela360.controller.dto.CreateReportRequest;
import com.centinela360.controller.dto.ReportResponse;
import com.centinela360.domain.Report;
import com.centinela360.kafka.producer.ReportEventProducer;
import com.centinela360.repository.ReportRepository;
import lombok.RequiredArgsConstructor;
import org.locationtech.jts.geom.Point;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.OffsetDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final ReportRepository reportRepository;
    private final ReportEventProducer reportEventProducer;

    public Mono<ReportResponse> createReport(CreateReportRequest request) {
        Point point = R2dbcConfig.makePoint(
                request.location().longitude(),
                request.location().latitude()
        );

        Report report = Report.builder()
                .userId(request.userId())
                .channel(request.channel())
                .category(request.category())
                .description(request.description())
                .status("RECIBIDO")
                .location(point)
                .createdAt(OffsetDateTime.now())
                .build();

        return reportRepository.save(report)
                .map(this::toResponse)
                .doOnNext(reportEventProducer::publishReportCreated);
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

    public Mono<ReportResponse> getReportById(UUID id) {
        return reportRepository.findById(id)
                .map(this::toResponse)
                .switchIfEmpty(Mono.error(new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Reporte no encontrado: " + id)));

    }


    public Flux<ReportResponse> getMyReports(UUID userId) {
        return reportRepository.findByUserId(userId)
                .map(this::toResponse);
    }
}

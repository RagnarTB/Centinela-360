package com.centinela360.controller;

import com.centinela360.controller.dto.CreateReportRequest;
import com.centinela360.controller.dto.ReportResponse;
import com.centinela360.service.ReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @PostMapping
    public Mono<ResponseEntity<ReportResponse>> createReport(@Valid @RequestBody CreateReportRequest request) {
        return reportService.createReport(request)
                .map(response -> ResponseEntity.status(HttpStatus.CREATED).body(response));
    }

    @GetMapping("/{id}")
    public Mono<ResponseEntity<ReportResponse>> getReportById(@PathVariable UUID id) {
        return reportService.getReportById(id)
                .map(ResponseEntity::ok);
    }

    @GetMapping("/me")
    public Flux<ReportResponse> getMyReports(@RequestHeader("X-User-Id") UUID userId){
        return reportService.getMyReports(userId);
    }
}
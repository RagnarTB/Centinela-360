package com.centinela360.controller;

import com.centinela360.controller.dto.ClusteringComparisonResponse;
import com.centinela360.controller.dto.RouteResponse;
import com.centinela360.service.ai.AStarRoutingService;
import com.centinela360.service.ai.ClusteringService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class AnalyticsAndRoutingController {

    private final ClusteringService clusteringService;
    private final AStarRoutingService routingService;

    @GetMapping("/analytics/clustering-comparison")
    public Mono<ClusteringComparisonResponse> getClusteringComparison(
            @RequestParam(defaultValue = "3") int k,
            @RequestParam(defaultValue = "300") double epsMeters,
            @RequestParam(defaultValue = "2") int minPts) {
        return clusteringService.compareClustering(k, epsMeters, minPts);
    }

    @GetMapping("/routes/calculate")
    public Mono<RouteResponse> calculateRoute(
            @RequestParam double startLat,
            @RequestParam double startLon,
            @RequestParam double endLat,
            @RequestParam double endLon) {
        return routingService.calculateOptimalRoute(startLat, startLon, endLat, endLon);
    }
}

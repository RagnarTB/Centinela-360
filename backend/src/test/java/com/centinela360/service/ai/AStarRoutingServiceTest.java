package com.centinela360.service.ai;

import com.centinela360.controller.dto.RouteResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import reactor.test.StepVerifier;

import static org.junit.jupiter.api.Assertions.*;

class AStarRoutingServiceTest {

    private AStarRoutingService routingService;

    @BeforeEach
    void setUp() {
        routingService = new AStarRoutingService();
    }

    @Test
    void shouldFindOptimalPathBetweenChiclayoIntersections() {
        // Desde Parque Principal (-6.7714, -79.8409) hasta Mercado Modelo (-6.7675, -79.8425)
        double startLat = -6.7714;
        double startLon = -79.8409;
        double endLat = -6.7675;
        double endLon = -79.8425;

        StepVerifier.create(routingService.calculateOptimalRoute(startLat, startLon, endLat, endLon))
                .assertNext((RouteResponse route) -> {
                    assertNotNull(route);
                    assertTrue(route.totalDistanceMeters() > 0);
                    assertTrue(route.estimatedArrivalMinutes() >= 1);
                    assertFalse(route.waypoints().isEmpty());
                    assertTrue(route.roadSegments().contains("Avenida Balta Norte") || route.roadSegments().contains("Calle San José"));
                })
                .verifyComplete();
    }
}

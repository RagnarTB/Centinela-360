package com.centinela360.controller.dto;

import java.util.List;

public record RouteResponse(
        String algorithm,
        double totalDistanceMeters,
        int estimatedArrivalMinutes,
        List<Waypoint> waypoints,
        List<String> roadSegments
) {
    public record Waypoint(double latitude, double longitude, String name) {}
}

package com.centinela360.controller.dto;

import java.util.List;
import java.util.Map;

public record ClusteringComparisonResponse(
        int totalReportsAnalyzed,
        KMeansResult kMeans,
        DbscanResult dbscan,
        String recommendation
) {
    public record KMeansResult(
            int k,
            double inertia,
            long executionTimeMs,
            List<Centroid> centroids,
            Map<Integer, Integer> clusterCounts
    ) {}

    public record DbscanResult(
            double epsMeters,
            int minPts,
            int clustersCount,
            int noisePointsCount,
            long executionTimeMs,
            Map<Integer, Integer> clusterCounts
    ) {}

    public record Centroid(int clusterId, double latitude, double longitude) {}
}

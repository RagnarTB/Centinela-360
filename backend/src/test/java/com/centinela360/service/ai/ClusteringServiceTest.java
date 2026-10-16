package com.centinela360.service.ai;

import com.centinela360.controller.dto.ClusteringComparisonResponse;
import com.centinela360.repository.ReportRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Flux;
import reactor.test.StepVerifier;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ClusteringServiceTest {

    @Mock
    private ReportRepository reportRepository;

    private ClusteringService clusteringService;

    @BeforeEach
    void setUp() {
        clusteringService = new ClusteringService(reportRepository);
    }

    @Test
    void shouldExecuteKMeansAndCalculateInertia() {
        List<ClusteringService.GeoPoint> points = List.of(
                new ClusteringService.GeoPoint(-6.7714, -79.8409, "P1"),
                new ClusteringService.GeoPoint(-6.7716, -79.8407, "P2"),
                new ClusteringService.GeoPoint(-6.7675, -79.8425, "P3"),
                new ClusteringService.GeoPoint(-6.7678, -79.8422, "P4")
        );

        ClusteringComparisonResponse.KMeansResult result = clusteringService.executeKMeans(points, 2);
        assertNotNull(result);
        assertEquals(2, result.centroids().size());
        assertTrue(result.inertia() >= 0);
    }

    @Test
    void shouldExecuteDbscanAndIsolateNoise() {
        List<ClusteringService.GeoPoint> points = List.of(
                // Cluster 1 (cercanos entre sí < 300m)
                new ClusteringService.GeoPoint(-6.7714, -79.8409, "P1"),
                new ClusteringService.GeoPoint(-6.7715, -79.8408, "P2"),
                new ClusteringService.GeoPoint(-6.7713, -79.8410, "P3"),
                // Punto aislado (Ruido a > 2 km)
                new ClusteringService.GeoPoint(-6.7950, -79.8200, "NOISE")
        );

        ClusteringComparisonResponse.DbscanResult result = clusteringService.executeDbscan(points, 300, 2);
        assertNotNull(result);
        assertTrue(result.clustersCount() >= 1);
        assertEquals(1, result.noisePointsCount(), "Debe identificar el punto aislado como ruido");
    }

    @Test
    void shouldCompareClusteringReactively() {
        when(reportRepository.findAll()).thenReturn(Flux.empty());

        StepVerifier.create(clusteringService.compareClustering(2, 300, 2))
                .assertNext(res -> {
                    assertTrue(res.totalReportsAnalyzed() > 0);
                    assertNotNull(res.kMeans());
                    assertNotNull(res.dbscan());
                    assertTrue(res.recommendation().contains("DBSCAN"));
                })
                .verifyComplete();
    }
}

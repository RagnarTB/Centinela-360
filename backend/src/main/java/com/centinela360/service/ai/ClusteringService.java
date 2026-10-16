package com.centinela360.service.ai;

import com.centinela360.controller.dto.ClusteringComparisonResponse;
import com.centinela360.repository.ReportRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class ClusteringService {

    private final ReportRepository reportRepository;

    public record GeoPoint(double lat, double lon, String label) {}

    public Mono<ClusteringComparisonResponse> compareClustering(int k, double epsMeters, int minPts) {
        return reportRepository.findAll()
                .map(r -> new GeoPoint(r.getLocation().getY(), r.getLocation().getX(), r.getCategory()))
                .collectList()
                .map(dbPoints -> {
                    List<GeoPoint> points = new ArrayList<>(dbPoints);
                    // Si la BD tiene pocos reportes para evaluar, complementamos con dataset simulado de Chiclayo
                    if (points.size() < 6) {
                        points.addAll(generateSimulatedChiclayoReports());
                    }

                    // 1. Ejecutar K-Means
                    long startKMeans = System.currentTimeMillis();
                    ClusteringComparisonResponse.KMeansResult kMeansResult = executeKMeans(points, k);
                    long durationKMeans = System.currentTimeMillis() - startKMeans;
                    kMeansResult = new ClusteringComparisonResponse.KMeansResult(
                            kMeansResult.k(), kMeansResult.inertia(), durationKMeans,
                            kMeansResult.centroids(), kMeansResult.clusterCounts()
                    );

                    // 2. Ejecutar DBSCAN
                    long startDbscan = System.currentTimeMillis();
                    ClusteringComparisonResponse.DbscanResult dbscanResult = executeDbscan(points, epsMeters, minPts);
                    long durationDbscan = System.currentTimeMillis() - startDbscan;
                    dbscanResult = new ClusteringComparisonResponse.DbscanResult(
                            dbscanResult.epsMeters(), dbscanResult.minPts(), dbscanResult.clustersCount(),
                            dbscanResult.noisePointsCount(), durationDbscan, dbscanResult.clusterCounts()
                    );

                    String recommendation = String.format(
                            "Para consolidación dinámica de incidentes en Chiclayo, DBSCAN es superior porque no requiere fijar K a priori y separa %d avisos aislados (ruido) sin sesgar los conglomerados. K-Means (K=%d) es ideal para zonificación de cuadrantes fijos de patrullaje.",
                            dbscanResult.noisePointsCount(), k
                    );

                    return new ClusteringComparisonResponse(points.size(), kMeansResult, dbscanResult, recommendation);
                });
    }

    public ClusteringComparisonResponse.KMeansResult executeKMeans(List<GeoPoint> points, int k) {
        if (points.isEmpty()) {
            return new ClusteringComparisonResponse.KMeansResult(k, 0, 0, List.of(), Map.of());
        }

        int actualK = Math.min(k, points.size());
        // Inicializar centroides con k puntos aleatorios
        List<GeoPoint> centroids = new ArrayList<>();
        Random rand = new Random(42);
        for (int i = 0; i < actualK; i++) {
            centroids.add(points.get(rand.nextInt(points.size())));
        }

        int[] assignments = new int[points.size()];
        boolean changed = true;
        int maxIter = 50;
        int iter = 0;

        while (changed && iter++ < maxIter) {
            changed = false;
            // Asignación al centroide más cercano
            for (int i = 0; i < points.size(); i++) {
                GeoPoint p = points.get(i);
                int bestCluster = 0;
                double bestDist = Double.MAX_VALUE;
                for (int c = 0; c < actualK; c++) {
                    double d = haversineDistance(p.lat, p.lon, centroids.get(c).lat, centroids.get(c).lon);
                    if (d < bestDist) {
                        bestDist = d;
                        bestCluster = c;
                    }
                }
                if (assignments[i] != bestCluster) {
                    assignments[i] = bestCluster;
                    changed = true;
                }
            }

            // Recalcular centroides
            for (int c = 0; c < actualK; c++) {
                double sumLat = 0, sumLon = 0;
                int count = 0;
                for (int i = 0; i < points.size(); i++) {
                    if (assignments[i] == c) {
                        sumLat += points.get(i).lat;
                        sumLon += points.get(i).lon;
                        count++;
                    }
                }
                if (count > 0) {
                    centroids.set(c, new GeoPoint(sumLat / count, sumLon / count, "CENTROID_" + c));
                }
            }
        }

        // Calcular inercia (suma de distancias al cuadrado) y conteos
        double inertia = 0;
        Map<Integer, Integer> counts = new HashMap<>();
        for (int i = 0; i < points.size(); i++) {
            int c = assignments[i];
            counts.put(c, counts.getOrDefault(c, 0) + 1);
            double dist = haversineDistance(points.get(i).lat, points.get(i).lon, centroids.get(c).lat, centroids.get(c).lon);
            inertia += (dist * dist);
        }

        List<ClusteringComparisonResponse.Centroid> centroidDtos = new ArrayList<>();
        for (int c = 0; c < actualK; c++) {
            centroidDtos.add(new ClusteringComparisonResponse.Centroid(c, centroids.get(c).lat, centroids.get(c).lon));
        }

        return new ClusteringComparisonResponse.KMeansResult(actualK, Math.round(inertia), 0, centroidDtos, counts);
    }

    public ClusteringComparisonResponse.DbscanResult executeDbscan(List<GeoPoint> points, double epsMeters, int minPts) {
        int n = points.size();
        int[] labels = new int[n]; // 0: no visitado, -1: ruido, >0: cluster id
        int currentCluster = 0;

        for (int i = 0; i < n; i++) {
            if (labels[i] != 0) continue;

            List<Integer> neighbors = getNeighbors(points, i, epsMeters);
            if (neighbors.size() < minPts) {
                labels[i] = -1; // Ruido
            } else {
                currentCluster++;
                labels[i] = currentCluster;
                expandCluster(points, labels, neighbors, currentCluster, epsMeters, minPts);
            }
        }

        int noiseCount = 0;
        Map<Integer, Integer> clusterCounts = new HashMap<>();
        for (int label : labels) {
            if (label == -1) {
                noiseCount++;
            } else if (label > 0) {
                clusterCounts.put(label, clusterCounts.getOrDefault(label, 0) + 1);
            }
        }

        return new ClusteringComparisonResponse.DbscanResult(epsMeters, minPts, currentCluster, noiseCount, 0, clusterCounts);
    }

    private void expandCluster(List<GeoPoint> points, int[] labels, List<Integer> neighbors, int clusterId, double eps, int minPts) {
        Queue<Integer> queue = new LinkedList<>(neighbors);
        while (!queue.isEmpty()) {
            int current = queue.poll();
            if (labels[current] == -1) {
                labels[current] = clusterId; // Pasa de ruido a frontera de cluster
            }
            if (labels[current] != 0) continue;

            labels[current] = clusterId;
            List<Integer> currentNeighbors = getNeighbors(points, current, eps);
            if (currentNeighbors.size() >= minPts) {
                queue.addAll(currentNeighbors);
            }
        }
    }

    private List<Integer> getNeighbors(List<GeoPoint> points, int index, double epsMeters) {
        List<Integer> neighbors = new ArrayList<>();
        GeoPoint target = points.get(index);
        for (int i = 0; i < points.size(); i++) {
            if (haversineDistance(target.lat, target.lon, points.get(i).lat, points.get(i).lon) <= epsMeters) {
                neighbors.add(i);
            }
        }
        return neighbors;
    }

    private List<GeoPoint> generateSimulatedChiclayoReports() {
        return List.of(
                // Cluster A: Mercado Modelo
                new GeoPoint(-6.7675, -79.8425, "ROBO"),
                new GeoPoint(-6.7678, -79.8422, "ROBO"),
                new GeoPoint(-6.7672, -79.8428, "HURTO"),
                // Cluster B: Parque Principal / Balta
                new GeoPoint(-6.7714, -79.8409, "SOS"),
                new GeoPoint(-6.7716, -79.8407, "ROBO"),
                new GeoPoint(-6.7712, -79.8411, "PELEA"),
                // Puntos Aislados (Ruido en periferia)
                new GeoPoint(-6.7550, -79.8550, "SOSPECHOSO"),
                new GeoPoint(-6.7890, -79.8280, "ACCIDENTE")
        );
    }

    private double haversineDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371000;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}

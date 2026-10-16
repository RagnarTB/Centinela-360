package com.centinela360.service.ai;

import com.centinela360.controller.dto.RouteResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.*;

@Slf4j
@Service
public class AStarRoutingService {

    public record RoadNode(String id, String name, double lat, double lon) {}
    public record RoadEdge(RoadNode target, double distanceMeters, String streetName) {}

    private final Map<String, RoadNode> nodes = new HashMap<>();
    private final Map<String, List<RoadEdge>> adjacencyList = new HashMap<>();

    public AStarRoutingService() {
        initChiclayoRoadGraph();
    }

    private void initChiclayoRoadGraph() {
        // Principales intersecciones viales de Chiclayo
        addNode("N1", "Parque Principal (San José con Balta)", -6.7714, -79.8409);
        addNode("N2", "Plaza Elías Aguirre (San José con Elías Aguirre)", -6.7705, -79.8430);
        addNode("N3", "Av. Balta con Av. Bolognesi", -6.7760, -79.8395);
        addNode("N4", "Av. Salaverry con Av. Bolognesi", -6.7775, -79.8340);
        addNode("N5", "Mercado Modelo (Balta con Arica)", -6.7675, -79.8425);
        addNode("N6", "Hospital Las Mercedes (Luis Gonzales)", -6.7730, -79.8450);
        addNode("N7", "Av. Leonardo Ortiz con Av. Grau", -6.7640, -79.8410);
        addNode("N8", "Óvalo Santa Elena (Salida Lambayeque)", -6.7580, -79.8520);

        // Vías conectadas (bidireccionales urbanas)
        connect("N1", "N2", "Calle San José");
        connect("N1", "N3", "Avenida José Leonardo Ortiz / Balta");
        connect("N1", "N5", "Avenida Balta Norte");
        connect("N2", "N6", "Calle Elías Aguirre / Luis Gonzales");
        connect("N3", "N4", "Avenida Bolognesi");
        connect("N3", "N6", "Calle Tacna / Bolognesi");
        connect("N5", "N7", "Avenida Balta / Leonardo Ortiz");
        connect("N7", "N8", "Avenida Panamericana Norte");
        connect("N5", "N2", "Calle Arica");
    }

    private void addNode(String id, String name, double lat, double lon) {
        RoadNode node = new RoadNode(id, name, lat, lon);
        nodes.put(id, node);
        adjacencyList.put(id, new ArrayList<>());
    }

    private void connect(String fromId, String toId, String streetName) {
        RoadNode from = nodes.get(fromId);
        RoadNode to = nodes.get(toId);
        double dist = haversineDistance(from.lat, from.lon, to.lat, to.lon);

        adjacencyList.get(fromId).add(new RoadEdge(to, dist, streetName));
        adjacencyList.get(toId).add(new RoadEdge(from, dist, streetName));
    }

    public Mono<RouteResponse> calculateOptimalRoute(double startLat, double startLon, double endLat, double endLon) {
        return Mono.fromCallable(() -> {
            RoadNode startNode = findNearestNode(startLat, startLon);
            RoadNode targetNode = findNearestNode(endLat, endLon);

            // Algoritmo A*
            PriorityQueue<AStarNode> openSet = new PriorityQueue<>(Comparator.comparingDouble(a -> a.fScore));
            Map<String, Double> gScore = new HashMap<>();
            Map<String, String> cameFromNode = new HashMap<>();
            Map<String, String> cameFromStreet = new HashMap<>();

            for (String nodeId : nodes.keySet()) {
                gScore.put(nodeId, Double.MAX_VALUE);
            }

            gScore.put(startNode.id, 0.0);
            openSet.add(new AStarNode(startNode, 0.0, haversineDistance(startNode.lat, startNode.lon, targetNode.lat, targetNode.lon)));

            Set<String> closedSet = new HashSet<>();

            while (!openSet.isEmpty()) {
                AStarNode current = openSet.poll();

                if (current.node.id.equals(targetNode.id)) {
                    // Reconstruir camino
                    return buildRouteResponse(startNode, targetNode, cameFromNode, cameFromStreet, gScore.get(targetNode.id));
                }

                closedSet.add(current.node.id);

                for (RoadEdge edge : adjacencyList.get(current.node.id)) {
                    RoadNode neighbor = edge.target;
                    if (closedSet.contains(neighbor.id)) continue;

                    double tentativeGScore = gScore.get(current.node.id) + edge.distanceMeters;

                    if (tentativeGScore < gScore.get(neighbor.id)) {
                        cameFromNode.put(neighbor.id, current.node.id);
                        cameFromStreet.put(neighbor.id, edge.streetName);
                        gScore.put(neighbor.id, tentativeGScore);

                        double hScore = haversineDistance(neighbor.lat, neighbor.lon, targetNode.lat, targetNode.lon);
                        openSet.add(new AStarNode(neighbor, tentativeGScore, tentativeGScore + hScore));
                    }
                }
            }

            // Fallback si no hay conexión completa: cálculo directo
            double fallbackDist = haversineDistance(startLat, startLon, endLat, endLon);
            return new RouteResponse(
                    "A* (Fallback Directo)",
                    Math.round(fallbackDist * 100.0) / 100.0,
                    Math.max(1, (int) Math.ceil(fallbackDist / 500.0)),
                    List.of(
                            new RouteResponse.Waypoint(startLat, startLon, "Origen GPS"),
                            new RouteResponse.Waypoint(endLat, endLon, "Destino Incidente")
                    ),
                    List.of("Ruta directa geodésica")
            );
        });
    }

    private RouteResponse buildRouteResponse(RoadNode start, RoadNode target, Map<String, String> cameFromNode, Map<String, String> cameFromStreet, double totalDist) {
        List<RouteResponse.Waypoint> waypoints = new ArrayList<>();
        List<String> streets = new ArrayList<>();

        String curr = target.id;
        while (curr != null) {
            RoadNode node = nodes.get(curr);
            waypoints.add(0, new RouteResponse.Waypoint(node.lat, node.lon, node.name));
            String street = cameFromStreet.get(curr);
            if (street != null && !streets.contains(street)) {
                streets.add(0, street);
            }
            curr = cameFromNode.get(curr);
        }

        // Velocidad urbana media en calles de Chiclayo: ~30 km/h = 500 m/min
        int etaMinutes = Math.max(1, (int) Math.ceil(totalDist / 500.0));

        return new RouteResponse(
                "A* Pathfinding (Red Vial Chiclayo)",
                Math.round(totalDist * 100.0) / 100.0,
                etaMinutes,
                waypoints,
                streets
        );
    }

    private RoadNode findNearestNode(double lat, double lon) {
        RoadNode nearest = null;
        double minDist = Double.MAX_VALUE;
        for (RoadNode node : nodes.values()) {
            double d = haversineDistance(lat, lon, node.lat, node.lon);
            if (d < minDist) {
                minDist = d;
                nearest = node;
            }
        }
        return nearest;
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

    private static class AStarNode {
        RoadNode node;
        double gScore;
        double fScore;

        AStarNode(RoadNode node, double gScore, double fScore) {
            this.node = node;
            this.gScore = gScore;
            this.fScore = fScore;
        }
    }
}

export interface IncidentSummary {
    id: string;
    category: string;
    status: string; // ABIERTO | CONFIRMADO | ASIGNADO | EN_ATENCION | ATENDIDO | DESCARTADO
    trustScore: number | null;
    latitude: number;
    longitude: number;
    createdAt: string;
}

export interface ReportSummary {
    id: string;
    channel: string;
    category: string;
    description: string | null;
    status: string;
    latitude: number;
    longitude: number;
    createdAt: string;
}

export interface IncidentDetail extends IncidentSummary {
    updatedAt: string;
    relatedReports: ReportSummary[];
}

export interface PatrolUnit {
    id: string;
    code: string;
    status: string; // DISPONIBLE | EN_CAMINO | EN_SITIO | ATENDIDO | FUERA_SERVICIO
    latitude: number | null;
    longitude: number | null;
    lastLocationAt: string | null;
}

export interface UnitRecommendation {
    unitId: string;
    code: string;
    status: string;
    unitLatitude: number;
    unitLongitude: number;
    distanceMeters: number;
    estimatedArrivalMinutes: number;
    rationale: string;
}

export interface DispatchInfo {
    id: string;
    incidentId: string;
    unitId: string;
    unitCode: string;
    status: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateReportPayload {
    userId?: string;
    channel: string;
    category: string;
    description: string;
    location: {
        latitude: number;
        longitude: number;
    };
}

export interface NewsItem {
    id: string;
    title: string;
    body: string;
    tag: 'OFICIAL' | 'PREVENTIVO' | 'INFORMATIVO';
    publishedAt: string;
}

export interface AlertItem {
    id: string;
    title: string;
    body: string;
    expiresAt: string | null;
    createdAt: string;
}

// Fase 10 / APF3 - Tipos para Inteligencia Artificial y Rutas
export interface ClusteringCentroid {
    clusterId: number;
    latitude: number;
    longitude: number;
}

export interface KMeansResult {
    k: number;
    inertia: number;
    executionTimeMs: number;
    centroids: ClusteringCentroid[];
    clusterCounts: Record<number, number>;
}

export interface DbscanResult {
    epsMeters: number;
    minPts: number;
    clustersCount: number;
    noisePointsCount: number;
    executionTimeMs: number;
    clusterCounts: Record<number, number>;
}

export interface ClusteringComparisonResponse {
    totalReportsAnalyzed: number;
    kMeans: KMeansResult;
    dbscan: DbscanResult;
    recommendation: string;
}

export interface RouteWaypoint {
    latitude: number;
    longitude: number;
    name: string;
}

export interface RouteResponse {
    algorithm: string;
    totalDistanceMeters: number;
    estimatedArrivalMinutes: number;
    waypoints: RouteWaypoint[];
    roadSegments: string[];
}
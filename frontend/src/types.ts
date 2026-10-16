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
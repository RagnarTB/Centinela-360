export interface IncidentSummary {
    id: string;
    category: string;
    status: string; // ABIERTO | ASIGNADO | ATENDIDO
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
    status: string;
    latitude: number | null;
    longitude: number | null;
    lastLocationAt: string | null;
}
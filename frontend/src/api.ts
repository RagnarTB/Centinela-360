import type {
    IncidentDetail,
    IncidentSummary,
    PatrolUnit,
    UnitRecommendation,
    DispatchInfo,
    CreateReportPayload,
    ReportSummary
} from './types';

async function handle<T>(res: Response): Promise<T> {
    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Error ${res.status}: ${errorText || res.statusText}`);
    }
    return res.json() as Promise<T>;
}

export function fetchIncidents(): Promise<IncidentSummary[]> {
    return fetch('/api/v1/incidents').then((res) => handle<IncidentSummary[]>(res));
}

export function fetchIncidentById(id: string): Promise<IncidentDetail> {
    return fetch(`/api/v1/incidents/${id}`).then((res) => handle<IncidentDetail>(res));
}

export function fetchUnits(): Promise<PatrolUnit[]> {
    return fetch('/api/v1/units').then((res) => handle<PatrolUnit[]>(res));
}

// Fase 6: Revisión de incidentes por operador (VAL-02 / HU-CEN-06)
export function reviewIncident(id: string, action: 'CONFIRMAR' | 'DESCARTAR', notes?: string): Promise<IncidentDetail> {
    return fetch(`/api/v1/incidents/${id}/review`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({action, notes: notes || ''})
    }).then((res) => handle<IncidentDetail>(res));
}

// Fase 7: Recomendación de patrullero (DSP-01 / HU-CEN-08)
export function fetchUnitRecommendation(incidentId: string): Promise<UnitRecommendation> {
    return fetch(`/api/v1/incidents/${incidentId}/recommend-unit`).then((res) => handle<UnitRecommendation>(res));
}

// Fase 7: Despacho (DSP-02 / HU-CEN-09)
export function createDispatch(incidentId: string, unitId: string, notes?: string): Promise<DispatchInfo> {
    return fetch('/api/v1/dispatches', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({incidentId, unitId, notes: notes || ''})
    }).then((res) => handle<DispatchInfo>(res));
}

// Fase 7: Estados de patrulla / despacho (DSP-03 / PAT-02)
export function updateDispatchStatus(dispatchId: string, status: string, notes?: string): Promise<DispatchInfo> {
    return fetch(`/api/v1/dispatches/${dispatchId}/status`, {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({status, notes: notes || ''})
    }).then((res) => handle<DispatchInfo>(res));
}

export function fetchDispatchForIncident(incidentId: string): Promise<DispatchInfo | null> {
    return fetch(`/api/v1/dispatches/incident/${incidentId}`).then((res) => {
        if (res.status === 404) return null;
        return handle<DispatchInfo>(res);
    });
}

// Fase 8: Telemetría GPS de unidad (GPS-01 / PAT-04 / HU-PAT-06)
export function updateUnitLocation(unitId: string, latitude: number, longitude: number): Promise<PatrolUnit> {
    return fetch(`/api/v1/units/${unitId}/location`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({latitude, longitude})
    }).then((res) => handle<PatrolUnit>(res));
}

export function updateUnitStatus(unitId: string, status: string): Promise<PatrolUnit> {
    return fetch(`/api/v1/units/${unitId}/status`, {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({status})
    }).then((res) => handle<PatrolUnit>(res));
}

// Fase 2: Reportes ciudadanos (REP-01 / HU-CIU-01 / HU-CIU-03)
export function createReport(payload: CreateReportPayload): Promise<ReportSummary> {
    return fetch('/api/v1/reports', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
    }).then((res) => handle<ReportSummary>(res));
}

export function fetchMyReports(userId = '00000000-0000-0000-0000-000000000001'): Promise<ReportSummary[]> {
    return fetch('/api/v1/reports/me', {
        headers: {'X-User-Id': userId}
    }).then((res) => handle<ReportSummary[]>(res));
}
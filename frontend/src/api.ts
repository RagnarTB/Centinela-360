import type {
    IncidentDetail,
    IncidentSummary,
    PatrolUnit,
    UnitRecommendation,
    DispatchInfo,
    CreateReportPayload,
    ReportSummary,
    NewsItem,
    AlertItem,
    ClusteringComparisonResponse,
    RouteResponse
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

export function fetchMyReports(userId = 'e2c440a8-6d2c-4157-a10c-500876af520a'): Promise<ReportSummary[]> {
    return fetch('/api/v1/reports/me', {
        headers: {'X-User-Id': userId}
    }).then((res) => handle<ReportSummary[]>(res));
}

// Fase 9: Noticias y Alertas ciudadanas (INF-01 / INF-02)
export function fetchNews(): Promise<NewsItem[]> {
    return fetch('/api/v1/news').then((res) => handle<NewsItem[]>(res));
}

export function createNews(payload: {title: string; body: string; tag: string}): Promise<NewsItem> {
    return fetch('/api/v1/news', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
    }).then((res) => handle<NewsItem>(res));
}

export function fetchAlerts(): Promise<AlertItem[]> {
    return fetch('/api/v1/alerts').then((res) => handle<AlertItem[]>(res));
}

export function createAlert(payload: {title: string; body: string; expiresAt?: string}): Promise<AlertItem> {
    return fetch('/api/v1/alerts', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
    }).then((res) => handle<AlertItem>(res));
}

// Fase 10 / APF3: Inteligencia Artificial (IA-01, IA-02)
export function fetchClusteringComparison(k = 3, epsMeters = 300, minPts = 2): Promise<ClusteringComparisonResponse> {
    const params = new URLSearchParams({k: String(k), epsMeters: String(epsMeters), minPts: String(minPts)});
    return fetch(`/api/v1/analytics/clustering-comparison?${params.toString()}`).then((res) => handle<ClusteringComparisonResponse>(res));
}

export function calculateOptimalRoute(startLat: number, startLon: number, endLat: number, endLon: number): Promise<RouteResponse> {
    const params = new URLSearchParams({
        startLat: String(startLat),
        startLon: String(startLon),
        endLat: String(endLat),
        endLon: String(endLon)
    });
    return fetch(`/api/v1/routes/calculate?${params.toString()}`).then((res) => handle<RouteResponse>(res));
}

// DEMO-01 / TEST-01: Simulación completa de Escenario INC-024 desde el Frontend
export async function executeInc024Simulation(onStep?: (msg: string, stepIndex: number) => void): Promise<{incidentId: string; dispatchId: string}> {
    const log = (msg: string, idx: number) => {
        if (onStep) onStep(msg, idx);
    };

    log('Paso 1/7: Ingestando 5 reportes multicanal en Centro de Chiclayo...', 1);
    const mockReports = [
        {channel: 'APP', category: 'ROBO', description: 'Robo a mano armada en tienda comercial Balta', lat: -6.7714, lon: -79.8409},
        {channel: 'LLAMADA', category: 'ROBO', description: 'Ciudadano llama informando 2 sospechosos en moto', lat: -6.7716, lon: -79.8407},
        {channel: 'APP', category: 'ROBO', description: 'Testigo reporta asalto a transeúnte en Balta', lat: -6.7712, lon: -79.8410},
        {channel: 'APP', category: 'ROBO', description: 'Alerta ciudadana: sujetos huyen hacia San José', lat: -6.7715, lon: -79.8412},
        {channel: 'PATRULLA', category: 'ROBO', description: 'Personal de Serenazgo visualiza desorden y fuga', lat: -6.7713, lon: -79.8408}
    ];

    for (const r of mockReports) {
        await createReport({
            channel: r.channel,
            category: r.category,
            description: r.description,
            location: {latitude: r.lat, longitude: r.lon}
        });
        await new Promise((resolve) => setTimeout(resolve, 350));
    }

    log('Paso 2/7: Consolidación espacio-temporal en Kafka y PostGIS (espera reactiva)...', 2);
    await new Promise((resolve) => setTimeout(resolve, 1800));

    log('Paso 3/7: Consultando incidente consolidado...', 3);
    const incidents = await fetchIncidents();
    const roboIncident = incidents.find((i) => i.category === 'ROBO' && i.status !== 'ATENDIDO') || incidents[0];
    if (!roboIncident) throw new Error('No se pudo consolidar el incidente.');

    log(`Paso 4/7: Operador valida y confirma hecho (TrustScore: 100%)...`, 4);
    await reviewIncident(roboIncident.id, 'CONFIRMAR', 'Confirmado por operador mediante cámaras CECOM');

    log('Paso 5/7: Recomendación de patrullero más cercano con menor ETA...', 5);
    const rec = await fetchUnitRecommendation(roboIncident.id);

    log(`Paso 6/7: Despachando patrullero ${rec.code} (ETA: ${rec.estimatedArrivalMinutes} min)...`, 6);
    const dispatch = await createDispatch(roboIncident.id, rec.unitId, 'Despacho de emergencia para interceptación');

    log(`Paso 7/7: Patrullero ${rec.code} avanza: En camino -> En sitio -> Hecho atendido`, 7);
    await updateDispatchStatus(dispatch.id, 'EN_CAMINO', 'Patrulla desplazándose con sirena por Av. Balta');
    await new Promise((resolve) => setTimeout(resolve, 800));
    await updateDispatchStatus(dispatch.id, 'EN_SITIO', 'Patrulla en el lugar de los hechos; controlando la zona');
    await new Promise((resolve) => setTimeout(resolve, 800));
    await updateDispatchStatus(dispatch.id, 'ATENDIDO', 'Sujetos intervenidos y derivados a la Comisaría César Llatas');

    return {incidentId: roboIncident.id, dispatchId: dispatch.id};
}
import type {IncidentDetail, IncidentSummary, PatrolUnit} from './types';

async function handle<T>(res: Response): Promise<T> {
    if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
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
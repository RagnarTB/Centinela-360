import type {IncidentSummary} from '../types';
import {ActivityIcon, ClockIcon} from './Icons';

interface Props {
    incidents: IncidentSummary[];
    selectedId: string | null;
    onSelect: (id: string) => void;
}

function timeAgo(dateStr: string): string {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'hace instantes';
    if (mins < 60) return `hace ${mins} min`;
    const hours = Math.floor(mins / 60);
    return `hace ${hours} h`;
}

const statusColor: Record<string, string> = {
    ABIERTO: '#ef4444',
    CONFIRMADO: '#f97316',
    ASIGNADO: '#f59e0b',
    EN_ATENCION: '#3b82f6',
    ATENDIDO: '#10b981',
    DESCARTADO: '#6b7280',
};

export default function IncidentList({incidents, selectedId, onSelect}: Props) {
    return (
        <div className="incident-list">
            <div className="incident-list-header">
                <ActivityIcon size={16} />
                <h2>Incidentes en Curso ({incidents.length})</h2>
            </div>
            {incidents.length === 0 && <p className="empty">Sin incidentes activos en el cuadrante</p>}
            {incidents.map((inc) => (
                <div
                    key={inc.id}
                    className={`incident-card ${selectedId === inc.id ? 'selected' : ''}`}
                    onClick={() => onSelect(inc.id)}
                >
                    <div className="incident-card-header">
                        <span className="badge" style={{backgroundColor: statusColor[inc.status] ?? '#64748b'}}>
                            {inc.status}
                        </span>
                        <span className="time" style={{display: 'flex', alignItems: 'center', gap: '3px'}}>
                            <ClockIcon size={11} />
                            {timeAgo(inc.createdAt)}
                        </span>
                    </div>
                    <div className="incident-category">{inc.category}</div>
                    <div className="incident-trust">
                        Confiabilidad: <strong>{inc.trustScore != null ? `${inc.trustScore}%` : 'N/D'}</strong>
                    </div>
                </div>
            ))}
        </div>
    );
}
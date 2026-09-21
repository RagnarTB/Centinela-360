import type {IncidentSummary} from '../types';

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
    ABIERTO: '#e74c3c',
    ASIGNADO: '#f39c12',
    ATENDIDO: '#27ae60',
};

export default function IncidentList({incidents, selectedId, onSelect}: Props) {
    return (
        <div className="incident-list">
            <h2>Incidentes</h2>
            {incidents.length === 0 && <p className="empty">Sin incidentes activos</p>}
            {incidents.map((inc) => (
                <div
                    key={inc.id}
                    className={`incident-card ${selectedId === inc.id ? 'selected' : ''}`}
                    onClick={() => onSelect(inc.id)}
                >
                    <div className="incident-card-header">
            <span className="badge" style={{backgroundColor: statusColor[inc.status] ?? '#999'}}>
              {inc.status}
            </span>
                        <span className="time">{timeAgo(inc.createdAt)}</span>
                    </div>
                    <div className="incident-category">{inc.category}</div>
                    <div className="incident-trust">
                        Confianza: {inc.trustScore != null ? `${inc.trustScore}%` : 'N/D'}
                    </div>
                </div>
            ))}
        </div>
    );
}
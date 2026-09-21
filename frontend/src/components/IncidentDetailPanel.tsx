import {useEffect, useState} from 'react';
import type {IncidentDetail} from '../types';
import {fetchIncidentById} from '../api';

interface Props {
    incidentId: string | null;
}

export default function IncidentDetailPanel({incidentId}: Props) {
    const [detail, setDetail] = useState<IncidentDetail | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!incidentId) {
            setDetail(null);
            return;
        }
        setLoading(true);
        fetchIncidentById(incidentId)
            .then(setDetail)
            .finally(() => setLoading(false));
    }, [incidentId]);

    if (!incidentId) {
        return (
            <div className="detail-panel">
                <p className="empty">Selecciona un incidente en la lista o el mapa</p>
            </div>
        );
    }

    if (loading || !detail) {
        return <div className="detail-panel"><p>Cargando...</p></div>;
    }

    return (
        <div className="detail-panel">
            <h2>{detail.category}</h2>
            <p><strong>Estado:</strong> {detail.status}</p>
            <p><strong>Confianza:</strong> {detail.trustScore != null ? `${detail.trustScore}%` : 'N/D'}</p>
            <p><strong>Coordenadas:</strong> {detail.latitude.toFixed(4)}, {detail.longitude.toFixed(4)}</p>
            <p><strong>Creado:</strong> {new Date(detail.createdAt).toLocaleString()}</p>

            <h3>Reportes asociados</h3>
            {detail.relatedReports.length === 0 ? (
                <p className="empty">Sin reportes asociados aún (motor de consolidación pendiente — Fase 5)</p>
            ) : (
                <ul>
                    {detail.relatedReports.map((r) => (
                        <li key={r.id}>{r.channel} — {r.description}</li>
                    ))}
                </ul>
            )}

            <button className="btn-assign" disabled title="Disponible en Fase 7 (Recomendación y despacho)">
                Asignar unidad
            </button>
        </div>
    );
}
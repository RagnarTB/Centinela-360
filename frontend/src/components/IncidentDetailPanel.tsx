import {useEffect, useState, useCallback} from 'react';
import type {IncidentDetail, UnitRecommendation, DispatchInfo} from '../types';
import {
    fetchIncidentById,
    reviewIncident,
    fetchUnitRecommendation,
    createDispatch,
    fetchDispatchForIncident
} from '../api';

interface Props {
    incidentId: string | null;
    onIncidentUpdated?: () => void;
}

export default function IncidentDetailPanel({incidentId, onIncidentUpdated}: Props) {
    const [detail, setDetail] = useState<IncidentDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [recommendation, setRecommendation] = useState<UnitRecommendation | null>(null);
    const [activeDispatch, setActiveDispatch] = useState<DispatchInfo | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const loadData = useCallback(() => {
        if (!incidentId) {
            setDetail(null);
            setRecommendation(null);
            setActiveDispatch(null);
            return;
        }
        setLoading(true);
        setErrorMsg(null);

        Promise.all([
            fetchIncidentById(incidentId),
            fetchDispatchForIncident(incidentId)
        ])
            .then(([incidentData, dispatchData]) => {
                setDetail(incidentData);
                setActiveDispatch(dispatchData);

                // Si está pendiente de asignación, obtener sugerencia de unidad
                if (incidentData.status === 'ABIERTO' || incidentData.status === 'CONFIRMADO') {
                    fetchUnitRecommendation(incidentId)
                        .then(setRecommendation)
                        .catch(() => setRecommendation(null));
                } else {
                    setRecommendation(null);
                }
            })
            .catch((err) => setErrorMsg(err.message))
            .finally(() => setLoading(false));
    }, [incidentId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleReview = async (action: 'CONFIRMAR' | 'DESCARTAR') => {
        if (!incidentId) return;
        setActionLoading(true);
        setErrorMsg(null);
        try {
            const updated = await reviewIncident(incidentId, action);
            setDetail(updated);
            if (onIncidentUpdated) onIncidentUpdated();
            loadData();
        } catch (err: any) {
            setErrorMsg(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDispatch = async (unitId: string) => {
        if (!incidentId) return;
        setActionLoading(true);
        setErrorMsg(null);
        try {
            await createDispatch(incidentId, unitId);
            if (onIncidentUpdated) onIncidentUpdated();
            loadData();
        } catch (err: any) {
            setErrorMsg(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    if (!incidentId) {
        return (
            <div className="detail-panel">
                <p className="empty">Selecciona un incidente en la lista o el mapa</p>
            </div>
        );
    }

    if (loading && !detail) {
        return <div className="detail-panel"><p>Cargando detalles...</p></div>;
    }

    if (!detail) {
        return <div className="detail-panel"><p className="empty">{errorMsg || 'No se pudo cargar el incidente'}</p></div>;
    }

    return (
        <div className="detail-panel">
            <div className="detail-header">
                <h2>{detail.category}</h2>
                <span className={`status-pill status-${detail.status.toLowerCase()}`}>
                    {detail.status}
                </span>
            </div>

            {errorMsg && <div className="alert-box error">{errorMsg}</div>}

            <div className="detail-metrics">
                <div className="metric-box">
                    <span className="metric-label">TrustScore</span>
                    <span className="metric-value trust-score">
                        {detail.trustScore != null ? `${detail.trustScore}%` : 'N/D'}
                    </span>
                </div>
                <div className="metric-box">
                    <span className="metric-label">Reportes Asoc.</span>
                    <span className="metric-value">{detail.relatedReports.length}</span>
                </div>
            </div>

            <div className="detail-meta">
                <p><strong>Ubicación:</strong> {detail.latitude.toFixed(4)}, {detail.longitude.toFixed(4)} (Chiclayo)</p>
                <p><strong>Registrado:</strong> {new Date(detail.createdAt).toLocaleTimeString()} ({new Date(detail.createdAt).toLocaleDateString()})</p>
            </div>

            {/* FASE 6: REVISIÓN DE OPERADOR (VAL-02 / HU-CEN-06) */}
            {detail.status === 'ABIERTO' && (
                <div className="section-review">
                    <h4>Validación Operativa (Revisión Humana)</h4>
                    <div className="button-group">
                        <button
                            className="btn btn-confirm"
                            disabled={actionLoading}
                            onClick={() => handleReview('CONFIRMAR')}
                        >
                            ✓ Confirmar Hecho
                        </button>
                        <button
                            className="btn btn-discard"
                            disabled={actionLoading}
                            onClick={() => handleReview('DESCARTAR')}
                        >
                            ✕ Descartar
                        </button>
                    </div>
                </div>
            )}

            {/* FASE 7: MOTOR DE RECOMENDACIÓN Y DESPACHO (DSP-01, DSP-02 / HU-CEN-08, 09) */}
            {(detail.status === 'ABIERTO' || detail.status === 'CONFIRMADO') && (
                <div className="section-dispatch">
                    <h4>Recomendación de Despacho (ETA)</h4>
                    {recommendation ? (
                        <div className="recommendation-card">
                            <div className="rec-header">
                                <span className="rec-code">Unidad {recommendation.code}</span>
                                <span className="rec-eta">{recommendation.estimatedArrivalMinutes} min ETA</span>
                            </div>
                            <p className="rec-dist">Distancia: {(recommendation.distanceMeters / 1000).toFixed(2)} km ({Math.round(recommendation.distanceMeters)} m)</p>
                            <p className="rec-rationale">{recommendation.rationale}</p>
                            <button
                                className="btn btn-assign"
                                disabled={actionLoading}
                                onClick={() => handleDispatch(recommendation.unitId)}
                            >
                                Asignar y Despachar Unidad
                            </button>
                        </div>
                    ) : (
                        <p className="no-units">No hay patrulleros disponibles en este momento.</p>
                    )}
                </div>
            )}

            {/* SEGUIMIENTO DE DESPACHO ACTIVO (HU-CEN-10) */}
            {activeDispatch && (
                <div className="section-active-dispatch">
                    <h4>Patrulla en Servicio</h4>
                    <div className="dispatch-badge">
                        <span>Unidad: <strong>{activeDispatch.unitCode}</strong></span>
                        <span>Estado: <strong className={`dispatch-${activeDispatch.status.toLowerCase()}`}>{activeDispatch.status}</strong></span>
                    </div>
                </div>
            )}

            <h3>Reportes ciudadanos asociados ({detail.relatedReports.length})</h3>
            {detail.relatedReports.length === 0 ? (
                <p className="empty">Sin reportes asociados todavía.</p>
            ) : (
                <ul className="reports-list">
                    {detail.relatedReports.map((r) => (
                        <li key={r.id} className="report-item">
                            <div className="report-header">
                                <span className="channel-tag">{r.channel}</span>
                                <span className="report-time">{new Date(r.createdAt).toLocaleTimeString()}</span>
                            </div>
                            <p className="report-desc">{r.description || 'Sin descripción detallada'}</p>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
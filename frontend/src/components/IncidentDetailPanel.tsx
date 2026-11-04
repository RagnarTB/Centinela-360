import {useEffect, useState, useCallback} from 'react';
import type {IncidentDetail, UnitRecommendation, DispatchInfo} from '../types';
import {
    fetchIncidentById,
    reviewIncident,
    fetchUnitRecommendation,
    createDispatch,
    fetchDispatchForIncident
} from '../api';
import {
    CheckIcon,
    XIcon,
    CarIcon,
    RouteIcon,
    ClockIcon,
    AlertTriangleIcon
} from './Icons';

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
                <p className="empty">Seleccione un incidente en el radar o en la lista operativa para gestionar su despacho</p>
            </div>
        );
    }

    if (loading && !detail) {
        return <div className="detail-panel"><p>Consultando bitácora de suceso...</p></div>;
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

            {errorMsg && (
                <div className="alert-box error">
                    <AlertTriangleIcon size={14} />
                    <span>{errorMsg}</span>
                </div>
            )}

            <div className="detail-metrics">
                <div className="metric-box">
                    <span className="metric-label">Confiabilidad (TrustScore)</span>
                    <span className="metric-value trust-score">
                        {detail.trustScore != null ? `${detail.trustScore}%` : 'N/D'}
                    </span>
                </div>
                <div className="metric-box">
                    <span className="metric-label">Reportes Consolidados</span>
                    <span className="metric-value">{detail.relatedReports.length}</span>
                </div>
            </div>

            <div className="detail-meta">
                <p><strong>Ubicación:</strong> {detail.latitude.toFixed(5)}, {detail.longitude.toFixed(5)} (Chiclayo)</p>
                <p><strong>Hora de Ingreso:</strong> {new Date(detail.createdAt).toLocaleTimeString()} ({new Date(detail.createdAt).toLocaleDateString()})</p>
            </div>

            {/* VALIDACIÓN OPERATIVA DE CECOM */}
            {detail.status === 'ABIERTO' && (
                <div className="section-review">
                    <h4>Validación Operativa (CECOM Chiclayo)</h4>
                    <div className="button-group">
                        <button
                            className="btn btn-confirm"
                            disabled={actionLoading}
                            onClick={() => handleReview('CONFIRMAR')}
                        >
                            <CheckIcon size={15} />
                            <span>Confirmar Hecho</span>
                        </button>
                        <button
                            className="btn btn-discard"
                            disabled={actionLoading}
                            onClick={() => handleReview('DESCARTAR')}
                        >
                            <XIcon size={15} />
                            <span>Descartar Falsa Alarma</span>
                        </button>
                    </div>
                </div>
            )}

            {/* RECOMENDACIÓN DE DESPACHO */}
            {(detail.status === 'ABIERTO' || detail.status === 'CONFIRMADO') && (
                <div className="section-dispatch">
                    <h4>Despacho Recomendado por Proximidad</h4>
                    {recommendation ? (
                        <div className="recommendation-card">
                            <div className="rec-header">
                                <span className="rec-code" style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
                                    <CarIcon size={14} />
                                    Unidad {recommendation.code}
                                </span>
                                <span className="rec-eta" style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
                                    <ClockIcon size={13} />
                                    {recommendation.estimatedArrivalMinutes} min ETA
                                </span>
                            </div>
                            <p className="rec-dist">Distancia: {(recommendation.distanceMeters / 1000).toFixed(2)} km ({Math.round(recommendation.distanceMeters)} m)</p>
                            <p className="rec-rationale">{recommendation.rationale}</p>
                            <button
                                className="btn btn-assign"
                                disabled={actionLoading}
                                onClick={() => handleDispatch(recommendation.unitId)}
                            >
                                <RouteIcon size={15} />
                                <span>Asignar y Despachar Unidad</span>
                            </button>
                        </div>
                    ) : (
                        <p className="no-units">Todas las unidades del cuadrante se encuentran en intervención.</p>
                    )}
                </div>
            )}

            {/* SEGUIMIENTO DE DESPACHO ACTIVO */}
            {activeDispatch && (
                <div className="section-active-dispatch">
                    <h4>Unidad en Misión de Intervención</h4>
                    <div className="dispatch-badge">
                        <span style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
                            <CarIcon size={14} />
                            Unidad: <strong>{activeDispatch.unitCode}</strong>
                        </span>
                        <span>Estado: <strong className={`dispatch-${activeDispatch.status.toLowerCase()}`}>{activeDispatch.status}</strong></span>
                    </div>
                </div>
            )}

            <h3>Reportes vecinales asociados ({detail.relatedReports.length})</h3>
            {detail.relatedReports.length === 0 ? (
                <p className="empty">Sin avisos complementarios registrados.</p>
            ) : (
                <ul className="reports-list">
                    {detail.relatedReports.map((r) => (
                        <li key={r.id} className="report-item">
                            <div className="report-header">
                                <span className="channel-tag">{r.channel}</span>
                                <span className="report-time">{new Date(r.createdAt).toLocaleTimeString()}</span>
                            </div>
                            <p className="report-desc">{r.description || 'Aviso ciudadano sin observaciones añadidas'}</p>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
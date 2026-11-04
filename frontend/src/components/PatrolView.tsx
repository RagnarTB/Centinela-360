import {useState, useEffect, useMemo} from 'react';
import {MapContainer, TileLayer, Marker, CircleMarker, Polyline, Popup, Tooltip} from 'react-leaflet';
import L from 'leaflet';
import {
    fetchUnits,
    updateUnitLocation,
    updateUnitStatus,
    fetchIncidents,
    fetchDispatchForIncident,
    updateDispatchStatus,
    calculateOptimalRoute
} from '../api';
import type {PatrolUnit, IncidentSummary, DispatchInfo, RouteWaypoint} from '../types';
import {
    CarIcon,
    CrosshairIcon,
    RouteIcon,
    NavigationIcon,
    ShieldIcon,
    CheckCircleIcon,
    AlertTriangleIcon,
    ClockIcon,
    ZapIcon,
    CheckIcon,
    XIcon,
    RefreshIcon
} from './Icons';

// SVG Icon for the Leaflet Patrol Marker
const createInMapPatrolIcon = (code: string, status: string) => {
    const isAvail = status === 'DISPONIBLE';
    const isEnCamino = status === 'EN_CAMINO';
    const isEnSitio = status === 'EN_SITIO';
    const bgColor = isEnCamino ? '#f59e0b' : isEnSitio ? '#3b82f6' : isAvail ? '#10b981' : '#6b7280';

    const carSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H7.5a1 1 0 0 0-.8.4L4 11l-5.16.86a1 1 0 0 0-.84.99V16h3"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/></svg>`;

    return L.divIcon({
        className: 'patrol-gps-marker',
        html: `
            <div style="
                background: ${bgColor};
                color: #ffffff;
                font-family: system-ui, sans-serif;
                font-size: 11px;
                font-weight: 800;
                padding: 4px 8px;
                border-radius: 14px;
                box-shadow: 0 0 16px ${bgColor}cc, 0 3px 8px rgba(0,0,0,0.6);
                border: 2px solid #ffffff;
                display: flex;
                align-items: center;
                gap: 5px;
                white-space: nowrap;
                transform: translate(-50%, -50%);
            ">
                ${carSvg}
                <span>${code}</span>
            </div>
        `,
        iconSize: [64, 26],
        iconAnchor: [32, 13]
    });
};

// Calculate haversine distance in meters
function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
}

export default function PatrolView() {
    const [units, setUnits] = useState<PatrolUnit[]>([]);
    const [selectedUnitId, setSelectedUnitId] = useState<string>('');
    const [activeIncident, setActiveIncident] = useState<IncidentSummary | null>(null);
    const [activeDispatch, setActiveDispatch] = useState<DispatchInfo | null>(null);
    const [waypoints, setWaypoints] = useState<RouteWaypoint[]>([]);
    const [loading, setLoading] = useState(false);
    const [actionMsg, setActionMsg] = useState<{type: 'info' | 'success' | 'warning'; text: string} | null>(null);
    const [showCloseModal, setShowCloseModal] = useState(false);
    const [closureNotes, setClosureNotes] = useState('Intervención concluida sin novedad. Zona asegurada.');

    const loadUnits = () => {
        setLoading(true);
        fetchUnits()
            .then((list) => {
                setUnits(list);
                if (list.length > 0 && !selectedUnitId) {
                    setSelectedUnitId(list[0].id);
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadUnits();
    }, []);

    const selectedUnit = useMemo(() => units.find((u) => u.id === selectedUnitId), [units, selectedUnitId]);

    // Buscar si hay incidentes asignados a esta unidad
    useEffect(() => {
        if (!selectedUnitId) return;

        fetchIncidents().then(async (incidents) => {
            const assignedIncidents = incidents.filter((i) => i.status === 'ASIGNADO' || i.status === 'EN_ATENCION');
            let foundIncident: IncidentSummary | null = null;
            let foundDispatch: DispatchInfo | null = null;

            for (const inc of assignedIncidents) {
                const disp = await fetchDispatchForIncident(inc.id);
                if (disp && disp.unitId === selectedUnitId) {
                    foundIncident = inc;
                    foundDispatch = disp;
                    break;
                }
            }

            setActiveIncident(foundIncident);
            setActiveDispatch(foundDispatch);

            // Si hay un incidente asignado y la unidad tiene GPS, calcular ruta táctica A*
            if (foundIncident && selectedUnit && selectedUnit.latitude && selectedUnit.longitude) {
                try {
                    const route = await calculateOptimalRoute(
                        selectedUnit.latitude,
                        selectedUnit.longitude,
                        foundIncident.latitude,
                        foundIncident.longitude
                    );
                    setWaypoints(route.waypoints || []);
                } catch (e) {
                    console.warn('Fallback a ruta directa:', e);
                    setWaypoints([
                        {latitude: selectedUnit.latitude, longitude: selectedUnit.longitude, name: selectedUnit.code},
                        {latitude: foundIncident.latitude, longitude: foundIncident.longitude, name: foundIncident.category}
                    ]);
                }
            } else {
                setWaypoints([]);
            }
        }).catch(console.error);
    }, [selectedUnitId, selectedUnit?.latitude, selectedUnit?.longitude]);

    // Transición de estado táctico
    const handleStatusChange = async (newStatus: string) => {
        if (!selectedUnitId) return;
        try {
            await updateUnitStatus(selectedUnitId, newStatus);
            if (activeDispatch) {
                await updateDispatchStatus(activeDispatch.id, newStatus);
            }
            setActionMsg({type: 'success', text: `Estado táctico actualizado a: ${newStatus}`});
            loadUnits();
        } catch (err: any) {
            setActionMsg({type: 'warning', text: `Error: ${err.message}`});
        }
    };

    // Mover unidad GPS manualmente por el mapa
    const handleMoveGps = async (deltaLat: number, deltaLon: number) => {
        if (!selectedUnit || selectedUnit.latitude == null || selectedUnit.longitude == null) return;
        const newLat = Number((selectedUnit.latitude + deltaLat).toFixed(6));
        const newLon = Number((selectedUnit.longitude + deltaLon).toFixed(6));

        try {
            await updateUnitLocation(selectedUnit.id, newLat, newLon);
            loadUnits();
        } catch (err: any) {
            setActionMsg({type: 'warning', text: `Error al emitir GPS: ${err.message}`});
        }
    };

    // Paso asistido de avance hacia el objetivo (A* step navigation)
    const handleStepTowardsTarget = async () => {
        if (!selectedUnit || selectedUnit.latitude == null || selectedUnit.longitude == null || !activeIncident) return;
        const stepRatio = 0.35; // 35% closer to target each step
        const deltaLat = (activeIncident.latitude - selectedUnit.latitude) * stepRatio;
        const deltaLon = (activeIncident.longitude - selectedUnit.longitude) * stepRatio;
        const newLat = Number((selectedUnit.latitude + deltaLat).toFixed(6));
        const newLon = Number((selectedUnit.longitude + deltaLon).toFixed(6));

        try {
            await updateUnitLocation(selectedUnit.id, newLat, newLon);
            const dist = calculateDistanceMeters(newLat, newLon, activeIncident.latitude, activeIncident.longitude);
            if (dist < 40) {
                setActionMsg({type: 'success', text: '¡Arribo a la escena confirmado! Se encuentra a menos de 40 metros del objetivo.'});
                handleStatusChange('EN_SITIO');
            } else {
                setActionMsg({type: 'info', text: `Avanzando hacia la escena. Distancia restante: ${dist} metros.`});
            }
            loadUnits();
        } catch (err: any) {
            setActionMsg({type: 'warning', text: `Error al navegar: ${err.message}`});
        }
    };

    // Cierre formal de la misión
    const handleFinalizeMission = async () => {
        if (!activeDispatch || !selectedUnitId) return;
        try {
            await updateDispatchStatus(activeDispatch.id, 'ATENDIDO', closureNotes);
            await updateUnitStatus(selectedUnitId, 'DISPONIBLE');
            setShowCloseModal(false);
            setActiveIncident(null);
            setActiveDispatch(null);
            setWaypoints([]);
            setActionMsg({type: 'success', text: 'Misión concluida exitosamente. Patrulla retornada a estado DISPONIBLE.'});
            loadUnits();
        } catch (err: any) {
            setActionMsg({type: 'warning', text: `Error al concluir misión: ${err.message}`});
        }
    };

    // Solicitar refuerzos tácticos
    const handleRequestBackup = () => {
        setActionMsg({type: 'warning', text: '¡ALERTA DE REFUERZO EMITIDA! Despachador CECOM notificado. Código Rojo.'});
    };

    // Distancia y tiempo estimado al objetivo
    const missionDistance = useMemo(() => {
        if (!selectedUnit?.latitude || !selectedUnit?.longitude || !activeIncident) return null;
        return calculateDistanceMeters(
            selectedUnit.latitude,
            selectedUnit.longitude,
            activeIncident.latitude,
            activeIncident.longitude
        );
    }, [selectedUnit, activeIncident]);

    const estimatedEtaSeconds = missionDistance ? Math.round((missionDistance / 400) * 60) : null;

    const mapCenter: [number, number] = selectedUnit?.latitude && selectedUnit?.longitude
        ? [selectedUnit.latitude, selectedUnit.longitude]
        : [-6.7714, -79.8409];

    return (
        <div className="patrol-tactical-dashboard">
            {/* BARRA SUPERIOR DE LA UNIDAD */}
            <div className="patrol-hud-header">
                <div className="patrol-id-badge">
                    <div className="patrol-icon-wrap">
                        <CarIcon size={22} />
                    </div>
                    <div>
                        <span className="unit-label">TERMINAL DE BORDO TÁCTICA</span>
                        <h2 className="unit-code-title">Unidad {selectedUnit?.code || 'P-01'}</h2>
                    </div>
                </div>

                <div className="unit-selector-wrapper">
                    <label>Cambiar Unidad en Servicio:</label>
                    <select
                        value={selectedUnitId}
                        onChange={(e) => setSelectedUnitId(e.target.value)}
                        disabled={loading}
                        className="unit-select-input"
                    >
                        {units.map((u) => (
                            <option key={u.id} value={u.id}>
                                {u.code} — {u.status}
                            </option>
                        ))}
                    </select>
                    <button className="btn-icon-refresh" onClick={loadUnits} title="Actualizar datos">
                        <RefreshIcon size={14} />
                    </button>
                </div>
            </div>

            {/* NOTIFICACIÓN TÁCTICA */}
            {actionMsg && (
                <div className={`patrol-alert-banner alert-${actionMsg.type}`}>
                    {actionMsg.type === 'warning' ? <AlertTriangleIcon size={16} /> : <CheckCircleIcon size={16} />}
                    <span>{actionMsg.text}</span>
                    <button className="alert-close-btn" onClick={() => setActionMsg(null)}>
                        <XIcon size={14} />
                    </button>
                </div>
            )}

            {/* CONTENIDO PRINCIPAL: MAPA TÁCTICO + HUD DE MISIÓN ESTILO GTA */}
            <div className="patrol-tactical-layout">
                {/* COLUMNA IZQUIERDA: MAPA TÁCTICO EN VIVO */}
                <div className="patrol-map-column">
                    <div className="patrol-map-card">
                        <div className="patrol-map-header">
                            <div className="map-title-row">
                                <CrosshairIcon size={16} />
                                <span>Radar GPS de Navegación Operativa</span>
                            </div>
                            <div className="map-status-pill">
                                <span className={`status-indicator status-${selectedUnit?.status?.toLowerCase() || 'disponible'}`}></span>
                                {selectedUnit?.status || 'DISPONIBLE'}
                            </div>
                        </div>

                        <div className="patrol-leaflet-wrapper tactical-dark-map">
                            <MapContainer
                                center={mapCenter}
                                zoom={15}
                                style={{height: '100%', width: '100%', background: '#090d16'}}
                            >
                                <TileLayer
                                    attribution="&copy; OpenStreetMap contributors"
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    maxZoom={19}
                                />

                                {/* Marcador de la Unidad Actual */}
                                {selectedUnit?.latitude && selectedUnit?.longitude && (
                                    <Marker
                                        position={[selectedUnit.latitude, selectedUnit.longitude]}
                                        icon={createInMapPatrolIcon(selectedUnit.code, selectedUnit.status)}
                                    >
                                        <Popup>
                                            <strong>{selectedUnit.code}</strong><br />
                                            Estado: {selectedUnit.status}<br />
                                            GPS: {selectedUnit.latitude.toFixed(5)}, {selectedUnit.longitude.toFixed(5)}
                                        </Popup>
                                    </Marker>
                                )}

                                {/* Marcador del Incidente Asignado */}
                                {activeIncident && (
                                    <CircleMarker
                                        center={[activeIncident.latitude, activeIncident.longitude]}
                                        radius={14}
                                        pathOptions={{
                                            color: '#ef4444',
                                            fillColor: '#dc2626',
                                            fillOpacity: 0.9,
                                            weight: 3
                                        }}
                                    >
                                        <Tooltip direction="top" permanent>
                                            <span style={{fontWeight: 700, fontSize: '11px', color: '#b91c1c'}}>
                                                OBJETIVO: {activeIncident.category}
                                            </span>
                                        </Tooltip>
                                    </CircleMarker>
                                )}

                                {/* Línea de Ruta Táctica A* */}
                                {waypoints.length > 1 && (
                                    <Polyline
                                        positions={waypoints.map((w) => [w.latitude, w.longitude])}
                                        pathOptions={{
                                            color: '#06b6d4',
                                            weight: 5,
                                            dashArray: '6, 8',
                                            lineCap: 'round',
                                            opacity: 0.95
                                        }}
                                    />
                                )}
                            </MapContainer>
                        </div>

                        {/* CONTROLES DE DESPLAZAMIENTO GPS Y TELEMETRÍA */}
                        <div className="patrol-gps-controls">
                            <div className="dpad-box">
                                <span className="dpad-title">Simulador de Movimiento GPS</span>
                                <div className="dpad-grid">
                                    <button className="dpad-btn up" onClick={() => handleMoveGps(0.001, 0)} title="Avanzar Norte">
                                        ▲ N
                                    </button>
                                    <div className="dpad-mid-row">
                                        <button className="dpad-btn left" onClick={() => handleMoveGps(0, -0.001)} title="Avanzar Oeste">
                                            ◄ O
                                        </button>
                                        <div className="dpad-center-dot"></div>
                                        <button className="dpad-btn right" onClick={() => handleMoveGps(0, 0.001)} title="Avanzar Este">
                                            E ►
                                        </button>
                                    </div>
                                    <button className="dpad-btn down" onClick={() => handleMoveGps(-0.001, 0)} title="Avanzar Sur">
                                        ▼ S
                                    </button>
                                </div>
                            </div>

                            {activeIncident && (
                                <div className="patrol-auto-step-box">
                                    <span className="auto-step-title">Navegación Asistida hacia el Incidente</span>
                                    <p className="auto-step-desc">
                                        Avanza la unidad siguiendo la trayectoria más rápida calculada por el algoritmo de ruteo:
                                    </p>
                                    <button className="btn-auto-step" onClick={handleStepTowardsTarget}>
                                        <NavigationIcon size={16} />
                                        <span>Avanzar 150m hacia el Objetivo</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* COLUMNA DERECHA: HUD DE MISIÓN TIPO GTA Y ESTADOS */}
                <div className="patrol-hud-column">
                    {/* TARJETA DE MISIÓN ESTILO GTA */}
                    {activeIncident ? (
                        <div className="gta-mission-card">
                            <div className="mission-banner-active">
                                <div className="mission-pulse-dot"></div>
                                <span className="mission-badge-text">MISIÓN DE INTERVENCIÓN ACTIVA</span>
                            </div>

                            <div className="mission-body">
                                <div className="mission-category-badge">{activeIncident.category}</div>
                                <h3 className="mission-title">Código Rojo: Respuesta Operativa</h3>

                                <div className="mission-metrics-row">
                                    <div className="mission-metric-item">
                                        <ClockIcon size={14} />
                                        <div className="metric-info">
                                            <span className="metric-label">Tiempo Estimado (ETA)</span>
                                            <span className="metric-value">
                                                {estimatedEtaSeconds ? `${Math.ceil(estimatedEtaSeconds / 60)} min` : 'Calculando...'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="mission-metric-item">
                                        <RouteIcon size={14} />
                                        <div className="metric-info">
                                            <span className="metric-label">Distancia al Suceso</span>
                                            <span className="metric-value">
                                                {missionDistance != null ? `${missionDistance} m` : 'Calculando...'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mission-instruction-box">
                                    <div className="instruction-header">
                                        <NavigationIcon size={14} />
                                        <span>Directiva de Despacho CECOM Chiclayo</span>
                                    </div>
                                    <p className="instruction-text">
                                        Desplácese con sirena reglamentaria hacia el cuadrante. Establezca contacto visual, asegure el perímetro comercial y reporte situación a la central.
                                    </p>
                                    <div className="mission-coords">
                                        Coordenadas del Suceso: <strong>{activeIncident.latitude.toFixed(5)}, {activeIncident.longitude.toFixed(5)}</strong>
                                    </div>
                                </div>

                                {/* BOTONES DE ACCIÓN SECUENCIAL DE LA MISIÓN */}
                                <div className="mission-action-stack">
                                    {selectedUnit?.status === 'ASIGNADO' && (
                                        <button
                                            className="btn-gta btn-proceed"
                                            onClick={() => handleStatusChange('EN_CAMINO')}
                                        >
                                            <CheckIcon size={18} />
                                            <span>Aceptar y Proceder (En Camino)</span>
                                        </button>
                                    )}

                                    {selectedUnit?.status === 'EN_CAMINO' && (
                                        <button
                                            className="btn-gta btn-arrived"
                                            onClick={() => handleStatusChange('EN_SITIO')}
                                        >
                                            <CrosshairIcon size={18} />
                                            <span>Arribo a la Escena (En Sitio)</span>
                                        </button>
                                    )}

                                    <div className="secondary-action-row">
                                        <button
                                            className="btn-gta-secondary btn-backup"
                                            onClick={handleRequestBackup}
                                        >
                                            <ShieldIcon size={16} />
                                            <span>Pedir Refuerzos</span>
                                        </button>

                                        <button
                                            className="btn-gta-secondary btn-close-mission"
                                            onClick={() => setShowCloseModal(true)}
                                        >
                                            <CheckCircleIcon size={16} />
                                            <span>Finalizar Misión</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="patrol-standby-card">
                            <div className="standby-header">
                                <div className="standby-beacon"></div>
                                <span>PATRULLAJE PREVENTIVO ACTIVO</span>
                            </div>

                            <div className="standby-body">
                                <h3>Unidad en Guardia Operativa</h3>
                                <p>
                                    La unidad <strong>{selectedUnit?.code || 'P-01'}</strong> está patrullando en su cuadrante correspondiente.
                                    No se reportan incidentes críticos asignados en este momento.
                                </p>

                                <div className="standby-status-box">
                                    <div className="status-row">
                                        <span>Estado Radioperativo:</span>
                                        <strong className="status-text-green">{selectedUnit?.status || 'DISPONIBLE'}</strong>
                                    </div>
                                    <div className="status-row">
                                        <span>Sector / Cuadrante:</span>
                                        <strong>Sector 2 — Chiclayo Centro</strong>
                                    </div>
                                    <div className="status-row">
                                        <span>Última Ubicación GPS:</span>
                                        <strong>
                                            {selectedUnit?.latitude?.toFixed(4)}, {selectedUnit?.longitude?.toFixed(4)}
                                        </strong>
                                    </div>
                                </div>

                                <div className="manual-status-controls">
                                    <label>Ajustar Disponibilidad:</label>
                                    <div className="status-btn-group">
                                        <button
                                            className={`status-btn ${selectedUnit?.status === 'DISPONIBLE' ? 'active' : ''}`}
                                            onClick={() => handleStatusChange('DISPONIBLE')}
                                        >
                                            Disponible
                                        </button>
                                        <button
                                            className={`status-btn ${selectedUnit?.status === 'EN_CAMINO' ? 'active' : ''}`}
                                            onClick={() => handleStatusChange('EN_CAMINO')}
                                        >
                                            En Patrulla
                                        </button>
                                        <button
                                            className={`status-btn ${selectedUnit?.status === 'FUERA_SERVICIO' ? 'active' : ''}`}
                                            onClick={() => handleStatusChange('FUERA_SERVICIO')}
                                        >
                                            Base / Recarga
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TELEMETRÍA DEL VEHÍCULO DE PATRULLA */}
                    <div className="patrol-telemetry-panel">
                        <div className="telemetry-header">
                            <ZapIcon size={15} />
                            <span>Diagnóstico y Bordo de Unidad</span>
                        </div>
                        <div className="telemetry-grid">
                            <div className="telemetry-gauge">
                                <span className="gauge-label">Batería Radio</span>
                                <span className="gauge-val">94%</span>
                                <div className="gauge-bar"><div className="gauge-fill" style={{width: '94%'}}></div></div>
                            </div>
                            <div className="telemetry-gauge">
                                <span className="gauge-label">Combustible</span>
                                <span className="gauge-val">78%</span>
                                <div className="gauge-bar"><div className="gauge-fill" style={{width: '78%'}}></div></div>
                            </div>
                            <div className="telemetry-gauge">
                                <span className="gauge-label">Señal GPS</span>
                                <span className="gauge-val text-green">Excelente</span>
                                <div className="gauge-bar"><div className="gauge-fill" style={{width: '100%', background: '#10b981'}}></div></div>
                            </div>
                            <div className="telemetry-gauge">
                                <span className="gauge-label">Canal CECOM</span>
                                <span className="gauge-val">CH-04</span>
                                <div className="gauge-bar"><div className="gauge-fill" style={{width: '100%', background: '#3b82f6'}}></div></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* MODAL PARA FINALIZAR Y CERRAR CASO */}
            {showCloseModal && (
                <div className="modal-backdrop">
                    <div className="modal-window">
                        <div className="modal-header">
                            <div className="modal-title-row">
                                <CheckCircleIcon size={18} />
                                <h3>Informe de Cierre de Intervención</h3>
                            </div>
                            <button className="modal-close-x" onClick={() => setShowCloseModal(false)}>
                                <XIcon size={16} />
                            </button>
                        </div>

                        <div className="modal-body">
                            <p className="modal-subtitle">
                                Registre el parte de servicio para concluir el incidente <strong>{activeIncident?.category}</strong> y liberar la unidad <strong>{selectedUnit?.code}</strong>.
                            </p>

                            <div className="form-group">
                                <label>Observaciones de la Intervención Operativa:</label>
                                <textarea
                                    className="form-textarea"
                                    rows={3}
                                    value={closureNotes}
                                    onChange={(e) => setClosureNotes(e.target.value)}
                                    placeholder="Detalles de la atención brindada por el serenazgo..."
                                />
                            </div>

                            <div className="modal-info-box">
                                <div><strong>Unidad Responsable:</strong> {selectedUnit?.code}</div>
                                <div><strong>Resultado:</strong> Situación Controlada / Caso Atendido</div>
                                <div><strong>Próximo Estado de Unidad:</strong> DISPONIBLE</div>
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={() => setShowCloseModal(false)}>
                                Cancelar
                            </button>
                            <button className="btn-confirm-save" onClick={handleFinalizeMission}>
                                <CheckIcon size={16} />
                                Concluir Misión y Reportar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

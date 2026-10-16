import {useState, useEffect} from 'react';
import {fetchUnits, updateUnitLocation, updateUnitStatus, fetchIncidents, fetchDispatchForIncident, updateDispatchStatus} from '../api';
import type {PatrolUnit, IncidentSummary, DispatchInfo} from '../types';

export default function PatrolView() {
    const [units, setUnits] = useState<PatrolUnit[]>([]);
    const [selectedUnitId, setSelectedUnitId] = useState<string>('');
    const [activeIncident, setActiveIncident] = useState<IncidentSummary | null>(null);
    const [activeDispatch, setActiveDispatch] = useState<DispatchInfo | null>(null);
    const [loading, setLoading] = useState(false);
    const [actionMsg, setActionMsg] = useState<string | null>(null);

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

    const selectedUnit = units.find((u) => u.id === selectedUnitId);

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
        }).catch(console.error);
    }, [selectedUnitId, units]);

    // HU-PAT-07: Cambio de estado de unidad
    const handleStatusChange = async (newStatus: string) => {
        if (!selectedUnitId) return;
        try {
            await updateUnitStatus(selectedUnitId, newStatus);
            if (activeDispatch) {
                await updateDispatchStatus(activeDispatch.id, newStatus);
            }
            setActionMsg(`Estado actualizado a ${newStatus}`);
            loadUnits();
        } catch (err: any) {
            setActionMsg(`Error: ${err.message}`);
        }
    };

    // HU-PAT-06: Simulación de movimiento GPS
    const handleMoveGps = async (deltaLat: number, deltaLon: number) => {
        if (!selectedUnit || selectedUnit.latitude == null || selectedUnit.longitude == null) return;
        const newLat = Number((selectedUnit.latitude + deltaLat).toFixed(6));
        const newLon = Number((selectedUnit.longitude + deltaLon).toFixed(6));

        try {
            await updateUnitLocation(selectedUnit.id, newLat, newLon);
            setActionMsg(`Ubicación GPS emitida: ${newLat}, ${newLon}`);
            loadUnits();
        } catch (err: any) {
            setActionMsg(`Error al actualizar GPS: ${err.message}`);
        }
    };

    return (
        <div className="patrol-container">
            <div className="patrol-header-card">
                <h2>Consola de Unidad de Patrullaje</h2>
                <div className="unit-selector">
                    <label>Seleccionar Unidad:</label>
                    <select
                        value={selectedUnitId}
                        onChange={(e) => setSelectedUnitId(e.target.value)}
                        disabled={loading}
                    >
                        {units.map((u) => (
                            <option key={u.id} value={u.id}>
                                {u.code} — {u.status}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {actionMsg && <div className="alert-box info">{actionMsg}</div>}

            {selectedUnit && (
                <div className="patrol-grid">
                    {/* PANEL DE ESTADO Y TELEMETRÍA */}
                    <div className="patrol-card telemetry-card">
                        <h3>Estado Actual: Unidad {selectedUnit.code}</h3>
                        <div className="telemetry-box">
                            <p><strong>Estado Operativo:</strong> <span className={`status-pill status-${selectedUnit.status.toLowerCase()}`}>{selectedUnit.status}</span></p>
                            <p><strong>Última Latitud:</strong> {selectedUnit.latitude?.toFixed(5) ?? 'N/D'}</p>
                            <p><strong>Última Longitud:</strong> {selectedUnit.longitude?.toFixed(5) ?? 'N/D'}</p>
                            <p><strong>Último Reporte GPS:</strong> {selectedUnit.lastLocationAt ? new Date(selectedUnit.lastLocationAt).toLocaleTimeString() : 'Sin señal'}</p>
                        </div>

                        <h4>Control de Estados (HU-PAT-07)</h4>
                        <div className="status-button-grid">
                            <button
                                className="btn-patrol btn-avail"
                                onClick={() => handleStatusChange('DISPONIBLE')}
                            >
                                Disponible
                            </button>
                            <button
                                className="btn-patrol btn-en-camino"
                                onClick={() => handleStatusChange('EN_CAMINO')}
                            >
                                En Camino
                            </button>
                            <button
                                className="btn-patrol btn-en-sitio"
                                onClick={() => handleStatusChange('EN_SITIO')}
                            >
                                En Sitio
                            </button>
                            <button
                                className="btn-patrol btn-atendido"
                                onClick={() => handleStatusChange('ATENDIDO')}
                            >
                                Atendido / Cerrar
                            </button>
                        </div>

                        <h4>Simulador de Desplazamiento GPS (HU-PAT-06)</h4>
                        <p className="hint">Mover unidad en tiempo real por el mapa de Chiclayo:</p>
                        <div className="dpad-grid">
                            <button onClick={() => handleMoveGps(0.0015, 0)}>▲ Norte</button>
                            <div className="dpad-mid">
                                <button onClick={() => handleMoveGps(0, -0.0015)}>◄ Oeste</button>
                                <button onClick={() => handleMoveGps(0, 0.0015)}>Este ►</button>
                            </div>
                            <button onClick={() => handleMoveGps(-0.0015, 0)}>▼ Sur</button>
                        </div>
                    </div>

                    {/* PANEL DE INCIDENTE ASIGNADO */}
                    <div className="patrol-card incident-card">
                        <h3>Incidente Asignado (HU-PAT-01 / HU-PAT-04)</h3>
                        {activeIncident ? (
                            <div className="assigned-box">
                                <div className="assigned-badge">¡MISIÓN ACTIVA!</div>
                                <h4>{activeIncident.category}</h4>
                                <p><strong>Estado:</strong> {activeIncident.status}</p>
                                <p><strong>Coordenadas del Suceso:</strong> {activeIncident.latitude.toFixed(4)}, {activeIncident.longitude.toFixed(4)}</p>
                                <p><strong>Registrado:</strong> {new Date(activeIncident.createdAt).toLocaleTimeString()}</p>
                                <p><strong>Confianza (TrustScore):</strong> {activeIncident.trustScore != null ? `${activeIncident.trustScore}%` : 'N/D'}</p>

                                <div className="assigned-actions">
                                    <button
                                        className="btn btn-confirm"
                                        onClick={() => handleStatusChange('EN_SITIO')}
                                    >
                                        Reportar: Llegué al Lugar (En Sitio)
                                    </button>
                                    <button
                                        className="btn btn-atendido"
                                        onClick={() => handleStatusChange('ATENDIDO')}
                                    >
                                        Marcar Hecho como Atendido
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="no-incident">
                                <p>No hay incidentes asignados actualmente para la unidad <strong>{selectedUnit.code}</strong>.</p>
                                <p className="hint">La unidad se encuentra a la espera de despacho desde la Central 360.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

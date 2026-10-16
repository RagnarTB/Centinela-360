import {useState, useEffect} from 'react';
import {createReport, fetchMyReports} from '../api';
import type {ReportSummary} from '../types';

// Centro de Chiclayo por defecto
const CHICLAYO_DEFAULT = {lat: -6.7714, lon: -79.8409};

export default function CitizenView() {
    const [category, setCategory] = useState('ROBO');
    const [description, setDescription] = useState('');
    const [latitude, setLatitude] = useState(CHICLAYO_DEFAULT.lat);
    const [longitude, setLongitude] = useState(CHICLAYO_DEFAULT.lon);
    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<{type: 'success' | 'error'; msg: string} | null>(null);

    const [myReports, setMyReports] = useState<ReportSummary[]>([]);
    const [loadingReports, setLoadingReports] = useState(false);

    const loadReports = () => {
        setLoadingReports(true);
        fetchMyReports()
            .then(setMyReports)
            .catch(console.error)
            .finally(() => setLoadingReports(false));
    };

    useEffect(() => {
        loadReports();
    }, []);

    const captureLocation = () => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setLatitude(Number(pos.coords.latitude.toFixed(6)));
                    setLongitude(Number(pos.coords.longitude.toFixed(6)));
                    setFeedback({type: 'success', msg: 'Ubicación GPS actual detectada correctamente'});
                },
                () => {
                    // Si el usuario niega o falla, se mantiene Chiclayo
                    setFeedback({type: 'error', msg: 'No se pudo obtener el GPS local; se utiliza Chiclayo Centro.'});
                }
            );
        }
    };

    // HU-CIU-03: Botón SOS de Emergencia
    const handleSOS = async () => {
        setSubmitting(true);
        setFeedback(null);
        try {
            const result = await createReport({
                channel: 'APP',
                category: 'EMERGENCIA_SOS',
                description: '¡ALERTA SOS EMITIDA DESDE APP CIUDADANA! Requiere atención urgente.',
                location: {latitude, longitude}
            });
            setFeedback({
                type: 'success',
                msg: `¡ALERTA SOS ENVIADA CON ÉXITO! ID de reporte: ${result.id.slice(0, 8)}... Serenazgo ha recibido tu alerta prioritaria.`
            });
            loadReports();
        } catch (err: any) {
            setFeedback({type: 'error', msg: `Error al emitir alerta SOS: ${err.message}`});
        } finally {
            setSubmitting(false);
        }
    };

    // HU-CIU-01: Reporte Rápido
    const handleSubmitQuickReport = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setFeedback(null);
        try {
            const result = await createReport({
                channel: 'APP',
                category,
                description: description || `Reporte de ${category} emitido por ciudadano en Chiclayo`,
                location: {latitude, longitude}
            });
            setFeedback({
                type: 'success',
                msg: `Reporte registrado exitosamente con ID: ${result.id.slice(0, 8)}... Estado inicial: ${result.status}`
            });
            setDescription('');
            loadReports();
        } catch (err: any) {
            setFeedback({type: 'error', msg: `Error al enviar reporte: ${err.message}`});
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="citizen-container">
            <div className="citizen-grid">
                {/* COLUMNA 1: ACCIÓN RÁPIDA Y SOS */}
                <div className="citizen-card sos-card">
                    <div className="sos-header">
                        <h3>Asistencia Inmediata</h3>
                        <p>Presiona el botón SOS si estás en peligro o presencias una emergencia grave.</p>
                    </div>

                    <button
                        className="btn-sos-pulse"
                        onClick={handleSOS}
                        disabled={submitting}
                        title="Enviar alerta SOS con tu ubicación actual"
                    >
                        <span className="sos-text">BOTÓN SOS</span>
                        <span className="sos-sub">EMERGENCIA 1 TOQUE</span>
                    </button>

                    <div className="location-picker">
                        <label>Coordenadas del incidente:</label>
                        <div className="coords-inputs">
                            <input
                                type="number"
                                step="0.0001"
                                value={latitude}
                                onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                                placeholder="Latitud"
                            />
                            <input
                                type="number"
                                step="0.0001"
                                value={longitude}
                                onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                                placeholder="Longitud"
                            />
                        </div>
                        <button type="button" className="btn-gps" onClick={captureLocation}>
                            Detectar mi GPS actual
                        </button>
                    </div>
                </div>

                {/* COLUMNA 2: FORMULARIO DE REPORTE RÁPIDO */}
                <div className="citizen-card form-card">
                    <h3>Reportar Incidente (Reporte Rápido)</h3>
                    <form onSubmit={handleSubmitQuickReport} className="report-form">
                        <div className="form-group">
                            <label>Tipo de Incidente / Categoría:</label>
                            <select value={category} onChange={(e) => setCategory(e.target.value)}>
                                <option value="ROBO">Robo / Asalto en vía pública</option>
                                <option value="ACCIDENTE">Accidente de tránsito</option>
                                <option value="SOSPECHOSO">Personas / Actividad sospechosa</option>
                                <option value="VIOLENCIA">Alteración del orden público / Pelea</option>
                                <option value="DROGAS">Consumo / Venta de sustancias</option>
                                <option value="OTRO">Otro incidente urbano</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Descripción breve (opcional):</label>
                            <textarea
                                rows={3}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Indica puntos de referencia o detalles (ej. frente a la Catedral, moto lineal roja)..."
                            />
                        </div>

                        {feedback && (
                            <div className={`citizen-alert alert-${feedback.type}`}>
                                {feedback.msg}
                            </div>
                        )}

                        <button type="submit" className="btn-send-report" disabled={submitting}>
                            {submitting ? 'Registrando reporte...' : 'Enviar Reporte a Central 360'}
                        </button>
                    </form>
                </div>

                {/* COLUMNA 3: MIS REPORTES */}
                <div className="citizen-card my-reports-card">
                    <div className="reports-card-header">
                        <h3>Mis Reportes Ciudadanos ({myReports.length})</h3>
                        <button className="btn-refresh-sm" onClick={loadReports} disabled={loadingReports}>
                            ↻
                        </button>
                    </div>

                    {loadingReports ? (
                        <p className="loading-text">Actualizando tus reportes...</p>
                    ) : myReports.length === 0 ? (
                        <p className="empty">No has registrado reportes aún.</p>
                    ) : (
                        <div className="my-reports-list">
                            {myReports.map((r) => (
                                <div key={r.id} className="citizen-report-item">
                                    <div className="cr-top">
                                        <span className="cr-cat">{r.category}</span>
                                        <span className={`cr-status status-${r.status.toLowerCase()}`}>
                                            {r.status}
                                        </span>
                                    </div>
                                    <p className="cr-desc">{r.description || 'Sin descripción'}</p>
                                    <span className="cr-time">{new Date(r.createdAt).toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

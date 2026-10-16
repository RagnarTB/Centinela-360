import {useState, useEffect} from 'react';
import {createReport, fetchMyReports, fetchNews, fetchAlerts} from '../api';
import type {ReportSummary, NewsItem, AlertItem} from '../types';

// Centro de Chiclayo por defecto
const CHICLAYO_DEFAULT = {lat: -6.7714, lon: -79.8409};

type CitizenSubTab = 'REPORTES' | 'NOTICIAS' | 'CONSEJOS';

export default function CitizenView() {
    const [subTab, setSubTab] = useState<CitizenSubTab>('REPORTES');

    // Reportes state
    const [category, setCategory] = useState('ROBO');
    const [description, setDescription] = useState('');
    const [latitude, setLatitude] = useState(CHICLAYO_DEFAULT.lat);
    const [longitude, setLongitude] = useState(CHICLAYO_DEFAULT.lon);
    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<{type: 'success' | 'error'; msg: string} | null>(null);

    const [myReports, setMyReports] = useState<ReportSummary[]>([]);
    const [loadingReports, setLoadingReports] = useState(false);

    // Noticias y Alertas state (Fase 9 / INF-01, INF-02)
    const [news, setNews] = useState<NewsItem[]>([]);
    const [alerts, setAlerts] = useState<AlertItem[]>([]);

    const loadReports = () => {
        setLoadingReports(true);
        fetchMyReports()
            .then(setMyReports)
            .catch(console.error)
            .finally(() => setLoadingReports(false));
    };

    const loadInfo = () => {
        Promise.all([fetchNews(), fetchAlerts()])
            .then(([newsData, alertData]) => {
                setNews(newsData);
                setAlerts(alertData);
            })
            .catch(console.error);
    };

    useEffect(() => {
        loadReports();
        loadInfo();
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
                msg: `¡ALERTA SOS ENVIADA CON ÉXITO! ID: ${result.id.slice(0, 8)}... Serenazgo ha recibido tu alerta prioritaria.`
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
            {/* SUB-NAVEGACIÓN CIUDADANA (Fase 9) */}
            <div className="citizen-subnav">
                <button
                    className={`subnav-btn ${subTab === 'REPORTES' ? 'active' : ''}`}
                    onClick={() => setSubTab('REPORTES')}
                >
                    🚨 Reportar & SOS
                </button>
                <button
                    className={`subnav-btn ${subTab === 'NOTICIAS' ? 'active' : ''}`}
                    onClick={() => setSubTab('NOTICIAS')}
                >
                    📢 Noticias y Alertas Preventivas ({alerts.length + news.length})
                </button>
                <button
                    className={`subnav-btn ${subTab === 'CONSEJOS' ? 'active' : ''}`}
                    onClick={() => setSubTab('CONSEJOS')}
                >
                    🛡️ Prevención y Contactos de Emergencia
                </button>
            </div>

            {/* PESTAÑA 1: REPORTES Y SOS */}
            {subTab === 'REPORTES' && (
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
                                    <option value="PROBLEMA_URBANO">Problema urbano (luminaria/pista) [CIU-02]</option>
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
            )}

            {/* PESTAÑA 2: NOTICIAS Y ALERTAS (FASE 9 / INF-01, INF-02) */}
            {subTab === 'NOTICIAS' && (
                <div className="news-alerts-container">
                    {/* Alertas preventivas activas */}
                    <div className="alerts-section">
                        <h3>Alertas Preventivas Zonales ({alerts.length})</h3>
                        {alerts.length === 0 ? (
                            <p className="empty-info">No hay alertas zonales vigentes en Chiclayo en este momento.</p>
                        ) : (
                            <div className="alerts-grid">
                                {alerts.map((a) => (
                                    <div key={a.id} className="alert-card-item">
                                        <div className="alert-card-header">
                                            <span className="alert-badge">AVISO PREVENTIVO</span>
                                            {a.expiresAt && (
                                                <span className="alert-expiry">
                                                    Vigente hasta: {new Date(a.expiresAt).toLocaleTimeString()} ({new Date(a.expiresAt).toLocaleDateString()})
                                                </span>
                                            )}
                                        </div>
                                        <h4>{a.title}</h4>
                                        <p>{a.body}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Noticias oficiales */}
                    <div className="news-section">
                        <h3>Comunicaciones Oficiales ({news.length})</h3>
                        {news.length === 0 ? (
                            <p className="empty-info">No hay comunicados publicados recientemente.</p>
                        ) : (
                            <div className="news-grid">
                                {news.map((n) => (
                                    <div key={n.id} className="news-card-item">
                                        <div className="news-card-header">
                                            <span className={`tag-pill tag-${n.tag.toLowerCase()}`}>{n.tag}</span>
                                            <span className="news-date">{new Date(n.publishedAt).toLocaleDateString()}</span>
                                        </div>
                                        <h4>{n.title}</h4>
                                        <p>{n.body}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* PESTAÑA 3: CONSEJOS Y CONTACTOS (CIU-01, CIU-02) */}
            {subTab === 'CONSEJOS' && (
                <div className="tips-container">
                    <div className="tips-grid">
                        <div className="tip-card contacts-card">
                            <h3>Centrales Telefónicas de Emergencia (Chiclayo)</h3>
                            <ul className="contacts-list">
                                <li>
                                    <strong>Serenazgo Provincial de Chiclayo:</strong>
                                    <span>(074) 20-3333 / 980-000-360</span>
                                </li>
                                <li>
                                    <strong>Policía Nacional del Perú (Central 105):</strong>
                                    <span>105 / Comisaría César Llatas: (074) 23-1000</span>
                                </li>
                                <li>
                                    <strong>Bomberos Salvadora Chiclayo N° 27:</strong>
                                    <span>116 / (074) 23-3333</span>
                                </li>
                                <li>
                                    <strong>SAMU (Ambulancia y Emergencias Médicas):</strong>
                                    <span>106</span>
                                </li>
                                <li>
                                    <strong>Defensoría del Pueblo (Oficina Lambayeque):</strong>
                                    <span>0800-15170 / (074) 22-8900</span>
                                </li>
                            </ul>
                        </div>

                        <div className="tip-card guide-card">
                            <h3>Pautas de Prevención y Seguridad Urbana</h3>
                            <div className="tip-item">
                                <h4>🏦 En Zonas Bancarias y Comerciales (Mercado Modelo / Balta)</h4>
                                <p>Evite retirar montos elevados en efectivo solo. No acepte ayuda de personas desconocidas en cajeros y guarde sus pertenencias en bolsos cerrados al frente.</p>
                            </div>
                            <div className="tip-item">
                                <h4>🚌 En Transporte Público y Taxis</h4>
                                <p>Verifique que el taxi cuente con casquete oficial y placa visible. Comparta su ubicación en tiempo real con un familiar ante desplazamientos nocturnos.</p>
                            </div>
                            <div className="tip-item">
                                <h4>🏗️ Problemas Urbanos No Urgentes (CIU-02)</h4>
                                <p>Luminarias públicas apagadas, buzones sin tapa o vías deterioradas deben reportarse bajo la categoría <em>Problema Urbano</em> para canalización a Obras Públicas sin saturar la línea de patrullaje de emergencia.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

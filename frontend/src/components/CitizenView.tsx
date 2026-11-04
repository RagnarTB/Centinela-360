import {useState, useEffect} from 'react';
import {createReport, fetchMyReports, fetchNews, fetchAlerts} from '../api';
import type {ReportSummary, NewsItem, AlertItem} from '../types';
import {
    RadioIcon,
    NewspaperIcon,
    ShieldIcon,
    MapPinIcon,
    CrosshairIcon,
    LockIcon,
    PhoneIcon,
    AlertTriangleIcon,
    CheckCircleIcon,
    RefreshIcon,
    ZapIcon,
    BellIcon
} from './Icons';

// Centro de Chiclayo por defecto
const CHICLAYO_DEFAULT = {lat: -6.7714, lon: -79.8409};

type CitizenSubTab = 'REPORTES' | 'NOTICIAS' | 'CONSEJOS';

const DEFAULT_NEWS_PHOTOS = [
    '/assets/patrol_serenazgo.jpg',
    '/assets/cecom_control.jpg',
    '/assets/patrol_team.jpg'
];

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

    // Noticias y Alertas state
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
                    setFeedback({type: 'success', msg: 'Ubicación GPS actual detectada con éxito.'});
                },
                () => {
                    setFeedback({type: 'error', msg: 'No se pudo leer el GPS local; se fija Chiclayo Centro.'});
                }
            );
        }
    };

    // Botón SOS de Emergencia
    const handleSOS = async () => {
        setSubmitting(true);
        setFeedback(null);
        try {
            const result = await createReport({
                channel: 'APP',
                category: 'EMERGENCIA_SOS',
                description: '¡ALERTA SOS EMITIDA DESDE APP CIUDADANA! Requiere intervención inmediata de Serenazgo.',
                location: {latitude, longitude}
            });
            setFeedback({
                type: 'success',
                msg: `¡ALERTA SOS TRANSMITIDA! Código: ${result.id.slice(0, 8)}. La central CECOM ha despachado la patrulla más cercana.`
            });
            loadReports();
        } catch (err: any) {
            setFeedback({type: 'error', msg: `Error al emitir alerta SOS: ${err.message}`});
        } finally {
            setSubmitting(false);
        }
    };

    // Formulario de Reporte Rápido
    const handleSubmitQuickReport = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setFeedback(null);
        try {
            const result = await createReport({
                channel: 'APP',
                category,
                description: description || `Reporte vecinal de ${category} emitido en Chiclayo`,
                location: {latitude, longitude}
            });
            setFeedback({
                type: 'success',
                msg: `Reporte registrado con éxito (ID: ${result.id.slice(0, 8)}...). Estado inicial: ${result.status}`
            });
            setDescription('');
            loadReports();
        } catch (err: any) {
            setFeedback({type: 'error', msg: `Error al registrar reporte: ${err.message}`});
        } finally {
            setSubmitting(false);
        }
    };

    // Extraer foto de noticia si está codificada en el texto
    const extractPhotoAndBody = (rawBody: string, index: number) => {
        const match = rawBody.match(/\[IMAGEN:(.*?)\]/);
        if (match) {
            return {
                photoUrl: match[1],
                cleanText: rawBody.replace(/\[IMAGEN:.*?\]/, '').trim()
            };
        }
        return {
            photoUrl: DEFAULT_NEWS_PHOTOS[index % DEFAULT_NEWS_PHOTOS.length],
            cleanText: rawBody
        };
    };

    return (
        <div className="citizen-container">
            {/* SUB-NAVEGACIÓN CIUDADANA */}
            <div className="citizen-subnav">
                <button
                    className={`subnav-btn ${subTab === 'REPORTES' ? 'active' : ''}`}
                    onClick={() => setSubTab('REPORTES')}
                >
                    <RadioIcon size={15} />
                    <span>Reportar & Botón SOS</span>
                </button>
                <button
                    className={`subnav-btn ${subTab === 'NOTICIAS' ? 'active' : ''}`}
                    onClick={() => setSubTab('NOTICIAS')}
                >
                    <NewspaperIcon size={15} />
                    <span>Noticias y Alertas ({alerts.length + news.length})</span>
                </button>
                <button
                    className={`subnav-btn ${subTab === 'CONSEJOS' ? 'active' : ''}`}
                    onClick={() => setSubTab('CONSEJOS')}
                >
                    <ShieldIcon size={15} />
                    <span>Prevención y Contactos</span>
                </button>
            </div>

            {/* PESTAÑA 1: REPORTES Y SOS */}
            {subTab === 'REPORTES' && (
                <div className="citizen-grid">
                    {/* COLUMNA 1: BOTÓN SOS */}
                    <div className="citizen-card sos-card">
                        <div className="sos-header">
                            <div className="card-badge-row">
                                <span className="sos-live-pill">ASISTENCIA DIRECTA</span>
                            </div>
                            <h3>Botón SOS de Emergencia</h3>
                            <p>Presione en situaciones de riesgo inminente para alertar a la Central CECOM.</p>
                        </div>

                        <button
                            className="btn-sos-pulse"
                            onClick={handleSOS}
                            disabled={submitting}
                            title="Enviar alerta SOS con tu ubicación actual"
                        >
                            <span className="sos-text">BOTÓN SOS</span>
                            <span className="sos-sub">EMERGENCIA EN 1 TOQUE</span>
                        </button>

                        <div className="location-picker">
                            <label>Ubicación del incidente (Chiclayo):</label>
                            <div className="quick-locations-pills">
                                <button type="button" className="pill-btn" onClick={() => { setLatitude(-6.7714); setLongitude(-79.8409); }}>
                                    <MapPinIcon size={12} /> Plaza de Armas
                                </button>
                                <button type="button" className="pill-btn" onClick={() => { setLatitude(-6.7675); setLongitude(-79.8425); }}>
                                    <MapPinIcon size={12} /> Mercado Modelo
                                </button>
                                <button type="button" className="pill-btn" onClick={() => { setLatitude(-6.7705); setLongitude(-79.8430); }}>
                                    <MapPinIcon size={12} /> Elías Aguirre
                                </button>
                                <button type="button" className="pill-btn" onClick={() => { setLatitude(-6.7760); setLongitude(-79.8395); }}>
                                    <MapPinIcon size={12} /> Balta / Bolognesi
                                </button>
                                <button type="button" className="pill-btn" onClick={() => { setLatitude(-6.7730); setLongitude(-79.8450); }}>
                                    <MapPinIcon size={12} /> Las Mercedes
                                </button>
                            </div>
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
                                <CrosshairIcon size={14} />
                                <span>Detectar mi GPS en tiempo real</span>
                            </button>
                        </div>
                    </div>

                    {/* COLUMNA 2: FORMULARIO DE REPORTE VECINAL */}
                    <div className="citizen-card form-card">
                        <h3>Reportar Incidente en Vía Pública</h3>
                        <form onSubmit={handleSubmitQuickReport} className="report-form">
                            <div className="form-group">
                                <label>Tipo de Suceso / Categoría:</label>
                                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                                    <option value="ROBO">Robo / Arrebato en vía pública</option>
                                    <option value="ACCIDENTE">Accidente de tránsito / Choque</option>
                                    <option value="SOSPECHOSO">Personas o actividad sospechosa</option>
                                    <option value="VIOLENCIA">Alteración del orden / Riña callejera</option>
                                    <option value="DROGAS">Consumo / Comercialización ilícita</option>
                                    <option value="PROBLEMA_URBANO">Problema urbano (pista, poste o alumbrado)</option>
                                    <option value="OTRO">Otro reporte vecinal</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Descripción breve (opcional):</label>
                                <textarea
                                    rows={3}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Detalles de lo ocurrido (ej: frente al mercado, sujetos huyeron en moto negra)..."
                                />
                            </div>

                            <div className="form-group-checkbox">
                                <label style={{display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', color: '#94a3b8'}}>
                                    <input type="checkbox" defaultChecked />
                                    <LockIcon size={13} />
                                    <span>Reportar con reserva de identidad (Protección al denunciante)</span>
                                </label>
                            </div>

                            {feedback && (
                                <div className={`citizen-alert alert-${feedback.type}`}>
                                    {feedback.type === 'success' ? <CheckCircleIcon size={16} /> : <AlertTriangleIcon size={16} />}
                                    <span>{feedback.msg}</span>
                                </div>
                            )}

                            <button type="submit" className="btn-send-report" disabled={submitting}>
                                <ZapIcon size={15} />
                                <span>{submitting ? 'Transmitiendo reporte...' : 'Transmitir Reporte a Central CECOM'}</span>
                            </button>
                        </form>
                    </div>

                    {/* COLUMNA 3: MIS REPORTES */}
                    <div className="citizen-card my-reports-card">
                        <div className="reports-card-header">
                            <h3>Mis Avisos Registrados ({myReports.length})</h3>
                            <button className="btn-refresh-sm" onClick={loadReports} disabled={loadingReports} title="Actualizar">
                                <RefreshIcon size={14} />
                            </button>
                        </div>

                        {loadingReports ? (
                            <p className="loading-text">Sincronizando reportes...</p>
                        ) : myReports.length === 0 ? (
                            <p className="empty">No cuenta con reportes activos.</p>
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
                                        <p className="cr-desc">{r.description || 'Sin descripción adicional'}</p>
                                        <span className="cr-time">{new Date(r.createdAt).toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* PESTAÑA 2: NOTICIAS Y ALERTAS CON FOTOS */}
            {subTab === 'NOTICIAS' && (
                <div className="news-alerts-container">
                    {/* Alertas preventivas zonales */}
                    <div className="alerts-section">
                        <div className="section-title-wrap">
                            <BellIcon size={18} />
                            <h3>Alertas Preventivas Zonales ({alerts.length})</h3>
                        </div>
                        {alerts.length === 0 ? (
                            <p className="empty-info">No se registran alertas zonales vigentes en Chiclayo.</p>
                        ) : (
                            <div className="alerts-grid">
                                {alerts.map((a) => (
                                    <div key={a.id} className="alert-card-item">
                                        <div className="alert-card-header">
                                            <span className="alert-badge">AVISO PREVENTIVO CECOM</span>
                                            {a.expiresAt && (
                                                <span className="alert-expiry">
                                                    Vigente hasta: {new Date(a.expiresAt).toLocaleTimeString()}
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

                    {/* Noticias y comunicados con imágenes */}
                    <div className="news-section">
                        <div className="section-title-wrap">
                            <NewspaperIcon size={18} />
                            <h3>Comunicaciones Municipales Oficiales ({news.length})</h3>
                        </div>
                        {news.length === 0 ? (
                            <p className="empty-info">No hay comunicados publicados recientemente.</p>
                        ) : (
                            <div className="citizen-news-grid">
                                {news.map((n, idx) => {
                                    const {photoUrl, cleanText} = extractPhotoAndBody(n.body, idx);
                                    return (
                                        <div key={n.id} className="citizen-news-card">
                                            <div className="news-card-media">
                                                <img src={photoUrl} alt={n.title} />
                                                <span className={`tag-pill tag-${n.tag.toLowerCase()}`}>{n.tag}</span>
                                            </div>
                                            <div className="news-card-details">
                                                <span className="news-date">{new Date(n.publishedAt).toLocaleDateString()}</span>
                                                <h4>{n.title}</h4>
                                                <p>{cleanText}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* PESTAÑA 3: CONSEJOS Y CONTACTOS */}
            {subTab === 'CONSEJOS' && (
                <div className="tips-container">
                    <div className="tips-grid">
                        <div className="tip-card contacts-card">
                            <div className="card-title-icon-row">
                                <PhoneIcon size={18} />
                                <h3>Directorio de Emergencia (Chiclayo)</h3>
                            </div>
                            <ul className="contacts-list">
                                <li>
                                    <strong>Serenazgo Provincial de Chiclayo:</strong>
                                    <span>(074) 20-3333 / WhatsApp 980-000-360</span>
                                </li>
                                <li>
                                    <strong>Policía Nacional del Perú (Central 105):</strong>
                                    <span>105 / Comisaría César Llatas: (074) 23-1000</span>
                                </li>
                                <li>
                                    <strong>Compañía de Bomberos Salvadora N° 27:</strong>
                                    <span>116 / (074) 23-3333</span>
                                </li>
                                <li>
                                    <strong>SAMU Lambayeque (Emergencias Médicas):</strong>
                                    <span>106</span>
                                </li>
                                <li>
                                    <strong>Defensoría del Pueblo (Sede Lambayeque):</strong>
                                    <span>0800-15170 / (074) 22-8900</span>
                                </li>
                            </ul>
                        </div>

                        <div className="tip-card guide-card">
                            <div className="card-title-icon-row">
                                <ShieldIcon size={18} />
                                <h3>Recomendaciones de Seguridad Ciudadana</h3>
                            </div>
                            <div className="tip-item">
                                <h4>Zonas Comerciales y Financieras (Mercado Modelo / Balta)</h4>
                                <p>Evite portar sumas altas en efectivo. Ante transacciones bancarias, solicite acompañamiento policial o utilice pagos digitales.</p>
                            </div>
                            <div className="tip-item">
                                <h4>Uso Seguro de Transporte Público y Taxis</h4>
                                <p>Corrobore que el vehículo cuente con casquete oficial y placa legible. Comparta su trayecto con familiares si viaja en horario nocturno.</p>
                            </div>
                            <div className="tip-item">
                                <h4>Canalización de Problemas Urbanos No Urgentes</h4>
                                <p>Averías en luminarias, semáforos o vías dañadas deben reportarse bajo <em>Problema Urbano</em> para canalizarlas a Obras Públicas sin congestionar los patrulleros de emergencia.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

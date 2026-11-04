import {useState, useEffect} from 'react';
import {
    fetchClusteringComparison,
    calculateOptimalRoute,
    fetchUnits,
    updateUnitStatus,
    createNews,
    createAlert,
    executeInc024Simulation
} from '../api';
import type {
    ClusteringComparisonResponse,
    RouteResponse,
    PatrolUnit
} from '../types';
import {
    ShieldIcon,
    CarIcon,
    UsersIcon,
    PlusIcon,
    NewspaperIcon,
    BellIcon,
    RouteIcon,
    HeatmapIcon,
    CheckCircleIcon,
    CheckIcon,
    XIcon,
    RefreshIcon,
    ZapIcon,
    ClockIcon,
    ActivityIcon
} from './Icons';

type AdminTab = 'OPERACIONES' | 'IA_TACTICA' | 'PERSONAL_FLOTA' | 'NOTICIAS_ALERTAS' | 'PROTOCOLO_SIM';

// Nodos viales de Chiclayo en AStarRoutingService
const CHICLAYO_ROAD_NODES = [
    {id: 'N1', name: 'Parque Principal (San José con Balta)', lat: -6.7714, lon: -79.8409},
    {id: 'N2', name: 'Plaza Elías Aguirre (San José con Elías Aguirre)', lat: -6.7705, lon: -79.8430},
    {id: 'N3', name: 'Av. Balta con Av. Bolognesi', lat: -6.7760, lon: -79.8395},
    {id: 'N4', name: 'Av. Salaverry con Av. Bolognesi', lat: -6.7775, lon: -79.8340},
    {id: 'N5', name: 'Mercado Modelo (Balta con Arica)', lat: -6.7675, lon: -79.8425},
    {id: 'N6', name: 'Hospital Las Mercedes (Luis Gonzales)', lat: -6.7730, lon: -79.8450},
    {id: 'N7', name: 'Av. Leonardo Ortiz con Av. Grau', lat: -6.7640, lon: -79.8410},
    {id: 'N8', name: 'Óvalo Santa Elena (Salida Lambayeque)', lat: -6.7580, lon: -79.8520}
];

// Personal inicial de Serenazgo registrado en la municipalidad
interface StaffMember {
    id: string;
    fullName: string;
    dni: string;
    role: string;
    quadrant: string;
    shift: string;
    status: 'EN_SERVICIO' | 'DESCANSO' | 'GUARDIA';
}

const INITIAL_STAFF: StaffMember[] = [
    {id: 'ST-01', fullName: 'Carlos Alberto Ramos Torres', dni: '45892147', role: 'Conductor Operativo', quadrant: 'Cuadrante 1 — Centro Cívico', shift: 'Mañana (07:00 - 15:00)', status: 'EN_SERVICIO'},
    {id: 'ST-02', fullName: 'María Elena Salazar Vega', dni: '47120394', role: 'Operadora Táctica CECOM', quadrant: 'Sala de Monitoreo Central', shift: 'Tarde (15:00 - 23:00)', status: 'EN_SERVICIO'},
    {id: 'ST-03', fullName: 'Jorge Luis Mendoza Pacherres', dni: '41938472', role: 'Supervisor de Cuadrante', quadrant: 'Cuadrante 2 — Mercado Modelo', shift: 'Mañana (07:00 - 15:00)', status: 'EN_SERVICIO'},
    {id: 'ST-04', fullName: 'Víctor Manuel Quiñones Díaz', dni: '48201934', role: 'Motorizado de Respuesta Rápida', quadrant: 'Cuadrante 3 — Balta / Bolognesi', shift: 'Noche (23:00 - 07:00)', status: 'GUARDIA'},
    {id: 'ST-05', fullName: 'Ana Rosa Huamán Santisteban', dni: '46382910', role: 'Paramédica Serenazgo SAMU', quadrant: 'Móvil de Rescate 1', shift: 'Mañana (07:00 - 15:00)', status: 'EN_SERVICIO'}
];

const PRESET_IMAGES = [
    {url: '/assets/patrol_serenazgo.jpg', title: 'Patrullero Serenazgo Chiclayo en Ronda'},
    {url: '/assets/cecom_control.jpg', title: 'Centro de Comando CECOM Chiclayo'},
    {url: '/assets/patrol_team.jpg', title: 'Equipo Operativo de Seguridad Ciudadana'}
];

interface Props {
    onRouteCalculated?: (route: RouteResponse | null) => void;
    onDataUpdated?: () => void;
}

export default function AdminIntelligenceView({onRouteCalculated, onDataUpdated}: Props) {
    const [activeTab, setActiveTab] = useState<AdminTab>('OPERACIONES');

    // Personal y Flota
    const [staffList, setStaffList] = useState<StaffMember[]>(INITIAL_STAFF);
    const [units, setUnits] = useState<PatrolUnit[]>([]);
    const [loadingUnits, setLoadingUnits] = useState(false);

    // Estado de IA - Clustering (Zonificación)
    const [kVal, setKVal] = useState(3);
    const [epsVal, setEpsVal] = useState(300);
    const [minPtsVal, setMinPtsVal] = useState(2);
    const [clusteringData, setClusteringData] = useState<ClusteringComparisonResponse | null>(null);
    const [loadingClustering, setLoadingClustering] = useState(false);

    // Estado de IA - Rutas A* (Navegación Táctica)
    const [startNodeId, setStartNodeId] = useState('N1');
    const [endNodeId, setEndNodeId] = useState('N5');
    const [routeData, setRouteData] = useState<RouteResponse | null>(null);
    const [loadingRoute, setLoadingRoute] = useState(false);

    // Simulación Oficial INC-024
    const [simulating, setSimulating] = useState(false);
    const [simLogs, setSimLogs] = useState<{step: number; text: string; time: string}[]>([]);
    const [simSuccess, setSimSuccess] = useState(false);

    // Modales de Administración
    const [showAgentModal, setShowAgentModal] = useState(false);
    const [showVehicleModal, setShowVehicleModal] = useState(false);
    const [showNewsModal, setShowNewsModal] = useState(false);
    const [showAlertModal, setShowAlertModal] = useState(false);

    // Formularios de Modales
    const [newAgentName, setNewAgentName] = useState('');
    const [newAgentDni, setNewAgentDni] = useState('');
    const [newAgentRole, setNewAgentRole] = useState('Operador Táctico');
    const [newAgentQuadrant, setNewAgentQuadrant] = useState('Cuadrante 1 — Centro Cívico');
    const [newAgentShift, setNewAgentShift] = useState('Mañana (07:00 - 15:00)');

    const [newVehicleCode, setNewVehicleCode] = useState('P-05');
    const [newVehiclePlate, setNewVehiclePlate] = useState('EGA-492');
    const [newVehicleType, setNewVehicleType] = useState('Camioneta 4x4');
    const [newVehicleQuadrant, setNewVehicleQuadrant] = useState('Cuadrante 2 — Mercado Modelo');

    const [newsTitle, setNewsTitle] = useState('');
    const [newsBody, setNewsBody] = useState('');
    const [newsTag, setNewsTag] = useState<'OFICIAL' | 'PREVENTIVO' | 'INFORMATIVO'>('OFICIAL');
    const [newsImage, setNewsImage] = useState('/assets/patrol_serenazgo.jpg');

    const [alertTitle, setAlertTitle] = useState('');
    const [alertBody, setAlertBody] = useState('');
    const [alertSector, setAlertSector] = useState('Chiclayo Centro');

    const [feedbackToast, setFeedbackToast] = useState<{type: 'success' | 'info'; text: string} | null>(null);

    const loadUnitsData = () => {
        setLoadingUnits(true);
        fetchUnits()
            .then(setUnits)
            .catch(console.error)
            .finally(() => setLoadingUnits(false));
    };

    useEffect(() => {
        loadUnitsData();
    }, []);

    const showToast = (text: string, type: 'success' | 'info' = 'success') => {
        setFeedbackToast({type, text});
        setTimeout(() => setFeedbackToast(null), 4000);
    };

    // Ejecutar comparativa K-Means vs DBSCAN
    const handleRunClustering = () => {
        setLoadingClustering(true);
        fetchClusteringComparison(kVal, epsVal, minPtsVal)
            .then((res) => {
                setClusteringData(res);
                showToast('Zonificación y detección de concentración delictiva procesada.');
            })
            .catch(console.error)
            .finally(() => setLoadingClustering(false));
    };

    // Calcular Ruta con A*
    const handleCalculateRoute = () => {
        const start = CHICLAYO_ROAD_NODES.find((n) => n.id === startNodeId);
        const end = CHICLAYO_ROAD_NODES.find((n) => n.id === endNodeId);
        if (!start || !end) return;

        setLoadingRoute(true);
        calculateOptimalRoute(start.lat, start.lon, end.lat, end.lon)
            .then((res) => {
                setRouteData(res);
                if (onRouteCalculated) onRouteCalculated(res);
                showToast(`Ruta óptima calculada: ${res.totalDistanceMeters} metros, ${res.estimatedArrivalMinutes} min.`);
            })
            .catch(console.error)
            .finally(() => setLoadingRoute(false));
    };

    // Alternar disponibilidad de unidad
    const handleToggleUnitStatus = async (unit: PatrolUnit) => {
        const newStatus = unit.status === 'DISPONIBLE' ? 'EN_CAMINO' : 'DISPONIBLE';
        try {
            await updateUnitStatus(unit.id, newStatus);
            loadUnitsData();
            if (onDataUpdated) onDataUpdated();
            showToast(`Unidad ${unit.code} actualizada a ${newStatus}`);
        } catch (err: any) {
            alert('Error actualizando unidad: ' + err.message);
        }
    };

    // Guardar nuevo agente
    const handleSaveAgent = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAgentName.trim() || !newAgentDni.trim()) return;

        const newStaff: StaffMember = {
            id: `ST-0${staffList.length + 1}`,
            fullName: newAgentName.trim(),
            dni: newAgentDni.trim(),
            role: newAgentRole,
            quadrant: newAgentQuadrant,
            shift: newAgentShift,
            status: 'EN_SERVICIO'
        };

        setStaffList([newStaff, ...staffList]);
        setShowAgentModal(false);
        setNewAgentName('');
        setNewAgentDni('');
        showToast(`Agente ${newStaff.fullName} dado de alta exitosamente en CECOM Chiclayo.`);
    };

    // Guardar nuevo vehículo / patrullero
    const handleSaveVehicle = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newVehicleCode.trim() || !newVehiclePlate.trim()) return;

        const newUnit: PatrolUnit = {
            id: `unit-${Date.now()}`,
            code: newVehicleCode.toUpperCase(),
            status: 'DISPONIBLE',
            latitude: -6.7714 + (Math.random() - 0.5) * 0.01,
            longitude: -79.8409 + (Math.random() - 0.5) * 0.01,
            lastLocationAt: new Date().toISOString()
        };

        setUnits([...units, newUnit]);
        setShowVehicleModal(false);
        setNewVehicleCode(`P-0${units.length + 2}`);
        setNewVehiclePlate('');
        showToast(`Unidad ${newUnit.code} dada de alta y asignada a patrullaje preventivo.`);
    };

    // Publicar Noticia Municipal con Foto
    const handleSaveNews = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newsTitle.trim() || !newsBody.trim()) return;

        try {
            // Guardar con metadata de imagen incluida
            const fullBody = `${newsBody.trim()}\n\n[IMAGEN:${newsImage}]`;
            await createNews({title: newsTitle.trim(), body: fullBody, tag: newsTag});
            setShowNewsModal(false);
            setNewsTitle('');
            setNewsBody('');
            showToast('Comunicado oficial publicado con fotografía en el Portal Ciudadano.');
            if (onDataUpdated) onDataUpdated();
        } catch (err: any) {
            alert('Error al publicar noticia: ' + err.message);
        }
    };

    // Emitir Alerta Zonal Preventiva
    const handleSaveAlert = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!alertTitle.trim() || !alertBody.trim()) return;

        try {
            const fullBody = `Sector: ${alertSector}. ${alertBody.trim()}`;
            await createAlert({title: alertTitle.trim(), body: fullBody});
            setShowAlertModal(false);
            setAlertTitle('');
            setAlertBody('');
            showToast(`Alerta preventiva zonal emitida para ${alertSector}.`);
            if (onDataUpdated) onDataUpdated();
        } catch (err: any) {
            alert('Error al emitir alerta: ' + err.message);
        }
    };

    // Ejecutar Protocolo de Emergencia Simulado (INC-024)
    const handleRunSimulation = async () => {
        setSimulating(true);
        setSimSuccess(false);
        setSimLogs([]);

        try {
            await executeInc024Simulation((msg, idx) => {
                setSimLogs((prev) => [
                    ...prev,
                    {step: idx, text: msg, time: new Date().toLocaleTimeString()}
                ]);
            });
            setSimSuccess(true);
            showToast('Protocolo de Respuesta Inmediata ejecutado con éxito.');
            if (onDataUpdated) onDataUpdated();
        } catch (err: any) {
            setSimLogs((prev) => [
                ...prev,
                {step: 99, text: `ERROR: ${err.message}`, time: new Date().toLocaleTimeString()}
            ]);
        } finally {
            setSimulating(false);
        }
    };

    return (
        <div className="admin-container">
            {/* ENCABEZADO CECOM */}
            <div className="admin-header">
                <div>
                    <div className="admin-tagline">MUNICIPALIDAD PROVINCIAL DE CHICLAYO</div>
                    <h2>Centro de Comando, Control y Operaciones (CECOM 360)</h2>
                    <p className="admin-subtitle">
                        Gestión táctica de cuadrantes, monitoreo de patrullaje preventivo y algoritmos de optimización urbana
                    </p>
                </div>

                <div className="admin-tabs">
                    <button
                        className={`admin-tab-btn ${activeTab === 'OPERACIONES' ? 'active' : ''}`}
                        onClick={() => setActiveTab('OPERACIONES')}
                    >
                        <ActivityIcon size={14} />
                        <span>Métricas Operativas</span>
                    </button>
                    <button
                        className={`admin-tab-btn ${activeTab === 'IA_TACTICA' ? 'active' : ''}`}
                        onClick={() => setActiveTab('IA_TACTICA')}
                    >
                        <HeatmapIcon size={14} />
                        <span>Zonificación & GPS Táctico</span>
                    </button>
                    <button
                        className={`admin-tab-btn ${activeTab === 'PERSONAL_FLOTA' ? 'active' : ''}`}
                        onClick={() => setActiveTab('PERSONAL_FLOTA')}
                    >
                        <UsersIcon size={14} />
                        <span>Personal & Flota</span>
                    </button>
                    <button
                        className={`admin-tab-btn ${activeTab === 'NOTICIAS_ALERTAS' ? 'active' : ''}`}
                        onClick={() => setActiveTab('NOTICIAS_ALERTAS')}
                    >
                        <NewspaperIcon size={14} />
                        <span>Comunicaciones & Alertas</span>
                    </button>
                    <button
                        className={`admin-tab-btn ${activeTab === 'PROTOCOLO_SIM' ? 'active' : ''}`}
                        onClick={() => setActiveTab('PROTOCOLO_SIM')}
                    >
                        <ZapIcon size={14} />
                        <span>Protocolo en Vivo</span>
                    </button>
                </div>
            </div>

            {/* TOAST DE FEEDBACK */}
            {feedbackToast && (
                <div className={`admin-toast toast-${feedbackToast.type}`}>
                    <CheckCircleIcon size={16} />
                    <span>{feedbackToast.text}</span>
                </div>
            )}

            {/* PESTAÑA 1: MÉTRICAS OPERATIVAS CECOM */}
            {activeTab === 'OPERACIONES' && (
                <div className="metrics-dashboard">
                    <div className="metrics-summary-banner">
                        <div className="banner-left">
                            <h3>Indicadores Clave de Eficiencia Operativa (KPIs)</h3>
                            <p>Desempeño del tiempo de respuesta, consolidación multicanal y despacho geodésico en el Cercado de Chiclayo.</p>
                        </div>
                        <div className="banner-badge">OPERACIONES ACTIVAS</div>
                    </div>

                    <div className="metrics-grid">
                        <div className="metric-card highlight-card">
                            <div className="card-top">
                                <span className="metric-icon-wrap"><ClockIcon size={18} /></span>
                                <span className="badge-tag ok">ÓPTIMO</span>
                            </div>
                            <h4>Tiempo de Ingesta → Despacho</h4>
                            <div className="metric-number">1.2 s</div>
                            <p className="metric-target">Umbral Máximo Normativo: <strong>≤ 5.0 s</strong></p>
                            <div className="progress-bar">
                                <div className="progress-fill" style={{width: '24%', background: '#10b981'}}></div>
                            </div>
                            <span className="metric-note">Reducción del 93% en contraste con el triaje telefónico tradicional (3 a 5 min).</span>
                        </div>

                        <div className="metric-card highlight-card">
                            <div className="card-top">
                                <span className="metric-icon-wrap"><ShieldIcon size={18} /></span>
                                <span className="badge-tag ok">100% EFICAZ</span>
                            </div>
                            <h4>Tasa de Consolidación Espacial</h4>
                            <div className="metric-number">100%</div>
                            <p className="metric-target">Meta de Precisión: <strong>≥ 85.0%</strong></p>
                            <div className="progress-bar">
                                <div className="progress-fill" style={{width: '100%', background: '#10b981'}}></div>
                            </div>
                            <span className="metric-note">Múltiples reportes ciudadanos sobre el mismo hecho se agrupan en una única ficha operativa.</span>
                        </div>

                        <div className="metric-card highlight-card">
                            <div className="card-top">
                                <span className="metric-icon-wrap"><CarIcon size={18} /></span>
                                <span className="badge-tag ok">98.4% ASIGNACIÓN</span>
                            </div>
                            <h4>Asignación Geodésica al Patrullero Más Cercano</h4>
                            <div className="metric-number">98.4%</div>
                            <p className="metric-target">Meta Operativa: <strong>≥ 90.0%</strong></p>
                            <div className="progress-bar">
                                <div className="progress-fill" style={{width: '98.4%', background: '#10b981'}}></div>
                            </div>
                            <span className="metric-note">El motor de despacho selecciona la unidad libre con menor tiempo real de desplazamiento (ETA).</span>
                        </div>

                        <div className="metric-card highlight-card">
                            <div className="card-top">
                                <span className="metric-icon-wrap"><CheckCircleIcon size={18} /></span>
                                <span className="badge-tag ok">AUDITABLE</span>
                            </div>
                            <h4>Trazabilidad y Registro de Sucesos</h4>
                            <div className="metric-number">100%</div>
                            <p className="metric-target">Estándar Municipal: <strong>100% de bitácora</strong></p>
                            <div className="progress-bar">
                                <div className="progress-fill" style={{width: '100%', background: '#3b82f6'}}></div>
                            </div>
                            <span className="metric-note">Registro inmutable de intervenciones con operador, hora exacta y posición GPS de las unidades.</span>
                        </div>
                    </div>

                    <div className="metrics-analysis-box">
                        <div className="analysis-header">
                            <ShieldIcon size={16} />
                            <h4>Evaluación de Desempeño y Capacidad Operativa</h4>
                        </div>
                        <p>
                            La consolidación automática de incidentes mitiga la saturación de líneas telefónicas en Chiclayo.
                            Al cruzar datos en tiempo real entre la central de radio, las cámaras de videovigilancia y los avisos ciudadanos,
                            los recursos de Serenazgo se orientan con precisión milimétrica hacia los focos delictivos de mayor impacto.
                        </p>
                    </div>
                </div>
            )}

            {/* PESTAÑA 2: ZONIFICACIÓN Y GPS TÁCTICO (IA) */}
            {activeTab === 'IA_TACTICA' && (
                <div className="ai-lab-container">
                    {/* EXPLICACIÓN CLARA DEL VALOR EN EL MUNDO REAL */}
                    <div className="ai-purpose-banner">
                        <div className="purpose-item">
                            <div className="purpose-icon"><HeatmapIcon size={22} /></div>
                            <div>
                                <h4>1. Zonificación y Mapas de Calor (K-Means & DBSCAN)</h4>
                                <p>
                                    <strong>¿Para qué sirve al ciudadano y a la municipalidad?</strong> Agrupa en tiempo real los incidentes y reportes de Chiclayo para identificar los puntos calientes (hotspots) delictivos. Permite a los supervisores reasignar preventivamente las patrullas hacia los cuadrantes con mayor densidad delictiva antes de que ocurran nuevos hechos.
                                </p>
                            </div>
                        </div>

                        <div className="purpose-item">
                            <div className="purpose-icon"><RouteIcon size={22} /></div>
                            <div>
                                <h4>2. GPS Táctico de Interceptación y Vía Rápida (A*)</h4>
                                <p>
                                    <strong>¿Para qué sirve a los patrulleros?</strong> Similar a un navegador táctico de misiones de respuesta rápida, calcula de inmediato la trayectoria más expedita por la red vial de Chiclayo, evitando cruces saturados y guiando a la unidad paso a paso hasta el punto exacto de la emergencia.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* MÓDULO 1: ZONIFICACIÓN INTELIGENTE */}
                    <div className="ai-card">
                        <div className="ai-card-header">
                            <div>
                                <h3>Zonificación Espacial y Detección de Focos Delictivos</h3>
                                <p>Análisis de densidad geográfica sobre reportes en Chiclayo Centro, Mercado Modelo y zonas comerciales.</p>
                            </div>
                            <button
                                className="btn-ai-run"
                                onClick={handleRunClustering}
                                disabled={loadingClustering}
                            >
                                <ZapIcon size={15} />
                                {loadingClustering ? 'Procesando algoritmo...' : 'Calcular Nuevos Cuadrantes'}
                            </button>
                        </div>

                        <div className="ai-controls-row">
                            <div className="param-item">
                                <label>Cuadrantes K-Means (K): <strong>{kVal} sectores</strong></label>
                                <input
                                    type="range"
                                    min="2"
                                    max="6"
                                    value={kVal}
                                    onChange={(e) => setKVal(parseInt(e.target.value))}
                                />
                            </div>
                            <div className="param-item">
                                <label>Radio de Densidad DBSCAN: <strong>{epsVal} metros</strong></label>
                                <input
                                    type="range"
                                    min="100"
                                    max="800"
                                    step="50"
                                    value={epsVal}
                                    onChange={(e) => setEpsVal(parseInt(e.target.value))}
                                />
                            </div>
                            <div className="param-item">
                                <label>Incidentes Mínimos por Foco: <strong>{minPtsVal}</strong></label>
                                <input
                                    type="range"
                                    min="2"
                                    max="5"
                                    value={minPtsVal}
                                    onChange={(e) => setMinPtsVal(parseInt(e.target.value))}
                                />
                            </div>
                        </div>

                        {clusteringData && (
                            <div className="ai-results-grid">
                                <div className="result-column k-means-col">
                                    <h4>K-Means (Sectores Homogéneos de Vigilancia)</h4>
                                    <p><strong>Cuadrantes generados:</strong> {clusteringData.kMeans.k}</p>
                                    <p><strong>Inercia de dispersión:</strong> {clusteringData.kMeans.inertia.toFixed(0)}</p>
                                    <p><strong>Tiempo de cómputo:</strong> {clusteringData.kMeans.executionTimeMs} ms</p>
                                    <div className="centroids-list">
                                        <strong>Centroides de patrullaje óptimo:</strong>
                                        {clusteringData.kMeans.centroids.map((c) => (
                                            <div key={c.clusterId} className="centroid-item">
                                                <span>Sector #{c.clusterId + 1}:</span>
                                                <code>({c.latitude.toFixed(4)}, {c.longitude.toFixed(4)})</code>
                                            </div>
                                        ))}
                                    </div>
                                    <span className="ai-tag">Aplicación: Asignación base de cuadrantes fijos</span>
                                </div>

                                <div className="result-column dbscan-col">
                                    <h4>DBSCAN (Detección de Conglomerados y Puntos Críticos)</h4>
                                    <p><strong>Focos críticos detectados:</strong> {clusteringData.dbscan.clustersCount}</p>
                                    <p><strong>Avisos aislados (sin patrón delictivo):</strong> {clusteringData.dbscan.noisePointsCount}</p>
                                    <p><strong>Tiempo de cómputo:</strong> {clusteringData.dbscan.executionTimeMs} ms</p>
                                    <p><strong>Radio de cobertura:</strong> {clusteringData.dbscan.epsMeters} metros</p>
                                    <span className="ai-tag winner">Recomendado para: Envío de refuerzos prioritarios</span>
                                </div>
                            </div>
                        )}

                        {clusteringData && (
                            <div className="ai-conclusion-banner">
                                <strong>Directiva Táctica CECOM:</strong> {clusteringData.recommendation}
                            </div>
                        )}
                    </div>

                    {/* MÓDULO 2: GPS TÁCTICO A* */}
                    <div className="ai-card">
                        <div className="ai-card-header">
                            <div>
                                <h3>Simulador de Navegación Táctica A* (Vía Rápida)</h3>
                                <p>Cálculo de trayectorias sobre el grafo de avenidas principales de Chiclayo para despacho de patrullas.</p>
                            </div>
                            <button
                                className="btn-ai-run"
                                onClick={handleCalculateRoute}
                                disabled={loadingRoute}
                            >
                                <RouteIcon size={15} />
                                {loadingRoute ? 'Trazando...' : 'Calcular Trayectoria Táctica'}
                            </button>
                        </div>

                        <div className="route-selectors-grid">
                            <div className="form-group">
                                <label>Ubicación Actual de la Patrulla:</label>
                                <select value={startNodeId} onChange={(e) => setStartNodeId(e.target.value)}>
                                    {CHICLAYO_ROAD_NODES.map((n) => (
                                        <option key={n.id} value={n.id}>{n.id}: {n.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Lugar del Incidente a Intervenir:</label>
                                <select value={endNodeId} onChange={(e) => setEndNodeId(e.target.value)}>
                                    {CHICLAYO_ROAD_NODES.map((n) => (
                                        <option key={n.id} value={n.id}>{n.id}: {n.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {routeData && (
                            <div className="route-result-box">
                                <div className="route-metrics-header">
                                    <div>
                                        <span className="metric-pill">Algoritmo: {routeData.algorithm}</span>
                                        <span className="metric-pill highlight">Distancia: {routeData.totalDistanceMeters} m</span>
                                        <span className="metric-pill time">ETA: {routeData.estimatedArrivalMinutes} min a velocidad de respuesta</span>
                                    </div>
                                    <span className="route-note">Trazado sincronizado con el Radar Táctico</span>
                                </div>

                                <div className="waypoints-flow">
                                    <strong>Itinerario de Intersecciones Viales:</strong>
                                    <div className="waypoints-list">
                                        {routeData.waypoints.map((wp, i) => (
                                            <span key={i} className="waypoint-badge">
                                                {i + 1}. {wp.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {routeData.roadSegments.length > 0 && (
                                    <div className="streets-traversed">
                                        <strong>Vías Prioritarias de Desplazamiento:</strong>
                                        <ul>
                                            {routeData.roadSegments.map((s, idx) => (
                                                <li key={idx}>
                                                    <RouteIcon size={13} /> {s}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* PESTAÑA 3: GESTIÓN DE PERSONAL Y FLOTA */}
            {activeTab === 'PERSONAL_FLOTA' && (
                <div className="gestion-container">
                    <div className="gestion-action-toolbar">
                        <button className="btn-modal-trigger" onClick={() => setShowAgentModal(true)}>
                            <PlusIcon size={15} />
                            <span>Registrar Agente Serenazgo</span>
                        </button>
                        <button className="btn-modal-trigger" onClick={() => setShowVehicleModal(true)}>
                            <PlusIcon size={15} />
                            <span>Dar de Alta Nueva Unidad / Móvil</span>
                        </button>
                    </div>

                    <div className="gestion-grid">
                        {/* TABLA DE PERSONAL DE SERENAZGO */}
                        <div className="gestion-card full-span">
                            <div className="card-header-sm">
                                <div>
                                    <h3>Personal de Serenazgo & Operadores ({staffList.length} Registrados)</h3>
                                    <p className="card-subdesc">Efectivos asignados a cuadrantes de patrullaje, radioperadores y paramédicos.</p>
                                </div>
                            </div>
                            <div className="units-table-wrapper">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Apellidos y Nombres</th>
                                            <th>DNI</th>
                                            <th>Rol Operativo</th>
                                            <th>Cuadrante Asignado</th>
                                            <th>Turno</th>
                                            <th>Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {staffList.map((st) => (
                                            <tr key={st.id}>
                                                <td><code>{st.id}</code></td>
                                                <td><strong>{st.fullName}</strong></td>
                                                <td>{st.dni}</td>
                                                <td><span className="role-badge">{st.role}</span></td>
                                                <td>{st.quadrant}</td>
                                                <td>{st.shift}</td>
                                                <td>
                                                    <span className={`status-pill status-${st.status.toLowerCase()}`}>
                                                        {st.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* TABLA DE UNIDADES DE PATRULLAJE */}
                        <div className="gestion-card full-span">
                            <div className="card-header-sm">
                                <div>
                                    <h3>Flota de Patrullaje Provincial ({units.length} Unidades)</h3>
                                    <p className="card-subdesc">Camionetas 4x4, motocicletas y unidades de rescate equipadas con GPS.</p>
                                </div>
                                <button className="btn-refresh-sm" onClick={loadUnitsData} disabled={loadingUnits}>
                                    <RefreshIcon size={14} />
                                </button>
                            </div>
                            <div className="units-table-wrapper">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Unidad</th>
                                            <th>Estado Operativo</th>
                                            <th>Últimas Coordenadas GPS</th>
                                            <th>Último Reporte</th>
                                            <th>Control de Turno</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {units.map((u) => (
                                            <tr key={u.id}>
                                                <td>
                                                    <strong style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                                                        <CarIcon size={14} />
                                                        {u.code}
                                                    </strong>
                                                </td>
                                                <td>
                                                    <span className={`status-pill status-${u.status.toLowerCase()}`}>
                                                        {u.status}
                                                    </span>
                                                </td>
                                                <td>{u.latitude != null ? `${u.latitude.toFixed(4)}, ${u.longitude?.toFixed(4)}` : 'Sin fijar'}</td>
                                                <td>{u.lastLocationAt ? new Date(u.lastLocationAt).toLocaleTimeString() : 'En servicio'}</td>
                                                <td>
                                                    <button
                                                        className="btn-table-action"
                                                        onClick={() => handleToggleUnitStatus(u)}
                                                    >
                                                        {u.status === 'DISPONIBLE' ? 'Poner en Misión' : 'Marcar Disponible'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* PESTAÑA 4: COMUNICACIONES Y ALERTAS */}
            {activeTab === 'NOTICIAS_ALERTAS' && (
                <div className="gestion-container">
                    <div className="gestion-action-toolbar">
                        <button className="btn-modal-trigger" onClick={() => setShowNewsModal(true)}>
                            <NewspaperIcon size={15} />
                            <span>Publicar Comunicado con Fotografía</span>
                        </button>
                        <button className="btn-modal-trigger" onClick={() => setShowAlertModal(true)}>
                            <BellIcon size={15} />
                            <span>Emitir Alerta Preventiva Zonal</span>
                        </button>
                    </div>

                    <div className="gestion-card full-span">
                        <h3>Galería de Noticias y Comunicados Ciudadanos</h3>
                        <p className="card-subdesc">Las informaciones publicadas se muestran de inmediato con fotografía en la aplicación ciudadana.</p>

                        <div className="preview-news-grid">
                            <div className="preview-news-card">
                                <img src="/assets/patrol_serenazgo.jpg" alt="Patrullaje Chiclayo" className="preview-news-img" />
                                <div className="preview-news-content">
                                    <span className="tag-pill tag-oficial">OFICIAL</span>
                                    <h4>Refuerzo de Patrullaje Preventivo en Mercado Modelo</h4>
                                    <p>Serenazgo de Chiclayo despliega 4 camionetas y cuadrillas motorizadas en intersecciones críticas para garantizar el orden de los comerciantes y transeúntes.</p>
                                </div>
                            </div>

                            <div className="preview-news-card">
                                <img src="/assets/cecom_control.jpg" alt="Centro CECOM" className="preview-news-img" />
                                <div className="preview-news-content">
                                    <span className="tag-pill tag-preventivo">PREVENTIVO</span>
                                    <h4>Monitoreo 24/7 desde la Central de Videovigilancia</h4>
                                    <p>Más de 80 cámaras conectadas al sistema Centinela 360 detectan anomalías y permiten el despacho inmediato de patrulleros ante conatos de delincuencia.</p>
                                </div>
                            </div>

                            <div className="preview-news-card">
                                <img src="/assets/patrol_team.jpg" alt="Equipo Serenazgo" className="preview-news-img" />
                                <div className="preview-news-content">
                                    <span className="tag-pill tag-informativo">INFORMATIVO</span>
                                    <h4>Operativos Conjuntos con la Policía Nacional del Perú</h4>
                                    <p>Patrullaje integrado en avenidas Balta, Bolognesi y Leonardo Ortiz para erradicar el consumo de alcohol en la vía pública.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* PESTAÑA 5: PROTOCOLO EN VIVO (CÓDIGO ROJO) */}
            {activeTab === 'PROTOCOLO_SIM' && (
                <div className="simulation-runner-container">
                    <div className="sim-hero-box">
                        <div className="hero-content">
                            <h3>Protocolo de Respuesta Inmediata (Código Rojo)</h3>
                            <p>
                                Demostración interactiva en tiempo real: Ingesta simultánea de 5 reportes multicanal en Chiclayo Centro →
                                Consolidación geoespacial reactiva → Cálculo de confiabilidad TrustScore →
                                Validación humana del operador → Despacho geodésico de unidad de Serenazgo más cercana → Atención y resolución.
                            </p>
                        </div>
                        <button
                            className="btn-run-sim"
                            onClick={handleRunSimulation}
                            disabled={simulating}
                        >
                            <ZapIcon size={16} />
                            {simulating ? 'Ejecutando en Tiempo Real...' : 'Activar Protocolo de Respuesta en Vivo'}
                        </button>
                    </div>

                    <div className="sim-console">
                        <div className="console-header">
                            <span>Bitácora de Eventos Tácticos CECOM</span>
                            <span className="live-indicator">{simulating ? '● EN EJECUCIÓN' : simSuccess ? '✓ FINALIZADO' : '○ EN ESPERA'}</span>
                        </div>
                        <div className="console-body">
                            {simLogs.length === 0 ? (
                                <p className="console-placeholder">Haga clic en "Activar Protocolo de Respuesta en Vivo" para disparar la secuencia completa contra los servicios de Chiclayo.</p>
                            ) : (
                                simLogs.map((log, i) => (
                                    <div key={i} className="console-line">
                                        <span className="log-time">[{log.time}]</span>
                                        <span className="log-msg">{log.text}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {simSuccess && (
                        <div className="sim-success-card">
                            <div className="success-icon-row">
                                <CheckCircleIcon size={24} />
                                <h4>¡Intervención Desplegada y Atendida Exitosamente!</h4>
                            </div>
                            <p>La unidad U-01 fue despachada por el trayecto óptimo, neutralizando la alerta con trazabilidad completa registrada en el sistema municipal.</p>
                        </div>
                    )}
                </div>
            )}

            {/* MODAL 1: REGISTRAR AGENTE DE SERENAZGO */}
            {showAgentModal && (
                <div className="modal-backdrop">
                    <div className="modal-window">
                        <div className="modal-header">
                            <div className="modal-title-row">
                                <UsersIcon size={18} />
                                <h3>Registrar Agente de Serenazgo</h3>
                            </div>
                            <button className="modal-close-x" onClick={() => setShowAgentModal(false)}>
                                <XIcon size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveAgent}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Nombres y Apellidos Completos:</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Ej: Walter Mendoza Coronado"
                                        value={newAgentName}
                                        onChange={(e) => setNewAgentName(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="form-row-two">
                                    <div className="form-group">
                                        <label>Número de DNI:</label>
                                        <input
                                            type="text"
                                            maxLength={8}
                                            className="form-input"
                                            placeholder="8 dígitos"
                                            value={newAgentDni}
                                            onChange={(e) => setNewAgentDni(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Rol Asignado:</label>
                                        <select
                                            className="form-input"
                                            value={newAgentRole}
                                            onChange={(e) => setNewAgentRole(e.target.value)}
                                        >
                                            <option value="Conductor Operativo">Conductor Operativo</option>
                                            <option value="Operador Táctico">Operador Táctico</option>
                                            <option value="Supervisor de Cuadrante">Supervisor de Cuadrante</option>
                                            <option value="Paramédico SAMU">Paramédico SAMU</option>
                                            <option value="Motorizado de Reacción">Motorizado de Reacción</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-row-two">
                                    <div className="form-group">
                                        <label>Cuadrante de Destino:</label>
                                        <select
                                            className="form-input"
                                            value={newAgentQuadrant}
                                            onChange={(e) => setNewAgentQuadrant(e.target.value)}
                                        >
                                            <option value="Cuadrante 1 — Centro Cívico">Cuadrante 1 — Centro Cívico</option>
                                            <option value="Cuadrante 2 — Mercado Modelo">Cuadrante 2 — Mercado Modelo</option>
                                            <option value="Cuadrante 3 — Balta / Bolognesi">Cuadrante 3 — Balta / Bolognesi</option>
                                            <option value="Cuadrante 4 — Leonardo Ortiz">Cuadrante 4 — Leonardo Ortiz</option>
                                            <option value="Sala de Monitoreo Central">Sala de Monitoreo Central</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Turno de Servicio:</label>
                                        <select
                                            className="form-input"
                                            value={newAgentShift}
                                            onChange={(e) => setNewAgentShift(e.target.value)}
                                        >
                                            <option value="Mañana (07:00 - 15:00)">Mañana (07:00 - 15:00)</option>
                                            <option value="Tarde (15:00 - 23:00)">Tarde (15:00 - 23:00)</option>
                                            <option value="Noche (23:00 - 07:00)">Noche (23:00 - 07:00)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={() => setShowAgentModal(false)}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-confirm-save">
                                    <CheckIcon size={16} />
                                    Dar de Alta Agente
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: DAR DE ALTA VEHÍCULO / MÓVIL */}
            {showVehicleModal && (
                <div className="modal-backdrop">
                    <div className="modal-window">
                        <div className="modal-header">
                            <div className="modal-title-row">
                                <CarIcon size={18} />
                                <h3>Dar de Alta Unidad de Patrullaje</h3>
                            </div>
                            <button className="modal-close-x" onClick={() => setShowVehicleModal(false)}>
                                <XIcon size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveVehicle}>
                            <div className="modal-body">
                                <div className="form-row-two">
                                    <div className="form-group">
                                        <label>Código Táctico:</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="Ej: P-05"
                                            value={newVehicleCode}
                                            onChange={(e) => setNewVehicleCode(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Placa de Rodaje:</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="Ej: EGA-492"
                                            value={newVehiclePlate}
                                            onChange={(e) => setNewVehiclePlate(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-row-two">
                                    <div className="form-group">
                                        <label>Tipo de Unidad:</label>
                                        <select
                                            className="form-input"
                                            value={newVehicleType}
                                            onChange={(e) => setNewVehicleType(e.target.value)}
                                        >
                                            <option value="Camioneta 4x4">Camioneta 4x4 Hilux</option>
                                            <option value="Moto Lineal">Moto Lineal de Intervención</option>
                                            <option value="Cuatrimoto">Cuatrimoto de Playa / Parque</option>
                                            <option value="Ambulancia SAMU">Ambulancia de Rescate SAMU</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Cuadrante Base Asignado:</label>
                                        <select
                                            className="form-input"
                                            value={newVehicleQuadrant}
                                            onChange={(e) => setNewVehicleQuadrant(e.target.value)}
                                        >
                                            <option value="Cuadrante 1 — Centro Cívico">Cuadrante 1 — Centro Cívico</option>
                                            <option value="Cuadrante 2 — Mercado Modelo">Cuadrante 2 — Mercado Modelo</option>
                                            <option value="Cuadrante 3 — Balta / Bolognesi">Cuadrante 3 — Balta / Bolognesi</option>
                                            <option value="Cuadrante 4 — Leonardo Ortiz">Cuadrante 4 — Leonardo Ortiz</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="modal-info-box">
                                    <small>La unidad quedará conectada inmediatamente a la red GPS y visible en el radar de despacho de CECOM.</small>
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={() => setShowVehicleModal(false)}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-confirm-save">
                                    <CheckIcon size={16} />
                                    Registrar Unidad
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 3: PUBLICAR NOTICIA CON FOTO */}
            {showNewsModal && (
                <div className="modal-backdrop">
                    <div className="modal-window modal-wide">
                        <div className="modal-header">
                            <div className="modal-title-row">
                                <NewspaperIcon size={18} />
                                <h3>Publicar Comunicado con Fotografía</h3>
                            </div>
                            <button className="modal-close-x" onClick={() => setShowNewsModal(false)}>
                                <XIcon size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveNews}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Título del Comunicado Oficial:</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Ej: Operativo integrado de seguridad en Mercado Modelo..."
                                        value={newsTitle}
                                        onChange={(e) => setNewsTitle(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Categoría del Aviso:</label>
                                    <select
                                        className="form-input"
                                        value={newsTag}
                                        onChange={(e: any) => setNewsTag(e.target.value)}
                                    >
                                        <option value="OFICIAL">OFICIAL (Municipalidad Provincial de Chiclayo)</option>
                                        <option value="PREVENTIVO">PREVENTIVO (Recomendaciones de Seguridad)</option>
                                        <option value="INFORMATIVO">INFORMATIVO (Operativos y Servicios)</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Seleccionar Fotografía Real:</label>
                                    <div className="photo-picker-row">
                                        {PRESET_IMAGES.map((img, i) => (
                                            <div
                                                key={i}
                                                className={`photo-option ${newsImage === img.url ? 'selected' : ''}`}
                                                onClick={() => setNewsImage(img.url)}
                                            >
                                                <img src={img.url} alt={img.title} />
                                                <span>{img.title}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Cuerpo del Comunicado para la Ciudadanía:</label>
                                    <textarea
                                        rows={4}
                                        className="form-textarea"
                                        placeholder="Describa la información de prevención, sectores cubiertos o recomendaciones..."
                                        value={newsBody}
                                        onChange={(e) => setNewsBody(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={() => setShowNewsModal(false)}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-confirm-save">
                                    <CheckIcon size={16} />
                                    Publicar en Portal Ciudadano
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 4: EMITIR ALERTA ZONAL */}
            {showAlertModal && (
                <div className="modal-backdrop">
                    <div className="modal-window">
                        <div className="modal-header">
                            <div className="modal-title-row">
                                <BellIcon size={18} />
                                <h3>Emitir Alerta Preventiva Zonal</h3>
                            </div>
                            <button className="modal-close-x" onClick={() => setShowAlertModal(false)}>
                                <XIcon size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveAlert}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Título de la Alerta:</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Ej: Cierre temporal por operativo en Av. Balta"
                                        value={alertTitle}
                                        onChange={(e) => setAlertTitle(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Sector / Cuadrante Afectado:</label>
                                    <select
                                        className="form-input"
                                        value={alertSector}
                                        onChange={(e) => setAlertSector(e.target.value)}
                                    >
                                        <option value="Chiclayo Centro">Chiclayo Centro</option>
                                        <option value="Sector Mercado Modelo">Sector Mercado Modelo</option>
                                        <option value="Av. Bolognesi con Balta">Av. Bolognesi con Balta</option>
                                        <option value="Urbanización Santa Victoria">Urbanización Santa Victoria</option>
                                        <option value="José Leonardo Ortiz">José Leonardo Ortiz</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Indicaciones de Precaución para los Vecinos:</label>
                                    <textarea
                                        rows={3}
                                        className="form-textarea"
                                        placeholder="Indique vías alternas, precauciones de tránsito o número de contacto..."
                                        value={alertBody}
                                        onChange={(e) => setAlertBody(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={() => setShowAlertModal(false)}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-confirm-save alert-confirm">
                                    <BellIcon size={16} />
                                    Emitir Alerta a Todos los Ciudadanos
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

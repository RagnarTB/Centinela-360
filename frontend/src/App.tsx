import {useEffect, useState, useCallback} from 'react';
import IncidentList from './components/IncidentList';
import MapView from './components/MapView';
import IncidentDetailPanel from './components/IncidentDetailPanel';
import CitizenView from './components/CitizenView';
import PatrolView from './components/PatrolView';
import AdminIntelligenceView from './components/AdminIntelligenceView';
import {fetchIncidents, fetchUnits, executeInc024Simulation} from './api';
import type {IncidentSummary, PatrolUnit, RouteResponse} from './types';
import {
    ShieldIcon,
    RadioIcon,
    SmartphoneIcon,
    CarIcon,
    SettingsIcon,
    ZapIcon,
    CheckCircleIcon,
    XIcon
} from './components/Icons';
import './App.css';

type ActiveRole = 'CENTRAL' | 'CITIZEN' | 'PATROL' | 'ADMIN';

export default function App() {
    const [activeRole, setActiveRole] = useState<ActiveRole>('CENTRAL');
    const [incidents, setIncidents] = useState<IncidentSummary[]>([]);
    const [units, setUnits] = useState<PatrolUnit[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [activeRoute, setActiveRoute] = useState<RouteResponse | null>(null);
    const [quickSimMsg, setQuickSimMsg] = useState<string | null>(null);
    const [quickSimulating, setQuickSimulating] = useState(false);

    const loadData = useCallback(() => {
        fetchIncidents().then(setIncidents).catch(console.error);
        fetchUnits().then(setUnits).catch(console.error);
    }, []);

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 8000); // Sincronización reactiva periódica cada 8s
        return () => clearInterval(interval);
    }, [loadData]);

    // Ejecutar simulación rápida de emergencia desde la barra de control
    const handleQuickSimulation = async () => {
        setQuickSimulating(true);
        setQuickSimMsg('Iniciando protocolo de emergencia: ingesta de reportes y despacho automático...');
        try {
            const res = await executeInc024Simulation((msg) => {
                setQuickSimMsg(msg);
            });
            setQuickSimMsg('Protocolo ejecutado con éxito: Caso consolidado y unidad despachada.');
            loadData();
            setSelectedId(res.incidentId);
            setActiveRole('CENTRAL');
            setTimeout(() => setQuickSimMsg(null), 6000);
        } catch (err: any) {
            setQuickSimMsg('Error en el protocolo: ' + err.message);
            setTimeout(() => setQuickSimMsg(null), 5000);
        } finally {
            setQuickSimulating(false);
        }
    };

    return (
        <div className="app-wrapper">
            {/* BARRA SUPERIOR DE CONTROL MUNICIPAL */}
            <div className="simulation-banner">
                <div className="banner-status-group">
                    <span className="live-status-dot"></span>
                    <span className="banner-text">
                        RED DE OPERACIONES TÁCTICAS — MUNICIPALIDAD PROVINCIAL DE CHICLAYO
                    </span>
                </div>
                <button
                    className="btn-banner-sim"
                    onClick={handleQuickSimulation}
                    disabled={quickSimulating}
                >
                    <ZapIcon size={14} />
                    <span>{quickSimulating ? 'Desplegando Protocolo...' : 'Simular Alerta Crítica (Código Rojo)'}</span>
                </button>
            </div>

            {quickSimMsg && (
                <div className="quick-sim-alert">
                    <CheckCircleIcon size={16} />
                    <span>{quickSimMsg}</span>
                    <button className="alert-close" onClick={() => setQuickSimMsg(null)}>
                        <XIcon size={14} />
                    </button>
                </div>
            )}

            <header className="topbar">
                <div className="brand">
                    <div className="brand-logo-icon">
                        <ShieldIcon size={24} />
                    </div>
                    <div className="brand-text-group">
                        <div className="brand-title-row">
                            <h1>CENTINELA 360</h1>
                            <span className="brand-badge-pill">CECOM CHICLAYO</span>
                        </div>
                        <span className="brand-badge">Sistema Integrado de Seguridad Ciudadana & Despacho Georreferenciado</span>
                    </div>
                </div>

                <nav className="nav-tabs">
                    <button
                        className={`tab-btn ${activeRole === 'CENTRAL' ? 'active' : ''}`}
                        onClick={() => setActiveRole('CENTRAL')}
                    >
                        <RadioIcon size={16} />
                        <span>Central CECOM</span>
                    </button>
                    <button
                        className={`tab-btn ${activeRole === 'CITIZEN' ? 'active' : ''}`}
                        onClick={() => setActiveRole('CITIZEN')}
                    >
                        <SmartphoneIcon size={16} />
                        <span>Portal Ciudadano</span>
                    </button>
                    <button
                        className={`tab-btn ${activeRole === 'PATROL' ? 'active' : ''}`}
                        onClick={() => setActiveRole('PATROL')}
                    >
                        <CarIcon size={16} />
                        <span>Consola Patrullero</span>
                    </button>
                    <button
                        className={`tab-btn ${activeRole === 'ADMIN' ? 'active' : ''}`}
                        onClick={() => setActiveRole('ADMIN')}
                    >
                        <SettingsIcon size={16} />
                        <span>Inteligencia & Gestión</span>
                    </button>
                </nav>
            </header>

            {/* VISTA 1: CENTRAL CECOM (OPERADOR) */}
            {activeRole === 'CENTRAL' && (
                <div className="central-columns">
                    <IncidentList
                        incidents={incidents}
                        selectedId={selectedId}
                        onSelect={setSelectedId}
                    />
                    <div className="map-column">
                        <MapView
                            incidents={incidents}
                            units={units}
                            selectedId={selectedId}
                            activeRoute={activeRoute}
                            onSelectIncident={setSelectedId}
                        />
                    </div>
                    <IncidentDetailPanel
                        incidentId={selectedId}
                        onIncidentUpdated={loadData}
                    />
                </div>
            )}

            {/* VISTA 2: CIUDADANO (REPORTE RÁPIDO & SOS) */}
            {activeRole === 'CITIZEN' && (
                <CitizenView />
            )}

            {/* VISTA 3: PATRULLERO (GPS, MAPA TÁCTICO Y HUD DE MISIÓN TIPO GTA) */}
            {activeRole === 'PATROL' && (
                <PatrolView />
            )}

            {/* VISTA 4: ADMIN & INTELIGENCIA (ZONIFICACIÓN, RUTAS A*, FLOTA Y COMUNICACIONES) */}
            {activeRole === 'ADMIN' && (
                <AdminIntelligenceView
                    onRouteCalculated={(route) => {
                        setActiveRoute(route);
                        if (route) {
                            setActiveRole('CENTRAL');
                        }
                    }}
                    onDataUpdated={loadData}
                />
            )}
        </div>
    );
}
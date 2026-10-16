import {useEffect, useState, useCallback} from 'react';
import IncidentList from './components/IncidentList';
import MapView from './components/MapView';
import IncidentDetailPanel from './components/IncidentDetailPanel';
import CitizenView from './components/CitizenView';
import PatrolView from './components/PatrolView';
import {fetchIncidents, fetchUnits} from './api';
import type {IncidentSummary, PatrolUnit} from './types';
import './App.css';

type ActiveRole = 'CENTRAL' | 'CITIZEN' | 'PATROL';

export default function App() {
    const [activeRole, setActiveRole] = useState<ActiveRole>('CENTRAL');
    const [incidents, setIncidents] = useState<IncidentSummary[]>([]);
    const [units, setUnits] = useState<PatrolUnit[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const loadData = useCallback(() => {
        fetchIncidents().then(setIncidents).catch(console.error);
        fetchUnits().then(setUnits).catch(console.error);
    }, []);

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 8000); // Refresco reactivo periódico cada 8s
        return () => clearInterval(interval);
    }, [loadData]);

    return (
        <div className="app-wrapper">
            {/* HU-ADM-10 / DEMO-04: Marca de simulación explícita obligatoria */}
            <div className="simulation-banner">
                ⚠️ MODO SIMULACIÓN — Datos de Demostración y Validación Académica (Chiclayo y Lambayeque) ⚠️
            </div>

            <header className="topbar">
                <div className="brand">
                    <h1>CENTINELA 360</h1>
                    <span className="brand-badge">Lambayeque Seguro</span>
                </div>

                <nav className="nav-tabs">
                    <button
                        className={`tab-btn ${activeRole === 'CENTRAL' ? 'active' : ''}`}
                        onClick={() => setActiveRole('CENTRAL')}
                    >
                        🖥️ Central 360 (Operador)
                    </button>
                    <button
                        className={`tab-btn ${activeRole === 'CITIZEN' ? 'active' : ''}`}
                        onClick={() => setActiveRole('CITIZEN')}
                    >
                        📱 Portal Ciudadano & SOS
                    </button>
                    <button
                        className={`tab-btn ${activeRole === 'PATROL' ? 'active' : ''}`}
                        onClick={() => setActiveRole('PATROL')}
                    >
                        🚔 Consola Patrullero
                    </button>
                </nav>
            </header>

            {/* VISTA 1: CENTRAL 360 (OPERADOR) */}
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

            {/* VISTA 3: PATRULLERO (GPS Y ESTADOS) */}
            {activeRole === 'PATROL' && (
                <PatrolView />
            )}
        </div>
    );
}
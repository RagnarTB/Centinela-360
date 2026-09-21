import {useEffect, useState, useCallback} from 'react';
import IncidentList from './components/IncidentList';
import MapView from './components/MapView';
import IncidentDetailPanel from './components/IncidentDetailPanel';
import {fetchIncidents, fetchUnits} from './api';
import type {IncidentSummary, PatrolUnit} from './types';
import './App.css';

export default function App() {
    const [incidents, setIncidents] = useState<IncidentSummary[]>([]);
    const [units, setUnits] = useState<PatrolUnit[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const loadData = useCallback(() => {
        fetchIncidents().then(setIncidents).catch(console.error);
        fetchUnits().then(setUnits).catch(console.error);
    }, []);

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 10000); // refresco cada 10s
        return () => clearInterval(interval);
    }, [loadData]);

    return (
        <div className="central-360">
            <header className="topbar">
                <h1>CENTINELA 360 — Central de Operaciones</h1>
            </header>
            <div className="columns">
                <IncidentList incidents={incidents} selectedId={selectedId} onSelect={setSelectedId}/>
                <div className="map-column">
                    <MapView incidents={incidents} units={units} onSelectIncident={setSelectedId}/>
                </div>
                <IncidentDetailPanel incidentId={selectedId}/>
            </div>
        </div>
    );
}
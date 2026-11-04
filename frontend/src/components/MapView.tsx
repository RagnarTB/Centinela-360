import {useState} from 'react';
import {MapContainer, TileLayer, Marker, Popup, CircleMarker, Polyline, Tooltip} from 'react-leaflet';
import L from 'leaflet';
import type {IncidentSummary, PatrolUnit, RouteWaypoint} from '../types';
import {MoonIcon, SunIcon, CarIcon, MapPinIcon, RouteIcon} from './Icons';

const CHICLAYO_CENTER: [number, number] = [-6.7714, -79.8409];

// Ícono SVG profesional para patrulleros de Serenazgo en Leaflet (Cero emojis)
const createPatrolIcon = (code: string, status: string) => {
    const isAvail = status === 'DISPONIBLE';
    const isEnCamino = status === 'EN_CAMINO';
    const isEnSitio = status === 'EN_SITIO';
    const bgColor = isEnCamino ? '#f59e0b' : isEnSitio ? '#3b82f6' : isAvail ? '#10b981' : '#6b7280';

    const carSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H7.5a1 1 0 0 0-.8.4L4 11l-5.16.86a1 1 0 0 0-.84.99V16h3"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/></svg>`;

    return L.divIcon({
        className: 'custom-patrol-marker',
        html: `
            <div style="
                background: ${bgColor};
                color: #ffffff;
                font-family: system-ui, -apple-system, sans-serif;
                font-size: 11px;
                font-weight: 700;
                letter-spacing: 0.3px;
                padding: 4px 8px;
                border-radius: 14px;
                box-shadow: 0 0 14px ${bgColor}aa, 0 3px 8px rgba(0,0,0,0.6);
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

// Puntos de referencia tácticos en Chiclayo
const CHICLAYO_LANDMARKS = [
    {name: 'Parque Principal / Catedral', lat: -6.7714, lon: -79.8409, type: 'CÍVICO'},
    {name: 'Mercado Modelo', lat: -6.7675, lon: -79.8425, type: 'COMERCIAL'},
    {name: 'Plaza Elías Aguirre', lat: -6.7705, lon: -79.8430, type: 'BANCARIO'},
    {name: 'Hospital Las Mercedes', lat: -6.7730, lon: -79.8450, type: 'SALUD'},
    {name: 'Av. Bolognesi con Balta', lat: -6.7760, lon: -79.8395, type: 'INTERSECCIÓN'}
];

const statusColor: Record<string, string> = {
    ABIERTO: '#ef4444',
    CONFIRMADO: '#f97316',
    ASIGNADO: '#f59e0b',
    EN_ATENCION: '#3b82f6',
    ATENDIDO: '#10b981',
    DESCARTADO: '#6b7280',
};

interface Props {
    incidents: IncidentSummary[];
    units: PatrolUnit[];
    selectedId?: string | null;
    activeRoute?: {waypoints: RouteWaypoint[]; algorithm?: string} | null;
    onSelectIncident?: (id: string) => void;
    onMapClick?: (lat: number, lon: number) => void;
}

export default function MapView({incidents, units, selectedId, activeRoute, onSelectIncident}: Props) {
    const [mapStyle, setMapStyle] = useState<'dark' | 'street'>('dark');

    // Usar OpenStreetMap público estándar tanto para modo nocturno como diurno.
    // El modo oscuro se procesa con filtro CSS táctico de alto rendimiento, evitando errores de 'API key required'
    const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

    // Generar línea de ruta si existe A* o asignación
    const routePositions: [number, number][] = activeRoute?.waypoints?.map((w) => [w.latitude, w.longitude]) || [];

    return (
        <div className={`map-view-container ${mapStyle === 'dark' ? 'tactical-dark-map' : 'street-light-map'}`} style={{height: '100%', width: '100%', position: 'relative'}}>
            {/* Controles flotantes sobre el mapa */}
            <div className="map-controls-overlay">
                <div className="map-style-toggle">
                    <button
                        className={`map-style-btn ${mapStyle === 'dark' ? 'active' : ''}`}
                        onClick={() => setMapStyle('dark')}
                    >
                        <MoonIcon size={13} />
                        <span>Modo Táctico</span>
                    </button>
                    <button
                        className={`map-style-btn ${mapStyle === 'street' ? 'active' : ''}`}
                        onClick={() => setMapStyle('street')}
                    >
                        <SunIcon size={13} />
                        <span>Modo Diurno</span>
                    </button>
                </div>
                <div className="map-legend">
                    <span className="legend-dot dot-open"></span> Abierto
                    <span className="legend-dot dot-assigned"></span> Asignado
                    <span className="legend-dot dot-resolved"></span> Atendido
                    <span className="legend-badge">
                        <CarIcon size={12} />
                        <span>Patrullas</span>
                    </span>
                </div>
            </div>

            <MapContainer
                center={CHICLAYO_CENTER}
                zoom={14}
                style={{height: '100%', width: '100%', background: '#0b1118'}}
            >
                <TileLayer attribution={attribution} url={tileUrl} maxZoom={19} />

                {/* Hitos clave de Chiclayo como puntos de referencia tácticos */}
                {CHICLAYO_LANDMARKS.map((lm, idx) => (
                    <CircleMarker
                        key={`landmark-${idx}`}
                        center={[lm.lat, lm.lon]}
                        radius={4}
                        pathOptions={{
                            color: '#94a3b8',
                            fillColor: '#64748b',
                            fillOpacity: 0.5,
                            weight: 1
                        }}
                    >
                        <Tooltip direction="top" offset={[0, -5]} opacity={0.9}>
                            <span style={{fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px'}}>
                                <MapPinIcon size={12} /> {lm.name} ({lm.type})
                            </span>
                        </Tooltip>
                    </CircleMarker>
                ))}

                {/* Línea de Ruta A* / Despacho en tiempo real */}
                {routePositions.length > 1 && (
                    <Polyline
                        positions={routePositions}
                        pathOptions={{
                            color: '#06b6d4',
                            weight: 4,
                            dashArray: '8, 8',
                            lineCap: 'round',
                            opacity: 0.95
                        }}
                    >
                        <Tooltip sticky>
                            <span style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
                                <RouteIcon size={13} /> Ruta A* Optimizada en Red Vial Chiclayo
                            </span>
                        </Tooltip>
                    </Polyline>
                )}

                {/* Marcadores de Incidentes */}
                {incidents.map((inc) => {
                    const isSelected = selectedId === inc.id;
                    const color = statusColor[inc.status] ?? '#f59e0b';

                    return (
                        <CircleMarker
                            key={inc.id}
                            center={[inc.latitude, inc.longitude]}
                            radius={isSelected ? 14 : 9}
                            pathOptions={{
                                color: isSelected ? '#ffffff' : color,
                                fillColor: color,
                                fillOpacity: isSelected ? 0.95 : 0.75,
                                weight: isSelected ? 3 : 2
                            }}
                            eventHandlers={{
                                click: () => onSelectIncident && onSelectIncident(inc.id)
                            }}
                        >
                            <Popup className="incident-leaflet-popup">
                                <div style={{fontFamily: 'system-ui', padding: '2px 4px'}}>
                                    <div style={{display: 'flex', justifyContent: 'space-between', gap: '8px', marginBottom: '4px'}}>
                                        <strong style={{color: '#0f172a', fontSize: '13px'}}>{inc.category}</strong>
                                        <span style={{
                                            fontSize: '10px',
                                            fontWeight: 700,
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            background: color,
                                            color: '#fff'
                                        }}>
                                            {inc.status}
                                        </span>
                                    </div>
                                    <p style={{margin: '3px 0', fontSize: '11px', color: '#475569'}}>
                                        Confianza: <strong>{inc.trustScore != null ? `${inc.trustScore}%` : 'N/D'}</strong>
                                    </p>
                                    <p style={{margin: '3px 0', fontSize: '10px', color: '#64748b'}}>
                                        Coordenadas: {inc.latitude.toFixed(4)}, {inc.longitude.toFixed(4)}
                                    </p>
                                    <button
                                        style={{
                                            marginTop: '6px',
                                            width: '100%',
                                            padding: '5px 8px',
                                            background: '#1e3a8a',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '5px',
                                            cursor: 'pointer',
                                            fontSize: '11px',
                                            fontWeight: 600
                                        }}
                                        onClick={() => onSelectIncident && onSelectIncident(inc.id)}
                                    >
                                        Ver Ficha Operativa
                                    </button>
                                </div>
                            </Popup>
                        </CircleMarker>
                    );
                })}

                {/* Marcadores de Unidades de Patrullaje */}
                {units.map((unit) => {
                    if (unit.latitude == null || unit.longitude == null) return null;

                    return (
                        <Marker
                            key={unit.id}
                            position={[unit.latitude, unit.longitude]}
                            icon={createPatrolIcon(unit.code, unit.status)}
                        >
                            <Popup className="patrol-leaflet-popup">
                                <div style={{fontFamily: 'system-ui', padding: '2px 4px'}}>
                                    <h4 style={{margin: '0 0 4px', color: '#0f172a', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px'}}>
                                        Patrullero {unit.code}
                                    </h4>
                                    <p style={{margin: '2px 0', fontSize: '11px', color: '#334155'}}>
                                        Estado: <strong>{unit.status}</strong>
                                    </p>
                                    <p style={{margin: '2px 0', fontSize: '10px', color: '#64748b'}}>
                                        Último GPS: {unit.lastLocationAt ? new Date(unit.lastLocationAt).toLocaleTimeString() : 'En patrullaje'}
                                    </p>
                                    <p style={{margin: '2px 0', fontSize: '10px', color: '#64748b'}}>
                                        Posición: ({unit.latitude.toFixed(4)}, {unit.longitude.toFixed(4)})
                                    </p>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
}
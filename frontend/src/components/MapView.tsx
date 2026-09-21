import {MapContainer, TileLayer, Marker, Popup, CircleMarker} from 'react-leaflet';
import type {IncidentSummary, PatrolUnit} from '../types';

const CHICLAYO_CENTER: [number, number] = [-6.7714, -79.8409];

const statusColor: Record<string, string> = {
    ABIERTO: '#e74c3c',
    ASIGNADO: '#f39c12',
    ATENDIDO: '#27ae60',
};

interface Props {
    incidents: IncidentSummary[];
    units: PatrolUnit[];
    onSelectIncident: (id: string) => void;
}

export default function MapView({incidents, units, onSelectIncident}: Props) {
    return (
        <MapContainer center={CHICLAYO_CENTER} zoom={13} style={{height: '100%', width: '100%'}}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {incidents.map((inc) => (
                <CircleMarker
                    key={inc.id}
                    center={[inc.latitude, inc.longitude]}
                    radius={10}
                    pathOptions={{color: statusColor[inc.status] ?? '#999', fillOpacity: 0.7}}
                    eventHandlers={{click: () => onSelectIncident(inc.id)}}
                >
                    <Popup>
                        <strong>{inc.category}</strong><br/>
                        Estado: {inc.status}
                    </Popup>
                </CircleMarker>
            ))}

            {units.map((unit) =>
                unit.latitude != null && unit.longitude != null ? (
                    <Marker key={unit.id} position={[unit.latitude, unit.longitude]}>
                        <Popup>
                            <strong>{unit.code}</strong><br/>
                            Estado: {unit.status}
                        </Popup>
                    </Marker>
                ) : null
            )}
        </MapContainer>
    );
}
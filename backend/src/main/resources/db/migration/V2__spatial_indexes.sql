-- Índices espaciales GIST para acelerar consultas de proximidad
CREATE INDEX idx_reports_location ON reports USING GIST (location);

CREATE INDEX idx_incidents_location ON incidents USING GIST (location);

CREATE INDEX idx_unit_locations_location ON unit_locations USING GIST (location);

CREATE INDEX idx_alerts_area ON alerts USING GIST (area);
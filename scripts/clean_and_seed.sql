-- ==============================================================================
-- CENTINELA 360 - SCRIPT DE LIMPIEZA Y CARGA DE DATOS OFICIALES PARA MVP
-- Ámbito: Chiclayo y Lambayeque
-- ==============================================================================

-- 1. Limpieza total de tablas operativas (CASCADE)
TRUNCATE TABLE dispatches CASCADE;
TRUNCATE TABLE incident_reports CASCADE;
TRUNCATE TABLE incident_events CASCADE;
TRUNCATE TABLE report_evidence CASCADE;
TRUNCATE TABLE reports CASCADE;
TRUNCATE TABLE incidents CASCADE;
TRUNCATE TABLE unit_locations CASCADE;
TRUNCATE TABLE patrol_units CASCADE;
TRUNCATE TABLE alerts CASCADE;
TRUNCATE TABLE news CASCADE;
TRUNCATE TABLE audit_log CASCADE;
TRUNCATE TABLE users CASCADE;

-- 2. Usuarios del sistema (4 Roles del equipo según APF1 y APF2)
INSERT INTO users (id, full_name, email, phone, role, created_at) VALUES
('e2c440a8-6d2c-4157-a10c-500876af520a', 'Leonardo Tello Bustamante', 'leonardo.tello@centinela360.pe', '974123456', 'CITIZEN', now()),
('a1b2c3d4-e5f6-4a5b-8c9d-0123456789ab', 'Fabian Arroyo Cusman', 'fabian.arroyo@centinela360.pe', '974234567', 'OPERATOR', now()),
('b2c3d4e5-f6a7-4b6c-9d0e-1234567890bc', 'Oscar Pacherrez Piscoya', 'oscar.pacherrez@centinela360.pe', '974345678', 'PATROL', now()),
('c3d4e5f6-a7b8-4c7d-0e1f-2345678901cd', 'Santiago Otero Brenis', 'santiago.otero@centinela360.pe', '974456789', 'ADMIN', now()),
('00000000-0000-0000-0000-000000000001', 'Ciudadano Chiclayo', 'ciudadano@centinela360.pe', '974000360', 'CITIZEN', now());

-- 3. Unidades de Patrullaje de Serenazgo de Chiclayo
INSERT INTO patrol_units (id, code, status, created_at) VALUES
('08272a1f-1286-490b-bfea-10bcfcf43862', 'U-01', 'DISPONIBLE', now()),
('067c31fb-3c46-4917-a2ec-35cbd54e1878', 'U-02', 'DISPONIBLE', now()),
('bdc91b66-9bb3-4de0-aa0f-f728e2db0b02', 'U-03', 'EN_PATRULLAJE', now()),
('e5a19001-3321-4f11-9a00-728e2db0b044', 'U-04', 'DISPONIBLE', now());

-- 4. Ubicaciones GPS iniciales en intersecciones clave de Chiclayo
INSERT INTO unit_locations (unit_id, location, recorded_at) VALUES
('08272a1f-1286-490b-bfea-10bcfcf43862', ST_SetSRID(ST_MakePoint(-79.8409, -6.7714), 4326), now()), -- U-01: Parque Principal (San José con Balta)
('067c31fb-3c46-4917-a2ec-35cbd54e1878', ST_SetSRID(ST_MakePoint(-79.8425, -6.7675), 4326), now()), -- U-02: Mercado Modelo (Balta con Arica)
('bdc91b66-9bb3-4de0-aa0f-f728e2db0b02', ST_SetSRID(ST_MakePoint(-79.8395, -6.7760), 4326), now()), -- U-03: Av. Balta con Av. Bolognesi
('e5a19001-3321-4f11-9a00-728e2db0b044', ST_SetSRID(ST_MakePoint(-79.8520, -6.7580), 4326), now()); -- U-04: Óvalo Santa Elena (Salida Lambayeque)

-- 5. Noticias Oficiales (Fase 9 / INF-01 / HU-ADM-05)
INSERT INTO news (id, title, body, tag, published_at) VALUES
(gen_random_uuid(), 'Plan de Patrullaje Integrado 2026 entre Serenazgo y PNP en el cuadrante comercial de Chiclayo', 'La Municipalidad Provincial de Chiclayo refuerza las rondas diurnas y nocturnas coordinadas con comisarias sectoriales en 154 cuadrantes urbanos.', 'OFICIAL', now() - INTERVAL '2 hours'),
(gen_random_uuid(), 'Monitoreo 24/7 activo con 43 camaras de videovigilancia en el eje Av. Balta y Av. Bolognesi', 'El Centro de Control CECOM mantiene vigilancia continua e interconexion con el sistema Centinela 360 para despacho asistido de unidades.', 'INFORMATIVO', now() - INTERVAL '1 day'),
(gen_random_uuid(), 'Recomendaciones de seguridad ciudadana para el circuito bancario y comercial', 'Evite traslados solitarios con dinero en efectivo, verifique taxis autorizados y reporte cualquier hecho sospechoso via Centinela 360 o llamada a Central.', 'PREVENTIVO', now() - INTERVAL '2 days');

-- 6. Alertas Preventivas Zonales (Fase 9 / INF-02 / HU-ADM-06)
INSERT INTO alerts (id, title, body, area, expires_at, created_at) VALUES
(gen_random_uuid(), 'Alerta de Transito y Operativo Zonal en Mercado Modelo', 'Operativo conjunto de recuperacion de espacios publicos y control de transito en Av. Balta y Calle Arica. Se recomienda circular con precaucion.', ST_SetSRID(ST_MakePolygon(ST_GeomFromText('LINESTRING(-79.8435 -6.7665, -79.8415 -6.7665, -79.8415 -6.7685, -79.8435 -6.7685, -79.8435 -6.7665)')), 4326), now() + INTERVAL '24 hours', now()),
(gen_random_uuid(), 'Patrullaje Preventivo Reforzado en Eje Av. Salaverry', 'Presencia continua de unidades motorizadas de Serenazgo ante afluencia ciudadana por actividades comerciales y universitarias.', ST_SetSRID(ST_MakePolygon(ST_GeomFromText('LINESTRING(-79.8360 -6.7760, -79.8320 -6.7760, -79.8320 -6.7790, -79.8360 -6.7790, -79.8360 -6.7760)')), 4326), now() + INTERVAL '48 hours', now());

-- 7. Incidentes y Reportes Iniciales Reales (para demostración limpia)
-- Incidente 1: DISTURBIO en Mercado Modelo (ABIERTO)
INSERT INTO incidents (id, category, status, trust_score, location, created_at, updated_at) VALUES
('11111111-1111-1111-1111-111111111111', 'DISTURBIO', 'ABIERTO', 76.50, ST_SetSRID(ST_MakePoint(-79.8425, -6.7675), 4326), now() - INTERVAL '25 minutes', now() - INTERVAL '10 minutes');

INSERT INTO reports (id, user_id, channel, category, description, status, location, created_at) VALUES
('11111111-1111-1111-1111-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000001', 'APP', 'DISTURBIO', 'Griterío y alteración del orden entre comerciantes informales en exterior de Arica', 'CONSOLIDADO', ST_SetSRID(ST_MakePoint(-79.8424, -6.7674), 4326), now() - INTERVAL '25 minutes'),
('11111111-1111-1111-1111-bbbbbbbbbbbb', '00000000-0000-0000-0000-000000000001', 'LLAMADA', 'DISTURBIO', 'Operador recibe llamada informando conato de riña en esquina Balta con Arica', 'CONSOLIDADO', ST_SetSRID(ST_MakePoint(-79.8426, -6.7676), 4326), now() - INTERVAL '20 minutes');

INSERT INTO incident_reports (incident_id, report_id, relation_type) VALUES
('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-aaaaaaaaaaaa', 'ORIGEN'),
('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-bbbbbbbbbbbb', 'ASOCIADO');

INSERT INTO incident_events (incident_id, event_type, payload, created_at) VALUES
('11111111-1111-1111-1111-111111111111', 'CREATED', '{"category":"DISTURBIO","trustScore":76.5}', now() - INTERVAL '25 minutes'),
('11111111-1111-1111-1111-111111111111', 'REPORT_ASSOCIATED', '{"reportCount":2}', now() - INTERVAL '20 minutes');

-- Incidente 2: SOSPECHOSO en Plaza Elías Aguirre (ASIGNADO a U-03)
INSERT INTO incidents (id, category, status, trust_score, location, created_at, updated_at) VALUES
('22222222-2222-2222-2222-222222222222', 'SOSPECHOSO', 'ASIGNADO', 92.00, ST_SetSRID(ST_MakePoint(-79.8430, -6.7705), 4326), now() - INTERVAL '15 minutes', now() - INTERVAL '5 minutes');

INSERT INTO reports (id, user_id, channel, category, description, status, location, created_at) VALUES
('22222222-2222-2222-2222-cccccccccccc', 'e2c440a8-6d2c-4157-a10c-500876af520a', 'APP', 'SOSPECHOSO', 'Dos personas sospechosas merodeando motocicletas estacionadas cerca a bancos', 'ASIGNADO', ST_SetSRID(ST_MakePoint(-79.8430, -6.7705), 4326), now() - INTERVAL '15 minutes');

INSERT INTO incident_reports (incident_id, report_id, relation_type) VALUES
('22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-cccccccccccc', 'ORIGEN');

INSERT INTO dispatches (id, incident_id, unit_id, status, created_at, updated_at) VALUES
('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'bdc91b66-9bb3-4de0-aa0f-f728e2db0b02', 'EN_CAMINO', now() - INTERVAL '10 minutes', now() - INTERVAL '5 minutes');

INSERT INTO incident_events (incident_id, event_type, payload, created_at) VALUES
('22222222-2222-2222-2222-222222222222', 'CREATED', '{"category":"SOSPECHOSO","trustScore":92.0}', now() - INTERVAL '15 minutes'),
('22222222-2222-2222-2222-222222222222', 'DISPATCHED', '{"unitCode":"U-03","status":"EN_CAMINO"}', now() - INTERVAL '10 minutes');

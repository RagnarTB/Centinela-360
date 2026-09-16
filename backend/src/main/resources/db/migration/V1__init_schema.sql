--CREATE EXTENSION IF NOT EXISTS pgcrypto; si da error descomentar esta linea ya que requiere de pgcrypto la funcion gen_random_uuid()--
-- Extensión espacial (la usaremos completo en DB-02, aquí solo la habilitamos)
CREATE EXTENSION IF NOT EXISTS postgis;

-- Usuarios
CREATE TABLE
    users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        full_name VARCHAR(150) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        phone VARCHAR(30),
        role VARCHAR(20) NOT NULL, -- CITIZEN | OPERATOR | PATROL | ADMIN
        created_at TIMESTAMPTZ NOT NULL DEFAULT now ()
    );

-- Reportes ciudadanos
CREATE TABLE
    reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        user_id UUID REFERENCES users (id),
        channel VARCHAR(20) NOT NULL, -- APP | LLAMADA | PATRULLA
        category VARCHAR(50) NOT NULL,
        description TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'RECIBIDO',
        location GEOMETRY (Point, 4326) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now ()
    );

-- Evidencia de reportes
CREATE TABLE
    report_evidence (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        report_id UUID NOT NULL REFERENCES reports (id) ON DELETE CASCADE,
        storage_ref TEXT NOT NULL,
        media_type VARCHAR(20), -- PHOTO | AUDIO | VIDEO
        created_at TIMESTAMPTZ NOT NULL DEFAULT now ()
    );

-- Incidentes (agrupan reportes)
CREATE TABLE
    incidents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        category VARCHAR(50) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'ABIERTO',
        trust_score NUMERIC(5, 2),
        location GEOMETRY (Point, 4326) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now (),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now ()
    );

-- Relación incidente-reporte
CREATE TABLE
    incident_reports (
        incident_id UUID NOT NULL REFERENCES incidents (id) ON DELETE CASCADE,
        report_id UUID NOT NULL REFERENCES reports (id) ON DELETE CASCADE,
        relation_type VARCHAR(30) DEFAULT 'ASOCIADO',
        PRIMARY KEY (incident_id, report_id)
    );

-- Unidades de patrullaje
CREATE TABLE
    patrol_units (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        code VARCHAR(20) UNIQUE NOT NULL, -- ej. U-01
        status VARCHAR(20) NOT NULL DEFAULT 'DISPONIBLE',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now ()
    );

-- Ubicaciones de unidades (histórico de GPS)
CREATE TABLE
    unit_locations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        unit_id UUID NOT NULL REFERENCES patrol_units (id) ON DELETE CASCADE,
        location GEOMETRY (Point, 4326) NOT NULL,
        recorded_at TIMESTAMPTZ NOT NULL DEFAULT now ()
    );

-- Despachos
CREATE TABLE
    dispatches (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        incident_id UUID NOT NULL REFERENCES incidents (id),
        unit_id UUID NOT NULL REFERENCES patrol_units (id),
        status VARCHAR(20) NOT NULL DEFAULT 'ASIGNADO',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now (),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now ()
    );

-- Eventos/historial de incidentes (auditoría)
CREATE TABLE
    incident_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        incident_id UUID NOT NULL REFERENCES incidents (id) ON DELETE CASCADE,
        event_type VARCHAR(50) NOT NULL,
        payload JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now ()
    );

-- Noticias
CREATE TABLE
    news (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        title VARCHAR(200) NOT NULL,
        body TEXT NOT NULL,
        tag VARCHAR(20) NOT NULL, -- OFICIAL | PREVENTIVO | INFORMATIVO
        published_at TIMESTAMPTZ NOT NULL DEFAULT now ()
    );

-- Alertas preventivas
CREATE TABLE
    alerts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        title VARCHAR(200) NOT NULL,
        body TEXT NOT NULL,
        area GEOMETRY (Polygon, 4326),
        expires_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now ()
    );

-- Auditoría general
CREATE TABLE
    audit_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        entity_type VARCHAR(50) NOT NULL,
        entity_id UUID NOT NULL,
        action VARCHAR(50) NOT NULL,
        performed_by UUID REFERENCES users (id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now ()
    );
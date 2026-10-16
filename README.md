# Centinela 360 
> **Gestión urbana y seguridad ciudadana inteligente para Lambayeque**  
> Proyecto de Transformación Digital — Universidad Tecnológica del Perú (UTP)  
> Curso: *Innovación y Transformación Digital* | Docente: Mg. Ing. Jessica Carrasco Zeña

---

##  1. Descripción del Proyecto

**Centinela 360** es una plataforma reactiva y distribuida diseñada para articular tres fuentes operativas de seguridad ciudadana que tradicionalmente operan aisladas:
1. **Reportes ciudadanos multicanal:** Aplicación móvil/web, botón SOS de un solo toque y registro asistido de llamadas.
2. **Telemetría y disponibilidad de Serenazgo:** Posición GPS en tiempo real de unidades de patrullaje.
3. **Consolidación inteligente y apoyo al despacho:** Agrupamiento espacio-temporal de avisos mediante **PostGIS**, cálculo explicable de confianza (**TrustScore**) y recomendación algorítmica de patrullas por tiempo de llegada estimado (**ETA**).

>  **Aviso de Integridad Académica (HU-ADM-10 / DEMO-04):**  
> Todo dato presentado en este prototipo está identificado como **SIMULACIÓN** con fines de validación técnica y académica en el entorno urbano de Chiclayo.

---

##  2. Arquitectura y Tecnologías

```text
[ Ciudadano / App / SOS ]       [ Patrullero / GPS ]
             │                            │
             ▼                            ▼
   ┌──────────────────────────────────────────────┐
   │         Spring Boot 3.4 (WebFlux)            │
   │  API Reactiva No Bloqueante + R2DBC + PostGIS│
   └──────────────────────┬───────────────────────┘
                          │
          ┌───────────────┴───────────────┐
          ▼                               ▼
┌──────────────────┐            ┌───────────────────┐
│   PostgreSQL 16  │            │    Apache Kafka   │
│  + PostGIS 3.4   │            │   Event Streaming │
│ (Índices GiST)   │            │   3.7 (Kraft)     │
└──────────────────┘            └─────────┬─────────┘
                                          │
                                          ▼
                                ┌───────────────────┐
                                │ Consolidation     │
                                │ Engine & Events   │
                                └─────────┬─────────┘
                                          │
                                          ▼
                                [ Central 360 UI ]
                                (React 19 + Leaflet)
```

| Capa | Tecnología | Rol en la Solución |
| :--- | :--- | :--- |
| **Backend** | Java 21, Spring Boot 3.4.3, Spring WebFlux | Procesamiento reactivo no bloqueante y alta concurrencia. |
| **Base de Datos Espacial** | PostgreSQL 16 + PostGIS 3.4, R2DBC, Flyway | Consultas geodésicas (`ST_DWithin`, `ST_Distance`) e índices GiST. |
| **Broker de Mensajería** | Apache Kafka 3.7.0 (KRaft) | Desacoplamiento de eventos (`reports.created`, `incidents.updated`, `dispatch.created`). |
| **Frontend** | React 19, TypeScript, Vite, React-Leaflet | Interfaz multirrol (Central 360, Portal Ciudadano SOS, Consola Patrulla). |
| **Infraestructura** | Docker Compose | Entorno reproducible y contenerizado. |

---

##  3. Cómo Levantar el Entorno Local

### Requisitos previos
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) (con Docker Compose v2+)
* [Java 21 JDK](https://adoptium.net/) (opcional si ejecutas con Maven Wrapper)
* [Node.js 20+](https://nodejs.org/) y npm

---

### Paso 1: Levantar PostgreSQL/PostGIS y Apache Kafka

En la raíz del repositorio (`centinela-360`):

```bash
docker-compose up -d postgres kafka
```

*Verificar contenedores activos:*
```bash
docker ps
```
Debe mostrar `centinela-postgres` (puerto `5432`) y `centinela-kafka` (puerto `9092`) en estado `Up`.

---

### Paso 2: Iniciar el Backend Reactivo (Spring WebFlux)

En una terminal:

```bash
cd backend
# En Windows:
.\mvnw.cmd spring-boot:run

# En Linux/macOS:
./mvnw spring-boot:run
```

*Verificar que el backend esté operativo:*
Abrir en el navegador: [http://localhost:8080/actuator/health](http://localhost:8080/actuator/health)  
Respuesta esperada: `{"status":"UP"}`.

---

### Paso 3: Iniciar el Frontend (React + Vite)

En otra terminal:

```bash
cd frontend
npm install
npm run dev
```

Acceder a la aplicación: [http://localhost:3000](http://localhost:3000)

---

##  4. Módulos y Roles de Usuario

La barra superior permite alternar instantáneamente entre los 3 perfiles operativos:

1. ** Central 360 (Operador de Serenazgo):**
   * Panel de 3 columnas: listado de incidentes en tiempo real, mapa geolocalizado de Chiclayo y ficha de detalle.
   * **Revisión Humana (`VAL-02`):** Botones para *Confirmar* (eleva TrustScore a 100%) o *Descartar* (score 0%).
   * **Motor de Recomendación (`DSP-01`):** Sugiere automáticamente la unidad de patrulla más cercana con menor ETA en minutos.
   * **Asignación y Despacho (`DSP-02`):** Despacho asistido en un clic.
2. ** Portal Ciudadano & SOS:**
   * **Botón SOS de 1 Toque (`HU-CIU-03`):** Envío prioritario inmediato con GPS.
   * **Reporte Rápido (`HU-CIU-01`):** Formulario por categoría con selector de coordenadas.
   * **Mis Reportes (`HU-CIU-04`):** Trazabilidad de estados (`RECIBIDO`, `ASIGNADO`, `ATENDIDO`).
   * **Noticias y Alertas Preventivas (`INF-01`, `INF-02`):** Avisos zonales oficiales sin estigmatizar barrios.
   * **Guía y Contactos (`CIU-01`, `CIU-02`):** Teléfonos de Serenazgo, PNP 105, SAMU 106 y canal de problemas urbanos.
3. ** Consola Patrullero:**
   * Selector interactivo de unidad (`U-01`, `U-02`, `U-03`).
   * Recepción de misión asignada (`HU-PAT-01`).
   * Transición de estados operativos: `Disponible`, `En camino`, `En sitio`, `Atendido` (`HU-PAT-07`).
   * D-Pad para simular desplazamiento GPS continuo por las calles de Chiclayo (`HU-PAT-06`).

---

##  5. Ejecución de Pruebas Unitarias y de Integración

El proyecto cuenta con una suite completa de pruebas reactivas verificadas:

```bash
cd backend
.\mvnw.cmd test
```

### Resultados de la Suite (13 tests pasando):
* `BackendApplicationTests`: Inicialización de contexto con PostGIS, Flyway y Kafka.
* `IncidentSerializationTest`: Serialización no recursiva de geometrías JTS en sobres Kafka (`EventEnvelope`).
* `TrustScoreServiceTest`: Ponderación multicanal, corroboración de reportes y límites automáticos.
* `DispatchServiceTest`: Cálculo de distancia geodésica (Haversine) y selección por menor ETA.
* `NewsServiceTest`: Creación y consulta ordenada de noticias oficiales.
* `AlertServiceTest`: Filtrado temporal de alertas activas por fecha de expiración.

---

##  6. Endpoints Principales de la API REST

| Método | Endpoint | Descripción | Fase / Ticket |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/reports` | Ingesta de reporte ciudadano | Fase 2 (REP-01) |
| `GET` | `/api/v1/reports/me` | Listado de mis reportes | Fase 2 (REP-04) |
| `GET` | `/api/v1/incidents` | Listado de incidentes consolidados | Fase 3 (API-INC-01) |
| `GET` | `/api/v1/incidents/{id}` | Ficha completa con reportes asociados | Fase 3 (API-INC-02) |
| `POST` | `/api/v1/incidents/{id}/review` | Revisión de operador (`CONFIRMAR`/`DESCARTAR`) | Fase 6 (VAL-02) |
| `GET` | `/api/v1/incidents/{id}/recommend-unit` | Unidad recomendada por menor ETA | Fase 7 (DSP-01) |
| `POST` | `/api/v1/dispatches` | Despacho y asignación de patrulla | Fase 7 (DSP-02) |
| `PATCH` | `/api/v1/dispatches/{id}/status` | Transición de estados del despacho | Fase 7 (DSP-03) |
| `GET` | `/api/v1/units` | Monitoreo de disponibilidad de unidades | Fase 3 (API-UNIT-01) |
| `POST` | `/api/v1/units/{id}/location` | Actualización de telemetría GPS | Fase 3 (GPS-01) |
| `PATCH` | `/api/v1/units/{id}/status` | Cambio de estado de la unidad | Fase 8 (PAT-02) |
| `GET` | `/api/v1/news` | Noticias oficiales y preventivas | Fase 9 (INF-01) |
| `GET` | `/api/v1/alerts` | Alertas preventivas zonales vigentes | Fase 9 (INF-02) |

---

##  7. Equipo de Proyecto

* **Leonardo Tello Bustamante:** Scrum Master, Arquitectura Backend, WebFlux, Kafka y Seguridad.
* **Fabian Arroyo Cusman:** Product Owner, Panel Central 360 y Modelado de Base de Datos.
* **Oscar Pacherrez Piscoya:** Dev Team, Lógica de Negocio, Ingesta, Despacho y Pruebas.
* **Santiago Otero Brenis:** Dev Team, Frontend Ciudadano y Consultas Espaciales.

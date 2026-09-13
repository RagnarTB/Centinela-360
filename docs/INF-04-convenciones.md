# Guía Maestra de Convenciones y Estándares Técnicos
## Centinela 360

**Código de documento:** INF-04  
**Versión:** 1.0  
**Estado:** Obligatorio  
**Ámbito:** `/backend`, `/frontend`, `/infra`, `/docs`  
**Repositorio:** Centinela 360  
**Nivel de obligatoriedad:** Estricto

---

# 1. Propósito

El presente documento establece las convenciones técnicas, estándares de desarrollo, reglas de versionado, estructura del código, estrategia de ramas, estándares de commits, integración mediante Kafka, proceso de Pull Requests y criterios mínimos de calidad para el desarrollo de Centinela 360.

El objetivo principal es garantizar:

- Consistencia técnica.
- Trazabilidad entre código y tickets.
- Integridad del repositorio.
- Mantenibilidad del código.
- Separación de responsabilidades.
- Calidad del software.
- Reproducibilidad del entorno.
- Control de cambios.
- Integración segura de funcionalidades.
- Facilidad de revisión.
- Trazabilidad de eventos distribuidos.

Estas reglas son obligatorias para todo cambio que se incorpore al repositorio oficial.

---

# 2. Alcance

Las convenciones definidas en este documento aplican a:

```text
centinela-360/
|
+-- backend/
|
+-- frontend/
|
+-- infra/
|
+-- docs/
|
+-- README.md
|
+-- .gitignore
|
+-- docker-compose.yml
|
+-- ...
```

El cumplimiento de estas reglas es obligatorio para:

- Código fuente.
- Configuraciones.
- Migraciones.
- Pruebas.
- Documentación técnica.
- Infraestructura.
- Scripts.
- Configuración de Docker.
- Integraciones con Kafka.
- Integraciones con PostgreSQL/PostGIS.
- Cambios de frontend.
- Cambios de CI/CD.

---

# 3. Reglas Generales del Proyecto

## 3.1. Un ticket por Pull Request

Cada Pull Request debe resolver exactamente un ticket.

La relación esperada es:

```text
1 Ticket
   |
   +-- 1 Rama
   |
   +-- 1 Pull Request
   |
   +-- 1 Unidad funcional verificable
```

No se deben agrupar funcionalidades independientes dentro del mismo Pull Request.

### Ejemplo correcto

```text
Ticket: BE-01
       |
       v
feature/BE-01-spring-webflux
       |
       v
Pull Request
       |
       v
develop
```

### Ejemplo incorrecto

```text
Ticket BE-01
Ticket DB-01
Ticket KAF-01
Ticket REP-01
       |
       v
feature/backend-completo
       |
       v
Pull Request
```

La segunda estrategia dificulta:

- La revisión.
- La trazabilidad.
- La identificación de errores.
- El rollback.
- La validación de criterios de aceptación.

---

# 4. Criterios de Aceptación

Todo ticket debe tener criterios de aceptación claramente definidos antes de considerarse finalizado.

Un Pull Request no puede aprobarse si no existe evidencia suficiente de que dichos criterios fueron cumplidos.

La evidencia puede incluir:

```text
+-----------------------+
| Criterio de aceptación|
+-----------+-----------+
            |
            v
+-----------------------+
| Implementación        |
+-----------+-----------+
            |
            v
+-----------------------+
| Prueba                |
+-----------+-----------+
            |
            v
+-----------------------+
| Evidencia             |
+-----------+-----------+
            |
            v
+-----------------------+
| Validación            |
+-----------------------+
```

Tipos de evidencia permitidos:

- Logs.
- Capturas de pantalla.
- Resultados de pruebas.
- Evidencia de Postman.
- Evidencia de Swagger/OpenAPI.
- Evidencia del frontend.
- Evidencia de Docker.
- Evidencia de PostgreSQL.
- Evidencia de Kafka.
- Reportes automatizados.

---

# 5. Flujo Secuencial de Fases

El proyecto se desarrolla mediante fases.

No se deben iniciar tickets pertenecientes a una fase posterior mientras la fase actual no haya sido completada y validada.

Flujo:

```text
+----------+
|  Fase N  |
+----+-----+
     |
     v
+------------------+
| Tickets completos|
+--------+---------+
         |
         v
+------------------+
| Validación       |
+--------+---------+
         |
         v
+------------------+
| Fase aprobada    |
+--------+---------+
         |
         v
+----------+
| Fase N+1 |
+----------+
```

Una fase solamente puede considerarse finalizada cuando:

```text
Todos los tickets
       |
       v
Estado DONE
       |
       v
Criterios aceptados
       |
       v
Pruebas ejecutadas
       |
       v
Evidencia disponible
       |
       v
Fase validada
```

---

# 6. Estrategia de Ramas

El repositorio utiliza un modelo derivado de GitFlow adaptado al desarrollo por tickets.

```text
                           +----------------+
                           |      main      |
                           |   producción   |
                           +-------^--------+
                                   |
                              Merge + Tag
                                   |
                           +-------+--------+
                           |    develop     |
                           |  integración   |
                           +-------^--------+
                                   |
              +--------------------+--------------------+
              |                    |                    |
              |                    |                    |
              v                    v                    v
     feature/BE-01       fix/DB-02-srid       refactor/KAF-03
```

---

# 7. Ramas Principales

## 7.1. main

La rama `main` contiene exclusivamente código estable.

Características:

- Código funcional.
- Código probado.
- Código validado.
- Código apto para demostraciones.
- Código correspondiente a versiones estables.
- Código asociado a hitos del proyecto.

No se permiten pushes directos.

Flujo:

```text
feature
   |
   v
develop
   |
   | validación
   v
fase completada
   |
   | tag
   v
main
```

---

## 7.2. develop

La rama `develop` representa el estado integrado del desarrollo.

Características:

- Es la rama base para nuevas funcionalidades.
- Recibe cambios mediante Pull Requests.
- No se debe trabajar directamente sobre ella.
- Debe mantenerse compilable.
- Debe mantenerse funcional.
- Debe contener únicamente cambios revisados.

---

# 8. Ramas de Trabajo

Todas las ramas temporales deben crearse desde la versión actualizada de `develop`.

Formato:

```text
<prefijo>/<ID_TICKET>-<descripcion-corta>
```

Ejemplo:

```text
feature/BE-01-spring-webflux
```

---

# 9. Tipos de Ramas

| Prefijo | Propósito | Ejemplo |
|---|---|---|
| `feature/` | Nueva funcionalidad | `feature/BE-01-spring-webflux` |
| `fix/` | Corrección de errores | `fix/DB-02-srid-postgis-index` |
| `refactor/` | Reestructuración interna | `refactor/KAF-03-incident-events` |
| `test/` | Pruebas | `test/TEST-01-cinco-reportes` |
| `docs/` | Documentación | `docs/INF-04-convenciones` |
| `ci/` | Automatización e infraestructura | `ci/INF-02-docker-compose` |

---

# 10. Reglas para Nombres de Ramas

Los nombres de ramas deben cumplir:

1. Utilizar el prefijo correspondiente.
2. Incluir obligatoriamente el ID del ticket.
3. Utilizar minúsculas en la descripción.
4. Utilizar `-` para separar palabras.
5. Ser descriptivos.
6. Evitar caracteres especiales.
7. Evitar espacios.
8. Evitar nombres genéricos.

## Correcto

```text
feature/BE-01-spring-webflux
feature/REP-01-post-reports
fix/DB-02-srid-postgis-index
refactor/KAF-03-incident-events
test/TEST-01-cinco-reportes
docs/INF-04-convenciones
ci/INF-02-docker-compose
```

## Incorrecto

```text
feature/nueva-funcionalidad
mi-rama
feature/BE01
BE-01
feature/BE_01
feature/NUEVO-ENDPOINT
```

---

# 11. Ciclo de Vida de una Rama

```text
develop
   |
   | git checkout
   v
nueva rama
   |
   v
desarrollo
   |
   v
pruebas locales
   |
   v
actualización desde develop
   |
   v
Pull Request
   |
   v
Code Review
   |
   v
Validación
   |
   v
Squash and Merge
   |
   v
develop
   |
   v
eliminación de rama
```

---

# 12. Convenciones de Commits

El proyecto utiliza Conventional Commits con identificación obligatoria del ticket.

Formato:

```text
<tipo>(<ID_TICKET>): <descripcion>
```

Ejemplo:

```text
feat(BE-01): init spring webflux base structure
```

---

# 13. Reglas de Commits

Los commits deben:

- Utilizar minúsculas.
- Utilizar modo imperativo.
- Ser concisos.
- Ser descriptivos.
- Estar asociados a un ticket.
- Representar un cambio lógico.
- Evitar mezclar cambios no relacionados.

---

# 14. Tipos de Commits Permitidos

| Tipo | Descripción |
|---|---|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de error |
| `refactor` | Reestructuración sin cambio funcional |
| `test` | Pruebas |
| `docs` | Documentación |
| `chore` | Mantenimiento |
| `ci` | Automatización e infraestructura |

---

# 15. Ejemplos de Commits

## Correctos

```text
feat(BE-01): init spring webflux base structure
```

```text
feat(DB-01): add flyway initial migration scripts
```

```text
fix(DB-02): correct geometry point srid for unit_locations
```

```text
feat(KAF-01): publish reports.created event on report persistence
```

```text
test(TEST-01): add report creation integration tests
```

```text
docs(INF-04): add repository coding conventions
```

---

## Incorrectos

```text
subiendo cambios
```

Problema:

```text
Sin tipo
Sin ticket
Sin descripción
```

```text
fix: arreglado bug en postgres
```

Problema:

```text
Falta ID del ticket
```

```text
FEAT(BE01) endpoints listos
```

Problemas:

```text
Mayúsculas
Formato de ticket incorrecto
Falta descripción convencional
```

```text
update
```

Problema:

```text
Descripción insuficiente
```

---

# 16. Estructura del Backend

El backend utiliza una arquitectura reactiva basada en:

```text
Spring WebFlux
       |
       v
     R2DBC
       |
       v
 PostgreSQL
       |
       +---- PostGIS
       |
       v
     Kafka
```

El paradigma principal es:

```text
No bloqueante
+
Reactivo
+
Asíncrono
+
Desacoplado
```

---

# 17. Paquete Base

```text
com.centinela360
```

---

# 18. Estructura de Paquetes

```text
com.centinela360
|
+-- config/
|   |
|   +-- DatabaseConfig.java
|   +-- KafkaTopicConfig.java
|   +-- WebFluxConfig.java
|
+-- security/
|   |
|   +-- jwt/
|   |   |
|   |   +-- JwtService.java
|   |   +-- JwtAuthenticationFilter.java
|   |   +-- JwtProperties.java
|   |
|   +-- roles/
|   |   |
|   |   +-- Role.java
|   |
|   +-- SecurityContext.java
|
+-- controller/
|   |
|   +-- ReportController.java
|   +-- IncidentController.java
|
+-- service/
|   |
|   +-- ReportService.java
|   +-- IncidentService.java
|   |
|   +-- impl/
|       |
|       +-- ReportServiceImpl.java
|       +-- IncidentServiceImpl.java
|
+-- domain/
|   |
|   +-- dto/
|   |   |
|   |   +-- request/
|   |   |   |
|   |   |   +-- CreateReportRequest.java
|   |   |   +-- UpdateReportRequest.java
|   |   |
|   |   +-- response/
|   |       |
|   |       +-- ReportResponse.java
|   |       +-- IncidentResponse.java
|   |
|   +-- model/
|       |
|       +-- Report.java
|       +-- Incident.java
|
+-- repository/
|   |
|   +-- ReportRepository.java
|   +-- IncidentRepository.java
|   |
|   +-- custom/
|       |
|       +-- ReportSpatialRepository.java
|       +-- IncidentSpatialRepository.java
|
+-- kafka/
    |
    +-- producer/
    |   |
    |   +-- ReportEventProducer.java
    |
    +-- consumer/
        |
        +-- ReportValidationConsumer.java
```

---

# 19. Responsabilidades por Capa

## 19.1. config

Contiene configuraciones globales.

Ejemplos:

```text
DatabaseConfig
KafkaTopicConfig
WebFluxConfig
```

Responsabilidades:

- R2DBC.
- PostgreSQL.
- PostGIS.
- Kafka.
- CORS.
- OpenAPI.
- WebFlux.

---

## 19.2. security

Contiene la seguridad de la aplicación.

Responsabilidades:

- Autenticación.
- Autorización.
- JWT.
- Roles.
- Contexto de seguridad.
- Filtros reactivos.

Roles:

```text
CITIZEN
OPERATOR
PATROL
ADMIN
```

---

## 19.3. controller

Responsabilidades:

```text
HTTP Request
     |
     v
Controller
     |
     v
Service
     |
     v
HTTP Response
```

Los controladores:

- Reciben requests.
- Validan entrada.
- Delegan al servicio.
- Retornan DTOs.
- Gestionan códigos HTTP.
- Trabajan con `Mono` y `Flux`.

No deben contener lógica de negocio compleja.

---

# 20. service

La capa `service` contiene la lógica de negocio.

Arquitectura:

```text
Controller
    |
    v
Service Interface
    |
    v
Service Implementation
    |
    v
Repository / Kafka / Domain
```

Ejemplo:

```text
ReportService.java
ReportServiceImpl.java
```

La interfaz define el contrato.

La implementación contiene los casos de uso.

---

# 21. domain

Representa el dominio de la aplicación.

```text
domain/
|
+-- dto/
|
+-- model/
```

## model

Representa entidades persistentes.

Ejemplos:

```text
Report.java
Incident.java
```

## dto

Representa objetos de transferencia.

```text
dto/
|
+-- request/
|
+-- response/
```

---

# 22. repository

La capa repository proporciona acceso reactivo a los datos.

Ejemplo:

```java
public interface ReportRepository
        extends ReactiveCrudRepository<Report, Long> {
}
```

Responsabilidades:

- Consultas.
- Persistencia.
- Recuperación de información.
- Operaciones espaciales.
- Integración con PostgreSQL/PostGIS.

---

# 23. kafka

La capa Kafka maneja comunicación asíncrona.

```text
kafka/
|
+-- producer/
|
+-- consumer/
```

## producer

Publica eventos.

## consumer

Consume eventos.

---

# 24. Programación Reactiva

El backend debe utilizar programación reactiva de extremo a extremo.

Flujo esperado:

```text
HTTP
 |
 v
Controller
 |
 v
Mono / Flux
 |
 v
Service
 |
 v
Mono / Flux
 |
 v
Repository
 |
 v
R2DBC
 |
 v
PostgreSQL
```

---

# 25. Regla de Cero Bloqueo

Está prohibido introducir operaciones bloqueantes en los flujos reactivos.

No se debe utilizar:

```java
.block()
```

```java
.toStream()
```

```java
Thread.sleep()
```

Tampoco se deben introducir APIs bloqueantes tradicionales en:

- Controllers.
- Services.
- Repositories.
- Flujos reactivos.

---

# 26. Operadores Reactivos Permitidos

Se deben utilizar operadores reactivos según corresponda:

```java
.map()
```

```java
.flatMap()
```

```java
.filter()
```

```java
.switchIfEmpty()
```

```java
.onErrorResume()
```

```java
.zip()
```

```java
.then()
```

```java
.concatMap()
```

```java
.flatMapMany()
```

---

# 27. Aislamiento del Modelo de Datos

Los controllers no deben exponer directamente entidades persistentes.

## Incorrecto

```java
@GetMapping("/{id}")
public Mono<Report> getReport(
        @PathVariable Long id) {

    return reportService.findById(id);
}
```

## Correcto

```java
@GetMapping("/{id}")
public Mono<ReportResponse> getReport(
        @PathVariable Long id) {

    return reportService.findById(id);
}
```

Arquitectura:

```text
Database Entity
      |
      v
   Service
      |
      v
     DTO
      |
      v
 Controller
      |
      v
    Client
```

Esto reduce el acoplamiento entre:

```text
API <----> Persistencia
```

---

# 28. Manejo Global de Excepciones

Los errores deben centralizarse mediante un manejador global.

Ejemplo:

```java
@RestControllerAdvice
public class GlobalExceptionHandler {
}
```

La API debe utilizar una estructura compatible con RFC 7807.

Ejemplo:

```json
{
  "type": "/errors/report-not-found",
  "title": "Report not found",
  "status": 404,
  "detail": "The requested report does not exist",
  "instance": "/api/reports/1024"
}
```

---

# 29. Estándar de Eventos Kafka

Código del estándar:

```text
EVT-STD
```

Toda comunicación mediante eventos Kafka debe utilizar un formato común.

---

# 30. Estructura Base del Evento

```json
{
  "eventId": "uuid-v4-generado",
  "eventType": "reports.created",
  "occurredAt": "2026-09-12T22:30:00Z",
  "source": "report-service",
  "correlationId": "uuid-v4-trazabilidad",
  "payload": {
    "reportId": 1024,
    "channel": "APP_SOS",
    "category": "ROBO",
    "location": {
      "latitude": -6.77137,
      "longitude": -79.84088
    }
  }
}
```

---

# 31. Campos Obligatorios del Evento

| Campo | Obligatorio | Descripción |
|---|---:|---|
| `eventId` | Sí | Identificador único |
| `eventType` | Sí | Tipo de evento |
| `occurredAt` | Sí | Momento de generación |
| `source` | Sí | Servicio origen |
| `correlationId` | Sí | Identificador de trazabilidad |
| `payload` | Sí | Datos del evento |

---

# 32. eventId

Debe ser único.

Formato recomendado:

```text
UUID v4
```

Ejemplo:

```text
550e8400-e29b-41d4-a716-446655440000
```

No debe reutilizarse un `eventId`.

---

# 33. eventType

Debe utilizar nombres semánticos.

Formato:

```text
<recurso>.<accion>
```

Ejemplos:

```text
reports.created
reports.updated
reports.cancelled

incidents.created
incidents.assigned
incidents.resolved

patrols.dispatched

alerts.created
```

---

# 34. occurredAt

Representa el momento exacto en que ocurrió el evento.

Formato recomendado:

```text
ISO-8601 UTC
```

Ejemplo:

```text
2026-09-12T22:30:00Z
```

---

# 35. source

Identifica el servicio que originó el evento.

Ejemplos:

```text
report-service
incident-service
patrol-service
notification-service
```

---

# 36. correlationId

Permite realizar trazabilidad distribuida.

Ejemplo:

```text
b8f9e3f4-6e4d-4e87-a4db-7a2b1b7d3c22
```

Flujo:

```text
Request
  |
  | correlationId = A
  v
Report Service
  |
  | correlationId = A
  v
Kafka
  |
  | correlationId = A
  v
Incident Service
  |
  | correlationId = A
  v
Notification Service
```

El mismo `correlationId` permite reconstruir la operación completa.

---

# 37. Idempotencia de Consumidores

Todo consumidor Kafka debe ser idempotente.

Flujo:

```text
             +----------------+
             |  Kafka Event   |
             +-------+--------+
                     |
                     v
             +---------------+
             | eventId existe|
             | anteriormente?|
             +-------+-------+
                     |
            +--------+--------+
            |                 |
           SI                NO
            |                 |
            v                 v
       Ignorar evento     Procesar evento
                              |
                              v
                       Registrar eventId
                              |
                              v
                       Confirmar proceso
```

Objetivo:

- Evitar duplicados.
- Evitar notificaciones repetidas.
- Evitar escrituras duplicadas.
- Evitar efectos secundarios repetidos.
- Garantizar procesamiento seguro.

---

# 38. Proceso de Pull Request

Todo cambio que deba integrarse en `develop` requiere Pull Request.

Flujo:

```text
Desarrollo
    |
    v
Pruebas locales
    |
    v
Actualización desde develop
    |
    v
Push de rama
    |
    v
Pull Request
    |
    v
Code Review
    |
    v
Correcciones
    |
    v
Validación
    |
    v
Aprobación
    |
    v
Squash and Merge
    |
    v
develop
```

---

# 39. Requisitos para Abrir un Pull Request

Antes de crear un PR se debe comprobar:

## 39.1. Rama actualizada

```bash
git fetch origin
git merge origin/develop
```

o:

```bash
git fetch origin
git rebase origin/develop
```

---

## 39.2. Backend

Gradle:

```bash
./gradlew clean build
```

Maven:

```bash
./mvnw clean package
```

---

## 39.3. Frontend

```bash
npm run build
```

---

## 39.4. Pruebas

```bash
./gradlew test
```

o:

```bash
./mvnw test
```

---

## 39.5. Docker

Levantar infraestructura:

```bash
docker compose up -d
```

Verificar:

```bash
docker compose ps
```

Servicios mínimos:

```text
postgres
kafka
```

---

# 40. Validación de Infraestructura

Antes de abrir el PR:

```text
+----------------------+
| docker compose up -d |
+----------+-----------+
           |
           v
+----------------------+
| docker compose ps    |
+----------+-----------+
           |
           v
+----------------------+
| PostgreSQL           |
| Kafka                |
+----------+-----------+
           |
           v
+----------------------+
| Servicios saludables |
+----------------------+
```

---

# 41. Evidencia Obligatoria

El Pull Request debe contener evidencia relacionada directamente con el ticket.

Ejemplos:

```text
Postman
Swagger
Logs
Tests
Docker
PostgreSQL
Kafka
Frontend
```

La evidencia debe permitir que un revisor pueda verificar el criterio de aceptación sin depender exclusivamente de la explicación del desarrollador.

---

# 42. Plantilla Oficial de Pull Request

```markdown
### Ticket Asociado

- **ID del Ticket:** [ID_TICKET]
- **Título del Ticket:** [Título según plan maestro]

---

### Descripción de los Cambios

- [Cambio realizado]
- [Componente afectado]
- [Consideración técnica relevante]

---

### Cumplimiento del Criterio de Aceptación

**Criterio establecido:**

[Copiar textualmente el criterio de aceptación]

**Resultado obtenido:**

[Explicar cómo se validó]

---

### Evidencia de Pruebas

Adjuntar:

- Capturas de pantalla.
- Logs.
- Resultados de tests.
- Evidencia de Postman.
- Evidencia de Swagger.
- Evidencia de Docker.
- Evidencia de Kafka.
- Evidencia de PostgreSQL.

---

### Pruebas Ejecutadas

```text
./gradlew clean build
./gradlew test
npm run build
docker compose ps
```

---

### Checklist de Auto-revisión

- [ ] El PR corresponde a un único ticket.
- [ ] La rama está sincronizada con develop.
- [ ] No contiene código bloqueante.
- [ ] No utiliza `.block()`.
- [ ] No utiliza `Thread.sleep()`.
- [ ] No utiliza `.toStream()` en flujos reactivos.
- [ ] No expone entidades directamente.
- [ ] Se utilizan DTOs.
- [ ] La lógica de negocio está ubicada en service.
- [ ] El acceso a datos está ubicado en repository.
- [ ] Los commits cumplen Conventional Commits.
- [ ] Todos los commits contienen el ID del ticket.
- [ ] Las pruebas pasan correctamente.
- [ ] La aplicación compila correctamente.
- [ ] Docker Compose funciona correctamente.
- [ ] Se adjuntó evidencia.
- [ ] El criterio de aceptación fue validado.
- [ ] No existen errores críticos.
```

---

# 43. Revisión por Code Reviewer

Todo Pull Request debe ser revisado por al menos un Code Reviewer.

El revisor debe verificar:

```text
+-----------------------+
| Pull Request          |
+-----------+-----------+
            |
            v
+-----------------------+
| Arquitectura          |
+-----------+-----------+
            |
            v
+-----------------------+
| Código                |
+-----------+-----------+
            |
            v
+-----------------------+
| Pruebas               |
+-----------+-----------+
            |
            v
+-----------------------+
| Criterios aceptación  |
+-----------+-----------+
            |
            v
+-----------------------+
| Evidencia             |
+-----------+-----------+
            |
            v
+-----------------------+
| Aprobación            |
+-----------------------+
```

---

# 44. Revisión de Arquitectura

El revisor debe comprobar:

- [ ] Separación correcta de responsabilidades.
- [ ] Estructura de paquetes correcta.
- [ ] Ausencia de acoplamiento innecesario.
- [ ] Correcto uso de las capas.
- [ ] Correcto uso de DTOs.
- [ ] Ausencia de lógica de negocio en controllers.
- [ ] Correcta utilización de repositories.

---

# 45. Revisión del Backend

Debe comprobarse:

- [ ] Programación reactiva.
- [ ] Ausencia de `.block()`.
- [ ] Ausencia de `Thread.sleep()`.
- [ ] Ausencia de APIs bloqueantes.
- [ ] Uso correcto de `Mono`.
- [ ] Uso correcto de `Flux`.
- [ ] Correcto manejo de errores.
- [ ] Uso correcto de DTOs.
- [ ] Validación de entrada.
- [ ] Separación de responsabilidades.

---

# 46. Revisión de Base de Datos

Debe verificarse:

- [ ] Migraciones versionadas.
- [ ] Esquema consistente.
- [ ] Índices apropiados.
- [ ] Claves primarias.
- [ ] Claves foráneas.
- [ ] Restricciones.
- [ ] Tipos de datos.
- [ ] Integridad referencial.
- [ ] Uso correcto de PostGIS.
- [ ] SRID correcto cuando corresponda.
- [ ] Consultas espaciales correctamente implementadas.

---

# 47. Revisión de Kafka

Debe verificarse:

- [ ] `eventId`.
- [ ] `eventType`.
- [ ] `occurredAt`.
- [ ] `source`.
- [ ] `correlationId`.
- [ ] `payload`.
- [ ] Idempotencia.
- [ ] Nombre correcto del topic.
- [ ] Productor correctamente configurado.
- [ ] Consumidor correctamente configurado.
- [ ] Manejo de errores.
- [ ] Trazabilidad.

---

# 48. Revisión de Testing

Debe comprobarse:

- [ ] Existen pruebas para la funcionalidad.
- [ ] Las pruebas pasan.
- [ ] Se cubren casos exitosos.
- [ ] Se cubren casos de error.
- [ ] Se cubren validaciones relevantes.
- [ ] Las pruebas son reproducibles.
- [ ] No existen pruebas dependientes del entorno local.

---

# 49. Resolución de Comentarios

Todos los comentarios críticos o relevantes deben ser atendidos antes del merge.

Proceso:

```text
Reviewer
   |
   v
Comentario
   |
   v
Desarrollador
   |
   v
Corrección
   |
   v
Nueva prueba
   |
   v
Reviewer
   |
   v
Resolución
```

No se debe realizar merge mientras existan observaciones críticas pendientes.

---

# 50. Estrategia de Merge

La integración debe realizarse mediante:

```text
Squash and Merge
```

Esto permite mantener un historial limpio.

Ejemplo:

```text
feature/BE-01
      |
      +-- commit 1
      +-- commit 2
      +-- commit 3
      +-- commit 4
      |
      v
Squash
      |
      v
develop
      |
      +-- feat(BE-01): init spring webflux base structure
```

---

# 51. Mensaje Final del Merge

El commit generado mediante Squash debe cumplir:

```text
<tipo>(<ID_TICKET>): <resumen>
```

Ejemplo:

```text
feat(BE-01): init spring webflux base structure
```

---

# 52. Estados del Ticket

Cada ticket debe seguir un flujo controlado.

```text
+----------+
| BACKLOG  |
+----+-----+
     |
     v
+----------+
|  READY   |
+----+-----+
     |
     v
+-------------+
| IN PROGRESS |
+------+------+ 
       |
       v
+-------------+
| IN REVIEW   |
+------+------+ 
       |
       v
+-------------+
| VALIDATION  |
+------+------+ 
       |
       v
+-------------+
|    DONE     |
+-------------+
```

---

# 53. Estado BACKLOG

El ticket está definido pero todavía no está listo para desarrollo.

Puede faltar:

- Descripción.
- Criterios de aceptación.
- Dependencias.
- Información técnica.

---

# 54. Estado READY

El ticket está preparado para ser desarrollado.

Debe contener como mínimo:

- Identificador.
- Título.
- Descripción.
- Criterios de aceptación.
- Dependencias conocidas.
- Fase correspondiente.

---

# 55. Estado IN PROGRESS

El desarrollador ha comenzado la implementación.

En este estado debe existir:

```text
Ticket
  |
  v
Rama
  |
  v
Desarrollo
  |
  v
Commits
```

---

# 56. Estado IN REVIEW

La implementación terminó y existe un Pull Request abierto.

Debe existir:

- Código.
- Pruebas.
- Evidencia.
- Descripción del cambio.
- Criterios de aceptación.

---

# 57. Estado VALIDATION

El Pull Request fue revisado y se encuentra en proceso de validación final.

Debe verificarse:

```text
Código
  +
Pruebas
  +
Criterios
  +
Evidencia
  +
Infraestructura
```

---

# 58. Estado DONE

El ticket puede pasar a `DONE` únicamente cuando:

```text
PR aprobado
     +
Comentarios resueltos
     +
Tests correctos
     +
Criterios aceptados
     +
Evidencia validada
     +
Merge realizado
     =
DONE
```

---

# 59. Convenciones de Código Java

Las clases deben utilizar nombres en PascalCase.

Correcto:

```text
ReportController
ReportService
ReportRepository
IncidentService
JwtService
```

Incorrecto:

```text
reportcontroller
report_service
REPORTSERVICE
```

---

# 60. Convenciones de Métodos

Los métodos deben utilizar camelCase.

Correcto:

```java
createReport()
findReportById()
updateIncident()
deleteReport()
publishReportCreatedEvent()
```

Incorrecto:

```java
CreateReport()
find_report()
FINDREPORT()
```

---

# 61. Convenciones de Variables

Las variables deben utilizar camelCase.

Correcto:

```java
reportId
incidentStatus
patrolLocation
correlationId
eventType
```

Incorrecto:

```java
Report_Id
REPORT_ID
report-id
```

---

# 62. Constantes

Las constantes deben utilizar:

```text
UPPER_SNAKE_CASE
```

Ejemplo:

```java
private static final String REPORT_TOPIC = "reports";
private static final int MAX_REPORTS = 100;
```

---

# 63. Nombres de DTOs

Los DTOs deben indicar claramente su propósito.

Ejemplos:

```text
CreateReportRequest
UpdateReportRequest
ReportResponse
IncidentResponse
PatrolResponse
CreateIncidentRequest
```

Evitar nombres genéricos:

```text
DataDTO
RequestDTO
ResponseDTO
ObjectDTO
```

---

# 64. Principio de Responsabilidad Única

Cada clase debe tener una responsabilidad claramente definida.

Ejemplo:

```text
Controller
    |
    | HTTP
    v
Service
    |
    | Business Logic
    v
Repository
    |
    | Persistence
    v
Database
```

No se debe implementar acceso directo a base de datos dentro de controllers.

---

# 65. Separación de Responsabilidades

Arquitectura recomendada:

```text
+----------------------+
|      Controller      |
| HTTP / DTO           |
+----------+-----------+
           |
           v
+----------------------+
|       Service        |
| Business Logic       |
+----------+-----------+
           |
           +----------------+
           |                |
           v                v
+----------------+   +----------------+
|   Repository   |   |     Kafka      |
| Persistence    |   | Events         |
+-------+--------+   +----------------+
        |
        v
+----------------+
| PostgreSQL     |
| PostGIS        |
+----------------+
```

---

# 66. Reglas de Documentación

Toda funcionalidad importante debe contar con documentación técnica cuando sea necesario.

La documentación debe explicar:

- Propósito.
- Uso.
- Dependencias.
- Configuración.
- Endpoints.
- Eventos.
- Variables de entorno.
- Consideraciones especiales.

Los documentos técnicos deben almacenarse en:

```text
/docs
```

---

# 67. Convenciones de Archivos Markdown

Los documentos deben utilizar:

```text
kebab-case
```

Ejemplos:

```text
inf-04-convenciones.md
arquitectura-backend.md
modelo-dominio.md
eventos-kafka.md
api-rest.md
```

Evitar:

```text
Documento Final.md
DOCUMENTACION.md
documento_final_v2_FINAL.md
```

---

# 68. Estructura Recomendada de /docs

```text
docs/
|
+-- architecture/
|   +-- arquitectura-general.md
|   +-- arquitectura-backend.md
|
+-- database/
|   +-- modelo-datos.md
|   +-- postgis.md
|
+-- api/
|   +-- api-rest.md
|
+-- events/
|   +-- eventos-kafka.md
|
+-- development/
|   +-- inf-04-convenciones.md
|
+-- deployment/
|   +-- despliegue.md
```

---

# 69. Regla de Variables de Entorno

Las credenciales y secretos no deben almacenarse directamente en el repositorio.

No se permite:

```text
password=123456
```

```text
jwt.secret=mi-secreto
```

```text
KAFKA_PASSWORD=123456
```

dentro del código fuente o archivos versionados que contengan secretos reales.

Debe utilizarse configuración externa.

Ejemplo:

```text
.env
```

o variables de entorno.

---

# 70. Archivos que no deben versionarse

Ejemplos:

```text
.env
*.log
target/
build/
.gradle/
node_modules/
.idea/
.vscode/
```

Las excepciones deben justificarse técnicamente.

---

# 71. Integridad del Repositorio

Todo desarrollador debe evitar subir:

- Credenciales.
- Tokens.
- Contraseñas.
- Claves privadas.
- Archivos temporales.
- Builds generados.
- Logs personales.
- Dependencias descargadas.
- Configuraciones locales.

---

# 72. Reglas de Calidad Mínima

Ningún cambio debe integrarse si:

```text
Compilación          = ERROR
Tests                = ERROR
Criterio aceptación  = NO CUMPLIDO
PR                   = SIN REVIEW
Evidencia            = AUSENTE
```

La condición mínima debe ser:

```text
Compilación          = OK
Tests                = OK
Criterios            = OK
Review                = OK
Evidencia             = OK
Infraestructura       = OK
```

---

# 73. Flujo Completo de Desarrollo

El proceso estándar de desarrollo es:

```text
                 +----------------+
                 |     BACKLOG    |
                 +-------+--------+
                         |
                         v
                 +----------------+
                 |      READY     |
                 +-------+--------+
                         |
                         v
                 +----------------+
                 | Crear rama     |
                 +-------+--------+
                         |
                         v
                 +----------------+
                 | Desarrollo     |
                 +-------+--------+
                         |
                         v
                 +----------------+
                 | Tests locales  |
                 +-------+--------+
                         |
                         v
                 +----------------+
                 | Actualizar     |
                 | desde develop  |
                 +-------+--------+
                         |
                         v
                 +----------------+
                 | Pull Request   |
                 +-------+--------+
                         |
                         v
                 +----------------+
                 | Code Review    |
                 +-------+--------+
                         |
                         v
                 +----------------+
                 | Correcciones   |
                 +-------+--------+
                         |
                         v
                 +----------------+
                 | Validación     |
                 +-------+--------+
                         |
                         v
                 +----------------+
                 | Squash & Merge |
                 +-------+--------+
                         |
                         v
                 +----------------+
                 |    develop     |
                 +-------+--------+
                         |
                         v
                 +----------------+
                 |   Ticket DONE  |
                 +----------------+
```

---

# 74. Flujo de una Fase

Cada fase debe seguir el siguiente proceso:

```text
             FASE N
                |
                v
       +------------------+
       | Tickets de fase  |
       +--------+---------+
                |
                v
       +------------------+
       | Desarrollo       |
       +--------+---------+
                |
                v
       +------------------+
       | Pull Requests    |
       +--------+---------+
                |
                v
       +------------------+
       | Code Review      |
       +--------+---------+
                |
                v
       +------------------+
       | Validación       |
       +--------+---------+
                |
                v
       +------------------+
       | Todos DONE       |
       +--------+---------+
                |
                v
       +------------------+
       | Tag de fase      |
       +--------+---------+
                |
                v
       +------------------+
       | Siguiente fase   |
       +------------------+
```

---

# 75. Checklist General del Desarrollador

Antes de abrir un Pull Request:

```text
[ ] Ticket correctamente identificado
[ ] Rama creada desde develop
[ ] Nombre de rama correcto
[ ] Código implementado
[ ] Código revisado localmente
[ ] No existen operaciones bloqueantes
[ ] No existe .block()
[ ] No existe Thread.sleep()
[ ] No existe .toStream() inapropiado
[ ] DTOs implementados
[ ] Entidades no expuestas directamente
[ ] Lógica de negocio en service
[ ] Persistencia en repository
[ ] Tests implementados
[ ] Tests ejecutados
[ ] Backend compilado
[ ] Frontend compilado
[ ] Docker validado
[ ] PostgreSQL validado
[ ] Kafka validado cuando corresponda
[ ] Commits correctamente nombrados
[ ] Ticket incluido en commits
[ ] Rama sincronizada con develop
[ ] Evidencia recopilada
[ ] Pull Request creado
```

---

# 76. Checklist del Reviewer

```text
[ ] Ticket correcto
[ ] Alcance del PR correcto
[ ] Un único ticket
[ ] Arquitectura respetada
[ ] Código legible
[ ] Código mantenible
[ ] Sin código bloqueante
[ ] DTOs correctamente utilizados
[ ] Manejo de errores correcto
[ ] Persistencia correcta
[ ] Migraciones correctas
[ ] PostGIS correcto
[ ] Eventos Kafka correctos
[ ] Idempotencia implementada
[ ] Tests suficientes
[ ] Tests exitosos
[ ] Criterios de aceptación cumplidos
[ ] Evidencia suficiente
[ ] Sin secretos
[ ] Sin archivos innecesarios
[ ] Comentarios resueltos
[ ] PR listo para merge
```

---

# 77. Criterio de Aprobación

Un Pull Request solamente puede aprobarse cuando se cumplen todas las condiciones:

```text
                  +----------------------+
                  | Pull Request creado  |
                  +----------+-----------+
                             |
                             v
                  +----------------------+
                  | Código correcto      |
                  +----------+-----------+
                             |
                             v
                  +----------------------+
                  | Tests correctos      |
                  +----------+-----------+
                             |
                             v
                  +----------------------+
                  | Criterios cumplidos  |
                  +----------+-----------+
                             |
                             v
                  +----------------------+
                  | Evidencia disponible |
                  +----------+-----------+
                             |
                             v
                  +----------------------+
                  | Code Review aprobado |
                  +----------+-----------+
                             |
                             v
                  +----------------------+
                  | Squash and Merge     |
                  +----------+-----------+
                             |
                             v
                         DEVELOP
```

---

# 78. Regla de Bloqueo del Merge

El merge debe bloquearse si existe cualquiera de las siguientes condiciones:

```text
+-------------------------------------+
| Condición                           |
+-------------------------------------+
| Tests fallando                      |
| Build fallando                      |
| Criterio no cumplido                |
| Evidencia ausente                   |
| Revisión pendiente                  |
| Comentario crítico sin resolver     |
| Conflictos sin resolver             |
| Código bloqueante                   |
| Secretos expuestos                  |
| Ticket incorrecto                   |
| Rama incorrecta                     |
+-------------------------------------+
```

---

# 79. Regla de Trazabilidad

Todo cambio debe poder rastrearse desde:

```text
Ticket
   |
   v
Rama
   |
   v
Commit
   |
   v
Pull Request
   |
   v
Review
   |
   v
Merge
   |
   v
Versión
```

Esta trazabilidad constituye un requisito fundamental para mantener el control técnico del proyecto.

---

# 80. Control de Versiones del Documento

Los cambios realizados sobre este documento también deben cumplir las convenciones establecidas en el propio documento.

Ejemplo:

```text
docs/INF-04-convenciones
```

Commit:

```text
docs(INF-04): update pull request conventions
```

---

# 81. Regla Final

Las presentes convenciones son de cumplimiento obligatorio.

Ningún cambio debe integrarse a `develop` si incumple los estándares definidos en este documento.

La calidad del repositorio depende de que cada integrante mantenga disciplina sobre:

```text
Código
  +
Git
  +
Tickets
  +
Pruebas
  +
Documentación
  +
Revisión
  +
Trazabilidad
```

El objetivo no es solamente producir código funcional, sino mantener una base de código:

```text
Consistente
     +
Mantenible
     +
Trazable
     +
Probada
     +
Escalable
     +
Documentada
```

---

# 82. Resumen del Flujo Oficial

```text
+---------+
| Ticket  |
+----+----+
     |
     v
+---------+
|  READY  |
+----+----+
     |
     v
+----------------------+
| Crear rama           |
| desde develop        |
+----------+-----------+
           |
           v
+----------------------+
| Implementación       |
+----------+-----------+
           |
           v
+----------------------+
| Tests locales        |
+----------+-----------+
           |
           v
+----------------------+
| Sincronizar develop  |
+----------+-----------+
           |
           v
+----------------------+
| Pull Request         |
+----------+-----------+
           |
           v
+----------------------+
| Code Review          |
+----------+-----------+
           |
           v
+----------------------+
| Correcciones         |
+----------+-----------+
           |
           v
+----------------------+
| Validación final     |
+----------+-----------+
           |
           v
+----------------------+
| Squash and Merge     |
+----------+-----------+
           |
           v
+----------------------+
| develop              |
+----------+-----------+
           |
           v
+----------------------+
| Ticket DONE          |
+----------------------+
```

---

**Fin del documento INF-04**

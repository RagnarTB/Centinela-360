# CENTINELA 360 
# MANUAL MAESTRO DE PRUEBAS, FLUJOS Y OPERACIÓN
**Documento Técnico y Guía de Demostración**  
**Versión:** 2.0 (Completa — Fases 0 a 12)  
**Ciclo Académico:** 2026 — Ciclo 2 Agosto  
**Universidad Tecnológica del Perú (UTP)**

---

##  Índice de Contenidos

1. [Arquitectura y Mapa de Puertos](#1-arquitectura-y-mapa-de-puertos)
2. [Paso 0: Preparación y Checklist de Salud del Sistema](#2-paso-0-preparación-y-checklist-de-salud-del-sistema)
3. [Flujo 1: Reporte Ciudadano y Botón SOS de Emergencia](#3-flujo-1-reporte-ciudadano-y-botón-sos-de-emergencia)
4. [Flujo 2: Consolidación Espacio-Temporal en PostGIS](#4-flujo-2-consolidación-espacio-temporal-en-postgis)
5. [Flujo 3: Vista Operativa Central 360 (Operador)](#5-flujo-3-vista-operativa-central-360-operador)
6. [Flujo 4: Validación Humana y Calibración de TrustScore](#6-flujo-4-validación-humana-y-calibración-de-trustscore)
7. [Flujo 5: Recomendación Algorítmica y Despacho de Patrulla](#7-flujo-5-recomendación-algorítmica-y-despacho-de-patrulla)
8. [Flujo 6: Consola de la Patrulla y Simulación de GPS](#8-flujo-6-consola-de-la-patrulla-y-simulación-de-gps)
9. [Flujo 7: Portal Ciudadano (Noticias, Alertas y Prevención)](#9-flujo-7-portal-ciudadano-noticias-alertas-y-prevención)
10. [Flujo 8: Módulo de IA — Clustering (K-Means vs DBSCAN) y Rutas A*](#10-flujo-8-módulo-de-ia--clustering-k-means-vs-dbscan-y-rutas-a)
11. [Flujo 9: Demostración Automatizada de Punta a Punta (INC-024)](#11-flujo-9-demostración-automatizada-de-punta-a-punta-inc-024)
12. [Guía de Solución de Problemas (Troubleshooting)](#12-guía-de-solución-de-problemas-troubleshooting)

---

## 1. Arquitectura y Mapa de Puertos

Antes de iniciar las pruebas, verifica que los puertos requeridos no estén ocupados por otras aplicaciones:

| Componente | Puerto | Protocolo | Verificación Rápida |
| :--- | :---: | :---: | :--- |
| **PostgreSQL / PostGIS** | `5432` | TCP | Contenedor `centinela-postgres` |
| **Apache Kafka Broker** | `9092` | PLAINTEXT | Contenedor `centinela-kafka` |
| **Backend Reactivo Spring Boot** | `8080` | HTTP | `GET http://localhost:8080/actuator/health` |
| **Frontend Web React + Leaflet** | `3000` | HTTP | `http://localhost:3000` |

---

## 2. Paso 0: Preparación y Checklist de Salud del Sistema

### 2.1. Levantar Infraestructura Contenerizada
Abre una terminal en la raíz del repositorio (`d:\centinela390`):

```powershell
docker-compose up -d postgres kafka
```

*Verificar contenedores:*
```powershell
docker ps
```
Deberás observar `centinela-postgres` y `centinela-kafka` con estado `Up`.

### 2.2. Iniciar el Backend Reactivo
En una segunda terminal:

```powershell
cd d:\centinela390\backend
.\mvnw.cmd spring-boot:run
```
*Espera a que en los logs aparezca:*
`Started BackendApplication in X.XXX seconds (process running for X.XXX)`.

### 2.3. Iniciar el Frontend Web
En una tercera terminal:

```powershell
cd d:\centinela390\frontend
npm run dev
```
La aplicación web estará disponible inmediatamente en: **`http://localhost:3000`**.

---

## 3. Flujo 1: Reporte Ciudadano y Botón SOS de Emergencia
**Historias de Usuario:** `HU-CIU-01`, `HU-CIU-03`, `HU-CIU-04`  
**Ticket Técnico:** `REP-01`, `REP-02`

### Prueba en Interfaz Gráfica:
1. Abre tu navegador en `http://localhost:3000`.
2. En la barra superior, haz clic en **`📱 Portal Ciudadano & SOS`**.
3. **Prueba del Botón SOS (1 Toque):**
   * Presiona el botón circular rojo pulsante **`BOTÓN SOS`**.
   * Verás un mensaje verde de confirmación con el ID generado del reporte.
   * En la columna derecha (*Mis Reportes Ciudadanos*), observa cómo aparece de inmediato el reporte con categoría `EMERGENCIA_SOS` y estado `RECIBIDO`.
4. **Prueba de Reporte Rápido:**
   * En la columna central, selecciona la categoría: `Robo / Asalto en vía pública`.
   * En descripción, escribe: `Sujetos sospechosos en moto lineal frente al Banco de la Nación`.
   * Haz clic en **`Enviar Reporte a Central 360`**.
   * El reporte se registrará al instante y aparecerá en tu historial de reportes.

### Prueba alternativa vía terminal (PowerShell / curl):
```powershell
$body = @{
    channel = "APP"
    category = "ROBO"
    description = "Asalto en calle Elías Aguirre"
    location = @{ latitude = -6.7714; longitude = -79.8409 }
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8080/api/v1/reports" -Method Post -Body $body -ContentType "application/json"
```

---

## 4. Flujo 2: Consolidación Espacio-Temporal en PostGIS
**Historias de Usuario:** `HU-CEN-03`, `HU-CEN-05`  
**Tickets Técnicos:** `INC-01`, `INC-02`, `INC-03`

### Cómo funciona:
Cuando ingresa un reporte, el backend emite el evento en Kafka (`reports.created`). El servicio `ConsolidationService` busca con PostGIS (`ST_DWithin`) si existe otro reporte de la misma categoría a menos de **300 metros** en una ventana de **120 minutos**.
* Si existe: **Asocia** el reporte al incidente existente y eleva el TrustScore.
* Si no existe: **Crea** un nuevo incidente con su punto geográfico de origen.

### Verificación:
1. Envía un segundo reporte en coordenadas muy cercanas: `lat: -6.7716, lon: -79.8407`.
2. Ve a la pestaña **`🖥️ Central 360 (Operador)`**.
3. Selecciona el incidente: en la sección *Reportes ciudadanos asociados*, verás listados **ambos avisos agrupados bajo el mismo incidente**, demostrando que no se generó un falso duplicado.

---

## 5. Flujo 3: Vista Operativa Central 360 (Operador)
**Historias de Usuario:** `HU-CEN-01`, `HU-CEN-04`, `HU-CEN-07`  
**Tickets Técnicos:** `CENT-01`, `API-INC-01`, `API-INC-02`, `API-UNIT-01`

### Pasos de Comprobación:
1. Selecciona la pestaña **` Central 360 (Operador)`**.
2. **Columna Izquierda (Lista de Incidentes):**
   * Observa los incidentes ordenados por fecha con insignias de estado: `ABIERTO` (rojo), `ASIGNADO` (azul), `CONFIRMADO` (naranja), `ATENDIDO` (verde).
   * Muestra el cálculo de antigüedad (ej. `hace instantes`, `hace 2 min`).
3. **Columna Central (Mapa Interactivo Leaflet de Chiclayo):**
   * Círculos de incidentes geolocalizados en Chiclayo (`-6.7714, -79.8409`).
   * Marcadores con iconos de las patrullas policiales y de Serenazgo (`U-01`, `U-02`, `U-03`).
   * Al hacer clic en cualquier marcador o círculo, se despliega el popup con estado y categoría.
4. **Columna Derecha (Panel de Detalle):**
   * Coordenadas exactas, fecha y hora de registro.
   * Indicador del **TrustScore (Nivel de Confianza)**.
   * Lista exhaustiva de reportes ciudadanos vinculados.

---

## 6. Flujo 4: Validación Humana y Calibración de TrustScore
**Historias de Usuario:** `HU-CEN-06`, `HU-ADM-08`  
**Tickets Técnicos:** `VAL-01`, `VAL-02`, `VAL-03`

### Pasos de Comprobación:
1. En la Central 360, haz clic en un incidente en estado `ABIERTO`.
2. En la sección **`Validación Operativa (Revisión Humana)`**, verás los botones:
   * **`✓ Confirmar Hecho`**
   * **`✕ Descartar`**
3. Haz clic en **`✓ Confirmar Hecho`**:
   * El estado del incidente cambia automáticamente a `CONFIRMADO`.
   * El **TrustScore sube al 100%**, dejando constancia en la bitácora de que un operador humano validó la información mediante cámaras o comunicación directa.
4. Si hubieras hecho clic en **`✕ Descartar`**, el incidente pasaría a `DESCARTADO` (TrustScore 0%) y no se permitiría despachar patrullas para evitar desvío inútil de recursos.

---

## 7. Flujo 5: Recomendación Algorítmica y Despacho de Patrulla
**Historias de Usuario:** `HU-CEN-08`, `HU-CEN-09`  
**Tickets Técnicos:** `DSP-01`, `DSP-02`

### Pasos de Comprobación:
1. Con el incidente seleccionado (en estado `ABIERTO` o `CONFIRMADO`), revisa la tarjeta: **`Recomendación de Despacho (ETA)`**.
2. Observa la información calculada en tiempo real:
   * **Unidad recomendada:** (ej. `Unidad U-01`).
   * **Distancia geodésica:** Calculada por Haversine (ej. `312 m`).
   * **Tiempo Estimado de Llegada (ETA):** (ej. `1 min ETA`).
   * **Fundamento operativo:** Explicación técnica de por qué fue elegida.
3. Haz clic en el botón azul **`Asignar y Despachar Unidad`**.
4. **Resultado inmediato:**
   * El incidente pasa a estado `ASIGNADO`.
   * La unidad de patrulla pasa a estado `EN_CAMINO`.
   * Se genera el registro oficial de despacho y se notifica a la unidad asignada vía Kafka.

---

## 8. Flujo 6: Consola de la Patrulla y Simulación de GPS
**Historias de Usuario:** `HU-PAT-01`, `HU-PAT-04`, `HU-PAT-06`, `HU-PAT-07`  
**Tickets Técnicos:** `PAT-01`, `PAT-02`, `PAT-04`, `DSP-03`

### Pasos de Comprobación:
1. En la barra superior, haz clic en **` Consola Patrullero`**.
2. En el selector superior, elige la unidad a la que se le asignó el despacho (ej. `U-01`).
3. **Misión Activa (`HU-PAT-01`):**
   * En la columna derecha aparecerá la tarjeta roja con la insignia **`¡MISIÓN ACTIVA!`**, mostrando la categoría del incidente, sus coordenadas y estado.
4. **Simulador de Desplazamiento GPS (`HU-PAT-06`):**
   * En la columna izquierda, en el bloque *Simulador de Desplazamiento GPS*, haz clic en los botones del D-Pad (**`▲ Norte`**, **`▼ Sur`**, **`◄ Oeste`**, **`Este ►`**).
   * Verás cómo la latitud y longitud de la unidad se actualizan y transmiten al servidor en tiempo real.
   * Si regresas a la pestaña **`Central 360`**, verás que el marcador del patrullero se movió en el mapa de Chiclayo.
5. **Transición de Estados del Operativo (`HU-PAT-07`):**
   * Presiona el botón **`Reportar: Llegué al Lugar (En Sitio)`** $\to$ La patrulla y el despacho pasan a `EN_SITIO` (el incidente se muestra como `EN_ATENCION`).
   * Presiona el botón **`Marcar Hecho como Atendido`** $\to$ El despacho y el incidente se marcan como `ATENDIDO` (verde), y la patrulla vuelve a quedar `DISPONIBLE`.

---

## 9. Flujo 7: Portal Ciudadano (Noticias, Alertas y Prevención)
**Historias de Usuario:** `HU-ADM-05`, `HU-ADM-06`, `HU-CIU-08`  
**Tickets Técnicos:** `INF-01`, `INF-02`, `CIU-01`, `CIU-02`

### Pasos de Comprobación:
1. En la barra superior, haz clic en **` Portal Ciudadano & SOS`**.
2. En la sub-barra, haz clic en **` Noticias y Alertas Preventivas`**:
   * **Alertas Zonales:** Visualiza avisos con fecha de caducidad automática para evitar generar alarma permanente.
   * **Comunicaciones Oficiales:** Noticias categorizadas por etiquetas `OFICIAL`, `PREVENTIVO` e `INFORMATIVO`.
3. Haz clic en la subpestaña **` Prevención y Contactos de Emergencia`**:
   * Consulta las centrales telefónicas de Chiclayo (Serenazgo, Central 105, Bomberos 116, SAMU 106).
   * Revisa las pautas para reporte de **Problemas Urbanos (`CIU-02`)** sin interferir con la línea de emergencia.

---

## 10. Flujo 8: Módulo de IA — Clustering (K-Means vs DBSCAN) y Rutas A*
**Objetivo Académico:** Contenido de la Unidad 3 / APF3  
**Tickets Técnicos:** `IA-01`, `IA-02`

### 10.1. Prueba de Comparativa K-Means vs. DBSCAN (`IA-01`)
Ejecuta la consulta desde tu navegador o terminal:

```http
GET http://localhost:8080/api/v1/analytics/clustering-comparison?k=3&epsMeters=300&minPts=2
```

**Respuesta JSON esperada:**
* Total de reportes analizados.
* **K-Means:** Centroides calculados, inercia cuadrática total y conteo por cluster.
* **DBSCAN:** Número de clusters densos detectados y cantidad de puntos aislados clasificados como **Ruido** (`noisePointsCount`).
* **Dictamen técnico:** Explica por qué DBSCAN es la opción recomendada para incidentes y K-Means para zonificación de cuadrantes.

### 10.2. Prueba de Ruteo sobre Red Vial con A* (`IA-02`)
Calcula la ruta óptima entre el Parque Principal y el Mercado Modelo de Chiclayo:

```http
GET http://localhost:8080/api/v1/routes/calculate?startLat=-6.7714&startLon=-79.8409&endLat=-6.7675&endLon=-79.8425
```

**Respuesta JSON esperada:**
* `totalDistanceMeters`: Distancia real por calles (no euclidiana).
* `estimatedArrivalMinutes`: Tiempo estimado según velocidad urbana.
* `waypoints`: Nodos de la red vial transitados (ej. *Parque Principal* $\to$ *Av. Balta Norte* $\to$ *Mercado Modelo*).
* `roadSegments`: Nombres de las avenidas y calles recorridas.

---

## 11. Flujo 9: Demostración Automatizada de Punta a Punta (INC-024)
**Ticket Oficial:** `DEMO-01`, `TEST-01`, `MET-01`

Para realizar una demostración completa e impecable sin necesidad de hacer clics manuales ni escribir comandos individuales, hemos preparado el script interactivo oficial en PowerShell.

### Cómo ejecutarlo:
1. Asegúrate de tener levantados Docker y el backend.
2. Abre PowerShell en la raíz del proyecto y ejecuta:

```powershell
.\scripts\demo_inc024.ps1
```

### Qué realiza el script de forma autónoma:
1. Comprueba la salud del backend (`/actuator/health`).
2. Dispara 5 reportes en coordenadas contiguas del Centro de Chiclayo (3 por App, 1 por Llamada, 1 por Patrulla).
3. Espera 2 segundos y verifica que PostGIS y Kafka los consolidaron en **1 solo incidente** con **TrustScore ALTO**.
4. Simula la validación del operador confirmando el hecho.
5. Invoca el motor de recomendación algorítmica y obtiene la patrulla con menor ETA (ej. `U-01`).
6. Crea el despacho formal.
7. Transiciona los estados del patrullero: `EN_CAMINO` $\to$ `EN_SITIO` $\to$ `ATENDIDO`.
8. Imprime en pantalla el **Tablero de Métricas (MET-01)** con los tiempos y tasas de éxito comprobadas.

---

## 12. Guía de Solución de Problemas (Troubleshooting)

| Síntoma / Problema | Causa Probable | Solución Paso a Paso |
| :--- | :--- | :--- |
| **Error `Connection refused` en puerto 5432 o 9092** | Los contenedores Docker no están iniciados. | Ejecuta `docker-compose up -d postgres kafka` y revisa con `docker ps`. |
| **El mapa de Leaflet aparece en blanco o gris** | Problema de renderizado de capas en Leaflet. | El archivo `leaflet-fix.ts` ya resuelve las rutas de tiles e iconos. Si ocurre, refresca con `Ctrl + F5`. |
| **El backend arroja `Port 8080 already in use`** | Otra instancia de Spring Boot o Tomcat está activa. | En PowerShell busca el proceso: `netstat -ano \| findstr :8080` y ciérralo con `taskkill /PID <PID> /F`. |
| **No hay unidades recomendadas en la Central 360** | Las patrullas no están en estado `DISPONIBLE` o no tienen ubicación GPS. | En la base de datos corre: `docker exec centinela-postgres psql -U centinela -d centinela360 -c "UPDATE patrol_units SET status='DISPONIBLE';"` |
| **Los reportes no se consolidan en el mismo incidente** | La distancia entre coordenadas supera los 300 metros fijados en `application.yml`. | Usa coordenadas cercanas dentro del casco urbano de Chiclayo (ej. `-6.7714, -79.8409` y `-6.7716, -79.8407`). |

---
**Centinela 360 — Documento de Aseguramiento de Calidad y Manual de Operaciones 2026**

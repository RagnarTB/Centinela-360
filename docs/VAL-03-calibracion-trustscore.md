# Calibración de Confianza (TrustScore)
## Centinela 360 — Documento de Diseño y Versionado
**Código:** VAL-03  
**Versión:** 1.0 (MVP)  
**Fecha:** 2026-10-16  
**Ámbito:** Backend (`com.centinela360.service.TrustScoreService`)

---

### 1. Propósito y Límites Éticos

El **TrustScore** es una métrica probabilística y explicable (0 a 100) diseñada para apoyar al operador humano en la priorización operativa de incidentes.

> **Regla de negocio obligatoria:**
> El TrustScore **nunca** debe presentarse ni interpretarse como un detector de falsedad infalible ni como evidencia pericial. Es una ponderación operativa de coherencia espacio-temporal y multiplicidad de fuentes para optimizar recursos de patrullaje.

---

### 2. Factores y Ponderación del Score Automático

| Factor | Peso / Impacto | Justificación Operativa |
| :--- | :---: | :--- |
| **Canal PATRULLA** | `65.00` pts base | Reporte emitido por personal operativo en campo; mayor presunción de veracidad. |
| **Canal APP** | `45.00` pts base | Reporte digital con coordenadas GPS del dispositivo y trazabilidad de usuario. |
| **Canal LLAMADA** | `35.00` pts base | Reporte telefónico asistido por operador; coordenadas aproximadas por referencia verbal. |
| **Reportes Adicionales** | `+18.00` pts c/u | Cada reporte ciudadano cercano corroborando la misma zona aumenta la certeza. |
| **2 Canales Distintos** | `+15.00` pts bono | Corroboración cruzada (ej. llamada telefónica + reporte móvil en la misma ventana). |
| **3 Canales Distintos** | `+25.00` pts bono | Máxima corroboración multicanal (App + Central telefónica + Patrullaje). |
| **Tope Automático** | `98.00%` máx | Ningún algoritmo cierra la certeza al 100% sin intervención humana. |

---

### 3. Intervención Humana (Operador de Central)

Conforme al ticket **VAL-02** (`POST /api/v1/incidents/{id}/review`):
* **CONFIRMAR**: El operador valida el hecho mediante cámaras o contacto. El score pasa inmediatamente a **100.00%** y el incidente cambia a estado `CONFIRMADO`.
* **DESCARTAR**: El operador desestima el incidente (falsa alarma o error). El score pasa a **0.00%** y el incidente pasa a `DESCARTADO`.

---

### 4. Historial de Versiones

* **v1.0 (2026-10-16):** Calibración inicial heurística lineal para el MVP con datos simulados y dataset de Chiclayo.

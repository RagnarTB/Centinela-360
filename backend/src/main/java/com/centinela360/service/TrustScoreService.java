package com.centinela360.service;

import com.centinela360.domain.Report;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Motor de cálculo de confianza (TrustScore) - Fase 6 (VAL-01).
 * Factores de evaluación:
 * 1. Canal de origen del reporte base (APP, LLAMADA, PATRULLA).
 * 2. Cantidad de reportes acumulados asociados al mismo incidente.
 * 3. Diversidad de fuentes (reportes de canales distintos corroborando el mismo hecho).
 * El score automático tiene un tope de 98.00%; el 100.00% requiere confirmación de operador humano (VAL-02).
 */
@Service
public class TrustScoreService {

    public BigDecimal calculateScore(List<Report> reports) {
        if (reports == null || reports.isEmpty()) {
            return BigDecimal.valueOf(30.00).setScale(2, RoundingMode.HALF_UP);
        }

        // 1. Puntuación base según los canales presentes
        Set<String> channels = reports.stream()
                .map(r -> r.getChannel() != null ? r.getChannel().toUpperCase() : "APP")
                .collect(Collectors.toSet());

        double baseScore = 40.0;
        if (channels.contains("PATRULLA")) {
            baseScore = 65.0;
        } else if (channels.contains("APP")) {
            baseScore = 45.0;
        } else if (channels.contains("LLAMADA")) {
            baseScore = 35.0;
        }

        // 2. Bonus por reportes corroborantes adicionales
        int extraReports = reports.size() - 1;
        double repetitionBonus = extraReports * 18.0;

        // 3. Bonus por múltiples canales corroborando
        double multiSourceBonus = 0.0;
        if (channels.size() >= 3) {
            multiSourceBonus = 25.0;
        } else if (channels.size() == 2) {
            multiSourceBonus = 15.0;
        }

        double total = baseScore + repetitionBonus + multiSourceBonus;

        // Tope automático: 98.00% (el 100% se reserva para confirmación del operador)
        if (total > 98.0) {
            total = 98.0;
        }
        if (total < 10.0) {
            total = 10.0;
        }

        return BigDecimal.valueOf(total).setScale(2, RoundingMode.HALF_UP);
    }
}

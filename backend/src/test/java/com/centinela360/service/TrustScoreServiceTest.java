package com.centinela360.service;

import com.centinela360.domain.Report;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class TrustScoreServiceTest {

    private TrustScoreService trustScoreService;

    @BeforeEach
    void setUp() {
        trustScoreService = new TrustScoreService();
    }

    @Test
    void shouldReturnDefaultScoreForEmptyReports() {
        BigDecimal score = trustScoreService.calculateScore(List.of());
        assertEquals(new BigDecimal("30.00"), score);
    }

    @Test
    void shouldCalculateBaseScoreForAppReport() {
        Report report = Report.builder().channel("APP").category("ROBO").build();
        BigDecimal score = trustScoreService.calculateScore(List.of(report));
        assertEquals(new BigDecimal("45.00"), score);
    }

    @Test
    void shouldCalculateHigherBaseScoreForPatrolReport() {
        Report report = Report.builder().channel("PATRULLA").category("ROBO").build();
        BigDecimal score = trustScoreService.calculateScore(List.of(report));
        assertEquals(new BigDecimal("65.00"), score);
    }

    @Test
    void shouldIncreaseScoreWithMultipleReportsAndMultipleChannels() {
        Report r1 = Report.builder().channel("APP").category("ROBO").build();
        Report r2 = Report.builder().channel("LLAMADA").category("ROBO").build();

        BigDecimal score = trustScoreService.calculateScore(List.of(r1, r2));
        // Base: 45.0, 1 extra report: +18.0, 2 distinct channels: +15.0 => 78.00
        assertEquals(new BigDecimal("78.00"), score);
    }

    @Test
    void shouldCapScoreAtMaxAutomaticLevel() {
        Report r1 = Report.builder().channel("PATRULLA").category("ROBO").build();
        Report r2 = Report.builder().channel("APP").category("ROBO").build();
        Report r3 = Report.builder().channel("LLAMADA").category("ROBO").build();
        Report r4 = Report.builder().channel("APP").category("ROBO").build();

        BigDecimal score = trustScoreService.calculateScore(List.of(r1, r2, r3, r4));
        // Calculation exceeds 98.0 -> capped at 98.00
        assertEquals(new BigDecimal("98.00"), score);
    }
}

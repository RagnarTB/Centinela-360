package com.centinela360.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "centinela.consolidation")
public record ConsolidationProperties(
        double distanceMeters,
        long timeWindowMinutes
) {
}
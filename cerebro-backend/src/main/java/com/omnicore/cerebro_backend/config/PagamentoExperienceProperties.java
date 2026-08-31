package com.omnicore.cerebro_backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "omnicore.pagamento.experience")
public record PagamentoExperienceProperties(
        boolean enabled,
        String baseUrl,
        int connectTimeoutMs,
        int readTimeoutMs
) {
    public PagamentoExperienceProperties {
        if (baseUrl == null || baseUrl.isBlank()) {
            baseUrl = "http://localhost:9090";
        }
        if (connectTimeoutMs <= 0) {
            connectTimeoutMs = 5_000;
        }
        if (readTimeoutMs <= 0) {
            readTimeoutMs = 30_000;
        }
    }
}

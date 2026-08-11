package com.omnicore.cerebro_backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "omnicore.jwt")
public record JwtProperties(
        String secret,
        long expirationHours
) {

}

package com.omnicore.cerebro_backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "omnicore.storage")
public record StorageProperties(
        boolean enabled,
        String endpoint,
        String accessKey,
        String secretKey,
        String bucket,
        String publicBaseUrl,
        long maxFileSizeBytes
) {
    public StorageProperties {
        if (maxFileSizeBytes <= 0) {
            maxFileSizeBytes = 5L * 1024 * 1024;
        }
    }
}

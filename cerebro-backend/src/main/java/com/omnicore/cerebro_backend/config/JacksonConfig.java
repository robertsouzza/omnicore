package com.omnicore.cerebro_backend.config;

import org.springframework.boot.autoconfigure.jackson.Jackson2ObjectMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.omnicore.cerebro_backend.model.Produto;

@Configuration
public class JacksonConfig {

    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private interface ProdutoMixin {
    }

    @Bean
    Jackson2ObjectMapperBuilderCustomizer hibernateProxyJacksonCustomizer() {
        return builder -> builder.mixIn(Produto.class, ProdutoMixin.class);
    }
}

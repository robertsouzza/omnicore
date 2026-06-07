package com.omnicore.cerebro_backend.config;

import org.springdoc.core.utils.SpringDocUtils;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.Pageable;

@Configuration
public class OpenApiConfig {

    static {
        // Alinha o Springdoc para traduzir o objeto Pageable em parâmetros simples de URL (page, size, sort)
        SpringDocUtils.getConfig().replaceParameterObjectWithClass(Pageable.class, org.springdoc.core.annotations.ParameterObject.class);
    }

}

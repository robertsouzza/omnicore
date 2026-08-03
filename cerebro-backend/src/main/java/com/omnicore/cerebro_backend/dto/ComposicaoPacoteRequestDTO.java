package com.omnicore.cerebro_backend.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record ComposicaoPacoteRequestDTO(
        @NotNull(message = "O ID do produto filho é obrigatório.")
        Long produtoFilhoId,

        @NotNull(message = "A quantidade do componente é obrigatória.")
        @Positive(message = "A quantidade do componente deve ser maior que zero.")
        BigDecimal quantidade
) {
}

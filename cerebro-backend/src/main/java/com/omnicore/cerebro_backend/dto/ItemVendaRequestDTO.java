package com.omnicore.cerebro_backend.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public record ItemVendaRequestDTO(
    @NotNull(message = "O ID do produto é obrigatório.")
    Long produtoId,

    @NotNull(message = "A quantidade é obrigatória.")
    @Min(value = 1, message = "A quantidade deve ser no mínimo 1.")
    Integer quantidade,

    @NotNull(message = "O preço unitário é obrigatório.")
    @PositiveOrZero(message = "O preço unitário não pode ser negativo.")
    BigDecimal precoUnitario,

    @PositiveOrZero(message = "O desconto não pode ser negativo.")
    BigDecimal desconto
) {}

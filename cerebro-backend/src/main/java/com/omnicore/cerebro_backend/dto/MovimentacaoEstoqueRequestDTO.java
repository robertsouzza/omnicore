package com.omnicore.cerebro_backend.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record MovimentacaoEstoqueRequestDTO(
    @NotNull(message = "O ID do produto é obrigatório.")
    @JsonAlias("produto_id") // Aceita 'produto_id' se o Spring global exigir snake_case
    Long produtoId,

    @NotNull(message = "A quantidade é obrigatória.")
    @Positive(message = "A quantidade deve ser maior que zero.")
    Integer quantidade,

    String justificativa
) {
}
package com.omnicore.cerebro_backend.dto;

import com.omnicore.cerebro_backend.enums.StatusPagamento;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record PagamentoWebhookRequestDTO(
        @NotBlank(message = "O identificador da experiência é obrigatório.")
        String experienciaPagamentoId,

        @NotNull(message = "O status é obrigatório.")
        StatusPagamento status,

        String nsu,
        String referenciaExterna,
        String bandeira
) {
}

package com.omnicore.cerebro_backend.dto;

import java.math.BigDecimal;

import com.omnicore.cerebro_backend.enums.FormaPagamento;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;

public record PagarVendaRequestDTO(
        @NotNull(message = "A forma de pagamento é obrigatória.")
        FormaPagamento forma,

        @NotNull(message = "O valor do pagamento é obrigatório.")
        @DecimalMin(value = "0.01", message = "O valor do pagamento deve ser positivo.")
        @Digits(integer = 10, fraction = 2)
        BigDecimal valor,

        /** Obrigatório para DINHEIRO — valor entregue pelo cliente. */
        @Digits(integer = 10, fraction = 2)
        BigDecimal valorRecebido,

        /** Parcelas para CREDITO (default 1). */
        Integer parcelas
) {
}

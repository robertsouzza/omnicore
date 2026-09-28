package com.omnicore.cerebro_backend.dto;

public record SaldoIndicadorItemDTO(
        Long produtoId,
        int saldo,
        int referencia
) {
}

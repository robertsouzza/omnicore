package com.omnicore.cerebro_backend.dto;

/**
 * Saldo atual e referência (pico histórico) para indicador visual de nível de estoque.
 */
public record SaldoIndicadorResponseDTO(
        int saldo,
        int referencia
) {
}

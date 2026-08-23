package com.omnicore.cerebro_backend.util;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class CpfValidatorTest {

    @Test
    @DisplayName("Deve aceitar CPF válido")
    void deveAceitarCpfValido() {
        assertTrue(CpfValidator.isValido("12345678909"));
        assertTrue(CpfValidator.isValido("123.456.789-09"));
    }

    @Test
    @DisplayName("Deve rejeitar CPF com dígitos repetidos ou inválidos")
    void deveRejeitarCpfInvalido() {
        assertFalse(CpfValidator.isValido("111.111.111-11"));
        assertFalse(CpfValidator.isValido("1111111111"));
        assertFalse(CpfValidator.isValido("12345678900"));
    }
}

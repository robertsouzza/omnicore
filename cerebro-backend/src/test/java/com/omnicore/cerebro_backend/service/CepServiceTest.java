package com.omnicore.cerebro_backend.service;

import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.omnicore.cerebro_backend.exception.BusinessException;

class CepServiceTest {

    private final CepService cepService = new CepService();

    @Test
    @DisplayName("Deve rejeitar CEP com quantidade inválida de dígitos")
    void deveRejeitarCepInvalido() {
        assertThrows(BusinessException.class, () -> cepService.consultar("1234"));
    }
}

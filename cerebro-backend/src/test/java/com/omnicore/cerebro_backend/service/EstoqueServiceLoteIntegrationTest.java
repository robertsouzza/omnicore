package com.omnicore.cerebro_backend.service;

import static org.junit.jupiter.api.Assertions.assertFalse;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import com.omnicore.cerebro_backend.dto.SaldoIndicadorItemDTO;

@SpringBootTest
class EstoqueServiceLoteIntegrationTest {

    @Autowired
    private EstoqueService estoqueService;

    @Test
    void consultarSaldoIndicadorLoteNaoDeveFalharComIdsValidos() {
        List<SaldoIndicadorItemDTO> itens = estoqueService.consultarSaldoIndicadorLote(List.of(1L));
        assertFalse(itens.isEmpty());
    }
}

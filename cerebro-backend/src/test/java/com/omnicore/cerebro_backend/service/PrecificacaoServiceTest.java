package com.omnicore.cerebro_backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.omnicore.cerebro_backend.config.PrecificacaoProperties;
import com.omnicore.cerebro_backend.model.Produto;

class PrecificacaoServiceTest {

    private PrecificacaoService precificacaoService;

    @BeforeEach
    void setUp() {
        PrecificacaoProperties props = new PrecificacaoProperties();
        props.setMargemPadraoPercent(30);
        props.setMargensPorCategoria(Map.of("Bebidas", 25));
        precificacaoService = new PrecificacaoService(props);
    }

    @Test
    void deveCalcularPrecoSugeridoComMargemDaCategoria() {
        Produto produto = Produto.builder()
                .precoCusto(new BigDecimal("10.00"))
                .precoVenda(new BigDecimal("12.00"))
                .categoria("Bebidas")
                .build();

        precificacaoService.enriquecerIndicadoresPrecificacao(produto);

        assertEquals(25, produto.getMargemMinimaEfetivaPercent());
        assertEquals(new BigDecimal("13.33"), produto.getPrecoSugerido());
        assertTrue(produto.getAlertaMargem());
    }

    @Test
    void deveUsarMargemDoProdutoQuandoInformada() {
        Produto produto = Produto.builder()
                .precoCusto(new BigDecimal("8.00"))
                .precoVenda(new BigDecimal("12.00"))
                .categoria("Bebidas")
                .margemMinimaPercent(20)
                .build();

        precificacaoService.enriquecerIndicadoresPrecificacao(produto);

        assertEquals(20, produto.getMargemMinimaEfetivaPercent());
        assertEquals(new BigDecimal("10.00"), produto.getPrecoSugerido());
        assertFalse(produto.getAlertaMargem());
    }
}

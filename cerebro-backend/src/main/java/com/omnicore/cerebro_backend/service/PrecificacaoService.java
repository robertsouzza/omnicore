package com.omnicore.cerebro_backend.service;

import java.math.BigDecimal;
import java.math.RoundingMode;

import org.springframework.stereotype.Service;

import com.omnicore.cerebro_backend.config.PrecificacaoProperties;
import com.omnicore.cerebro_backend.model.Produto;

@Service
public class PrecificacaoService {

    private final PrecificacaoProperties properties;

    public PrecificacaoService(PrecificacaoProperties properties) {
        this.properties = properties;
    }

    public int resolverMargemMinimaPercent(Produto produto) {
        if (produto.getMargemMinimaPercent() != null) {
            return clampMargem(produto.getMargemMinimaPercent());
        }
        return properties.margemParaCategoria(produto.getCategoria());
    }

    public BigDecimal calcularPrecoSugerido(BigDecimal precoCusto, int margemMinimaPercent) {
        if (precoCusto == null) {
            return null;
        }
        int margem = clampMargem(margemMinimaPercent);
        if (margem >= 99) {
            return null;
        }
        BigDecimal divisor = BigDecimal.ONE.subtract(
                BigDecimal.valueOf(margem).divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP));
        if (divisor.compareTo(BigDecimal.ZERO) <= 0) {
            return null;
        }
        return precoCusto.divide(divisor, 2, RoundingMode.HALF_UP);
    }

    public boolean precoAbaixoMargem(BigDecimal precoVenda, BigDecimal precoSugerido) {
        if (precoVenda == null || precoSugerido == null) {
            return false;
        }
        return precoVenda.compareTo(precoSugerido) < 0;
    }

    public void enriquecerIndicadoresPrecificacao(Produto produto) {
        if (produto == null) {
            return;
        }
        int margem = resolverMargemMinimaPercent(produto);
        produto.setMargemMinimaEfetivaPercent(margem);
        BigDecimal sugerido = calcularPrecoSugerido(produto.getPrecoCusto(), margem);
        produto.setPrecoSugerido(sugerido);
        produto.setAlertaMargem(precoAbaixoMargem(produto.getPrecoVenda(), sugerido));
    }

    private static int clampMargem(int value) {
        return Math.clamp(value, 0, 99);
    }
}

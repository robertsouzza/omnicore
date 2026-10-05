package com.omnicore.cerebro_backend.config;

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "omnicore.precificacao")
public class PrecificacaoProperties {

    /** Margem mínima padrão (%) quando produto e categoria não definem outra. */
    private int margemPadraoPercent = 30;

    /** Margem mínima (%) por nome de categoria (comparação case-insensitive). */
    private Map<String, Integer> margensPorCategoria = new HashMap<>();

    public int getMargemPadraoPercent() {
        return margemPadraoPercent;
    }

    public void setMargemPadraoPercent(int margemPadraoPercent) {
        this.margemPadraoPercent = margemPadraoPercent;
    }

    public Map<String, Integer> getMargensPorCategoria() {
        return margensPorCategoria;
    }

    public void setMargensPorCategoria(Map<String, Integer> margensPorCategoria) {
        this.margensPorCategoria = margensPorCategoria;
    }

    public int margemParaCategoria(String categoria) {
        if (categoria == null || categoria.isBlank()) {
            return margemPadraoPercent;
        }
        String chave = categoria.trim().toLowerCase(Locale.ROOT);
        for (Map.Entry<String, Integer> entry : margensPorCategoria.entrySet()) {
            if (entry.getKey() != null && entry.getKey().trim().toLowerCase(Locale.ROOT).equals(chave)) {
                return clampMargem(entry.getValue());
            }
        }
        return margemPadraoPercent;
    }

    private static int clampMargem(Integer value) {
        if (value == null) {
            return 30;
        }
        return Math.clamp(value, 0, 99);
    }
}

package com.omnicore.cerebro_backend.dto;

import java.math.BigDecimal;

import com.omnicore.cerebro_backend.enums.IndicadorTamanho;
import com.omnicore.cerebro_backend.enums.TipoProduto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record ProdutoRequestDTO(
    @NotBlank(message = "O código de barras é obrigatório.")
    @Size(max = 50, message = "O código de barras deve ter no máximo 50 caracteres.")
    String codigoBarras,

    @NotBlank(message = "O nome do produto é obrigatório.")
    @Size(max = 150, message = "O nome deve ter no máximo 150 caracteres.")
    String nome,

    String descricao,

    @NotNull(message = "O preço de venda é obrigatório.")
    @PositiveOrZero(message = "O preço de venda não pode ser negativo.")
    BigDecimal precoVenda,

    @NotBlank(message = "A categoria é obrigatória.")
    @Size(max = 50, message = "A categoria deve ter no máximo 50 caracteres.")
    String categoria,

    String urlImagem,

    @NotNull(message = "O tipo do produto é obrigatório.")
    TipoProduto tipoProduto,

    @NotNull(message = "O indicador de tamanho é obrigatório.")
    IndicadorTamanho indicadorTamanho
) {

}

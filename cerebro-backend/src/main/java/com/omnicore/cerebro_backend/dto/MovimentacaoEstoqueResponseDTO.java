package com.omnicore.cerebro_backend.dto;

import java.time.LocalDateTime;

import com.omnicore.cerebro_backend.enums.TipoMovimentacaoEstoque;
import com.omnicore.cerebro_backend.model.MovimentacaoEstoque;

public record MovimentacaoEstoqueResponseDTO(
        Long id,
        Long produtoId,
        TipoMovimentacaoEstoque tipo,
        Integer quantidade,
        LocalDateTime dataHora,
        String justificativa,
        Long vendaId
) {

    public static MovimentacaoEstoqueResponseDTO from(MovimentacaoEstoque movimentacao) {
        return new MovimentacaoEstoqueResponseDTO(
                movimentacao.getId(),
                movimentacao.getProduto().getId(),
                movimentacao.getTipo(),
                movimentacao.getQuantidade(),
                movimentacao.getDataHora(),
                movimentacao.getJustificativa(),
                movimentacao.getVendaId());
    }
}

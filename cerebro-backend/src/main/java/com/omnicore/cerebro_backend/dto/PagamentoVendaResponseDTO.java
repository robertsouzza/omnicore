package com.omnicore.cerebro_backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.omnicore.cerebro_backend.enums.FormaPagamento;
import com.omnicore.cerebro_backend.enums.ProviderPagamento;
import com.omnicore.cerebro_backend.enums.StatusPagamento;
import com.omnicore.cerebro_backend.model.PagamentoVenda;

public record PagamentoVendaResponseDTO(
        Long id,
        Long vendaId,
        FormaPagamento forma,
        BigDecimal valor,
        BigDecimal valorRecebido,
        BigDecimal troco,
        StatusPagamento status,
        ProviderPagamento provider,
        String referenciaExterna,
        String nsu,
        String experienciaPagamentoId,
        String urlExperiencia,
        LocalDateTime dataHora
) {

    public static PagamentoVendaResponseDTO from(PagamentoVenda pagamento, String urlExperiencia) {
        return new PagamentoVendaResponseDTO(
                pagamento.getId(),
                pagamento.getVendaId(),
                pagamento.getForma(),
                pagamento.getValor(),
                pagamento.getValorRecebido(),
                pagamento.getTroco(),
                pagamento.getStatus(),
                pagamento.getProvider(),
                pagamento.getReferenciaExterna(),
                pagamento.getNsu(),
                pagamento.getExperienciaPagamentoId(),
                urlExperiencia,
                pagamento.getDataHora());
    }

    public static PagamentoVendaResponseDTO from(PagamentoVenda pagamento) {
        return from(pagamento, null);
    }
}

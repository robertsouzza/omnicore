package com.omnicore.cerebro_backend.pagamento;

import java.math.BigDecimal;

import com.omnicore.cerebro_backend.enums.FormaPagamento;

public record IniciarExperienciaRequest(
        String referenciaOmniCore,
        Long vendaId,
        FormaPagamento forma,
        BigDecimal valor,
        Integer parcelas
) {
}

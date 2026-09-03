package com.omnicore.cerebro_backend.pagamento;

import com.omnicore.cerebro_backend.enums.StatusPagamento;

public record ExperienciaPagamentoResultado(
        String experienciaPagamentoId,
        StatusPagamento status,
        String urlExperiencia,
        String nsu,
        String referenciaExterna,
        String pixCopiaECola,
        String qrCodeBase64
) {
}

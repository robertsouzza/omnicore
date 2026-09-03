package com.omnicore.cerebro_backend.pagamento;

import com.omnicore.cerebro_backend.enums.FormaPagamento;
import com.omnicore.cerebro_backend.model.PagamentoVenda;

public final class PagamentoExperienciaUrls {

    private PagamentoExperienciaUrls() {
    }

    public static String buildUrl(String baseUrl, PagamentoVenda pagamento) {
        if (pagamento.getExperienciaPagamentoId() == null) {
            return null;
        }
        return buildUrl(baseUrl, pagamento.getForma(), pagamento.getExperienciaPagamentoId(), 1);
    }

    public static String buildUrl(
            String baseUrl,
            FormaPagamento forma,
            String experienciaPagamentoId,
            int parcelas) {
        if (experienciaPagamentoId == null || experienciaPagamentoId.isBlank()) {
            return null;
        }
        String base = baseUrl == null ? "" : baseUrl.replaceAll("/$", "");
        return switch (forma) {
            case PIX -> base + "/pix/" + experienciaPagamentoId;
            case CREDITO -> {
                int n = parcelas > 0 ? parcelas : 1;
                yield base + "/credito/" + experienciaPagamentoId + "?parcelas=" + n;
            }
            case DEBITO_BANCARIO -> base + "/debito/" + experienciaPagamentoId;
            default -> null;
        };
    }
}

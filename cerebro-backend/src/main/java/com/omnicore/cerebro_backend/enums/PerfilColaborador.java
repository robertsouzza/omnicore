package com.omnicore.cerebro_backend.enums;

public enum PerfilColaborador {
    VENDEDOR,
    CAIXA,
    CONFERENTE,
    GERENTE;

    public boolean podeAutorizarCancelamentoVendaPaga() {
        return this == GERENTE;
    }
}

package com.omnicore.cerebro_backend.enums;

public enum StatusVenda {

    PENDENTE,              // Criada pelo vendedor no salão (aguardando pagamento no caixa)
    PAGA,                  // Liquidada financeira e aguardando conferência/despacho
    AGUARDANDO_RETIRADA,   // Vendas vindas do E-commerce aprovadas para o balcão
    CONCLUIDA,             // Já conferida e entregue ao cliente no balcão
    CANCELADA              // Cancelada por falta de pagamento ou estorno

}

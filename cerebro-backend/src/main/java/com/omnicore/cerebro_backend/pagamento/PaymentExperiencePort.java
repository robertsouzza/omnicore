package com.omnicore.cerebro_backend.pagamento;

public interface PaymentExperiencePort {

    ExperienciaPagamentoResultado iniciar(IniciarExperienciaRequest request);

    ExperienciaPagamentoResultado consultar(String experienciaPagamentoId);

}

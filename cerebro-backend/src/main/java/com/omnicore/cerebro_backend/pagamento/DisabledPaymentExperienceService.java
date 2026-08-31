package com.omnicore.cerebro_backend.pagamento;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import com.omnicore.cerebro_backend.exception.BusinessException;

@Service
@Profile("!test")
@ConditionalOnProperty(prefix = "omnicore.pagamento.experience", name = "enabled", havingValue = "false")
public class DisabledPaymentExperienceService implements PaymentExperiencePort {

    @Override
    public ExperienciaPagamentoResultado iniciar(IniciarExperienciaRequest request) {
        throw new BusinessException("Sistema de experiência de pagamento desabilitado.");
    }

    @Override
    public ExperienciaPagamentoResultado consultar(String experienciaPagamentoId) {
        throw new BusinessException("Sistema de experiência de pagamento desabilitado.");
    }
}

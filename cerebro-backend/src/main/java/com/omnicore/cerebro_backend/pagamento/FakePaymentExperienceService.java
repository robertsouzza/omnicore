package com.omnicore.cerebro_backend.pagamento;

import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import com.omnicore.cerebro_backend.enums.StatusPagamento;

@Service
@Profile("test")
@Primary
public class FakePaymentExperienceService implements PaymentExperiencePort {

    private final ConcurrentHashMap<String, ExperienciaPagamentoResultado> pagamentos = new ConcurrentHashMap<>();

    @Override
    public ExperienciaPagamentoResultado iniciar(IniciarExperienciaRequest request) {
        String id = "fake-" + UUID.randomUUID();
        ExperienciaPagamentoResultado resultado = new ExperienciaPagamentoResultado(
                id,
                StatusPagamento.APROVADO,
                null,
                "NSU-FAKE-001",
                "REF-FAKE-" + request.vendaId());
        pagamentos.put(id, resultado);
        return resultado;
    }

    @Override
    public ExperienciaPagamentoResultado consultar(String experienciaPagamentoId) {
        return pagamentos.getOrDefault(
                experienciaPagamentoId,
                new ExperienciaPagamentoResultado(
                        experienciaPagamentoId,
                        StatusPagamento.RECUSADO,
                        null,
                        null,
                        null));
    }
}

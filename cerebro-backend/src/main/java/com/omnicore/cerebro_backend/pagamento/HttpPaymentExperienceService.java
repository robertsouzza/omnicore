package com.omnicore.cerebro_backend.pagamento;

import java.util.Objects;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import com.omnicore.cerebro_backend.config.PagamentoExperienceProperties;
import com.omnicore.cerebro_backend.enums.StatusPagamento;
import com.omnicore.cerebro_backend.exception.BusinessException;

@Service
@Profile("!test")
@ConditionalOnProperty(prefix = "omnicore.pagamento.experience", name = "enabled", havingValue = "true", matchIfMissing = true)
public class HttpPaymentExperienceService implements PaymentExperiencePort {

    private final PagamentoExperienceProperties properties;
    private final RestClient restClient;

    public HttpPaymentExperienceService(PagamentoExperienceProperties properties) {
        this.properties = properties;
        String baseUrl = Objects.requireNonNull(properties.baseUrl(), "baseUrl");
        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .build();
    }

    @Override
    public ExperienciaPagamentoResultado iniciar(IniciarExperienciaRequest request) {
        IniciarExperienciaRequest body = Objects.requireNonNull(request, "request");
        try {
            ExperienciaApiResponse resposta = restClient.post()
                    .uri("/experiencia/pagamentos/iniciar")
                    .contentType(Objects.requireNonNull(MediaType.APPLICATION_JSON))
                    .body(body)
                    .retrieve()
                    .body(ExperienciaApiResponse.class);

            if (resposta == null || resposta.experienciaPagamentoId() == null) {
                throw new BusinessException("Resposta inválida do sistema de pagamento.");
            }

            return toResultado(resposta);
        } catch (RestClientException ex) {
            throw new BusinessException(
                    "Não foi possível contatar o sistema de pagamento em "
                            + properties.baseUrl()
                            + ". Verifique se o simulador está em execução.");
        }
    }

    @Override
    public ExperienciaPagamentoResultado consultar(String experienciaPagamentoId) {
        try {
            ExperienciaApiResponse resposta = restClient.get()
                    .uri("/experiencia/pagamentos/{id}", experienciaPagamentoId)
                    .retrieve()
                    .body(ExperienciaApiResponse.class);

            if (resposta == null) {
                throw new BusinessException("Pagamento não encontrado no sistema externo.");
            }

            return toResultado(resposta);
        } catch (RestClientException ex) {
            throw new BusinessException("Não foi possível consultar o status do pagamento.");
        }
    }

    private ExperienciaPagamentoResultado toResultado(ExperienciaApiResponse resposta) {
        StatusPagamento status = resposta.status() != null ? resposta.status() : StatusPagamento.PENDENTE;
        return new ExperienciaPagamentoResultado(
                resposta.experienciaPagamentoId(),
                status,
                resposta.urlExperiencia(),
                resposta.nsu(),
                resposta.referenciaExterna());
    }

    private record ExperienciaApiResponse(
            String experienciaPagamentoId,
            StatusPagamento status,
            String urlExperiencia,
            String nsu,
            String referenciaExterna
    ) {
    }
}

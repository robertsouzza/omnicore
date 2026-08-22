package com.omnicore.cerebro_backend.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import com.omnicore.cerebro_backend.dto.CepConsultaResponseDTO;
import com.omnicore.cerebro_backend.dto.ViaCepResponseDTO;
import com.omnicore.cerebro_backend.exception.BusinessException;

@Service
public class CepService {

    private final RestClient restClient;

    public CepService() {
        this.restClient = RestClient.builder()
                .baseUrl("https://viacep.com.br")
                .build();
    }

    public CepConsultaResponseDTO consultar(String cep) {
        String cepNormalizado = normalizarCep(cep);
        if (cepNormalizado.length() != 8) {
            throw new BusinessException("Informe um CEP válido com 8 dígitos.");
        }

        try {
            ViaCepResponseDTO resposta = restClient.get()
                    .uri("/ws/{cep}/json/", cepNormalizado)
                    .retrieve()
                    .body(ViaCepResponseDTO.class);

            if (resposta == null || Boolean.TRUE.equals(resposta.erro())) {
                throw new BusinessException("CEP não encontrado.");
            }

            return new CepConsultaResponseDTO(
                    cepNormalizado,
                    resposta.logradouro(),
                    resposta.bairro(),
                    resposta.localidade(),
                    resposta.uf());
        } catch (RestClientException ex) {
            throw new BusinessException("Não foi possível consultar o CEP no momento.");
        }
    }

    private String normalizarCep(String cep) {
        if (cep == null) {
            return "";
        }
        return cep.replaceAll("\\D", "");
    }
}

package com.omnicore.cerebro_backend.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ViaCepResponseDTO(
    String cep,
    String logradouro,
    String complemento,
    String bairro,
    @JsonProperty("localidade") String localidade,
    String uf,
    Boolean erro
) {

}

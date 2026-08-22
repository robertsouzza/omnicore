package com.omnicore.cerebro_backend.dto;

public record CepConsultaResponseDTO(
    String cep,
    String logradouro,
    String bairro,
    String cidade,
    String estado
) {

}

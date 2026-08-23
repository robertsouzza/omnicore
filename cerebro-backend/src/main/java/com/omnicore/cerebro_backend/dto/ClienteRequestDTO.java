package com.omnicore.cerebro_backend.dto;

import com.omnicore.cerebro_backend.model.TipoDocumento;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ClienteRequestDTO(
    @NotBlank(message = "O nome completo é obrigatório.")
    @Size(max = 150, message = "O nome completo deve ter no máximo 150 caracteres.")
    String nomeCompleto,

    @NotNull(message = "O tipo de documento é obrigatório.")
    TipoDocumento tipoDocumento,

    @NotBlank(message = "O número do documento é obrigatório.")
    @Size(min = 3, max = 30, message = "Informe um documento válido (3 a 30 caracteres).")
    String numeroDocumento,

    @NotBlank(message = "O e-mail é obrigatório.")
    @Email(message = "Informe um e-mail válido.")
    @Size(max = 150, message = "O e-mail deve ter no máximo 150 caracteres.")
    String email,

    @NotBlank(message = "O país do celular é obrigatório.")
    @Size(min = 2, max = 4, message = "Informe o código ISO do país (ex.: BR).")
    String codigoPais,

    @NotBlank(message = "O celular é obrigatório.")
    @Size(min = 4, max = 15, message = "Informe um celular válido (4 a 15 dígitos).")
    String celular,

    @Size(max = 9, message = "Informe um CEP válido (8 dígitos).")
    String cep,

    @Size(max = 150, message = "O logradouro deve ter no máximo 150 caracteres.")
    String logradouro,

    @Size(max = 20, message = "O número deve ter no máximo 20 caracteres.")
    String numero,

    @Size(max = 100, message = "O complemento deve ter no máximo 100 caracteres.")
    String complemento,

    @Size(max = 100, message = "O bairro deve ter no máximo 100 caracteres.")
    String bairro,

    @Size(max = 100, message = "A cidade deve ter no máximo 100 caracteres.")
    String cidade,

    @Size(max = 2, message = "O estado deve ter no máximo 2 caracteres.")
    String estado
) {

}

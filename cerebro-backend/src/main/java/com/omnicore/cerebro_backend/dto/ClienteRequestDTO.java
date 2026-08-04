package com.omnicore.cerebro_backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ClienteRequestDTO(
    @NotBlank(message = "O nome completo é obrigatório.")
    @Size(max = 150, message = "O nome completo deve ter no máximo 150 caracteres.")
    String nomeCompleto,

    @NotBlank(message = "O CPF é obrigatório.")
    @Size(min = 11, max = 14, message = "Informe um CPF válido (11 a 14 caracteres).")
    String cpf,

    @NotBlank(message = "O e-mail é obrigatório.")
    @Email(message = "Informe um e-mail válido.")
    @Size(max = 150, message = "O e-mail deve ter no máximo 150 caracteres.")
    String email,

    @NotBlank(message = "O celular é obrigatório.")
    @Size(max = 20, message = "O celular deve ter no máximo 20 caracteres.")
    String celular,

    @Size(max = 255, message = "O endereço deve ter no máximo 255 caracteres.")
    String enderecoEntregaPadrao
) {

}

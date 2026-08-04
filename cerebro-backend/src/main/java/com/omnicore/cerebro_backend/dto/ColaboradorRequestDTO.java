package com.omnicore.cerebro_backend.dto;

import java.math.BigDecimal;

import com.omnicore.cerebro_backend.enums.PerfilColaborador;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record ColaboradorRequestDTO(
    @NotBlank(message = "O nome é obrigatório.")
    @Size(max = 150, message = "O nome deve ter no máximo 150 caracteres.")
    String nome,

    @NotBlank(message = "O CPF é obrigatório.")
    @Size(min = 11, max = 14, message = "Informe um CPF válido (11 a 14 caracteres).")
    String cpf,

    @NotBlank(message = "O e-mail é obrigatório.")
    @Email(message = "Informe um e-mail válido.")
    @Size(max = 150, message = "O e-mail deve ter no máximo 150 caracteres.")
    String email,

    @Size(min = 6, max = 100, message = "A senha deve ter entre 6 e 100 caracteres.")
    String senha,

    @NotNull(message = "O perfil é obrigatório.")
    PerfilColaborador perfil,

    @NotNull(message = "O limite de desconto autônomo é obrigatório.")
    @PositiveOrZero(message = "O limite de desconto não pode ser negativo.")
    BigDecimal limiteDescontoAutonomo
) {

}

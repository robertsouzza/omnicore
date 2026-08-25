package com.omnicore.cerebro_backend.dto;

import jakarta.validation.constraints.Size;

public record CancelarVendaRequestDTO(
        @Size(max = 255, message = "O motivo do cancelamento deve ter no máximo 255 caracteres.")
        String motivo,

        @Size(max = 150, message = "O e-mail do autorizador deve ter no máximo 150 caracteres.")
        String autorizadorEmail,

        @Size(max = 100, message = "A senha do autorizador deve ter no máximo 100 caracteres.")
        String autorizadorSenha
) {
}

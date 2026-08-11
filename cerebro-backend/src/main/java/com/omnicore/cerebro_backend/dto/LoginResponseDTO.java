package com.omnicore.cerebro_backend.dto;

import com.omnicore.cerebro_backend.enums.PerfilColaborador;

public record LoginResponseDTO(
        String token,
        String tipoToken,
        Long colaboradorId,
        String nome,
        String email,
        PerfilColaborador perfil
) {

}

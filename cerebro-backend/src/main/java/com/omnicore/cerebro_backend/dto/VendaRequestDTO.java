package com.omnicore.cerebro_backend.dto;

import java.util.List;

import com.omnicore.cerebro_backend.enums.StatusVenda;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

public record VendaRequestDTO(
    @NotNull(message = "O status da venda é obrigatório.")
    StatusVenda status,

    Long vendedorId,
    Long clienteId,
    String nomeClienteOcasional,

    @NotEmpty(message = "A venda deve conter ao menos um item.")
    List<@Valid ItemVendaRequestDTO> itens
) {

}

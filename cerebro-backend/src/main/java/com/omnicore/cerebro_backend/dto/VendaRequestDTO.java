package com.omnicore.cerebro_backend.dto;

import java.util.List;

import com.omnicore.cerebro_backend.enums.StatusVenda;

public record VendaRequestDTO(
    StatusVenda status,
    Long vendedorId,
    Long clienteId,
    String nomeClienteOcasional,
    List<ItemVendaRequestDTO> itens
) {

}

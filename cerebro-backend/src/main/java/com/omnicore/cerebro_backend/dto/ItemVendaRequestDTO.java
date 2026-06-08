package com.omnicore.cerebro_backend.dto;

import java.math.BigDecimal;

public record ItemVendaRequestDTO(
    Long produtoId,
    Integer quantidade,
    BigDecimal precoUnitario,
    BigDecimal desconto
) {}

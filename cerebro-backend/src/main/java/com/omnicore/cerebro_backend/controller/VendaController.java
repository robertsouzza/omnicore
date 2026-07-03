package com.omnicore.cerebro_backend.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.omnicore.cerebro_backend.dto.VendaRequestDTO;
import com.omnicore.cerebro_backend.model.Venda;
import com.omnicore.cerebro_backend.service.VendaService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/vendas")
@Tag(name = "Vendas", description = "Endpoints para registro e gestão de vendas do OmniCore")
@RequiredArgsConstructor
public class VendaController {

    private final VendaService vendaService;

    @PostMapping
    @Operation(
        summary = "Registrar uma nova venda",
        description = "Cria um pedido de venda com seus itens. Valida estoque e gera saída automática quando o status for PAGA ou CONCLUIDA."
    )
    public ResponseEntity<Venda> criar(@Valid @RequestBody VendaRequestDTO dto) {
        Venda venda = vendaService.criarVenda(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(venda);
    }
}

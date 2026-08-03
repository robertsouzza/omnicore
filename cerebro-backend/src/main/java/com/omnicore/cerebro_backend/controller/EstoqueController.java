package com.omnicore.cerebro_backend.controller;

import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.omnicore.cerebro_backend.dto.MovimentacaoEstoqueRequestDTO;
import com.omnicore.cerebro_backend.dto.MovimentacaoEstoqueResponseDTO;
import com.omnicore.cerebro_backend.service.EstoqueService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/estoque")
@Tag(name = "Estoque", description = "Endpoints para movimentação e consulta de estoque do OmniCore")
public class EstoqueController {

    private final EstoqueService estoqueService;

    @PostMapping("/entrada")
    @Operation(summary = "Registrar entrada manual de estoque", description = "Adiciona quantidade ao saldo do produto ativo.")
    public ResponseEntity<Void> darEntrada(@RequestBody @Valid MovimentacaoEstoqueRequestDTO dto) {
        estoqueService.registrarEntrada(dto);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PostMapping("/saida")
    @Operation(summary = "Registrar saída manual de estoque", description = "Remove quantidade do saldo, validando disponibilidade e produto ativo.")
    public ResponseEntity<Void> darSaida(@RequestBody @Valid MovimentacaoEstoqueRequestDTO dto) {
        estoqueService.registrarSaida(dto);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @GetMapping("/saldo/{produtoId}")
    @Operation(summary = "Consultar saldo atual", description = "Retorna o saldo calculado (ENTRADA − SAÍDA) do produto.")
    public ResponseEntity<Integer> obterSaldo(@PathVariable Long produtoId) {
        Integer saldo = estoqueService.consultarSaldo(produtoId);
        return ResponseEntity.ok(saldo);
    }

    @GetMapping("/historico/{produtoId}")
    @Operation(summary = "Listar histórico de movimentações", description = "Retorna o histórico paginado de entradas e saídas do produto.")
    public ResponseEntity<Page<MovimentacaoEstoqueResponseDTO>> listarHistorico(
            @PathVariable Long produtoId,
            @ParameterObject
            @PageableDefault(page = 0, size = 20, sort = "dataHora", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(estoqueService.listarHistorico(produtoId, pageable));
    }
}

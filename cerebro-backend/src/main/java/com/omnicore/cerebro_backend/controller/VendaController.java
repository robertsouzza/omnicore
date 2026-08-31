package com.omnicore.cerebro_backend.controller;

import java.time.LocalDateTime;

import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.omnicore.cerebro_backend.dto.CancelarVendaRequestDTO;
import com.omnicore.cerebro_backend.dto.PagarVendaRequestDTO;
import com.omnicore.cerebro_backend.dto.VendaRequestDTO;
import com.omnicore.cerebro_backend.enums.StatusVenda;
import com.omnicore.cerebro_backend.model.Venda;
import com.omnicore.cerebro_backend.security.AuthenticatedColaborador;
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

    @GetMapping
    @Operation(
        summary = "Listar vendas de forma paginada",
        description = "Retorna o histórico de pedidos com filtros opcionais por status, clienteId e período de datas."
    )
    public ResponseEntity<Page<Venda>> listar(
            @ParameterObject
            @PageableDefault(page = 0, size = 20, sort = "dataHora", direction = Sort.Direction.DESC) Pageable pageable,
            @RequestParam(value = "status", required = false) StatusVenda status,
            @RequestParam(value = "clienteId", required = false) Long clienteId,
            @RequestParam(value = "dataInicio", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dataInicio,
            @RequestParam(value = "dataFim", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dataFim) {
        return ResponseEntity.ok(vendaService.listar(pageable, status, clienteId, dataInicio, dataFim));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar venda por ID", description = "Retorna os detalhes completos de um pedido específico.")
    public ResponseEntity<Venda> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(vendaService.buscarPorId(id));
    }

    @PutMapping("/{id}/cancelar")
    @Operation(
        summary = "Cancelar uma venda",
        description = "Altera o status para CANCELADA. Vendas PAGA ou CONCLUIDA exigem motivo e autorização de gerente "
                + "(ou perfil GERENTE logado). Devolve estoque automaticamente quando aplicável."
    )
    public ResponseEntity<Venda> cancelar(@PathVariable Long id,
            @RequestBody(required = false) @Valid CancelarVendaRequestDTO dto,
            @AuthenticationPrincipal AuthenticatedColaborador colaborador) {
        if (colaborador == null) {
            throw new com.omnicore.cerebro_backend.exception.BusinessException(
                    "Colaborador autenticado não identificado.");
        }
        return ResponseEntity.ok(vendaService.cancelar(id, dto, colaborador));
    }

    @PutMapping("/{id}/pagar")
    @Operation(
        summary = "Confirmar pagamento de venda pendente",
        description = "Altera o status de PENDENTE para PAGA após pagamento. "
                + "Sem body: comportamento legado (liquida direto). "
                + "Com body: registra forma de pagamento (dinheiro, Pix, crédito, débito bancário). "
                + "Pix/cartão/débito aguardam sistema de experiência externo se status PENDENTE."
    )
    public ResponseEntity<Venda> pagar(@PathVariable Long id,
            @RequestBody(required = false) @Valid PagarVendaRequestDTO dto,
            @AuthenticationPrincipal AuthenticatedColaborador colaborador) {
        if (colaborador == null) {
            throw new com.omnicore.cerebro_backend.exception.BusinessException(
                    "Colaborador autenticado não identificado.");
        }
        return ResponseEntity.ok(vendaService.pagar(id, colaborador, dto));
    }
}

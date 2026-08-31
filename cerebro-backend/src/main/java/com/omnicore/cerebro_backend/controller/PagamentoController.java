package com.omnicore.cerebro_backend.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.omnicore.cerebro_backend.dto.PagamentoVendaResponseDTO;
import com.omnicore.cerebro_backend.dto.PagamentoWebhookRequestDTO;
import com.omnicore.cerebro_backend.model.PagamentoVenda;
import com.omnicore.cerebro_backend.service.PagamentoService;
import com.omnicore.cerebro_backend.service.VendaService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/pagamentos")
@Tag(name = "Pagamentos", description = "Registro de pagamentos e callback do sistema de experiência externo")
@RequiredArgsConstructor
public class PagamentoController {

    private final PagamentoService pagamentoService;
    private final VendaService vendaService;

    @GetMapping("/venda/{vendaId}")
    @Operation(summary = "Listar pagamentos de uma venda")
    public ResponseEntity<List<PagamentoVendaResponseDTO>> listarPorVenda(@PathVariable Long vendaId) {
        List<PagamentoVendaResponseDTO> lista = pagamentoService.listarPorVenda(vendaId).stream()
                .map(PagamentoVendaResponseDTO::from)
                .toList();
        return ResponseEntity.ok(lista);
    }

    @PostMapping("/webhook")
    @Operation(
            summary = "Callback do sistema de experiência de pagamento",
            description = "Chamado pelo simulador externo (dev) ou PSP quando o pagamento for concluído. "
                    + "Se aprovado e valor suficiente, liquida a venda pendente.")
    public ResponseEntity<PagamentoVendaResponseDTO> webhook(@Valid @RequestBody PagamentoWebhookRequestDTO dto) {
        PagamentoVenda pagamento = pagamentoService.aplicarWebhook(dto);
        vendaService.tentarLiquidarAposPagamento(pagamento.getVendaId());
        return ResponseEntity.ok(PagamentoVendaResponseDTO.from(pagamento));
    }
}

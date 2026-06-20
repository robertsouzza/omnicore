package com.omnicore.cerebro_backend.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
//import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.omnicore.cerebro_backend.dto.MovimentacaoEstoqueRequestDTO;
//import com.omnicore.cerebro_backend.model.MovimentacaoEstoque;
import com.omnicore.cerebro_backend.service.EstoqueService;

//import io.swagger.v3.oas.annotations.parameters.RequestBody;
import org.springframework.web.bind.annotation.RequestBody;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor 
@RestController
@RequestMapping("/api/estoque")
public class EstoqueController {

    private final EstoqueService estoqueService;
    /*
    @PostMapping("/entrada")
    public ResponseEntity<MovimentacaoEstoque> darEntrada(@RequestBody @Validated MovimentacaoEstoqueRequestDTO dto) {
        MovimentacaoEstoque movimentacao = estoqueService.registrarEntrada(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(movimentacao);
    }

    @GetMapping("/saldo/{produtoId}")
    public ResponseEntity<Integer> obterSaldo(@PathVariable Long produtoId) {
        Integer saldo = estoqueService.consultarSaldo(produtoId);
        return ResponseEntity.ok(saldo);
    }*/

        @PostMapping("/entrada")
    public ResponseEntity<Void> darEntrada(@RequestBody @Valid MovimentacaoEstoqueRequestDTO dto) {
        estoqueService.registrarEntrada(dto);
        // Retornamos 201 Created com corpo vazio para evitar erros de serialização da Entidade JPA no Jackson
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @GetMapping("/saldo/{produtoId}")
    public ResponseEntity<Integer> obterSaldo(@PathVariable Long produtoId) {
        Integer saldo = estoqueService.consultarSaldo(produtoId);
        return ResponseEntity.ok(saldo);
    }

}

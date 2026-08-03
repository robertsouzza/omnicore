package com.omnicore.cerebro_backend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.omnicore.cerebro_backend.dto.ComposicaoPacoteRequestDTO;
import com.omnicore.cerebro_backend.model.ComposicaoPacote;
import com.omnicore.cerebro_backend.service.ComposicaoPacoteService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/produtos/{pacoteId}/composicao")
@Tag(name = "Composição de Pacotes", description = "Endpoints para montar kits/combos (produto PACOTE e seus componentes UNITARIO)")
@RequiredArgsConstructor
public class ComposicaoPacoteController {

    private final ComposicaoPacoteService composicaoPacoteService;

    @GetMapping
    @Operation(summary = "Listar componentes do pacote", description = "Retorna todos os produtos filhos que compõem o kit/combo.")
    public ResponseEntity<List<ComposicaoPacote>> listar(@PathVariable Long pacoteId) {
        return ResponseEntity.ok(composicaoPacoteService.listarPorPacote(pacoteId));
    }

    @PostMapping
    @Operation(summary = "Adicionar componente ao pacote", description = "Vincula um produto UNITARIO ao pacote com a quantidade consumida por unidade vendida.")
    public ResponseEntity<ComposicaoPacote> adicionar(
            @PathVariable Long pacoteId,
            @Valid @RequestBody ComposicaoPacoteRequestDTO dto) {
        ComposicaoPacote criada = composicaoPacoteService.adicionarComponente(pacoteId, dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(criada);
    }

    @DeleteMapping("/{composicaoId}")
    @Operation(summary = "Remover componente do pacote", description = "Exclui um item da composição do kit/combo.")
    public ResponseEntity<Void> remover(@PathVariable Long pacoteId, @PathVariable Long composicaoId) {
        composicaoPacoteService.removerComponente(pacoteId, composicaoId);
        return ResponseEntity.noContent().build();
    }
}

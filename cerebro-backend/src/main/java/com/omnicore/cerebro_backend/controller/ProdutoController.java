package com.omnicore.cerebro_backend.controller;

import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.omnicore.cerebro_backend.dto.ProdutoRequestDTO;
import com.omnicore.cerebro_backend.model.Produto;
import com.omnicore.cerebro_backend.service.ProdutoService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/produtos")
@Tag(name = "Produtos", description = "Endpoints para gerenciamento do catálogo de produtos do OmniCore")
@RequiredArgsConstructor // O Lombok cria o construtor para todos os campos 'final' automaticamente do produtoService!
public class ProdutoController {

    private final ProdutoService produtoService;

    @PostMapping
    @Operation(summary = "Cadastrar um novo produto", description = "Salva um produto unitário ou pacote no banco, validando duplicidade de código de barras.")
    public ResponseEntity<Produto> cadastrar(@Valid @RequestBody ProdutoRequestDTO dto) {
        Produto produto = Produto.builder()
                .codigoBarras(dto.codigoBarras()) // Padrão record: chamada direta
                .nome(dto.nome())
                .descricao(dto.descricao())
                .precoVenda(dto.precoVenda())
                .categoria(dto.categoria())
                .urlImagem(dto.urlImagem())
                .tipoProduto(dto.tipoProduto())
                .indicadorTamanho(dto.indicadorTamanho())
                .build();

        Produto salvo = produtoService.salvar(produto);
        return ResponseEntity.status(HttpStatus.CREATED).body(salvo);
    }

    @GetMapping
    @Operation(
        summary = "Listar produtos de forma paginada", 
            description = "Retorna o catálogo de produtos fatiado por páginas para garantir a performance e eficiência de memória do ecossistema."
    )
    public ResponseEntity<Page<Produto>> listar(
        @ParameterObject @PageableDefault(page = 0, size = 20, sort = "nome", direction = Sort.Direction.ASC) Pageable pageable) {
            Page<Produto> produtosPaginados = produtoService.listarTodos(pageable);
            return ResponseEntity.ok(produtosPaginados);
        }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar produto por ID", description = "Retorna os detalhes de um produto específico com base no identificador único.")
    public ResponseEntity<Produto> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(produtoService.buscarPorId(id));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar um produto existente", description = "Atualiza os dados cadastrais de um produto com base no ID informado.")
    public ResponseEntity<Produto> atualizar(@PathVariable Long id, @Valid @RequestBody ProdutoRequestDTO dto) {
        Produto dadosNovos = Produto.builder()
                .codigoBarras(dto.codigoBarras())
                .nome(dto.nome())
                .descricao(dto.descricao())
                .precoVenda(dto.precoVenda())
                .categoria(dto.categoria())
                .urlImagem(dto.urlImagem())
                .tipoProduto(dto.tipoProduto())
                .indicadorTamanho(dto.indicadorTamanho())
                .build();

        Produto atualizado = produtoService.atualizar(id, dadosNovos);
        return ResponseEntity.ok(atualizado);
    }

    @DeleteMapping("/{id}")
    @Operation(
        summary = "Inativar um produto (Exclusão Lógica)", 
        description = "Altera o status do produto para inativo. O registro permanece no banco para integridade histórica, mas não constará como disponível no ecossistema."
    )
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        produtoService.inativar(id);
        return ResponseEntity.noContent().build(); // Retorna o status 244 No Content, ideal para exclusões seguras
    }

}

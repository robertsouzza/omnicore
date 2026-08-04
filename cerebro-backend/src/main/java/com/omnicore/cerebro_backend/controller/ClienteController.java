package com.omnicore.cerebro_backend.controller;

import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.omnicore.cerebro_backend.dto.ClienteRequestDTO;
import com.omnicore.cerebro_backend.model.Cliente;
import com.omnicore.cerebro_backend.service.ClienteService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/clientes")
@Tag(name = "Clientes", description = "Cadastro e consulta de clientes do OmniCore")
@RequiredArgsConstructor
public class ClienteController {

    private final ClienteService clienteService;

    @PostMapping
    @Operation(summary = "Cadastrar cliente", description = "Registra um novo cliente com CPF único.")
    public ResponseEntity<Cliente> cadastrar(@Valid @RequestBody ClienteRequestDTO dto) {
        Cliente salvo = clienteService.cadastrar(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(salvo);
    }

    @GetMapping
    @Operation(summary = "Listar clientes paginados", description = "Retorna clientes ativos por padrão.")
    public ResponseEntity<Page<Cliente>> listar(
            @ParameterObject
            @PageableDefault(page = 0, size = 20, sort = "nomeCompleto", direction = Sort.Direction.ASC) Pageable pageable,
            @RequestParam(value = "incluirInativos", required = false, defaultValue = "false") boolean incluirInativos) {
        return ResponseEntity.ok(clienteService.listar(pageable, incluirInativos));
    }

    @GetMapping("/cpf/{cpf}")
    @Operation(summary = "Buscar cliente por CPF", description = "Localiza cliente pelo CPF (com ou sem pontuação).")
    public ResponseEntity<Cliente> buscarPorCpf(@PathVariable String cpf) {
        return ResponseEntity.ok(clienteService.buscarPorCpf(cpf));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar cliente por ID")
    public ResponseEntity<Cliente> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(clienteService.buscarPorId(id));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar cliente")
    public ResponseEntity<Cliente> atualizar(@PathVariable Long id, @Valid @RequestBody ClienteRequestDTO dto) {
        return ResponseEntity.ok(clienteService.atualizar(id, dto));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Inativar cliente", description = "Exclusão lógica; o histórico de vendas permanece intacto.")
    public ResponseEntity<Void> inativar(@PathVariable Long id) {
        clienteService.inativar(id);
        return ResponseEntity.noContent().build();
    }
}

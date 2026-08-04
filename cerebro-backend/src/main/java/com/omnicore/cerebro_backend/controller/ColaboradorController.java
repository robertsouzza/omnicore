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

import com.omnicore.cerebro_backend.dto.ColaboradorRequestDTO;
import com.omnicore.cerebro_backend.model.Colaborador;
import com.omnicore.cerebro_backend.service.ColaboradorService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/colaboradores")
@Tag(name = "Colaboradores", description = "Cadastro de vendedores, caixa, conferentes e gerentes")
@RequiredArgsConstructor
public class ColaboradorController {

    private final ColaboradorService colaboradorService;

    @PostMapping
    @Operation(summary = "Cadastrar colaborador", description = "A senha é armazenada com BCrypt; login será habilitado em sessão futura.")
    public ResponseEntity<Colaborador> cadastrar(@Valid @RequestBody ColaboradorRequestDTO dto) {
        Colaborador salvo = colaboradorService.cadastrar(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(salvo);
    }

    @GetMapping
    @Operation(summary = "Listar colaboradores paginados")
    public ResponseEntity<Page<Colaborador>> listar(
            @ParameterObject
            @PageableDefault(page = 0, size = 20, sort = "nome", direction = Sort.Direction.ASC) Pageable pageable,
            @RequestParam(value = "incluirInativos", required = false, defaultValue = "false") boolean incluirInativos) {
        return ResponseEntity.ok(colaboradorService.listar(pageable, incluirInativos));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar colaborador por ID")
    public ResponseEntity<Colaborador> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(colaboradorService.buscarPorId(id));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar colaborador", description = "Informe senha apenas se desejar alterá-la.")
    public ResponseEntity<Colaborador> atualizar(@PathVariable Long id, @Valid @RequestBody ColaboradorRequestDTO dto) {
        return ResponseEntity.ok(colaboradorService.atualizar(id, dto));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Inativar colaborador")
    public ResponseEntity<Void> inativar(@PathVariable Long id) {
        colaboradorService.inativar(id);
        return ResponseEntity.noContent().build();
    }
}

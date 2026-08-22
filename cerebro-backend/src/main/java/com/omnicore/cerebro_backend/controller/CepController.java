package com.omnicore.cerebro_backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.omnicore.cerebro_backend.dto.CepConsultaResponseDTO;
import com.omnicore.cerebro_backend.service.CepService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/cep")
@Tag(name = "CEP", description = "Consulta de endereço por CEP (ViaCEP)")
public class CepController {

    private final CepService cepService;

    public CepController(CepService cepService) {
        this.cepService = cepService;
    }

    @GetMapping("/{cep}")
    @Operation(summary = "Consultar endereço por CEP")
    public ResponseEntity<CepConsultaResponseDTO> consultar(@PathVariable String cep) {
        return ResponseEntity.ok(cepService.consultar(cep));
    }
}

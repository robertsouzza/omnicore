package com.omnicore.cerebro_backend.controller;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.omnicore.cerebro_backend.dto.CepConsultaResponseDTO;
import com.omnicore.cerebro_backend.exception.GlobalExceptionHandler;
import com.omnicore.cerebro_backend.service.CepService;

@WebMvcTest(controllers = CepController.class, excludeAutoConfiguration = SecurityAutoConfiguration.class)
@ActiveProfiles("test")
@Import(GlobalExceptionHandler.class)
class CepControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CepService cepService;

    @Test
    @DisplayName("GET /api/cep/{cep} deve retornar endereço")
    void deveConsultarCep() throws Exception {
        when(cepService.consultar("69309209")).thenReturn(new CepConsultaResponseDTO(
                "69309209",
                "Rua Antônio Pinheiro Galvão",
                "Buritis",
                "Boa Vista",
                "RR"));

        mockMvc.perform(get("/api/cep/{cep}", "69309209"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cep").value("69309209"))
                .andExpect(jsonPath("$.cidade").value("Boa Vista"))
                .andExpect(jsonPath("$.estado").value("RR"));
    }
}

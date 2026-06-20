package com.omnicore.cerebro_backend.controller;

import com.omnicore.cerebro_backend.model.MovimentacaoEstoque;
import com.omnicore.cerebro_backend.service.EstoqueService;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;

import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;

@WebMvcTest(EstoqueController.class)
@SuppressWarnings("null")
public class EstoqueControllerTest {

    @Autowired
    private MockMvc mockMvc;


    @MockitoBean
    private EstoqueService estoqueService;

    @Test
@DisplayName("POST /api/estoque/entrada - Deve retornar 201 Created ao registrar entrada válida")
void deveRetornarCriadoAoRegistrarEntrada() throws Exception {
    // Arrange - Enviando com snake_case para bater com a provável configuração global do ObjectMapper
    String payloadValido = """
            {
                "produto_id": 1,
                "quantidade": 100,
                "justificativa": "Lote Novo"
            }
            """;
    
    MovimentacaoEstoque movimentacaoMock = new MovimentacaoEstoque();
    when(estoqueService.registrarEntrada(any())).thenReturn(movimentacaoMock);

    // Act & Assert
    mockMvc.perform(post("/api/estoque/entrada")
            .contentType(MediaType.APPLICATION_JSON)
            .content(payloadValido))
            .andDo(print()) 
            .andExpect(status().isCreated());
}

    @Test
    @DisplayName("POST /api/estoque/entrada - Deve retornar 400 Bad Request se a quantidade for negativa ou nula")
    void deveRetornarBadRequestSeQuantidadeInvalida() throws Exception {
        String payloadInvalido = """
                {
                    "produtoId": 1,
                    "quantidade": -5,
                    "justificativa": "Invalido"
                }
                """;

        mockMvc.perform(post("/api/estoque/entrada")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payloadInvalido))
                .andDo(print())
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /api/estoque/saldo/{id} - Deve retornar o saldo do estoque com sucesso")
    void deveRetornarSaldoEstoque() throws Exception {
        // Arrange
        when(estoqueService.consultarSaldo(1L)).thenReturn(45);

        // Act & Assert
        mockMvc.perform(get("/api/estoque/saldo/1"))
                .andExpect(status().isOk())
                .andExpect(content().string("45"));
    }
}
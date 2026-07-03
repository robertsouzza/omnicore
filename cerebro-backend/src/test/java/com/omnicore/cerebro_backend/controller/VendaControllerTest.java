package com.omnicore.cerebro_backend.controller;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.omnicore.cerebro_backend.enums.StatusVenda;
import com.omnicore.cerebro_backend.exception.BusinessException;
import com.omnicore.cerebro_backend.exception.GlobalExceptionHandler;
import com.omnicore.cerebro_backend.model.Venda;
import com.omnicore.cerebro_backend.service.VendaService;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(VendaController.class)
@Import(GlobalExceptionHandler.class)
@SuppressWarnings("null")
public class VendaControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private VendaService vendaService;

    private static final String PAYLOAD_VALIDO = """
            {
                "status": "PAGA",
                "vendedorId": 10,
                "clienteId": 20,
                "itens": [
                    {
                        "produtoId": 1,
                        "quantidade": 2,
                        "precoUnitario": 5.00,
                        "desconto": 0.50
                    }
                ]
            }
            """;

    @Test
    @DisplayName("POST /api/vendas deve retornar 201 Created ao registrar venda válida")
    void deveRetornar201AoCriarVenda() throws Exception {
        Venda vendaSalva = Venda.builder()
                .id(1L)
                .dataHora(LocalDateTime.now())
                .status(StatusVenda.PAGA)
                .vendedorId(10L)
                .clienteId(20L)
                .valorTotal(new BigDecimal("9.00"))
                .build();

        when(vendaService.criarVenda(any())).thenReturn(vendaSalva);

        mockMvc.perform(post("/api/vendas")
                .contentType(MediaType.APPLICATION_JSON)
                .content(PAYLOAD_VALIDO))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.status").value("PAGA"))
                .andExpect(jsonPath("$.valorTotal").value(9.00));
    }

    @Test
    @DisplayName("POST /api/vendas deve retornar 400 Bad Request se o payload for inválido")
    void deveRetornar400QuandoPayloadInvalido() throws Exception {
        String payloadInvalido = """
                {
                    "status": null,
                    "itens": []
                }
                """;

        mockMvc.perform(post("/api/vendas")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payloadInvalido))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/vendas deve retornar 400 Bad Request quando houver regra de negócio violada")
    void deveRetornar400QuandoRegraDeNegocioViolada() throws Exception {
        when(vendaService.criarVenda(any()))
                .thenThrow(new BusinessException("Saldo insuficiente em estoque para o produto 'Refrigerante'. Estoque atual: 3, Solicitado: 5"));

        mockMvc.perform(post("/api/vendas")
                .contentType(MediaType.APPLICATION_JSON)
                .content(PAYLOAD_VALIDO))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Saldo insuficiente em estoque para o produto 'Refrigerante'. Estoque atual: 3, Solicitado: 5"));
    }
}

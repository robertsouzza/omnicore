package com.omnicore.cerebro_backend.controller;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.omnicore.cerebro_backend.enums.StatusVenda;
import com.omnicore.cerebro_backend.exception.BusinessException;
import com.omnicore.cerebro_backend.exception.GlobalExceptionHandler;
import com.omnicore.cerebro_backend.model.Venda;
import com.omnicore.cerebro_backend.service.VendaService;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
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

    @Test
    @DisplayName("GET /api/vendas deve retornar 200 OK com listagem paginada")
    void deveRetornar200AoListarVendas() throws Exception {
        Venda venda = Venda.builder().id(1L).status(StatusVenda.PAGA).build();
        when(vendaService.listar(any(Pageable.class), eq(StatusVenda.PAGA), eq(20L), isNull(), isNull()))
                .thenReturn(new PageImpl<>(java.util.List.of(venda)));

        mockMvc.perform(get("/api/vendas")
                .param("page", "0")
                .param("size", "20")
                .param("sort", "dataHora,DESC")
                .param("status", "PAGA")
                .param("clienteId", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(1))
                .andExpect(jsonPath("$.content[0].status").value("PAGA"));
    }

    @Test
    @DisplayName("GET /api/vendas/{id} deve retornar 200 OK ao buscar venda existente")
    void deveRetornar200AoBuscarVendaPorId() throws Exception {
        Venda venda = Venda.builder()
                .id(1L)
                .status(StatusVenda.PAGA)
                .valorTotal(new BigDecimal("59.80"))
                .build();

        when(vendaService.buscarPorId(1L)).thenReturn(venda);

        mockMvc.perform(get("/api/vendas/{id}", 1L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.status").value("PAGA"));
    }

    @Test
    @DisplayName("GET /api/vendas/{id} deve retornar 400 Bad Request se a venda não existir")
    void deveRetornar400AoBuscarVendaInexistente() throws Exception {
        when(vendaService.buscarPorId(999L))
                .thenThrow(new BusinessException("Venda com ID 999 não encontrada."));

        mockMvc.perform(get("/api/vendas/{id}", 999L))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Venda com ID 999 não encontrada."));
    }

    @Test
    @DisplayName("PUT /api/vendas/{id}/cancelar deve retornar 200 OK ao cancelar venda")
    void deveRetornar200AoCancelarVenda() throws Exception {
        Venda vendaCancelada = Venda.builder()
                .id(1L)
                .status(StatusVenda.CANCELADA)
                .valorTotal(new BigDecimal("59.80"))
                .build();

        when(vendaService.cancelar(1L)).thenReturn(vendaCancelada);

        mockMvc.perform(put("/api/vendas/{id}/cancelar", 1L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.status").value("CANCELADA"));
    }

    @Test
    @DisplayName("PUT /api/vendas/{id}/cancelar deve retornar 400 Bad Request se a venda já estiver cancelada")
    void deveRetornar400AoCancelarVendaJaCancelada() throws Exception {
        when(vendaService.cancelar(1L))
                .thenThrow(new BusinessException("A venda #1 já se encontra cancelada."));

        mockMvc.perform(put("/api/vendas/{id}/cancelar", 1L))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("A venda #1 já se encontra cancelada."));
    }
}

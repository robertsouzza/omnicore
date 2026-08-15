package com.omnicore.cerebro_backend.controller;

import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.omnicore.cerebro_backend.dto.MovimentacaoEstoqueResponseDTO;
import com.omnicore.cerebro_backend.enums.TipoMovimentacaoEstoque;
import com.omnicore.cerebro_backend.exception.BusinessException;
import com.omnicore.cerebro_backend.exception.GlobalExceptionHandler;
import com.omnicore.cerebro_backend.model.MovimentacaoEstoque;
import com.omnicore.cerebro_backend.service.EstoqueService;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = EstoqueController.class, excludeAutoConfiguration = SecurityAutoConfiguration.class)
@ActiveProfiles("test")
@Import(GlobalExceptionHandler.class)
@SuppressWarnings("null")
public class EstoqueControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private EstoqueService estoqueService;

    @Test
    @DisplayName("POST /api/estoque/entrada - Deve retornar 201 Created ao registrar entrada válida")
    void deveRetornarCriadoAoRegistrarEntrada() throws Exception {
        String payloadValido = """
                {
                    "produtoId": 1,
                    "quantidade": 100,
                    "justificativa": "Lote Novo"
                }
                """;

        MovimentacaoEstoque movimentacaoMock = new MovimentacaoEstoque();
        when(estoqueService.registrarEntrada(any())).thenReturn(movimentacaoMock);

        mockMvc.perform(post("/api/estoque/entrada")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payloadValido))
                .andExpect(status().isCreated());
    }

    @Test
    @DisplayName("POST /api/estoque/entrada - Deve retornar 400 Bad Request se a quantidade for negativa")
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
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/estoque/saida - Deve retornar 201 ao registrar saída válida")
    void deveRetornarCriadoAoRegistrarSaida() throws Exception {
        when(estoqueService.registrarSaida(any())).thenReturn(new MovimentacaoEstoque());

        String payload = """
                {
                    "produtoId": 1,
                    "quantidade": 5,
                    "justificativa": "Perda por avaria"
                }
                """;

        mockMvc.perform(post("/api/estoque/saida")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated());
    }

    @Test
    @DisplayName("POST /api/estoque/saida - Deve retornar 400 quando saldo for insuficiente")
    void deveRetornar400QuandoSaldoInsuficiente() throws Exception {
        doThrow(new BusinessException("Saldo insuficiente em estoque"))
                .when(estoqueService).registrarSaida(any());

        String payload = """
                {
                    "produtoId": 1,
                    "quantidade": 999,
                    "justificativa": "Teste"
                }
                """;

        mockMvc.perform(post("/api/estoque/saida")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /api/estoque/saldo/{id} - Deve retornar o saldo do estoque com sucesso")
    void deveRetornarSaldoEstoque() throws Exception {
        when(estoqueService.consultarSaldo(1L)).thenReturn(45);

        mockMvc.perform(get("/api/estoque/saldo/1"))
                .andExpect(status().isOk())
                .andExpect(content().string("45"));
    }

    @Test
    @DisplayName("GET /api/estoque/historico/{produtoId} - Deve retornar histórico paginado")
    void deveRetornarHistoricoPaginado() throws Exception {
        Page<MovimentacaoEstoqueResponseDTO> pagina = new PageImpl<>(List.of(
                new MovimentacaoEstoqueResponseDTO(
                        1L, 1L, TipoMovimentacaoEstoque.ENTRADA, 10,
                        LocalDateTime.of(2026, 8, 3, 10, 0), "Entrada teste", null)));

        when(estoqueService.listarHistorico(eq(1L), any(Pageable.class))).thenReturn(pagina);

        mockMvc.perform(get("/api/estoque/historico/1?page=0&size=10"))
                .andExpect(status().isOk());
    }
}

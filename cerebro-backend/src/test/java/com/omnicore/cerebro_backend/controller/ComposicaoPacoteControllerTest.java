package com.omnicore.cerebro_backend.controller;

import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.omnicore.cerebro_backend.exception.BusinessException;
import com.omnicore.cerebro_backend.exception.GlobalExceptionHandler;
import com.omnicore.cerebro_backend.model.ComposicaoPacote;
import com.omnicore.cerebro_backend.service.ComposicaoPacoteService;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = ComposicaoPacoteController.class, excludeAutoConfiguration = SecurityAutoConfiguration.class)
@ActiveProfiles("test")
@Import(GlobalExceptionHandler.class)
@SuppressWarnings("null")
class ComposicaoPacoteControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ComposicaoPacoteService composicaoPacoteService;

    @Test
    @DisplayName("GET /api/produtos/{pacoteId}/composicao - Deve retornar 200 com lista de componentes")
    void deveListarComposicaoDoPacote() throws Exception {
        when(composicaoPacoteService.listarPorPacote(2L)).thenReturn(List.of(new ComposicaoPacote()));

        mockMvc.perform(get("/api/produtos/2/composicao"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /api/produtos/{pacoteId}/composicao - Deve retornar 201 ao adicionar componente válido")
    void deveRetornar201AoAdicionarComponente() throws Exception {
        when(composicaoPacoteService.adicionarComponente(eq(2L), any())).thenReturn(new ComposicaoPacote());

        String payload = """
                {
                  "produtoFilhoId": 1,
                  "quantidade": 1
                }
                """;

        mockMvc.perform(post("/api/produtos/2/composicao")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated());
    }

    @Test
    @DisplayName("POST /api/produtos/{pacoteId}/composicao - Deve retornar 400 quando payload for inválido")
    void deveRetornar400QuandoPayloadInvalido() throws Exception {
        String payload = """
                {
                  "produtoFilhoId": null,
                  "quantidade": 0
                }
                """;

        mockMvc.perform(post("/api/produtos/2/composicao")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("DELETE /api/produtos/{pacoteId}/composicao/{id} - Deve retornar 204 ao remover componente")
    void deveRetornar204AoRemoverComponente() throws Exception {
        mockMvc.perform(delete("/api/produtos/2/composicao/10"))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("POST /api/produtos/{pacoteId}/composicao - Deve retornar 400 quando regra de negócio for violada")
    void deveRetornar400QuandoRegraDeNegocioViolada() throws Exception {
        doThrow(new BusinessException("A composição só pode ser gerenciada para produtos do tipo PACOTE."))
                .when(composicaoPacoteService).adicionarComponente(eq(1L), any());

        String payload = """
                {
                  "produtoFilhoId": 3,
                  "quantidade": 1
                }
                """;

        mockMvc.perform(post("/api/produtos/1/composicao")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest());
    }
}

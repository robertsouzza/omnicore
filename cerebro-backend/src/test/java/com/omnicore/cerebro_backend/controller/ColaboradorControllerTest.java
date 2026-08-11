package com.omnicore.cerebro_backend.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;

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

import com.omnicore.cerebro_backend.enums.PerfilColaborador;
import com.omnicore.cerebro_backend.exception.GlobalExceptionHandler;
import com.omnicore.cerebro_backend.model.Colaborador;
import com.omnicore.cerebro_backend.service.ColaboradorService;

@WebMvcTest(controllers = ColaboradorController.class, excludeAutoConfiguration = SecurityAutoConfiguration.class)
@ActiveProfiles("test")
@Import(GlobalExceptionHandler.class)
@SuppressWarnings("null")
class ColaboradorControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ColaboradorService colaboradorService;

    private static final String PAYLOAD = """
            {
                "nome": "Carlos Vendedor",
                "cpf": "98765432100",
                "email": "carlos@loja.com",
                "senha": "senha123",
                "perfil": "VENDEDOR",
                "limiteDescontoAutonomo": 5.00
            }
            """;

    @Test
    @DisplayName("POST /api/colaboradores deve retornar 201 e não expor senhaHash")
    void deveCadastrarColaborador() throws Exception {
        Colaborador colaborador = Colaborador.builder()
                .id(1L)
                .nome("Carlos Vendedor")
                .email("carlos@loja.com")
                .perfil(PerfilColaborador.VENDEDOR)
                .limiteDescontoAutonomo(new BigDecimal("5.00"))
                .senhaHash("hash-secreto")
                .build();

        when(colaboradorService.cadastrar(any())).thenReturn(colaborador);

        mockMvc.perform(post("/api/colaboradores")
                .contentType(MediaType.APPLICATION_JSON)
                .content(PAYLOAD))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.nome").value("Carlos Vendedor"))
                .andExpect(jsonPath("$.senhaHash").doesNotExist());
    }
}

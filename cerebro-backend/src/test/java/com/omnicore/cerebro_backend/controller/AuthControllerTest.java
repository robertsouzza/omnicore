package com.omnicore.cerebro_backend.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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

import com.omnicore.cerebro_backend.dto.LoginResponseDTO;
import com.omnicore.cerebro_backend.enums.PerfilColaborador;
import com.omnicore.cerebro_backend.exception.AuthenticationFailedException;
import com.omnicore.cerebro_backend.exception.GlobalExceptionHandler;
import com.omnicore.cerebro_backend.service.AuthService;

@WebMvcTest(controllers = AuthController.class, excludeAutoConfiguration = SecurityAutoConfiguration.class)
@ActiveProfiles("test")
@Import(GlobalExceptionHandler.class)
@SuppressWarnings("null")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AuthService authService;

    private static final String PAYLOAD = """
            {
                "email": "carlos@loja.com",
                "senha": "senha123"
            }
            """;

    @Test
    @DisplayName("POST /api/auth/login deve retornar 200 com token")
    void deveRetornar200AoLogar() throws Exception {
        LoginResponseDTO resposta = new LoginResponseDTO(
                "token-jwt", "Bearer", 1L, "Carlos", "carlos@loja.com", PerfilColaborador.VENDEDOR);

        when(authService.login(any())).thenReturn(resposta);

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(PAYLOAD))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("token-jwt"))
                .andExpect(jsonPath("$.colaboradorId").value(1))
                .andExpect(jsonPath("$.perfil").value("VENDEDOR"));
    }

    @Test
    @DisplayName("POST /api/auth/login deve retornar 401 para credenciais inválidas")
    void deveRetornar401ParaCredenciaisInvalidas() throws Exception {
        when(authService.login(any()))
                .thenThrow(new AuthenticationFailedException("E-mail ou senha inválidos."));

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(PAYLOAD))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("E-mail ou senha inválidos."));
    }

    @Test
    @DisplayName("POST /api/auth/login deve retornar 400 para payload inválido")
    void deveRetornar400ParaPayloadInvalido() throws Exception {
        String payloadInvalido = """
                {
                    "email": "",
                    "senha": ""
                }
                """;

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payloadInvalido))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Erro de Validação"));
    }
}

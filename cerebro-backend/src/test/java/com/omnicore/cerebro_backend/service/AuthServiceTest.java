package com.omnicore.cerebro_backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.omnicore.cerebro_backend.config.JwtProperties;
import com.omnicore.cerebro_backend.dto.LoginRequestDTO;
import com.omnicore.cerebro_backend.dto.LoginResponseDTO;
import com.omnicore.cerebro_backend.enums.PerfilColaborador;
import com.omnicore.cerebro_backend.exception.AuthenticationFailedException;
import com.omnicore.cerebro_backend.exception.BusinessException;
import com.omnicore.cerebro_backend.model.Colaborador;
import com.omnicore.cerebro_backend.repository.ColaboradorRepository;
import com.omnicore.cerebro_backend.security.JwtService;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private ColaboradorRepository colaboradorRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    private AuthService authService;

    private Colaborador colaboradorAtivo;

    @BeforeEach
    void setUp() {
        JwtService jwtService = new JwtService(
                new JwtProperties("omnicore-test-secret-key-min-32-chars", 24));
        authService = new AuthService(colaboradorRepository, passwordEncoder, jwtService);

        colaboradorAtivo = Colaborador.builder()
                .id(1L)
                .nome("Carlos Vendedor")
                .email("carlos@loja.com")
                .senhaHash("hash-armazenado")
                .perfil(PerfilColaborador.VENDEDOR)
                .limiteDescontoAutonomo(new BigDecimal("5.00"))
                .ativo(true)
                .build();
    }

    @Test
    @DisplayName("Deve autenticar colaborador ativo e retornar token JWT")
    void deveAutenticarComSucesso() {
        LoginRequestDTO dto = new LoginRequestDTO("carlos@loja.com", "senha123");

        when(colaboradorRepository.findByEmail("carlos@loja.com")).thenReturn(Optional.of(colaboradorAtivo));
        when(passwordEncoder.matches("senha123", "hash-armazenado")).thenReturn(true);

        LoginResponseDTO resposta = authService.login(dto);

        assertNotNull(resposta.token());
        assertEquals("Bearer", resposta.tipoToken());
        assertEquals(1L, resposta.colaboradorId());
        assertEquals(PerfilColaborador.VENDEDOR, resposta.perfil());
    }

    @Test
    @DisplayName("Deve rejeitar senha incorreta")
    void deveRejeitarSenhaIncorreta() {
        LoginRequestDTO dto = new LoginRequestDTO("carlos@loja.com", "senha-errada");

        when(colaboradorRepository.findByEmail("carlos@loja.com")).thenReturn(Optional.of(colaboradorAtivo));
        when(passwordEncoder.matches("senha-errada", "hash-armazenado")).thenReturn(false);

        assertThrows(AuthenticationFailedException.class, () -> authService.login(dto));
    }

    @Test
    @DisplayName("Deve rejeitar colaborador inativo")
    void deveRejeitarColaboradorInativo() {
        colaboradorAtivo.setAtivo(false);
        LoginRequestDTO dto = new LoginRequestDTO("carlos@loja.com", "senha123");

        when(colaboradorRepository.findByEmail("carlos@loja.com")).thenReturn(Optional.of(colaboradorAtivo));

        assertThrows(BusinessException.class, () -> authService.login(dto));
    }
}

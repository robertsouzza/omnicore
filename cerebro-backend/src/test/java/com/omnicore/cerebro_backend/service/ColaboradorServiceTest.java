package com.omnicore.cerebro_backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
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

import com.omnicore.cerebro_backend.dto.ColaboradorRequestDTO;
import com.omnicore.cerebro_backend.enums.PerfilColaborador;
import com.omnicore.cerebro_backend.exception.BusinessException;
import com.omnicore.cerebro_backend.model.Colaborador;
import com.omnicore.cerebro_backend.repository.ColaboradorRepository;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class ColaboradorServiceTest {

    @Mock
    private ColaboradorRepository colaboradorRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    private ColaboradorService colaboradorService;

    private ColaboradorRequestDTO dtoValido;

    @BeforeEach
    void setUp() {
        colaboradorService = new ColaboradorService(colaboradorRepository, passwordEncoder);
        dtoValido = new ColaboradorRequestDTO(
                "Carlos Vendedor",
                "98765432100",
                "carlos@loja.com",
                "senha123",
                PerfilColaborador.VENDEDOR,
                new BigDecimal("5.00"));
    }

    @Test
    @DisplayName("Deve cadastrar colaborador com senha BCrypt")
    void deveCadastrarComSenhaHash() {
        when(colaboradorRepository.existsByCpf("98765432100")).thenReturn(false);
        when(colaboradorRepository.existsByEmail("carlos@loja.com")).thenReturn(false);
        when(passwordEncoder.encode("senha123")).thenReturn("$2a$hash");
        when(colaboradorRepository.save(any(Colaborador.class))).thenAnswer(inv -> {
            Colaborador c = inv.getArgument(0);
            c.setId(1L);
            return c;
        });

        Colaborador salvo = colaboradorService.cadastrar(dtoValido);

        assertEquals(1L, salvo.getId());
        assertEquals("$2a$hash", salvo.getSenhaHash());
        verify(passwordEncoder).encode("senha123");
    }

    @Test
    @DisplayName("Deve exigir senha no cadastro")
    void deveExigirSenhaNoCadastro() {
        ColaboradorRequestDTO semSenha = new ColaboradorRequestDTO(
                dtoValido.nome(), dtoValido.cpf(), dtoValido.email(), "  ",
                dtoValido.perfil(), dtoValido.limiteDescontoAutonomo());

        assertThrows(BusinessException.class, () -> colaboradorService.cadastrar(semSenha));
        verify(colaboradorRepository, never()).save(any());
    }

    @Test
    @DisplayName("Deve rejeitar colaborador inativo em nova venda")
    void deveRejeitarColaboradorInativo() {
        Colaborador inativo = Colaborador.builder().id(10L).nome("Ana").ativo(false).build();
        when(colaboradorRepository.findById(10L)).thenReturn(Optional.of(inativo));

        BusinessException ex = assertThrows(BusinessException.class,
                () -> colaboradorService.validarColaboradorAtivoParaVenda(10L));

        assertTrue(ex.getMessage().contains("inativo"));
    }

    @Test
    @DisplayName("Deve atualizar senha somente quando informada")
    void deveAtualizarSenhaQuandoInformada() {
        Colaborador existente = Colaborador.builder()
                .id(2L)
                .nome("Carlos")
                .cpf("98765432100")
                .email("carlos@loja.com")
                .senhaHash("antigo")
                .perfil(PerfilColaborador.VENDEDOR)
                .limiteDescontoAutonomo(new BigDecimal("5"))
                .ativo(true)
                .build();

        when(colaboradorRepository.findById(2L)).thenReturn(Optional.of(existente));
        when(colaboradorRepository.findByCpf("98765432100")).thenReturn(Optional.of(existente));
        when(colaboradorRepository.findByEmail("carlos@loja.com")).thenReturn(Optional.of(existente));
        when(passwordEncoder.encode("novaSenha")).thenReturn("novoHash");
        when(colaboradorRepository.save(any(Colaborador.class))).thenAnswer(inv -> inv.getArgument(0));

        ColaboradorRequestDTO updateComSenha = new ColaboradorRequestDTO(
                "Carlos Vendedor", "98765432100", "carlos@loja.com", "novaSenha",
                PerfilColaborador.GERENTE, new BigDecimal("15.00"));

        Colaborador atualizado = colaboradorService.atualizar(2L, updateComSenha);

        assertEquals("novoHash", atualizado.getSenhaHash());
        assertEquals(PerfilColaborador.GERENTE, atualizado.getPerfil());
        verify(passwordEncoder).encode("novaSenha");
    }
}

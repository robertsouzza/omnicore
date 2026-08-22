package com.omnicore.cerebro_backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import com.omnicore.cerebro_backend.dto.ClienteRequestDTO;
import com.omnicore.cerebro_backend.exception.BusinessException;
import com.omnicore.cerebro_backend.model.Cliente;
import com.omnicore.cerebro_backend.repository.ClienteRepository;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class ClienteServiceTest {

    @Mock
    private ClienteRepository clienteRepository;

    private ClienteService clienteService;

    private ClienteRequestDTO dtoValido;

    @BeforeEach
    void setUp() {
        clienteService = new ClienteService(clienteRepository);
        dtoValido = new ClienteRequestDTO(
                "Maria Silva",
                "123.456.789-09",
                "maria@email.com",
                "BR",
                "(11) 99999-8888",
                "69309-209",
                "Rua Antônio Pinheiro Galvão",
                "634",
                null,
                "Buritis",
                "Boa Vista",
                "RR");
    }

    @Test
    @DisplayName("Deve cadastrar cliente normalizando CPF, celular e CEP")
    void deveCadastrarCliente() {
        when(clienteRepository.findByCpf("12345678909")).thenReturn(Optional.empty());
        when(clienteRepository.save(any(Cliente.class))).thenAnswer(inv -> {
            Cliente c = inv.getArgument(0);
            c.setId(1L);
            return c;
        });

        Cliente salvo = clienteService.cadastrar(dtoValido);

        assertEquals(1L, salvo.getId());
        assertEquals("12345678909", salvo.getCpf());

        ArgumentCaptor<Cliente> captor = ArgumentCaptor.forClass(Cliente.class);
        verify(clienteRepository).save(captor.capture());
        Cliente persistido = captor.getValue();
        assertEquals("Maria Silva", persistido.getNomeCompleto());
        assertEquals("BR", persistido.getCodigoPais());
        assertEquals("11999998888", persistido.getCelular());
        assertEquals("69309209", persistido.getCep());
        assertEquals("RR", persistido.getEstado());
    }

    @Test
    @DisplayName("Deve rejeitar CPF duplicado")
    void deveRejeitarCpfDuplicado() {
        when(clienteRepository.findByCpf("12345678909")).thenReturn(Optional.of(new Cliente()));

        assertThrows(BusinessException.class, () -> clienteService.cadastrar(dtoValido));
        verify(clienteRepository, never()).save(any());
    }

    @Test
    @DisplayName("Deve rejeitar celular brasileiro inválido")
    void deveRejeitarCelularBrInvalido() {
        ClienteRequestDTO dtoInvalido = new ClienteRequestDTO(
                dtoValido.nomeCompleto(),
                dtoValido.cpf(),
                dtoValido.email(),
                "BR",
                "119999",
                dtoValido.cep(),
                dtoValido.logradouro(),
                dtoValido.numero(),
                dtoValido.complemento(),
                dtoValido.bairro(),
                dtoValido.cidade(),
                dtoValido.estado());

        when(clienteRepository.findByCpf("12345678909")).thenReturn(Optional.empty());

        assertThrows(BusinessException.class, () -> clienteService.cadastrar(dtoInvalido));
        verify(clienteRepository, never()).save(any());
    }

    @Test
    @DisplayName("Deve listar apenas clientes ativos por padrão")
    void deveListarApenasAtivos() {
        PageRequest pageable = PageRequest.of(0, 20);
        when(clienteRepository.findByAtivo(true, pageable)).thenReturn(new PageImpl<>(java.util.List.of()));

        Page<Cliente> page = clienteService.listar(pageable, false);

        assertEquals(0, page.getTotalElements());
        verify(clienteRepository).findByAtivo(eq(true), eq(pageable));
    }

    @Test
    @DisplayName("Deve impedir venda para cliente inativo")
    void deveRejeitarClienteInativoNaVenda() {
        Cliente inativo = Cliente.builder().id(5L).nomeCompleto("João").ativo(false).build();
        when(clienteRepository.findById(5L)).thenReturn(Optional.of(inativo));

        BusinessException ex = assertThrows(BusinessException.class,
                () -> clienteService.validarClienteAtivoParaVenda(5L));

        assertTrue(ex.getMessage().contains("inativo"));
    }
}

package com.omnicore.cerebro_backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyString;
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
import com.omnicore.cerebro_backend.model.TipoDocumento;
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
                TipoDocumento.CPF,
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
        when(clienteRepository.findByTipoDocumentoAndNumeroDocumento(TipoDocumento.CPF, "12345678909"))
                .thenReturn(Optional.empty());
        when(clienteRepository.save(any(Cliente.class))).thenAnswer(inv -> {
            Cliente c = inv.getArgument(0);
            c.setId(1L);
            return c;
        });

        Cliente salvo = clienteService.cadastrar(dtoValido);

        assertEquals(1L, salvo.getId());

        ArgumentCaptor<Cliente> captor = ArgumentCaptor.forClass(Cliente.class);
        verify(clienteRepository).save(captor.capture());
        Cliente persistido = captor.getValue();
        assertEquals(TipoDocumento.CPF, persistido.getTipoDocumento());
        assertEquals("12345678909", persistido.getNumeroDocumento());
        assertEquals("69309209", persistido.getCep());
    }

    @Test
    @DisplayName("Deve cadastrar cliente estrangeiro com passaporte e endereço BR")
    void deveCadastrarClienteEstrangeiro() {
        ClienteRequestDTO dtoEstrangeiro = new ClienteRequestDTO(
                "John Smith",
                TipoDocumento.PASSAPORTE,
                "ca1234567",
                "john@email.com",
                "CA",
                "4165552671",
                "69309209",
                "Rua A",
                "100",
                null,
                "Centro",
                "Boa Vista",
                "RR");

        when(clienteRepository.findByTipoDocumentoAndNumeroDocumento(TipoDocumento.PASSAPORTE, "CA1234567"))
                .thenReturn(Optional.empty());
        when(clienteRepository.save(any(Cliente.class))).thenAnswer(inv -> inv.getArgument(0));

        Cliente salvo = clienteService.cadastrar(dtoEstrangeiro);

        assertEquals(TipoDocumento.PASSAPORTE, salvo.getTipoDocumento());
        assertEquals("CA1234567", salvo.getNumeroDocumento());
    }

    @Test
    @DisplayName("Deve cadastrar cliente com celular português (9 dígitos)")
    void deveCadastrarClienteComCelularPortugues() {
        ClienteRequestDTO dtoPortugues = new ClienteRequestDTO(
                "Sofia Mendes Almeida",
                TipoDocumento.PASSAPORTE,
                "N1234567",
                "sofia.mendes@email.pt",
                "PT",
                "912345678",
                "22041001",
                "Av. Nossa Senhora de Copacabana",
                "502",
                "Apt 1201",
                "Copacabana",
                "Rio de Janeiro",
                "RJ");

        when(clienteRepository.findByTipoDocumentoAndNumeroDocumento(TipoDocumento.PASSAPORTE, "N1234567"))
                .thenReturn(Optional.empty());
        when(clienteRepository.save(any(Cliente.class))).thenAnswer(inv -> inv.getArgument(0));

        Cliente salvo = clienteService.cadastrar(dtoPortugues);

        assertEquals("PT", salvo.getCodigoPais());
        assertEquals("912345678", salvo.getCelular());
    }

    @Test
    @DisplayName("Deve rejeitar documento duplicado")
    void deveRejeitarDocumentoDuplicado() {
        when(clienteRepository.findByTipoDocumentoAndNumeroDocumento(TipoDocumento.CPF, "12345678909"))
                .thenReturn(Optional.of(new Cliente()));

        assertThrows(BusinessException.class, () -> clienteService.cadastrar(dtoValido));
        verify(clienteRepository, never()).save(any());
    }

    @Test
    @DisplayName("Deve rejeitar celular brasileiro inválido")
    void deveRejeitarCelularBrInvalido() {
        ClienteRequestDTO dtoInvalido = new ClienteRequestDTO(
                dtoValido.nomeCompleto(),
                dtoValido.tipoDocumento(),
                dtoValido.numeroDocumento(),
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

        when(clienteRepository.findByTipoDocumentoAndNumeroDocumento(TipoDocumento.CPF, "12345678909"))
                .thenReturn(Optional.empty());

        assertThrows(BusinessException.class, () -> clienteService.cadastrar(dtoInvalido));
        verify(clienteRepository, never()).save(any());
    }

    @Test
    @DisplayName("Deve exigir endereço BR para cliente estrangeiro")
    void deveExigirEnderecoBrParaEstrangeiro() {
        ClienteRequestDTO dtoSemEndereco = new ClienteRequestDTO(
                "John Smith",
                TipoDocumento.PASSAPORTE,
                "AB1234567",
                "john@email.com",
                "US",
                "4155552671",
                null,
                null,
                null,
                null,
                null,
                null,
                null);

        when(clienteRepository.findByTipoDocumentoAndNumeroDocumento(TipoDocumento.PASSAPORTE, "AB1234567"))
                .thenReturn(Optional.empty());

        BusinessException ex = assertThrows(BusinessException.class, () -> clienteService.cadastrar(dtoSemEndereco));
        assertTrue(ex.getMessage().contains("Brasil"));
        verify(clienteRepository, never()).save(any());
    }

    @Test
    @DisplayName("Deve rejeitar CPF inválido")
    void deveRejeitarCpfInvalido() {
        ClienteRequestDTO dtoCpfInvalido = new ClienteRequestDTO(
                dtoValido.nomeCompleto(),
                TipoDocumento.CPF,
                "111.111.111-11",
                dtoValido.email(),
                dtoValido.codigoPais(),
                dtoValido.celular(),
                dtoValido.cep(),
                dtoValido.logradouro(),
                dtoValido.numero(),
                dtoValido.complemento(),
                dtoValido.bairro(),
                dtoValido.cidade(),
                dtoValido.estado());

        BusinessException ex = assertThrows(BusinessException.class, () -> clienteService.cadastrar(dtoCpfInvalido));
        assertTrue(ex.getMessage().contains("CPF válido"));
        verify(clienteRepository, never()).save(any());
    }

    @Test
    @DisplayName("Deve ignorar busca por nome com menos de 3 caracteres")
    void deveIgnorarBuscaPorNomeCurta() {
        PageRequest pageable = PageRequest.of(0, 20);
        when(clienteRepository.findByAtivo(true, pageable)).thenReturn(new PageImpl<>(java.util.List.of()));

        clienteService.listar(pageable, false, "Ra");

        verify(clienteRepository).findByAtivo(eq(true), eq(pageable));
        verify(clienteRepository, never()).findByAtivoAndNomeCompletoContainingIgnoreCase(
                anyBoolean(), anyString(), any());
    }

    @Test
    @DisplayName("Deve listar clientes filtrando por nome")
    void deveListarPorNome() {
        PageRequest pageable = PageRequest.of(0, 20);
        when(clienteRepository.findByAtivoAndNomeCompletoContainingIgnoreCase(true, "Maria", pageable))
                .thenReturn(new PageImpl<>(java.util.List.of()));

        Page<Cliente> page = clienteService.listar(pageable, false, "Maria");

        assertEquals(0, page.getTotalElements());
        verify(clienteRepository).findByAtivoAndNomeCompletoContainingIgnoreCase(eq(true), eq("Maria"), eq(pageable));
    }

    @Test
    @DisplayName("Deve listar apenas clientes ativos por padrão")
    void deveListarApenasAtivos() {
        PageRequest pageable = PageRequest.of(0, 20);
        when(clienteRepository.findByAtivo(true, pageable)).thenReturn(new PageImpl<>(java.util.List.of()));

        Page<Cliente> page = clienteService.listar(pageable, false, null);

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

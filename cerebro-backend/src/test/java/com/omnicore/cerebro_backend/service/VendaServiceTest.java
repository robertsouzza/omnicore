package com.omnicore.cerebro_backend.service;

import com.omnicore.cerebro_backend.dto.CancelarVendaRequestDTO;
import com.omnicore.cerebro_backend.dto.ItemVendaRequestDTO;
import com.omnicore.cerebro_backend.dto.VendaRequestDTO;
import com.omnicore.cerebro_backend.enums.PerfilColaborador;
import com.omnicore.cerebro_backend.enums.StatusVenda;
import com.omnicore.cerebro_backend.enums.TipoMovimentacaoEstoque;
import com.omnicore.cerebro_backend.enums.TipoProduto;
import com.omnicore.cerebro_backend.exception.BusinessException;
import com.omnicore.cerebro_backend.model.ComposicaoPacote;
import com.omnicore.cerebro_backend.model.ItemVenda;
import com.omnicore.cerebro_backend.model.MovimentacaoEstoque;
import com.omnicore.cerebro_backend.model.Produto;
import com.omnicore.cerebro_backend.model.Venda;
import com.omnicore.cerebro_backend.repository.ComposicaoPacoteRepository;
import com.omnicore.cerebro_backend.repository.MovimentacaoEstoqueRepository;
import com.omnicore.cerebro_backend.repository.ProdutoRepository;
import com.omnicore.cerebro_backend.repository.VendaRepository;
import com.omnicore.cerebro_backend.security.AuthenticatedColaborador;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.ArgumentMatchers;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.mockito.Mockito.lenient;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class VendaServiceTest {

    private static final AuthenticatedColaborador VENDEDOR =
            new AuthenticatedColaborador(1L, "Carlos", "carlos@loja.com", PerfilColaborador.VENDEDOR);

    private static final AuthenticatedColaborador GERENTE =
            new AuthenticatedColaborador(2L, "Ana", "ana@loja.com", PerfilColaborador.GERENTE);

    @Mock
    private VendaRepository vendaRepository;

    @Mock
    private ProdutoRepository produtoRepository;

    @Mock
    private MovimentacaoEstoqueRepository movimentacaoEstoqueRepository;

    @Mock
    private ComposicaoPacoteRepository composicaoPacoteRepository;

    @Mock
    private ClienteService clienteService;

    @Mock
    private ColaboradorService colaboradorService;

    @Mock
    private AuthService authService;

    @Mock
    private ReservaEstoqueService reservaEstoqueService;

    private VendaService vendaService;
    private Produto produtoMock;

    @BeforeEach
    void setUp() {
        vendaService = new VendaService(
                vendaRepository,
                produtoRepository,
                movimentacaoEstoqueRepository,
                composicaoPacoteRepository,
                clienteService,
                colaboradorService,
                authService,
                reservaEstoqueService);

        lenient().when(reservaEstoqueService.calcularSaldoDisponivel(anyInt(), anyLong()))
                .thenAnswer(invocation -> invocation.getArgument(0));
        lenient().when(reservaEstoqueService.obterQuantidadeReservadaAtiva(anyLong())).thenReturn(0);

        produtoMock = new Produto();
        produtoMock.setId(1L);
        produtoMock.setNome("Refrigerante Pepsi-Cola Lata 350ml");
        produtoMock.setPrecoVenda(new BigDecimal("5.00"));
        produtoMock.setAtivo(true);
        produtoMock.setTipoProduto(TipoProduto.UNITARIO);
    }

    @Test
    @DisplayName("Deve criar uma venda com sucesso, calcular valor total com desconto e dar baixa no estoque")
    void deveCriarVendaComSucesso() {
        ItemVendaRequestDTO itemDto = new ItemVendaRequestDTO(1L, 2, new BigDecimal("5.00"), new BigDecimal("0.50"));
        VendaRequestDTO vendaDto = new VendaRequestDTO(StatusVenda.PAGA, 10L, 20L, null, List.of(itemDto));

        when(produtoRepository.findById(1L)).thenReturn(Optional.of(produtoMock));
        when(movimentacaoEstoqueRepository.getSaldoEstoquePorProdutoId(1L)).thenReturn(10);
        when(vendaRepository.save(any(Venda.class))).thenAnswer(invocation -> {
            Venda venda = invocation.getArgument(0);
            venda.setId(1L);
            return venda;
        });

        Venda vendaGerada = vendaService.criarVenda(vendaDto);

        assertNotNull(vendaGerada);
        assertEquals(StatusVenda.PAGA, vendaGerada.getStatus());
        assertEquals(new BigDecimal("9.00"), vendaGerada.getValorTotal());
        assertEquals(1, vendaGerada.getItens().size());
        verify(movimentacaoEstoqueRepository, times(1)).save(any(MovimentacaoEstoque.class));
    }

    @Test
    @DisplayName("Deve lançar BusinessException quando o estoque do produto for insuficiente")
    void deveLancaoExcecaoQuandoEstoqueInsuficiente() {
        ItemVendaRequestDTO itemDto = new ItemVendaRequestDTO(1L, 5, new BigDecimal("5.00"), BigDecimal.ZERO);
        VendaRequestDTO vendaDto = new VendaRequestDTO(StatusVenda.PAGA, 10L, 20L, null, List.of(itemDto));

        when(produtoRepository.findById(1L)).thenReturn(Optional.of(produtoMock));
        when(movimentacaoEstoqueRepository.getSaldoEstoquePorProdutoId(1L)).thenReturn(3);

        BusinessException exception = assertThrows(BusinessException.class, () -> vendaService.criarVenda(vendaDto));

        assertTrue(exception.getMessage().contains("Saldo insuficiente em estoque"));
        verify(vendaRepository, never()).save(any(Venda.class));
        verify(movimentacaoEstoqueRepository, never()).save(any(MovimentacaoEstoque.class));
    }

    @Test
    @DisplayName("Deve listar vendas paginadas aplicando filtros")
    void deveListarVendasComFiltros() {
        PageRequest pageable = PageRequest.of(0, 20);
        LocalDateTime inicio = LocalDateTime.of(2026, 7, 1, 0, 0);
        LocalDateTime fim = LocalDateTime.of(2026, 7, 31, 23, 59);
        Page<Venda> paginaMock = new PageImpl<>(List.of(new Venda()));

        when(vendaRepository.findAll(ArgumentMatchers.<Specification<Venda>>any(), eq(pageable))).thenReturn(paginaMock);

        Page<Venda> resultado = vendaService.listar(pageable, StatusVenda.PAGA, 20L, inicio, fim);

        assertEquals(1, resultado.getTotalElements());
        verify(vendaRepository).findAll(ArgumentMatchers.<Specification<Venda>>any(), eq(pageable));
    }

    @Test
    @DisplayName("Deve lançar BusinessException quando data inicial for posterior à final")
    void deveRejeitarPeriodoInvalido() {
        PageRequest pageable = PageRequest.of(0, 20);
        LocalDateTime inicio = LocalDateTime.of(2026, 7, 10, 0, 0);
        LocalDateTime fim = LocalDateTime.of(2026, 7, 1, 0, 0);

        assertThrows(BusinessException.class, () -> vendaService.listar(pageable, null, null, inicio, fim));
    }

    @Test
    @DisplayName("Deve buscar venda por ID com sucesso")
    void deveBuscarVendaPorId() {
        Venda venda = Venda.builder().id(1L).status(StatusVenda.PAGA).build();
        when(vendaRepository.findById(1L)).thenReturn(Optional.of(venda));

        Venda encontrada = vendaService.buscarPorId(1L);

        assertEquals(1L, encontrada.getId());
    }

    @Test
    void deveCancelarVendaPagaComEstorno() {
        ItemVenda item = ItemVenda.builder()
                .produto(produtoMock)
                .quantidade(2)
                .precoUnitario(new BigDecimal("5.00"))
                .build();
        Venda venda = Venda.builder()
                .id(1L)
                .status(StatusVenda.PAGA)
                .valorTotal(new BigDecimal("10.00"))
                .build();
        venda.adicionarItem(item);

        when(vendaRepository.findById(1L)).thenReturn(Optional.of(venda));
        when(vendaRepository.save(any(Venda.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(movimentacaoEstoqueRepository.findByVendaIdAndTipo(1L, TipoMovimentacaoEstoque.SAIDA))
                .thenReturn(List.of(MovimentacaoEstoque.builder()
                        .produto(produtoMock)
                        .tipo(TipoMovimentacaoEstoque.SAIDA)
                        .quantidade(2)
                        .build()));

        Venda cancelada = vendaService.cancelar(
                1L,
                new CancelarVendaRequestDTO("Produto com defeito", null, null),
                GERENTE);

        assertEquals(StatusVenda.CANCELADA, cancelada.getStatus());
        assertEquals("Produto com defeito", cancelada.getMotivoCancelamento());

        ArgumentCaptor<MovimentacaoEstoque> captor = ArgumentCaptor.forClass(MovimentacaoEstoque.class);
        verify(movimentacaoEstoqueRepository).save(captor.capture());
        assertEquals(TipoMovimentacaoEstoque.ENTRADA, captor.getValue().getTipo());
        assertEquals(2, captor.getValue().getQuantidade());
    }

    @Test
    void deveCancelarVendaPendenteSemEstorno() {
        Venda venda = Venda.builder()
                .id(2L)
                .status(StatusVenda.PENDENTE)
                .valorTotal(BigDecimal.ZERO)
                .build();

        when(vendaRepository.findById(2L)).thenReturn(Optional.of(venda));
        when(vendaRepository.save(any(Venda.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Venda cancelada = vendaService.cancelar(2L, null, VENDEDOR);

        assertEquals(StatusVenda.CANCELADA, cancelada.getStatus());
        verify(movimentacaoEstoqueRepository, never()).save(any(MovimentacaoEstoque.class));
        verify(reservaEstoqueService).liberarReservasVenda(2L);
    }

    @Test
    void deveRejeitarCancelamentoDuplicado() {
        Venda venda = Venda.builder().id(3L).status(StatusVenda.CANCELADA).build();
        when(vendaRepository.findById(3L)).thenReturn(Optional.of(venda));

        assertThrows(BusinessException.class, () -> vendaService.cancelar(3L, null, VENDEDOR));
        verify(vendaRepository, never()).save(any(Venda.class));
    }

    @Test
    void deveRejeitarCancelamentoPagoSemGerente() {
        Venda venda = Venda.builder()
                .id(4L)
                .status(StatusVenda.PAGA)
                .valorTotal(new BigDecimal("10.00"))
                .build();

        when(vendaRepository.findById(4L)).thenReturn(Optional.of(venda));

        assertThrows(BusinessException.class, () -> vendaService.cancelar(4L, null, VENDEDOR));
    }

    @Test
    void deveRejeitarVendaDeProdutoInativo() {
        produtoMock.setAtivo(false);
        ItemVendaRequestDTO itemDto = new ItemVendaRequestDTO(1L, 1, new BigDecimal("5.00"), BigDecimal.ZERO);
        VendaRequestDTO vendaDto = new VendaRequestDTO(StatusVenda.PAGA, 10L, 20L, null, List.of(itemDto));

        when(produtoRepository.findById(1L)).thenReturn(Optional.of(produtoMock));

        BusinessException exception = assertThrows(BusinessException.class, () -> vendaService.criarVenda(vendaDto));

        assertTrue(exception.getMessage().contains("inativo"));
        verify(vendaRepository, never()).save(any(Venda.class));
    }

    @Test
    @DisplayName("Deve baixar estoque dos produtos filhos ao vender um pacote")
    void deveBaixarEstoqueDosFilhosAoVenderPacote() {
        Produto pacote = new Produto();
        pacote.setId(2L);
        pacote.setNome("Kit Limpeza");
        pacote.setTipoProduto(TipoProduto.PACOTE);
        pacote.setAtivo(true);

        Produto filhoA = new Produto();
        filhoA.setId(10L);
        filhoA.setNome("Desinfetante");
        filhoA.setTipoProduto(TipoProduto.UNITARIO);
        filhoA.setAtivo(true);

        Produto filhoB = new Produto();
        filhoB.setId(11L);
        filhoB.setNome("Sabão em pó");
        filhoB.setTipoProduto(TipoProduto.UNITARIO);
        filhoB.setAtivo(true);

        ComposicaoPacote compA = ComposicaoPacote.builder()
                .produtoFilho(filhoA)
                .quantidade(new BigDecimal("1"))
                .build();
        ComposicaoPacote compB = ComposicaoPacote.builder()
                .produtoFilho(filhoB)
                .quantidade(new BigDecimal("2"))
                .build();

        ItemVendaRequestDTO itemDto = new ItemVendaRequestDTO(2L, 1, new BigDecimal("29.90"), BigDecimal.ZERO);
        VendaRequestDTO vendaDto = new VendaRequestDTO(StatusVenda.PAGA, 10L, 20L, null, List.of(itemDto));

        when(produtoRepository.findById(2L)).thenReturn(Optional.of(pacote));
        when(composicaoPacoteRepository.findByPacote_Id(2L)).thenReturn(List.of(compA, compB));
        when(movimentacaoEstoqueRepository.getSaldoEstoquePorProdutoId(10L)).thenReturn(5);
        when(movimentacaoEstoqueRepository.getSaldoEstoquePorProdutoId(11L)).thenReturn(5);
        when(vendaRepository.save(any(Venda.class))).thenAnswer(invocation -> {
            Venda venda = invocation.getArgument(0);
            venda.setId(100L);
            return venda;
        });

        vendaService.criarVenda(vendaDto);

        verify(movimentacaoEstoqueRepository, times(2)).save(any(MovimentacaoEstoque.class));
    }

    @Test
    @DisplayName("Deve rejeitar venda de pacote sem composição cadastrada")
    void deveRejeitarVendaDePacoteSemComposicao() {
        Produto pacote = new Produto();
        pacote.setId(2L);
        pacote.setNome("Kit vazio");
        pacote.setTipoProduto(TipoProduto.PACOTE);
        pacote.setAtivo(true);

        ItemVendaRequestDTO itemDto = new ItemVendaRequestDTO(2L, 1, new BigDecimal("29.90"), BigDecimal.ZERO);
        VendaRequestDTO vendaDto = new VendaRequestDTO(StatusVenda.PAGA, 10L, 20L, null, List.of(itemDto));

        when(produtoRepository.findById(2L)).thenReturn(Optional.of(pacote));
        when(composicaoPacoteRepository.findByPacote_Id(2L)).thenReturn(List.of());

        BusinessException exception = assertThrows(BusinessException.class, () -> vendaService.criarVenda(vendaDto));

        assertTrue(exception.getMessage().contains("não possui composição cadastrada"));
        verify(vendaRepository, never()).save(any(Venda.class));
    }

    @Test
    @DisplayName("Deve pagar venda pendente, validar estoque e registrar saída")
    void devePagarVendaPendenteComBaixaEstoque() {
        ItemVenda item = ItemVenda.builder()
                .produto(produtoMock)
                .quantidade(2)
                .precoUnitario(new BigDecimal("5.00"))
                .build();
        Venda venda = Venda.builder()
                .id(5L)
                .status(StatusVenda.PENDENTE)
                .valorTotal(new BigDecimal("10.00"))
                .build();
        venda.adicionarItem(item);

        when(vendaRepository.findById(5L)).thenReturn(Optional.of(venda));
        when(produtoRepository.findById(1L)).thenReturn(Optional.of(produtoMock));
        when(vendaRepository.save(any(Venda.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Venda paga = vendaService.pagar(5L, VENDEDOR);

        assertEquals(StatusVenda.PAGA, paga.getStatus());
        verify(reservaEstoqueService).consumirReservasVenda(5L);
        verify(movimentacaoEstoqueRepository, times(1)).save(any(MovimentacaoEstoque.class));
    }

    @Test
    @DisplayName("Deve rejeitar pagamento quando não houver reserva ativa")
    void deveRejeitarPagamentoSemReservaAtiva() {
        ItemVenda item = ItemVenda.builder()
                .produto(produtoMock)
                .quantidade(5)
                .precoUnitario(new BigDecimal("5.00"))
                .build();
        Venda venda = Venda.builder()
                .id(6L)
                .status(StatusVenda.PENDENTE)
                .valorTotal(new BigDecimal("25.00"))
                .build();
        venda.adicionarItem(item);

        when(vendaRepository.findById(6L)).thenReturn(Optional.of(venda));
        when(produtoRepository.findById(1L)).thenReturn(Optional.of(produtoMock));
        doThrow(new BusinessException("Não há reserva de estoque ativa para a venda #6."))
                .when(reservaEstoqueService).consumirReservasVenda(6L);

        BusinessException exception = assertThrows(BusinessException.class, () -> vendaService.pagar(6L, VENDEDOR));

        assertTrue(exception.getMessage().contains("reserva"));
        verify(vendaRepository, never()).save(any(Venda.class));
        verify(movimentacaoEstoqueRepository, never()).save(any(MovimentacaoEstoque.class));
    }

    @Test
    @DisplayName("Deve rejeitar pagamento de venda que não está pendente")
    void deveRejeitarPagamentoDeVendaNaoPendente() {
        Venda venda = Venda.builder()
                .id(7L)
                .status(StatusVenda.PAGA)
                .valorTotal(new BigDecimal("10.00"))
                .build();

        when(vendaRepository.findById(7L)).thenReturn(Optional.of(venda));

        BusinessException exception = assertThrows(BusinessException.class, () -> vendaService.pagar(7L, VENDEDOR));

        assertTrue(exception.getMessage().contains("não pode ser paga"));
        verify(vendaRepository, never()).save(any(Venda.class));
    }

    @Test
    @DisplayName("Deve criar venda pendente e reservar estoque")
    void deveCriarVendaPendenteComReserva() {
        ItemVendaRequestDTO itemDto = new ItemVendaRequestDTO(1L, 2, new BigDecimal("5.00"), BigDecimal.ZERO);
        VendaRequestDTO vendaDto = new VendaRequestDTO(StatusVenda.PENDENTE, 10L, 20L, null, List.of(itemDto));

        when(produtoRepository.findById(1L)).thenReturn(Optional.of(produtoMock));
        when(movimentacaoEstoqueRepository.getSaldoEstoquePorProdutoId(1L)).thenReturn(10);
        when(vendaRepository.save(any(Venda.class))).thenAnswer(invocation -> {
            Venda venda = invocation.getArgument(0);
            venda.setId(8L);
            return venda;
        });

        Venda vendaGerada = vendaService.criarVenda(vendaDto);

        assertEquals(StatusVenda.PENDENTE, vendaGerada.getStatus());
        verify(reservaEstoqueService).reservarItensVenda(vendaGerada);
        verify(movimentacaoEstoqueRepository, never()).save(any(MovimentacaoEstoque.class));
    }
}

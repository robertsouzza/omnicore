package com.omnicore.cerebro_backend.service;

import com.omnicore.cerebro_backend.dto.ItemVendaRequestDTO;
import com.omnicore.cerebro_backend.dto.VendaRequestDTO;
import com.omnicore.cerebro_backend.enums.StatusVenda;
import com.omnicore.cerebro_backend.enums.TipoMovimentacaoEstoque;
import com.omnicore.cerebro_backend.exception.BusinessException;
import com.omnicore.cerebro_backend.model.ItemVenda;
import com.omnicore.cerebro_backend.model.MovimentacaoEstoque;
import com.omnicore.cerebro_backend.model.Produto;
import com.omnicore.cerebro_backend.model.Venda;
import com.omnicore.cerebro_backend.repository.MovimentacaoEstoqueRepository;
import com.omnicore.cerebro_backend.repository.ProdutoRepository;
import com.omnicore.cerebro_backend.repository.VendaRepository;

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

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
public class VendaServiceTest {

    @Mock
    private VendaRepository vendaRepository;

    @Mock
    private ProdutoRepository produtoRepository;

    @Mock
    private MovimentacaoEstoqueRepository movimentacaoEstoqueRepository;

    private VendaService vendaService;

    private Produto produtoMock;

    @BeforeEach
    void setUp() {
        vendaService = new VendaService(vendaRepository, produtoRepository, movimentacaoEstoqueRepository);

        produtoMock = new Produto();
        produtoMock.setId(1L);
        produtoMock.setNome("Refrigerante Pepsi-Cola Lata 350ml");
        produtoMock.setPrecoVenda(new BigDecimal("5.00"));
        produtoMock.setAtivo(true);
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

        when(vendaRepository.findByFiltros(StatusVenda.PAGA, 20L, inicio, fim, pageable)).thenReturn(paginaMock);

        Page<Venda> resultado = vendaService.listar(pageable, StatusVenda.PAGA, 20L, inicio, fim);

        assertEquals(1, resultado.getTotalElements());
        verify(vendaRepository).findByFiltros(StatusVenda.PAGA, 20L, inicio, fim, pageable);
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
    @DisplayName("Deve cancelar venda PAGA e gerar ENTRADA de estorno no estoque")
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

        Venda cancelada = vendaService.cancelar(1L);

        assertEquals(StatusVenda.CANCELADA, cancelada.getStatus());

        ArgumentCaptor<MovimentacaoEstoque> captor = ArgumentCaptor.forClass(MovimentacaoEstoque.class);
        verify(movimentacaoEstoqueRepository).save(captor.capture());
        assertEquals(TipoMovimentacaoEstoque.ENTRADA, captor.getValue().getTipo());
        assertEquals(2, captor.getValue().getQuantidade());
    }

    @Test
    @DisplayName("Deve cancelar venda PENDENTE sem gerar movimentação de estorno")
    void deveCancelarVendaPendenteSemEstorno() {
        Venda venda = Venda.builder()
                .id(2L)
                .status(StatusVenda.PENDENTE)
                .valorTotal(BigDecimal.ZERO)
                .build();

        when(vendaRepository.findById(2L)).thenReturn(Optional.of(venda));
        when(vendaRepository.save(any(Venda.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Venda cancelada = vendaService.cancelar(2L);

        assertEquals(StatusVenda.CANCELADA, cancelada.getStatus());
        verify(movimentacaoEstoqueRepository, never()).save(any(MovimentacaoEstoque.class));
    }

    @Test
    @DisplayName("Deve lançar BusinessException ao cancelar venda já cancelada")
    void deveRejeitarCancelamentoDuplicado() {
        Venda venda = Venda.builder().id(3L).status(StatusVenda.CANCELADA).build();
        when(vendaRepository.findById(3L)).thenReturn(Optional.of(venda));

        assertThrows(BusinessException.class, () -> vendaService.cancelar(3L));
        verify(vendaRepository, never()).save(any(Venda.class));
    }
}

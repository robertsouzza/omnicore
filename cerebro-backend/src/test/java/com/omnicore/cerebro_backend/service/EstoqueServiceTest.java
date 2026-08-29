package com.omnicore.cerebro_backend.service;

import com.omnicore.cerebro_backend.dto.MovimentacaoEstoqueRequestDTO;
import com.omnicore.cerebro_backend.enums.TipoMovimentacaoEstoque;
import com.omnicore.cerebro_backend.exception.BusinessException;
import com.omnicore.cerebro_backend.model.MovimentacaoEstoque;
import com.omnicore.cerebro_backend.model.Produto;
import com.omnicore.cerebro_backend.repository.MovimentacaoEstoqueRepository;
import com.omnicore.cerebro_backend.repository.ProdutoRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class EstoqueServiceTest {

    @Mock
    private MovimentacaoEstoqueRepository movimentacaoEstoqueRepository;

    @Mock
    private ProdutoRepository produtoRepository;

    @Mock
    private ReservaEstoqueService reservaEstoqueService;

    private EstoqueService estoqueService;
    private Produto produtoMock;

    @BeforeEach
    void setUp() {
        estoqueService = new EstoqueService(movimentacaoEstoqueRepository, produtoRepository, reservaEstoqueService);

        produtoMock = new Produto();
        produtoMock.setId(1L);
        produtoMock.setNome("Cimento CP-II 50kg");
        produtoMock.setAtivo(true);
    }

    @Test
    @DisplayName("Deve registrar entrada de estoque com sucesso")
    void deveRegistrarEntradaComSucesso() {
        MovimentacaoEstoqueRequestDTO dto = new MovimentacaoEstoqueRequestDTO(1L, 50, "Chegada de lote do fornecedor");
        when(produtoRepository.findById(1L)).thenReturn(Optional.of(produtoMock));
        when(movimentacaoEstoqueRepository.save(any(MovimentacaoEstoque.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        MovimentacaoEstoque resultado = estoqueService.registrarEntrada(dto);

        assertNotNull(resultado);
        assertEquals(TipoMovimentacaoEstoque.ENTRADA, resultado.getTipo());
        assertEquals(50, resultado.getQuantidade());
        assertEquals("Chegada de lote do fornecedor", resultado.getJustificativa());
        verify(movimentacaoEstoqueRepository, times(1)).save(any(MovimentacaoEstoque.class));
    }

    @Test
    @DisplayName("Deve usar justificativa padrão se vier vazia ou nula")
    void deveUsarJustificativaPadraoSeNula() {
        MovimentacaoEstoqueRequestDTO dto = new MovimentacaoEstoqueRequestDTO(1L, 10, null);
        when(produtoRepository.findById(1L)).thenReturn(Optional.of(produtoMock));
        when(movimentacaoEstoqueRepository.save(any(MovimentacaoEstoque.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        MovimentacaoEstoque resultado = estoqueService.registrarEntrada(dto);

        assertEquals("Entrada/Reposição manual de estoque.", resultado.getJustificativa());
    }

    @Test
    @DisplayName("Deve lançar BusinessException ao tentar dar entrada em produto inexistente")
    void deveLancarExcecaoProdutoInexistente() {
        MovimentacaoEstoqueRequestDTO dto = new MovimentacaoEstoqueRequestDTO(99L, 10, "Erro");
        when(produtoRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(BusinessException.class, () -> estoqueService.registrarEntrada(dto));
        verify(movimentacaoEstoqueRepository, never()).save(any(MovimentacaoEstoque.class));
    }

    @Test
    @DisplayName("Deve rejeitar movimentação em produto inativo")
    void deveRejeitarProdutoInativo() {
        produtoMock.setAtivo(false);
        MovimentacaoEstoqueRequestDTO dto = new MovimentacaoEstoqueRequestDTO(1L, 10, "Teste");
        when(produtoRepository.findById(1L)).thenReturn(Optional.of(produtoMock));

        assertThrows(BusinessException.class, () -> estoqueService.registrarEntrada(dto));
        verify(movimentacaoEstoqueRepository, never()).save(any(MovimentacaoEstoque.class));
    }

    @Test
    @DisplayName("Deve registrar saída manual quando houver saldo suficiente")
    void deveRegistrarSaidaManualComSucesso() {
        MovimentacaoEstoqueRequestDTO dto = new MovimentacaoEstoqueRequestDTO(1L, 5, "Ajuste de perda");
        when(produtoRepository.findById(1L)).thenReturn(Optional.of(produtoMock));
        when(movimentacaoEstoqueRepository.getSaldoEstoquePorProdutoId(1L)).thenReturn(20);
        when(reservaEstoqueService.calcularSaldoDisponivel(20, 1L)).thenReturn(20);
        when(movimentacaoEstoqueRepository.save(any(MovimentacaoEstoque.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        MovimentacaoEstoque resultado = estoqueService.registrarSaida(dto);

        assertEquals(TipoMovimentacaoEstoque.SAIDA, resultado.getTipo());
        assertEquals(5, resultado.getQuantidade());
    }

    @Test
    @DisplayName("Deve lançar BusinessException na saída manual com saldo insuficiente")
    void deveRejeitarSaidaComSaldoInsuficiente() {
        MovimentacaoEstoqueRequestDTO dto = new MovimentacaoEstoqueRequestDTO(1L, 10, "Saída");
        when(produtoRepository.findById(1L)).thenReturn(Optional.of(produtoMock));
        when(movimentacaoEstoqueRepository.getSaldoEstoquePorProdutoId(1L)).thenReturn(10);
        when(reservaEstoqueService.calcularSaldoDisponivel(10, 1L)).thenReturn(3);

        assertThrows(BusinessException.class, () -> estoqueService.registrarSaida(dto));
        verify(movimentacaoEstoqueRepository, never()).save(any(MovimentacaoEstoque.class));
    }

    @Test
    @DisplayName("Deve listar histórico paginado de movimentações do produto")
    void deveListarHistoricoPaginado() {
        PageRequest pageable = PageRequest.of(0, 10);
        MovimentacaoEstoque movimentacao = MovimentacaoEstoque.builder()
                .id(1L)
                .produto(produtoMock)
                .tipo(TipoMovimentacaoEstoque.ENTRADA)
                .quantidade(10)
                .dataHora(LocalDateTime.now())
                .justificativa("Teste")
                .build();

        when(produtoRepository.existsById(1L)).thenReturn(true);
        when(movimentacaoEstoqueRepository.findByProduto_IdOrderByDataHoraDesc(eq(1L), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of(movimentacao)));

        Page<?> resultado = estoqueService.listarHistorico(1L, pageable);

        assertEquals(1, resultado.getTotalElements());
    }
}

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

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class EstoqueServiceTest {

    @Mock
    private MovimentacaoEstoqueRepository movimentacaoEstoqueRepository;

    @Mock
    private ProdutoRepository produtoRepository;

    private EstoqueService estoqueService;
    private Produto produtoMock;

    @BeforeEach
    void setUp() {
        // Construtor manual conforme o seu padrão
        estoqueService = new EstoqueService(movimentacaoEstoqueRepository, produtoRepository);

        produtoMock = new Produto();
        produtoMock.setId(1L);
        produtoMock.setNome("Cimento CP-II 50kg");
        produtoMock.setAtivo(true);
    }

    @Test
    @DisplayName("Deve registrar entrada de estoque com sucesso")
    void deveRegistrarEntradaComSucesso() {
        // Arrange
        MovimentacaoEstoqueRequestDTO dto = new MovimentacaoEstoqueRequestDTO(1L, 50, "Chegada de lote do fornecedor");
        when(produtoRepository.findById(1L)).thenReturn(Optional.of(produtoMock));
        when(movimentacaoEstoqueRepository.save(any(MovimentacaoEstoque.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        MovimentacaoEstoque resultado = estoqueService.registrarEntrada(dto);

        // Assert
        assertNotNull(resultado);
        assertEquals(TipoMovimentacaoEstoque.ENTRADA, resultado.getTipo());
        assertEquals(50, resultado.getQuantidade());
        assertEquals("Chegada de lote do fornecedor", resultado.getJustificativa());
        verify(movimentacaoEstoqueRepository, times(1)).save(any(MovimentacaoEstoque.class));
    }

    @Test
    @DisplayName("Deve usar justificativa padrão se vier vazia ou nula")
    void deveUsarJustificativaPadraoSeNula() {
        // Arrange
        MovimentacaoEstoqueRequestDTO dto = new MovimentacaoEstoqueRequestDTO(1L, 10, null);
        when(produtoRepository.findById(1L)).thenReturn(Optional.of(produtoMock));
        when(movimentacaoEstoqueRepository.save(any(MovimentacaoEstoque.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        MovimentacaoEstoque resultado = estoqueService.registrarEntrada(dto);

        // Assert
        assertEquals("Entrada/Reposição manual de estoque.", resultado.getJustificativa());
    }

    @Test
    @DisplayName("Deve lançar BusinessException ao tentar dar entrada em produto inexistente")
    void deveLancarExcecaoProdutoInexistente() {
        // Arrange
        MovimentacaoEstoqueRequestDTO dto = new MovimentacaoEstoqueRequestDTO(99L, 10, "Erro");
        when(produtoRepository.findById(99L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(BusinessException.class, () -> estoqueService.registrarEntrada(dto));
        verify(movimentacaoEstoqueRepository, never()).save(any(MovimentacaoEstoque.class));
    }
}

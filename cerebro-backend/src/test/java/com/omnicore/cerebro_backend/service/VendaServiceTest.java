package com.omnicore.cerebro_backend.service;

import com.omnicore.cerebro_backend.dto.ItemVendaRequestDTO;
import com.omnicore.cerebro_backend.dto.VendaRequestDTO;
import com.omnicore.cerebro_backend.enums.StatusVenda;
import com.omnicore.cerebro_backend.exception.BusinessException;
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
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
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
        // Inicialização manual do serviço passando os mocks via construtor (conforme seu padrão)
        vendaService = new VendaService(vendaRepository, produtoRepository, movimentacaoEstoqueRepository);

        // Prepara um produto padrão para os testes
        produtoMock = new Produto();
        produtoMock.setId(1L);
        produtoMock.setNome("Refrigerante Pepsi-Cola Lata 350ml");
        produtoMock.setPrecoVenda(new BigDecimal("5.00"));
        produtoMock.setAtivo(true);
    }

    @Test
    @DisplayName("Deve criar uma venda com sucesso, calcular valor total com desconto e dar baixa no estoque")
    void deveCriarVendaComSucesso() {
        // Arrange (Cenário)
        ItemVendaRequestDTO itemDto = new ItemVendaRequestDTO(1L, 2, new BigDecimal("5.00"), new BigDecimal("0.50"));
        VendaRequestDTO vendaDto = new VendaRequestDTO(StatusVenda.PAGA, 10L, 20L, null, List.of(itemDto));

        when(produtoRepository.findById(1L)).thenReturn(Optional.of(produtoMock));
        when(movimentacaoEstoqueRepository.getSaldoEstoquePorProdutoId(1L)).thenReturn(10); // Tem 10 no estoque
        
        // Simula o comportamento do save retornando a própria venda que o service montou
        when(vendaRepository.save(any(Venda.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act (Ação)
        Venda vendaGerada = vendaService.criarVenda(vendaDto);

        // Assert (Verificações)
        assertNotNull(vendaGerada);
        assertEquals(StatusVenda.PAGA, vendaGerada.getStatus());
        
        // Cálculo esperado: (5.00 - 0.50) * 2 = 9.00
        assertEquals(new BigDecimal("9.00"), vendaGerada.getValorTotal());
        assertEquals(1, vendaGerada.getItens().size());

        // Garante que o repositório de movimentação salvou a SAÍDA do estoque
        verify(movimentacaoEstoqueRepository, times(1)).save(any(MovimentacaoEstoque.class));
    }

    @Test
    @DisplayName("Deve lançar BusinessException quando o estoque do produto for insuficiente")
    void deveLancaoExcecaoQuandoEstoqueInsuficiente() {
        // Arrange (Cenário)
        ItemVendaRequestDTO itemDto = new ItemVendaRequestDTO(1L, 5, new BigDecimal("5.00"), BigDecimal.ZERO);
        VendaRequestDTO vendaDto = new VendaRequestDTO(StatusVenda.PAGA, 10L, 20L, null, List.of(itemDto));

        when(produtoRepository.findById(1L)).thenReturn(Optional.of(produtoMock));
        when(movimentacaoEstoqueRepository.getSaldoEstoquePorProdutoId(1L)).thenReturn(3); // Só tem 3 no estoque, pedimos 5

        // Act & Assert (Ação e Verificação do Erro)
        BusinessException exception = assertThrows(BusinessException.class, () -> {
            vendaService.criarVenda(vendaDto);
        });

        // Verifica se a mensagem do erro contém os dados corretos
        assertTrue(exception.getMessage().contains("Saldo insuficiente em estoque"));
        
        // Garante que a venda NUNCA foi salva e NENHUMA movimentação de saída foi gerada
        verify(vendaRepository, never()).save(any(Venda.class));
        verify(movimentacaoEstoqueRepository, never()).save(any(MovimentacaoEstoque.class));
    }

}

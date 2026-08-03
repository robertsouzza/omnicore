package com.omnicore.cerebro_backend.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.omnicore.cerebro_backend.dto.ComposicaoPacoteRequestDTO;
import com.omnicore.cerebro_backend.enums.TipoProduto;
import com.omnicore.cerebro_backend.exception.BusinessException;
import com.omnicore.cerebro_backend.model.ComposicaoPacote;
import com.omnicore.cerebro_backend.model.Produto;
import com.omnicore.cerebro_backend.repository.ComposicaoPacoteRepository;
import com.omnicore.cerebro_backend.repository.ProdutoRepository;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class ComposicaoPacoteServiceTest {

    @Mock
    private ComposicaoPacoteRepository composicaoPacoteRepository;

    @Mock
    private ProdutoRepository produtoRepository;

    private ComposicaoPacoteService composicaoPacoteService;

    private Produto pacote;
    private Produto filho;

    @BeforeEach
    void setUp() {
        composicaoPacoteService = new ComposicaoPacoteService(composicaoPacoteRepository, produtoRepository);

        pacote = Produto.builder()
                .id(2L)
                .nome("Kit Limpeza")
                .tipoProduto(TipoProduto.PACOTE)
                .build();

        filho = Produto.builder()
                .id(1L)
                .nome("Desinfetante")
                .tipoProduto(TipoProduto.UNITARIO)
                .build();
    }

    @Test
    @DisplayName("Deve adicionar componente UNITARIO a um pacote")
    void deveAdicionarComponenteAoPacote() {
        ComposicaoPacoteRequestDTO dto = new ComposicaoPacoteRequestDTO(1L, new BigDecimal("1.000"));

        when(produtoRepository.findById(2L)).thenReturn(Optional.of(pacote));
        when(produtoRepository.findById(1L)).thenReturn(Optional.of(filho));
        when(composicaoPacoteRepository.existsByPacote_IdAndProdutoFilho_Id(2L, 1L)).thenReturn(false);
        when(composicaoPacoteRepository.save(any(ComposicaoPacote.class))).thenAnswer(invocation -> {
            ComposicaoPacote salva = invocation.getArgument(0);
            salva.setId(99L);
            return salva;
        });

        ComposicaoPacote resultado = composicaoPacoteService.adicionarComponente(2L, dto);

        assertNotNull(resultado);
        assertEquals(99L, resultado.getId());
        verify(composicaoPacoteRepository).save(any(ComposicaoPacote.class));
    }

    @Test
    @DisplayName("Deve rejeitar composição em produto que não é PACOTE")
    void deveRejeitarProdutoQueNaoEPacote() {
        Produto unitario = Produto.builder().id(1L).tipoProduto(TipoProduto.UNITARIO).build();
        when(produtoRepository.findById(1L)).thenReturn(Optional.of(unitario));

        ComposicaoPacoteRequestDTO dto = new ComposicaoPacoteRequestDTO(3L, BigDecimal.ONE);

        assertThrows(BusinessException.class, () -> composicaoPacoteService.adicionarComponente(1L, dto));
        verify(composicaoPacoteRepository, never()).save(any());
    }

    @Test
    @DisplayName("Deve listar composição de um pacote")
    void deveListarComposicao() {
        when(produtoRepository.findById(2L)).thenReturn(Optional.of(pacote));
        when(composicaoPacoteRepository.findByPacote_Id(2L)).thenReturn(List.of(new ComposicaoPacote()));

        List<ComposicaoPacote> resultado = composicaoPacoteService.listarPorPacote(2L);

        assertEquals(1, resultado.size());
    }
}

package com.omnicore.cerebro_backend.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.omnicore.cerebro_backend.model.Produto;
import com.omnicore.cerebro_backend.repository.ProdutoRepository;

@ExtendWith(MockitoExtension.class)
public class ProdutoServiceTest {

    @Mock
    private ProdutoRepository produtoRepository;

    @InjectMocks
    private ProdutoService produtoService;

    @Test
    @DisplayName("Deve inativar um produto com sucesso (Exclusão Lógica)")
    void deveInativarProdutoComSucesso() {
        // Arrange (Configuração do cenário)
        Long idExistente = 1L;
        Produto produtoMock = Produto.builder()
                .id(idExistente)
                .nome("Coca-Cola")
                .ativo(true)
                .build();

        // Dizemos ao Mockito o que fazer quando o Service chamar o Repository
        when(produtoRepository.findById(idExistente)).thenReturn(Optional.of(produtoMock));
        when(produtoRepository.save(any(Produto.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act (Execução da ação)
        produtoService.inativar(idExistente);

        // Assert (Validação dos resultados)
        assertFalse(produtoMock.getAtivo(), "O produto deveria estar com o status ativo = false");
        verify(produtoRepository, times(1)).findById(idExistente);
        verify(produtoRepository, times(1)).save(produtoMock);
    }

    @Test
    @DisplayName("Deve lançar exceção ao tentar atualizar ou inativar um produto inexistente")
    void deveLancarExcecaoQuandoProdutoNaoExistir() {
        // Arrange
        Long idInexistente = 99L;
        when(produtoRepository.findById(idInexistente)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(RuntimeException.class, () -> {
            produtoService.inativar(idInexistente);
        });

        verify(produtoRepository, times(1)).findById(idInexistente);
        verify(produtoRepository, never()).save(any(Produto.class));
    }

    @Test
    @DisplayName("Deve listar apenas produtos ativos por padrão")
    void deveListarApenasProdutosAtivos() {
        // Arrange
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(0, 20);
        org.springframework.data.domain.Page<Produto> paginaMock = new org.springframework.data.domain.PageImpl<>(java.util.List.of(new Produto()));
        
        when(produtoRepository.findByAtivo(true, pageable)).thenReturn(paginaMock);

        // Act
        org.springframework.data.domain.Page<Produto> resultado = produtoService.listarTodos(pageable, false);

        // Assert
        assertNotNull(resultado);
        verify(produtoRepository, times(1)).findByAtivo(true, pageable);
        verify(produtoRepository, never()).findAll(pageable);
    }

    @Test
    @DisplayName("Deve listar todos os produtos incluindo inativos quando solicitado")
    void deveListarTodosOsProdutosIncluindoInativos() {
        // Arrange
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(0, 20);
        org.springframework.data.domain.Page<Produto> paginaMock = new org.springframework.data.domain.PageImpl<>(java.util.List.of(new Produto()));
        
        when(produtoRepository.findAll(pageable)).thenReturn(paginaMock);

        // Act
        org.springframework.data.domain.Page<Produto> resultado = produtoService.listarTodos(pageable, true);

        // Assert
        assertNotNull(resultado);
        verify(produtoRepository, times(1)).findAll(pageable);
        verify(produtoRepository, never()).findByAtivo(anyBoolean(), any());
    }

}

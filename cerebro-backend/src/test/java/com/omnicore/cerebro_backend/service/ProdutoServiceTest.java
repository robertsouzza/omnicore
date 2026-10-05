package com.omnicore.cerebro_backend.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.omnicore.cerebro_backend.exception.BusinessException;
import com.omnicore.cerebro_backend.model.Produto;
import com.omnicore.cerebro_backend.repository.ProdutoRepository;
import com.omnicore.cerebro_backend.support.WebMvcTestAuth;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
public class ProdutoServiceTest {

    @Mock
    private ProdutoRepository produtoRepository;

    @Mock
    private PrecificacaoService precificacaoService;

    @InjectMocks
    private ProdutoService produtoService;

    @BeforeEach
    void autenticarGerente() {
        WebMvcTestAuth.setGerenteNoContexto();
        org.mockito.Mockito.lenient()
                .doNothing()
                .when(precificacaoService)
                .enriquecerIndicadoresPrecificacao(org.mockito.ArgumentMatchers.any());
    }

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
        org.springframework.data.domain.Page<Produto> resultado = produtoService.listarTodos(pageable, false, null, null);

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
        org.springframework.data.domain.Page<Produto> resultado = produtoService.listarTodos(pageable, true, null, null);

        // Assert
        assertNotNull(resultado);
        verify(produtoRepository, times(1)).findAll(pageable);
        verify(produtoRepository, never()).findByAtivo(anyBoolean(), any());
    }

    @Test
    @DisplayName("Deve listar produtos filtrando por nome")
    void deveListarProdutosPorNome() {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(0, 20);
        org.springframework.data.domain.Page<Produto> paginaMock = new org.springframework.data.domain.PageImpl<>(java.util.List.of(new Produto()));

        when(produtoRepository.findByAtivoAndNomeContainingIgnoreCase(true, "Coca", pageable))
                .thenReturn(paginaMock);

        org.springframework.data.domain.Page<Produto> resultado = produtoService.listarTodos(pageable, false, "Coca", null);

        assertNotNull(resultado);
        verify(produtoRepository).findByAtivoAndNomeContainingIgnoreCase(true, "Coca", pageable);
    }

    @Test
    @DisplayName("Deve ignorar busca por nome com menos de 3 caracteres")
    void deveIgnorarBuscaPorNomeCurta() {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(0, 20);
        when(produtoRepository.findByAtivo(true, pageable))
                .thenReturn(new org.springframework.data.domain.PageImpl<>(java.util.List.of()));

        produtoService.listarTodos(pageable, false, "Co", null);

        verify(produtoRepository).findByAtivo(true, pageable);
        verify(produtoRepository, never()).findByAtivoAndNomeContainingIgnoreCase(anyBoolean(), any(), any());
    }

    @Test
    @DisplayName("Deve listar produtos filtrando por código de barras")
    void deveListarProdutosPorCodigoBarras() {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(0, 20);
        org.springframework.data.domain.Page<Produto> paginaMock = new org.springframework.data.domain.PageImpl<>(java.util.List.of(new Produto()));

        when(produtoRepository.findByAtivoAndCodigoBarrasContaining(true, "789123", pageable))
                .thenReturn(paginaMock);

        org.springframework.data.domain.Page<Produto> resultado = produtoService.listarTodos(pageable, false, null, "789123");

        assertNotNull(resultado);
        verify(produtoRepository).findByAtivoAndCodigoBarrasContaining(true, "789123", pageable);
    }

    @Test
    @DisplayName("Deve ignorar busca por código de barras com menos de 3 dígitos")
    void deveIgnorarBuscaPorCodigoBarrasCurto() {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(0, 20);
        when(produtoRepository.findByAtivo(true, pageable))
                .thenReturn(new org.springframework.data.domain.PageImpl<>(java.util.List.of()));

        produtoService.listarTodos(pageable, false, null, "78");

        verify(produtoRepository).findByAtivo(true, pageable);
        verify(produtoRepository, never()).findByAtivoAndCodigoBarrasContaining(anyBoolean(), any(), any());
    }

    @Test
    @DisplayName("Atualizar produto preserva QR/código de barras quando payload envia null")
    void devePreservarImagensCodigosQuandoNaoInformadasNoUpdate() {
        Long id = 14L;
        Produto existente = Produto.builder()
                .id(id)
                .codigoBarras("7899876543213")
                .nome("Amaciante")
                .precoVenda(new java.math.BigDecimal("10.50"))
                .categoria("Limpeza")
                .tipoProduto(com.omnicore.cerebro_backend.enums.TipoProduto.UNITARIO)
                .indicadorTamanho(com.omnicore.cerebro_backend.enums.IndicadorTamanho.PEQUENO)
                .ativo(true)
                .imagemCodigoBarras("data:image/png;base64,barcode")
                .imagemQrCode("data:image/png;base64,qr")
                .build();

        Produto dados = Produto.builder()
                .codigoBarras("7899876543213")
                .nome("Amaciante Atualizado")
                .precoVenda(new java.math.BigDecimal("11.00"))
                .categoria("Limpeza")
                .tipoProduto(com.omnicore.cerebro_backend.enums.TipoProduto.UNITARIO)
                .indicadorTamanho(com.omnicore.cerebro_backend.enums.IndicadorTamanho.PEQUENO)
                .imagemCodigoBarras(null)
                .imagemQrCode(null)
                .build();

        when(produtoRepository.findById(id)).thenReturn(Optional.of(existente));
        when(produtoRepository.findByCodigoBarras("7899876543213")).thenReturn(Optional.of(existente));
        when(produtoRepository.save(any(Produto.class))).thenAnswer(inv -> inv.getArgument(0));

        Produto salvo = produtoService.atualizar(id, dados);

        assertEquals("Amaciante Atualizado", salvo.getNome());
        assertEquals("data:image/png;base64,barcode", salvo.getImagemCodigoBarras());
        assertEquals("data:image/png;base64,qr", salvo.getImagemQrCode());
    }

    @Test
    @DisplayName("Deve lançar exceção ao tentar inativar um produto que já está inativo")
    void deveLancarExcecaoQuandoProdutoJaEstiverInativo() {
        // Arrange
        Long idExistente = 1L;
        Produto produtoInativoMock = Produto.builder()
                .id(idExistente)
                .nome("Pepsi-Cola")
                .ativo(false) // Simulando produto que já veio inativo do banco
                .build();

        when(produtoRepository.findById(idExistente)).thenReturn(Optional.of(produtoInativoMock));

        // Act & Assert
        BusinessException excecao = assertThrows(BusinessException.class, () -> {
            produtoService.inativar(idExistente);
        });

        assertEquals("O produto 'Pepsi-Cola' já se encontra inativo no sistema.", excecao.getMessage());
        verify(produtoRepository, times(1)).findById(idExistente);
        verify(produtoRepository, never()).save(any(Produto.class)); // Garante que não forçou update
    }

}

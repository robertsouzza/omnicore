package com.omnicore.cerebro_backend.controller;

import java.math.BigDecimal;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.omnicore.cerebro_backend.enums.IndicadorTamanho;
import com.omnicore.cerebro_backend.enums.TipoProduto;
import com.omnicore.cerebro_backend.exception.BusinessException;
import com.omnicore.cerebro_backend.exception.GlobalExceptionHandler;
import com.omnicore.cerebro_backend.model.Produto;
import com.omnicore.cerebro_backend.service.ProdutoService;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ProdutoController.class)
@Import(GlobalExceptionHandler.class)
@SuppressWarnings("null")
public class ProdutoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ProdutoService produtoService;

    private static final String PAYLOAD_VALIDO = """
            {
                "codigoBarras": "7891234567890",
                "nome": "Produto Teste",
                "descricao": "Descrição do produto",
                "precoVenda": 19.90,
                "categoria": "Bebidas",
                "urlImagem": "https://example.com/img.png",
                "tipoProduto": "UNITARIO",
                "indicadorTamanho": "MEDIO"
            }
            """;

    @Test
    @DisplayName("POST /api/produtos deve retornar 201 Created ao cadastrar produto válido")
    void deveRetornar201AoCadastrarProduto() throws Exception {
        Produto produtoSalvo = Produto.builder()
                .id(1L)
                .codigoBarras("7891234567890")
                .nome("Produto Teste")
                .precoVenda(new BigDecimal("19.90"))
                .categoria("Bebidas")
                .tipoProduto(TipoProduto.UNITARIO)
                .indicadorTamanho(IndicadorTamanho.MEDIO)
                .build();

        when(produtoService.salvar(any(Produto.class))).thenReturn(produtoSalvo);

        mockMvc.perform(post("/api/produtos")
                .contentType(MediaType.APPLICATION_JSON)
                .content(PAYLOAD_VALIDO))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.nome").value("Produto Teste"));
    }

    @Test
    @DisplayName("POST /api/produtos deve retornar 400 Bad Request se o payload for inválido")
    void deveRetornar400AoCadastrarProdutoInvalido() throws Exception {
        String payloadInvalido = """
                {
                    "codigoBarras": "",
                    "nome": "",
                    "precoVenda": -1,
                    "categoria": "",
                    "tipoProduto": "UNITARIO",
                    "indicadorTamanho": "MEDIO"
                }
                """;

        mockMvc.perform(post("/api/produtos")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payloadInvalido))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /api/produtos deve retornar status 200 OK e carregar parâmetros de paginação e filtro")
    void deveRetornar200AoListarProdutos() throws Exception {
        when(produtoService.listarTodos(any(Pageable.class), eq(false)))
                .thenReturn(Page.empty());

        mockMvc.perform(get("/api/produtos")
                .param("page", "0")
                .param("size", "20")
                .param("sort", "nome,ASC")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/produtos deve repassar incluirInativos=true ao service")
    void deveListarProdutosIncluindoInativos() throws Exception {
        when(produtoService.listarTodos(any(Pageable.class), eq(true)))
                .thenReturn(Page.empty());

        mockMvc.perform(get("/api/produtos")
                .param("incluirInativos", "true")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/produtos/{id} deve retornar 200 OK ao buscar produto existente")
    void deveRetornar200AoBuscarProdutoPorId() throws Exception {
        Produto produto = Produto.builder()
                .id(1L)
                .codigoBarras("7891234567890")
                .nome("Produto Teste")
                .precoVenda(new BigDecimal("19.90"))
                .categoria("Bebidas")
                .tipoProduto(TipoProduto.UNITARIO)
                .indicadorTamanho(IndicadorTamanho.MEDIO)
                .build();

        when(produtoService.buscarPorId(1L)).thenReturn(produto);

        mockMvc.perform(get("/api/produtos/{id}", 1L)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.nome").value("Produto Teste"));
    }

    @Test
    @DisplayName("GET /api/produtos/{id} deve retornar 400 Bad Request se o produto não existir")
    void deveRetornar400AoBuscarProdutoInexistente() throws Exception {
        when(produtoService.buscarPorId(999L))
                .thenThrow(new BusinessException("Produto com ID 999 não encontrado."));

        mockMvc.perform(get("/api/produtos/{id}", 999L)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Produto com ID 999 não encontrado."));
    }

    @Test
    @DisplayName("PUT /api/produtos/{id} deve retornar 200 OK ao atualizar produto válido")
    void deveRetornar200AoAtualizarProduto() throws Exception {
        Produto produtoAtualizado = Produto.builder()
                .id(1L)
                .codigoBarras("7891234567890")
                .nome("Produto Atualizado")
                .precoVenda(new BigDecimal("29.90"))
                .categoria("Bebidas")
                .tipoProduto(TipoProduto.UNITARIO)
                .indicadorTamanho(IndicadorTamanho.MEDIO)
                .build();

        when(produtoService.atualizar(eq(1L), any(Produto.class))).thenReturn(produtoAtualizado);

        mockMvc.perform(put("/api/produtos/{id}", 1L)
                .contentType(MediaType.APPLICATION_JSON)
                .content(PAYLOAD_VALIDO.replace("Produto Teste", "Produto Atualizado")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.nome").value("Produto Atualizado"));
    }

    @Test
    @DisplayName("PUT /api/produtos/{id} deve retornar 400 Bad Request se o payload for inválido")
    void deveRetornar400AoAtualizarProdutoInvalido() throws Exception {
        String payloadInvalido = """
                {
                    "codigoBarras": "",
                    "nome": "",
                    "precoVenda": -1,
                    "categoria": "",
                    "tipoProduto": "UNITARIO",
                    "indicadorTamanho": "MEDIO"
                }
                """;

        mockMvc.perform(put("/api/produtos/{id}", 1L)
                .contentType(MediaType.APPLICATION_JSON)
                .content(payloadInvalido))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("DELETE /api/produtos/{id} deve retornar status 204 No Content ao inativar")
    void deveRetornar204AoInativarProduto() throws Exception {
        Long idExistente = 1L;

        doNothing().when(produtoService).inativar(idExistente);

        mockMvc.perform(delete("/api/produtos/{id}", idExistente)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNoContent());
    }
}

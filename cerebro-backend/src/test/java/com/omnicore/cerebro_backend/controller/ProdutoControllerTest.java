package com.omnicore.cerebro_backend.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import com.omnicore.cerebro_backend.service.ProdutoService;

import static org.mockito.Mockito.doNothing;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ProdutoController.class)
public class ProdutoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ProdutoService produtoService;

    @Test
    @DisplayName("DELETE /api/produtos/{id} deve retornar status 204 No Content ao inativar")
    void deveRetornar204AoInativarProduto() throws Exception {
        Long idExistente = 1L;
        
        // Configuramos o mock do service para não fazer nada (Void), simulando sucesso
        doNothing().when(produtoService).inativar(idExistente);

        // Dispara uma requisição HTTP simulada de DELETE
        mockMvc.perform(delete("/api/produtos/{id}", idExistente)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNoContent()); // Valida se o retorno é 204
    }

    @Test
    @DisplayName("GET /api/produtos deve retornar status 200 OK e carregar parâmetros de paginação e filtro")
    void deveRetornar200AoListarProdutos() throws Exception {
        // Arrange
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(0, 20, org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.ASC, "nome"));
        
        when(produtoService.listarTodos(any(org.springframework.data.domain.Pageable.class), eq(false)))
                .thenReturn(org.springframework.data.domain.Page.empty());

        // Act & Assert
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/produtos")
                .param("page", "0")
                .param("size", "20")
                .param("sort", "nome,ASC")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk()); // Valida o retorno 200 OK
    }

}

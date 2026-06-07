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

}

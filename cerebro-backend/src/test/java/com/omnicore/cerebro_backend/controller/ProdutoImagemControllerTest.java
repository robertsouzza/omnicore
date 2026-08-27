package com.omnicore.cerebro_backend.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.omnicore.cerebro_backend.exception.GlobalExceptionHandler;
import com.omnicore.cerebro_backend.storage.ObjectStorageService;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = ProdutoImagemController.class, excludeAutoConfiguration = SecurityAutoConfiguration.class)
@ActiveProfiles("test")
@Import(GlobalExceptionHandler.class)
@SuppressWarnings("null")
class ProdutoImagemControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ObjectStorageService objectStorageService;

    @Test
    @DisplayName("POST /api/produtos/imagem/upload retorna URL pública")
    void deveRetornarUrlAposUpload() throws Exception {
        when(objectStorageService.uploadProdutoImagem(any())).thenReturn(
                "http://localhost:9000/omnicore-produtos/produtos/abc.png");

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "foto.png",
                MediaType.IMAGE_PNG_VALUE,
                new byte[] { (byte) 0x89, 0x50, 0x4E, 0x47 });

        mockMvc.perform(multipart("/api/produtos/imagem/upload").file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.url").value("http://localhost:9000/omnicore-produtos/produtos/abc.png"));
    }
}

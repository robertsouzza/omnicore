package com.omnicore.cerebro_backend.controller;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.omnicore.cerebro_backend.dto.ProdutoImagemUploadResponseDTO;
import com.omnicore.cerebro_backend.storage.ObjectStorageService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/produtos/imagem")
@Tag(name = "Produtos — imagem", description = "Upload de imagem de produto para object storage")
@RequiredArgsConstructor
public class ProdutoImagemController {

    private final ObjectStorageService objectStorageService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(
            summary = "Enviar imagem de produto",
            description = "Recebe JPG/PNG/WebP (até 5 MB), envia ao storage S3-compatível (MinIO em dev) e retorna a URL pública."
    )
    public ResponseEntity<ProdutoImagemUploadResponseDTO> upload(@RequestPart("file") MultipartFile file) {
        String url = objectStorageService.uploadProdutoImagem(file);
        return ResponseEntity.ok(new ProdutoImagemUploadResponseDTO(url));
    }
}

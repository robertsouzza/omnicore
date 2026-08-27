package com.omnicore.cerebro_backend.storage;

import java.util.Set;
import java.util.UUID;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.omnicore.cerebro_backend.exception.BusinessException;

@Service
@Profile("test")
public class InMemoryObjectStorageService implements ObjectStorageService {

    private static final Set<String> TIPOS_PERMITIDOS = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp");

    @Override
    public String uploadProdutoImagem(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("Selecione um arquivo de imagem.");
        }
        String contentType = file.getContentType();
        if (contentType == null || !TIPOS_PERMITIDOS.contains(contentType)) {
            throw new BusinessException("Formato não suportado. Use JPG, PNG ou WebP.");
        }
        return "https://storage.test/produtos/" + UUID.randomUUID() + ".png";
    }
}

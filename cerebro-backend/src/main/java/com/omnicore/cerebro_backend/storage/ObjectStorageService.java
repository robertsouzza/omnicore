package com.omnicore.cerebro_backend.storage;

import org.springframework.web.multipart.MultipartFile;

public interface ObjectStorageService {

    /** Envia imagem de produto e retorna URL pública para persistir em {@code urlImagem}. */
    String uploadProdutoImagem(MultipartFile file);
}

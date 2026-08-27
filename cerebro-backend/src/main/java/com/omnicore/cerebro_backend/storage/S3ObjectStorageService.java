package com.omnicore.cerebro_backend.storage;

import java.io.IOException;
import java.net.URI;
import java.util.Set;
import java.util.UUID;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.omnicore.cerebro_backend.exception.BusinessException;

import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

@Service
@Profile("!test")
@ConditionalOnProperty(prefix = "omnicore.storage", name = "enabled", havingValue = "true", matchIfMissing = true)
public class S3ObjectStorageService implements ObjectStorageService {

    private static final Set<String> TIPOS_PERMITIDOS = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp");

    private final S3Client s3Client;
    private final String bucket;
    private final String publicBaseUrl;
    private final long maxFileSizeBytes;

    public S3ObjectStorageService(
            com.omnicore.cerebro_backend.config.StorageProperties properties) {
        if (!properties.enabled()) {
            throw new IllegalStateException("Storage desabilitado — ver omnicore.storage.enabled");
        }

        this.bucket = properties.bucket();
        this.publicBaseUrl = trimTrailingSlash(properties.publicBaseUrl());
        this.maxFileSizeBytes = properties.maxFileSizeBytes();
        this.s3Client = S3Client.builder()
                .endpointOverride(URI.create(properties.endpoint()))
                .region(Region.US_EAST_1)
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(properties.accessKey(), properties.secretKey())))
                .forcePathStyle(true)
                .build();
    }

    @Override
    public String uploadProdutoImagem(MultipartFile file) {
        validarArquivo(file);

        String extensao = extensaoPorContentType(file.getContentType());
        String objectKey = "produtos/" + UUID.randomUUID() + extensao;

        try {
            PutObjectRequest request = PutObjectRequest.builder()
                    .bucket(bucket)
                    .key(objectKey)
                    .contentType(file.getContentType())
                    .build();

            s3Client.putObject(request, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
        } catch (IOException ex) {
            throw new BusinessException("Não foi possível ler o arquivo enviado.");
        } catch (Exception ex) {
            throw new BusinessException("Falha ao enviar imagem para o storage. Verifique se o MinIO está ativo.");
        }

        return publicBaseUrl + "/" + objectKey;
    }

    private void validarArquivo(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("Selecione um arquivo de imagem.");
        }
        if (file.getSize() > maxFileSizeBytes) {
            throw new BusinessException("A imagem excede o tamanho máximo de 5 MB.");
        }
        String contentType = file.getContentType();
        if (contentType == null || !TIPOS_PERMITIDOS.contains(contentType)) {
            throw new BusinessException("Formato não suportado. Use JPG, PNG ou WebP.");
        }
    }

    private static String extensaoPorContentType(String contentType) {
        return switch (contentType) {
            case "image/jpeg" -> ".jpg";
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            default -> ".bin";
        };
    }

    private static String trimTrailingSlash(String url) {
        if (url == null || url.isBlank()) {
            return "";
        }
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }
}

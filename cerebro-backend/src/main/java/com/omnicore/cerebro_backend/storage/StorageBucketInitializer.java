package com.omnicore.cerebro_backend.storage;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.annotation.Profile;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import com.omnicore.cerebro_backend.config.StorageProperties;

import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.CreateBucketRequest;
import software.amazon.awssdk.services.s3.model.HeadBucketRequest;
import software.amazon.awssdk.services.s3.model.NoSuchBucketException;
import software.amazon.awssdk.services.s3.model.PutBucketPolicyRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;

import java.net.URI;

@Component
@Profile("!test")
@ConditionalOnProperty(prefix = "omnicore.storage", name = "enabled", havingValue = "true", matchIfMissing = true)
public class StorageBucketInitializer {

    private static final String PUBLIC_READ_POLICY = """
            {
              "Version": "2012-10-17",
              "Statement": [{
                "Effect": "Allow",
                "Principal": {"AWS": ["*"]},
                "Action": ["s3:GetObject"],
                "Resource": ["arn:aws:s3:::%s/produtos/*"]
              }]
            }
            """;

    private final StorageProperties properties;

    public StorageBucketInitializer(StorageProperties properties) {
        this.properties = properties;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void garantirBucket() {
        try (S3Client s3 = criarCliente()) {
            String bucket = properties.bucket();
            if (!bucketExiste(s3, bucket)) {
                s3.createBucket(CreateBucketRequest.builder().bucket(bucket).build());
            }
            s3.putBucketPolicy(PutBucketPolicyRequest.builder()
                    .bucket(bucket)
                    .policy(PUBLIC_READ_POLICY.formatted(bucket))
                    .build());
        } catch (Exception ex) {
            // Dev: MinIO pode estar offline — upload falhará com mensagem clara no service.
        }
    }

    private boolean bucketExiste(S3Client s3, String bucket) {
        try {
            s3.headBucket(HeadBucketRequest.builder().bucket(bucket).build());
            return true;
        } catch (NoSuchBucketException ex) {
            return false;
        } catch (S3Exception ex) {
            return ex.statusCode() == 404;
        }
    }

    private S3Client criarCliente() {
        return S3Client.builder()
                .endpointOverride(URI.create(properties.endpoint()))
                .region(Region.US_EAST_1)
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(properties.accessKey(), properties.secretKey())))
                .forcePathStyle(true)
                .build();
    }
}

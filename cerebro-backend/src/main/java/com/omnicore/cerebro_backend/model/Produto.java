package com.omnicore.cerebro_backend.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.omnicore.cerebro_backend.enums.IndicadorTamanho;
import com.omnicore.cerebro_backend.enums.TipoProduto;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.AllArgsConstructor;
import lombok.Builder;



@Entity
@Table(name = "tb_produto")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Produto {

    @Id 
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "codigo_barras", nullable = false, unique = true, length = 50)
    private String codigoBarras;

    @Column(name = "nome", nullable = false, length = 150)
    private String nome;

    @Column(columnDefinition = "TEXT")
    private String descricao;

    @Column(name = "preco_venda", nullable = false, precision = 10, scale = 2)
    private BigDecimal precoVenda;

    @Column(name = "categoria", nullable = false, length = 50)
    private String categoria;

    @Column(name = "url_imagem", length = 255)
    private String urlImagem;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_produto", nullable = false, length = 20)
    private TipoProduto tipoProduto;

    @Enumerated(EnumType.STRING)
    @Column(name = "indicador_tamanho", nullable = false, length = 20)
    private IndicadorTamanho indicadorTamanho;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}

package com.omnicore.cerebro_backend.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.PrePersist;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;


@Entity
@Table(name = "tb_composicao_pacote")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ComposicaoPacote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pacote_id", nullable = false)
    private Produto pacote; // O produto mãe (Aquele que foi marcado com TipoProduto = PACOTE)
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "produto_filho_id", nullable = false)
    private Produto produtoFilho;// O produto filho que compõe o pacote (TipoProduto = UNITARIO)
    
    // Quantidade do produto filho inclusa no combo. 
    // Usamos precision=10 e scale=3 para suportar frações como 1.500 kg ou 0.250g
    @Column(nullable = false, precision = 10, scale = 3)
    private BigDecimal quantidade;
    
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}

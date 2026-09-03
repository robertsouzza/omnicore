package com.omnicore.cerebro_backend.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.omnicore.cerebro_backend.enums.FormaPagamento;
import com.omnicore.cerebro_backend.enums.ProviderPagamento;
import com.omnicore.cerebro_backend.enums.StatusPagamento;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "tb_pagamento_venda")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PagamentoVenda {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "venda_id", nullable = false)
    private Long vendaId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private FormaPagamento forma;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal valor;

    @Column(name = "valor_recebido", precision = 12, scale = 2)
    private BigDecimal valorRecebido;

    @Column(precision = 12, scale = 2)
    private BigDecimal troco;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatusPagamento status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ProviderPagamento provider;

    @Column(name = "referencia_externa", length = 120)
    private String referenciaExterna;

    @Column(length = 40)
    private String nsu;

    @Column(name = "experiencia_pagamento_id", length = 80)
    private String experienciaPagamentoId;

    @Column(name = "pix_copia_e_cola", length = 512)
    private String pixCopiaECola;

    @Column(name = "qr_code_base64", columnDefinition = "TEXT")
    private String qrCodeBase64;

    @Column(name = "data_hora", nullable = false)
    private LocalDateTime dataHora;

}

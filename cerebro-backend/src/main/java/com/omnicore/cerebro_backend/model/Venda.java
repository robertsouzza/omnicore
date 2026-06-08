package com.omnicore.cerebro_backend.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.omnicore.cerebro_backend.enums.StatusVenda;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;


@Entity
@Table(name = "tb_venda")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Venda {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDateTime dataHora;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal valorTotal;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private StatusVenda status;

    // Ganchos temporários para auditoria (RF01 e RF02) até termos as entidades de Usuário/Cliente
    @Column(name = "vendedor_id")
    private Long vendedorId;

    @Column(name = "cliente_id")
    private Long clienteId;

    @Column(length = 100)
    private String nomeClienteOcasional; // Para cadastros rápidos ou vendas diretas

    @OneToMany(mappedBy = "venda", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ItemVenda> itens = new ArrayList<>();

    // Helper method para garantir a consistência do relacionamento bidirecional
    public void adicionarItem(ItemVenda item) {
        this.itens.add(item);
        item.setVenda(this);
    }

}

package com.omnicore.cerebro_backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.omnicore.cerebro_backend.enums.StatusReservaEstoque;
import com.omnicore.cerebro_backend.model.ReservaEstoque;

public interface ReservaEstoqueRepository extends JpaRepository<ReservaEstoque, Long> {

    List<ReservaEstoque> findByVendaIdAndStatus(Long vendaId, StatusReservaEstoque status);

    @Query("""
            SELECT COALESCE(SUM(r.quantidade), 0)
            FROM ReservaEstoque r
            WHERE r.produto.id = :produtoId
              AND r.status = :status
            """)
    Integer somarQuantidadeReservadaAtiva(@Param("produtoId") Long produtoId,
                                          @Param("status") StatusReservaEstoque status);

    default Integer somarQuantidadeReservadaAtiva(Long produtoId) {
        return somarQuantidadeReservadaAtiva(produtoId, StatusReservaEstoque.ATIVA);
    }

}

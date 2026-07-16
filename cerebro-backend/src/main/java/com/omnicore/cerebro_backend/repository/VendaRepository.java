package com.omnicore.cerebro_backend.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.omnicore.cerebro_backend.enums.StatusVenda;
import com.omnicore.cerebro_backend.model.Venda;

public interface VendaRepository extends JpaRepository<Venda, Long> {

    // RF14: Busca todos os pedidos em um determinado status (Ex: PAGA, aguardando painel do balcão)
    List<Venda> findByStatusOrderByDataHoraAsc(StatusVenda status);

    // RF09: Permite ao operador de caixa ou conferente buscar uma venda pelo CPF do cliente
    @Query("SELECT v FROM Venda v WHERE v.vendedorId = :vendedorId AND v.status = :status")
    List<Venda> findVendasPorVendedorEStatus(@Param("vendedorId") Long vendedorId, @Param("status") StatusVenda status);

    @Query("""
            SELECT v FROM Venda v
            WHERE (:status IS NULL OR v.status = :status)
              AND (:clienteId IS NULL OR v.clienteId = :clienteId)
              AND (:dataInicio IS NULL OR v.dataHora >= :dataInicio)
              AND (:dataFim IS NULL OR v.dataHora <= :dataFim)
            """)
    Page<Venda> findByFiltros(
            @Param("status") StatusVenda status,
            @Param("clienteId") Long clienteId,
            @Param("dataInicio") LocalDateTime dataInicio,
            @Param("dataFim") LocalDateTime dataFim,
            Pageable pageable);

}

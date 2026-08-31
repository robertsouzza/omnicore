package com.omnicore.cerebro_backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.omnicore.cerebro_backend.enums.StatusPagamento;
import com.omnicore.cerebro_backend.model.PagamentoVenda;

public interface PagamentoVendaRepository extends JpaRepository<PagamentoVenda, Long> {

    List<PagamentoVenda> findByVendaIdOrderByDataHoraAsc(Long vendaId);

    Optional<PagamentoVenda> findByExperienciaPagamentoId(String experienciaPagamentoId);

    boolean existsByVendaIdAndStatus(Long vendaId, StatusPagamento status);

}

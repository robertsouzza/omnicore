package com.omnicore.cerebro_backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.omnicore.cerebro_backend.model.MovimentacaoEstoque;

public interface MovimentacaoEstoqueRepository extends JpaRepository<MovimentacaoEstoque, Long> {

    // Busca todo o histórico de movimentações de um produto específico
    List<MovimentacaoEstoque> findByProdutoIdOrderByDataHoraDesc(Long produtoId);

    /**
     * RF04 / RF19: O "Cérebro" do cálculo de estoque em tempo real.
     * Soma todas as ENTRADAS e subtrai todas as SAÍDAS registradas para o produto.
     * Retorna o saldo total disponível na loja.
     */
    @Query("""
       SELECT COALESCE(
           SUM(CASE WHEN m.tipo = 'ENTRADA' THEN m.quantidade ELSE -m.quantidade END), 
           0
       ) 
       FROM MovimentacaoEstoque m 
       WHERE m.produto.id = :produtoId
       """)
    Integer getSaldoEstoquePorProdutoId(@Param("produtoId") Long produtoId);

}

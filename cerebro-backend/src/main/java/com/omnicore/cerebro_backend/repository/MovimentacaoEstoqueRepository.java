package com.omnicore.cerebro_backend.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.omnicore.cerebro_backend.enums.TipoMovimentacaoEstoque;
import com.omnicore.cerebro_backend.model.MovimentacaoEstoque;

public interface MovimentacaoEstoqueRepository extends JpaRepository<MovimentacaoEstoque, Long> {

    // Busca todo o histórico de movimentações de um produto específico
    List<MovimentacaoEstoque> findByProdutoIdOrderByDataHoraDesc(Long produtoId);

    Page<MovimentacaoEstoque> findByProduto_IdOrderByDataHoraDesc(Long produtoId, Pageable pageable);

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

    /**
     * Maior saldo acumulado já registrado no histórico de movimentações (pico de reposição).
     */
    @Query(value = """
            WITH mov AS (
                SELECT CASE WHEN tipo = 'ENTRADA' THEN quantidade ELSE -quantidade END AS delta,
                       data_hora,
                       id
                FROM tb_movimentacao_estoque
                WHERE produto_id = :produtoId
            ),
            running AS (
                SELECT SUM(delta) OVER (ORDER BY data_hora ASC, id ASC ROWS UNBOUNDED PRECEDING) AS saldo
                FROM mov
            )
            SELECT COALESCE(MAX(saldo), 0) FROM running
            """, nativeQuery = true)
    Integer getPicoSaldoHistoricoPorProdutoId(@Param("produtoId") Long produtoId);

    List<MovimentacaoEstoque> findByVendaIdAndTipo(Long vendaId, TipoMovimentacaoEstoque tipo);

}

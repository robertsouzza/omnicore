package com.omnicore.cerebro_backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.omnicore.cerebro_backend.model.Produto;

public interface ProdutoRepository extends JpaRepository<Produto, Long> {
    
    // Método derivado (Query Method) para buscar produto por código de barras de forma opcional
    Optional<Produto> findByCodigoBarras(String codigoBarras);

    // Busca paginada filtrando apenas pelo status da coluna 'ativo'
    Page<Produto> findByAtivo(boolean ativo, Pageable pageable);
    
}

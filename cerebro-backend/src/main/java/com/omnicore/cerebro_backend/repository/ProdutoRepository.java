package com.omnicore.cerebro_backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.omnicore.cerebro_backend.model.Produto;

@Repository
public interface ProdutoRepository extends JpaRepository<Produto, Long> {
    
    // Método derivado (Query Method) para buscar produto por código de barras de forma opcional
    Optional<Produto> findByCodigoBarras(String codigoBarras);
    
}

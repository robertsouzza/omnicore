package com.omnicore.cerebro_backend.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.omnicore.cerebro_backend.model.Cliente;
import com.omnicore.cerebro_backend.model.TipoDocumento;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {

    Optional<Cliente> findByTipoDocumentoAndNumeroDocumento(TipoDocumento tipoDocumento, String numeroDocumento);

    Page<Cliente> findByAtivo(boolean ativo, Pageable pageable);

    Page<Cliente> findByNomeCompletoContainingIgnoreCase(String nome, Pageable pageable);

    Page<Cliente> findByAtivoAndNomeCompletoContainingIgnoreCase(boolean ativo, String nome, Pageable pageable);
}

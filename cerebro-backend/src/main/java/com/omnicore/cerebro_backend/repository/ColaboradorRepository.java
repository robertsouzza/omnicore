package com.omnicore.cerebro_backend.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.omnicore.cerebro_backend.model.Colaborador;

public interface ColaboradorRepository extends JpaRepository<Colaborador, Long> {

    Optional<Colaborador> findByCpf(String cpf);

    Optional<Colaborador> findByEmail(String email);

    boolean existsByCpf(String cpf);

    boolean existsByEmail(String email);

    Page<Colaborador> findByAtivo(boolean ativo, Pageable pageable);
}

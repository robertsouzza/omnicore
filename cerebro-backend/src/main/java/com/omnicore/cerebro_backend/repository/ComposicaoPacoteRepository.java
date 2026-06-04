package com.omnicore.cerebro_backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.omnicore.cerebro_backend.model.ComposicaoPacote;

@Repository
public interface ComposicaoPacoteRepository extends JpaRepository<ComposicaoPacote, Long> {

    // Busca todas as composições/componentes de um pacote mãe específico através do seu ID
    List<ComposicaoPacote> findByPacoteId(Long pacoteId);
}

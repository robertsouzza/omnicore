package com.omnicore.cerebro_backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.omnicore.cerebro_backend.model.ComposicaoPacote;


public interface ComposicaoPacoteRepository extends JpaRepository<ComposicaoPacote, Long> {

    List<ComposicaoPacote> findByPacote_Id(Long pacoteId);

    boolean existsByPacote_IdAndProdutoFilho_Id(Long pacoteId, Long produtoFilhoId);
}

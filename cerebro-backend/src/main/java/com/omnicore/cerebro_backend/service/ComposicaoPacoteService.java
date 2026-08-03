package com.omnicore.cerebro_backend.service;

import java.util.List;
import java.util.Objects;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.omnicore.cerebro_backend.dto.ComposicaoPacoteRequestDTO;
import com.omnicore.cerebro_backend.enums.TipoProduto;
import com.omnicore.cerebro_backend.exception.BusinessException;
import com.omnicore.cerebro_backend.model.ComposicaoPacote;
import com.omnicore.cerebro_backend.model.Produto;
import com.omnicore.cerebro_backend.repository.ComposicaoPacoteRepository;
import com.omnicore.cerebro_backend.repository.ProdutoRepository;

@Service
@SuppressWarnings("null")
public class ComposicaoPacoteService {

    private final ComposicaoPacoteRepository composicaoPacoteRepository;
    private final ProdutoRepository produtoRepository;

    public ComposicaoPacoteService(ComposicaoPacoteRepository composicaoPacoteRepository,
                                   ProdutoRepository produtoRepository) {
        this.composicaoPacoteRepository = composicaoPacoteRepository;
        this.produtoRepository = produtoRepository;
    }

    @Transactional(readOnly = true)
    public List<ComposicaoPacote> listarPorPacote(Long pacoteId) {
        Produto pacote = buscarPacote(pacoteId);
        return composicaoPacoteRepository.findByPacote_Id(pacote.getId());
    }

    @Transactional
    public ComposicaoPacote adicionarComponente(Long pacoteId, ComposicaoPacoteRequestDTO dto) {
        Produto pacote = buscarPacote(pacoteId);

        Produto produtoFilho = produtoRepository.findById(dto.produtoFilhoId())
                .orElseThrow(() -> new BusinessException(
                        "Produto filho com ID " + dto.produtoFilhoId() + " não encontrado."));

        if (produtoFilho.getTipoProduto() != TipoProduto.UNITARIO) {
            throw new BusinessException("Apenas produtos do tipo UNITARIO podem compor um pacote.");
        }

        if (pacote.getId().equals(produtoFilho.getId())) {
            throw new BusinessException("O pacote não pode conter a si mesmo como componente.");
        }

        if (composicaoPacoteRepository.existsByPacote_IdAndProdutoFilho_Id(pacoteId, dto.produtoFilhoId())) {
            throw new BusinessException("Este produto já faz parte da composição do pacote.");
        }

        ComposicaoPacote composicao = ComposicaoPacote.builder()
                .pacote(pacote)
                .produtoFilho(produtoFilho)
                .quantidade(dto.quantidade())
                .build();

        return Objects.requireNonNull(
                composicaoPacoteRepository.save(composicao),
                "Falha ao persistir composição do pacote.");
    }

    @Transactional
    public void removerComponente(Long pacoteId, Long composicaoId) {
        buscarPacote(pacoteId);

        ComposicaoPacote composicao = composicaoPacoteRepository.findById(composicaoId)
                .orElseThrow(() -> new BusinessException("Composição com ID " + composicaoId + " não encontrada."));

        if (!composicao.getPacote().getId().equals(pacoteId)) {
            throw new BusinessException("A composição informada não pertence ao pacote #" + pacoteId + ".");
        }

        composicaoPacoteRepository.delete(composicao);
    }

    private Produto buscarPacote(Long pacoteId) {
        Produto pacote = produtoRepository.findById(pacoteId)
                .orElseThrow(() -> new BusinessException("Produto com ID " + pacoteId + " não encontrado."));

        if (pacote.getTipoProduto() != TipoProduto.PACOTE) {
            throw new BusinessException("A composição só pode ser gerenciada para produtos do tipo PACOTE.");
        }

        return pacote;
    }
}

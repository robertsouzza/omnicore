package com.omnicore.cerebro_backend.service;

import com.omnicore.cerebro_backend.dto.MovimentacaoEstoqueRequestDTO;
import com.omnicore.cerebro_backend.enums.TipoMovimentacaoEstoque;
import com.omnicore.cerebro_backend.exception.BusinessException;
import com.omnicore.cerebro_backend.model.MovimentacaoEstoque;
import com.omnicore.cerebro_backend.model.Produto;
import com.omnicore.cerebro_backend.repository.MovimentacaoEstoqueRepository;
import com.omnicore.cerebro_backend.repository.ProdutoRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@SuppressWarnings("null")
@Service
public class EstoqueService {

    private final MovimentacaoEstoqueRepository movimentacaoEstoqueRepository;
    private final ProdutoRepository produtoRepository;

    // Construtor manual para Injeção de Dependência
    public EstoqueService(MovimentacaoEstoqueRepository movimentacaoEstoqueRepository, 
                          ProdutoRepository produtoRepository) {
        this.movimentacaoEstoqueRepository = movimentacaoEstoqueRepository;
        this.produtoRepository = produtoRepository;
    }

    @Transactional
    public MovimentacaoEstoque registrarEntrada(MovimentacaoEstoqueRequestDTO dto) {
        Produto produto = produtoRepository.findById(dto.produtoId())
                .orElseThrow(() -> new BusinessException("Produto com ID " + dto.produtoId() + " não encontrado."));

        String justificativa = dto.justificativa() != null && !dto.justificativa().isBlank() 
                ? dto.justificativa() 
                : "Entrada/Reposição manual de estoque.";

        MovimentacaoEstoque movimentacao = MovimentacaoEstoque.builder()
                .produto(produto)
                .tipo(TipoMovimentacaoEstoque.ENTRADA)
                .quantidade(dto.quantidade())
                .dataHora(LocalDateTime.now())
                .justificativa(justificativa)
                .build();

        return movimentacaoEstoqueRepository.save(movimentacao);
    }

    @Transactional(readOnly = true)
    public Integer consultarSaldo(Long produtoId) {
        if (!produtoRepository.existsById(produtoId)) {
            throw new BusinessException("Produto com ID " + produtoId + " não encontrado.");
        }
        return movimentacaoEstoqueRepository.getSaldoEstoquePorProdutoId(produtoId);
    }

}

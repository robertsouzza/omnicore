package com.omnicore.cerebro_backend.service;

import java.time.LocalDateTime;
import java.util.Objects;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.omnicore.cerebro_backend.dto.MovimentacaoEstoqueRequestDTO;
import com.omnicore.cerebro_backend.dto.MovimentacaoEstoqueResponseDTO;
import com.omnicore.cerebro_backend.dto.SaldoIndicadorResponseDTO;
import com.omnicore.cerebro_backend.enums.TipoMovimentacaoEstoque;
import com.omnicore.cerebro_backend.exception.BusinessException;
import com.omnicore.cerebro_backend.model.MovimentacaoEstoque;
import com.omnicore.cerebro_backend.model.Produto;
import com.omnicore.cerebro_backend.repository.MovimentacaoEstoqueRepository;
import com.omnicore.cerebro_backend.repository.ProdutoRepository;

@SuppressWarnings("null")
@Service
public class EstoqueService {

    private final MovimentacaoEstoqueRepository movimentacaoEstoqueRepository;
    private final ProdutoRepository produtoRepository;

    public EstoqueService(MovimentacaoEstoqueRepository movimentacaoEstoqueRepository,
                          ProdutoRepository produtoRepository) {
        this.movimentacaoEstoqueRepository = movimentacaoEstoqueRepository;
        this.produtoRepository = produtoRepository;
    }

    @Transactional
    public MovimentacaoEstoque registrarEntrada(MovimentacaoEstoqueRequestDTO dto) {
        Produto produto = buscarProdutoAtivoParaMovimentacao(dto.produtoId());

        String justificativa = dto.justificativa() != null && !dto.justificativa().isBlank()
                ? dto.justificativa()
                : "Entrada/Reposição manual de estoque.";

        return salvarMovimentacao(produto, TipoMovimentacaoEstoque.ENTRADA, dto.quantidade(), justificativa, null);
    }

    @Transactional
    public MovimentacaoEstoque registrarSaida(MovimentacaoEstoqueRequestDTO dto) {
        Produto produto = buscarProdutoAtivoParaMovimentacao(dto.produtoId());

        int saldoAtual = obterSaldoAtual(produto.getId());
        if (saldoAtual < dto.quantidade()) {
            throw new BusinessException("Saldo insuficiente em estoque para o produto '" + produto.getNome()
                    + "'. Estoque atual: " + saldoAtual + ", Solicitado: " + dto.quantidade());
        }

        String justificativa = dto.justificativa() != null && !dto.justificativa().isBlank()
                ? dto.justificativa()
                : "Saída manual de estoque.";

        return salvarMovimentacao(produto, TipoMovimentacaoEstoque.SAIDA, dto.quantidade(), justificativa, null);
    }

    @Transactional(readOnly = true)
    public Integer consultarSaldo(Long produtoId) {
        if (!produtoRepository.existsById(produtoId)) {
            throw new BusinessException("Produto com ID " + produtoId + " não encontrado.");
        }
        return obterSaldoAtual(produtoId);
    }

    @Transactional(readOnly = true)
    public SaldoIndicadorResponseDTO consultarSaldoIndicador(Long produtoId) {
        if (!produtoRepository.existsById(produtoId)) {
            throw new BusinessException("Produto com ID " + produtoId + " não encontrado.");
        }
        int saldo = obterSaldoAtual(produtoId);
        int picoHistorico = obterPicoHistorico(produtoId);
        int referencia = Math.max(picoHistorico, saldo);
        return new SaldoIndicadorResponseDTO(saldo, referencia);
    }

    @Transactional(readOnly = true)
    public Page<MovimentacaoEstoqueResponseDTO> listarHistorico(Long produtoId, Pageable pageable) {
        if (pageable == null) {
            throw new BusinessException("Os parâmetros de paginação não podem ser nulos.");
        }
        if (!produtoRepository.existsById(produtoId)) {
            throw new BusinessException("Produto com ID " + produtoId + " não encontrado.");
        }

        return movimentacaoEstoqueRepository.findByProduto_IdOrderByDataHoraDesc(produtoId, pageable)
                .map(MovimentacaoEstoqueResponseDTO::from);
    }

    private Produto buscarProdutoAtivoParaMovimentacao(Long produtoId) {
        Produto produto = produtoRepository.findById(produtoId)
                .orElseThrow(() -> new BusinessException("Produto com ID " + produtoId + " não encontrado."));

        if (!Boolean.TRUE.equals(produto.getAtivo())) {
            throw new BusinessException("O produto '" + produto.getNome() + "' está inativo e não pode movimentar estoque.");
        }

        return produto;
    }

    private int obterSaldoAtual(Long produtoId) {
        Integer saldoConsultado = movimentacaoEstoqueRepository.getSaldoEstoquePorProdutoId(produtoId);
        return saldoConsultado != null ? saldoConsultado : 0;
    }

    private int obterPicoHistorico(Long produtoId) {
        Integer pico = movimentacaoEstoqueRepository.getPicoSaldoHistoricoPorProdutoId(produtoId);
        return pico != null ? pico : 0;
    }

    private MovimentacaoEstoque salvarMovimentacao(Produto produto, TipoMovimentacaoEstoque tipo, Integer quantidade,
                                                   String justificativa, Long vendaId) {
        MovimentacaoEstoque movimentacao = MovimentacaoEstoque.builder()
                .produto(produto)
                .tipo(tipo)
                .quantidade(quantidade)
                .dataHora(LocalDateTime.now())
                .justificativa(justificativa)
                .vendaId(vendaId)
                .build();

        return Objects.requireNonNull(
                movimentacaoEstoqueRepository.save(movimentacao),
                "Falha ao persistir movimentação de estoque.");
    }
}

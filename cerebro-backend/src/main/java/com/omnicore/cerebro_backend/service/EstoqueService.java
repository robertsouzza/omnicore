package com.omnicore.cerebro_backend.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.omnicore.cerebro_backend.dto.MovimentacaoEstoqueRequestDTO;
import com.omnicore.cerebro_backend.dto.MovimentacaoEstoqueResponseDTO;
import com.omnicore.cerebro_backend.dto.SaldoIndicadorItemDTO;
import com.omnicore.cerebro_backend.dto.SaldoIndicadorResponseDTO;
import com.omnicore.cerebro_backend.repository.ProdutoSaldoAggProjection;
import com.omnicore.cerebro_backend.enums.TipoMovimentacaoEstoque;
import com.omnicore.cerebro_backend.exception.BusinessException;
import com.omnicore.cerebro_backend.security.ColaboradorAutorizacao;
import com.omnicore.cerebro_backend.model.MovimentacaoEstoque;
import com.omnicore.cerebro_backend.model.Produto;
import com.omnicore.cerebro_backend.repository.MovimentacaoEstoqueRepository;
import com.omnicore.cerebro_backend.repository.ProdutoRepository;

@SuppressWarnings("null")
@Service
public class EstoqueService {

    private static final int MAX_INDICADOR_LOTE = 100;

    private final MovimentacaoEstoqueRepository movimentacaoEstoqueRepository;
    private final ProdutoRepository produtoRepository;
    private final ReservaEstoqueService reservaEstoqueService;

    public EstoqueService(MovimentacaoEstoqueRepository movimentacaoEstoqueRepository,
                          ProdutoRepository produtoRepository,
                          ReservaEstoqueService reservaEstoqueService) {
        this.movimentacaoEstoqueRepository = movimentacaoEstoqueRepository;
        this.produtoRepository = produtoRepository;
        this.reservaEstoqueService = reservaEstoqueService;
    }

    @Transactional
    public MovimentacaoEstoque registrarEntrada(MovimentacaoEstoqueRequestDTO dto) {
        ColaboradorAutorizacao.exigirMovimentarEstoque(null);
        Produto produto = buscarProdutoAtivoParaMovimentacao(dto.produtoId());

        String justificativa = dto.justificativa() != null && !dto.justificativa().isBlank()
                ? dto.justificativa()
                : "Entrada/Reposição manual de estoque.";

        return salvarMovimentacao(produto, TipoMovimentacaoEstoque.ENTRADA, dto.quantidade(), justificativa, null);
    }

    @Transactional
    public MovimentacaoEstoque registrarSaida(MovimentacaoEstoqueRequestDTO dto) {
        ColaboradorAutorizacao.exigirMovimentarEstoque(null);
        Produto produto = buscarProdutoAtivoParaMovimentacao(dto.produtoId());

        int saldoDisponivel = obterSaldoDisponivel(produto.getId());
        if (saldoDisponivel < dto.quantidade()) {
            throw new BusinessException("Saldo insuficiente em estoque para o produto '" + produto.getNome()
                    + "'. Disponível: " + saldoDisponivel + ", Solicitado: " + dto.quantidade());
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
        return obterSaldoDisponivel(produtoId);
    }

    @Transactional(readOnly = true)
    public SaldoIndicadorResponseDTO consultarSaldoIndicador(Long produtoId) {
        if (!produtoRepository.existsById(produtoId)) {
            throw new BusinessException("Produto com ID " + produtoId + " não encontrado.");
        }
        int saldo = obterSaldoDisponivel(produtoId);
        int picoHistorico = obterPicoHistorico(produtoId);
        int referencia = Math.max(picoHistorico, saldo);
        return new SaldoIndicadorResponseDTO(saldo, referencia);
    }

    @Transactional(readOnly = true)
    public List<SaldoIndicadorItemDTO> consultarSaldoIndicadorLote(List<Long> produtoIds) {
        if (produtoIds == null || produtoIds.isEmpty()) {
            return List.of();
        }
        List<Long> ids = produtoIds.stream().filter(Objects::nonNull).distinct().toList();
        if (ids.isEmpty()) {
            return List.of();
        }
        if (ids.size() > MAX_INDICADOR_LOTE) {
            throw new BusinessException(
                    "Consulta em lote limitada a " + MAX_INDICADOR_LOTE + " produtos por requisição.");
        }

        List<Long> existentes = produtoRepository.findAllById(ids).stream().map(Produto::getId).toList();
        if (existentes.isEmpty()) {
            return List.of();
        }

        Map<Long, Integer> saldoFisico = new HashMap<>();
        for (ProdutoSaldoAggProjection row : movimentacaoEstoqueRepository.getSaldoEstoquePorProdutoIds(existentes)) {
            long total = row.getTotal() != null ? row.getTotal() : 0L;
            saldoFisico.put(row.getProdutoId(), (int) total);
        }

        Map<Long, Integer> reservas = reservaEstoqueService.mapReservasAtivasPorProdutoIds(existentes);

        Map<Long, Integer> picos = new HashMap<>();
        for (Object[] row : movimentacaoEstoqueRepository.getPicoSaldoHistoricoPorProdutoIds(existentes)) {
            Long pid = ((Number) row[0]).longValue();
            int pico = row[1] != null ? ((Number) row[1]).intValue() : 0;
            picos.put(pid, pico);
        }

        List<SaldoIndicadorItemDTO> resultado = new ArrayList<>(existentes.size());
        for (Long produtoId : existentes) {
            int fisico = saldoFisico.getOrDefault(produtoId, 0);
            int reservado = reservas.getOrDefault(produtoId, 0);
            int saldo = fisico - reservado;
            int picoHistorico = picos.getOrDefault(produtoId, 0);
            int referencia = Math.max(picoHistorico, saldo);
            resultado.add(new SaldoIndicadorItemDTO(produtoId, saldo, referencia));
        }
        return resultado;
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

    private int obterSaldoDisponivel(Long produtoId) {
        int saldoFisico = obterSaldoAtual(produtoId);
        return reservaEstoqueService.calcularSaldoDisponivel(saldoFisico, produtoId);
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

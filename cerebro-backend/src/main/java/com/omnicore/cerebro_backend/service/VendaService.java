package com.omnicore.cerebro_backend.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.omnicore.cerebro_backend.dto.ItemVendaRequestDTO;
import com.omnicore.cerebro_backend.dto.VendaRequestDTO;
import com.omnicore.cerebro_backend.enums.StatusVenda;
import com.omnicore.cerebro_backend.enums.TipoMovimentacaoEstoque;
import com.omnicore.cerebro_backend.exception.BusinessException;
import com.omnicore.cerebro_backend.model.ItemVenda;
import com.omnicore.cerebro_backend.model.MovimentacaoEstoque;
import com.omnicore.cerebro_backend.model.Produto;
import com.omnicore.cerebro_backend.model.Venda;
import com.omnicore.cerebro_backend.repository.MovimentacaoEstoqueRepository;
import com.omnicore.cerebro_backend.repository.ProdutoRepository;
import com.omnicore.cerebro_backend.repository.VendaRepository;

@Service
public class VendaService {

    private final VendaRepository vendaRepository;
    private final ProdutoRepository produtoRepository;
    private final MovimentacaoEstoqueRepository movimentacaoEstoqueRepository;

    public VendaService(VendaRepository vendaRepository,
                        ProdutoRepository produtoRepository,
                        MovimentacaoEstoqueRepository movimentacaoEstoqueRepository) {
        this.vendaRepository = vendaRepository;
        this.produtoRepository = produtoRepository;
        this.movimentacaoEstoqueRepository = movimentacaoEstoqueRepository;
    }

    @SuppressWarnings("null")
    @Transactional
    public Venda criarVenda(VendaRequestDTO dto) {
        Venda venda = Venda.builder()
                .dataHora(LocalDateTime.now())
                .status(dto.status())
                .vendedorId(dto.vendedorId())
                .clienteId(dto.clienteId())
                .nomeClienteOcasional(dto.nomeClienteOcasional())
                .valorTotal(BigDecimal.ZERO)
                .build();

        BigDecimal valorTotalCalculado = BigDecimal.ZERO;

        for (ItemVendaRequestDTO itemDto : dto.itens()) {
            if (itemDto.produtoId() == null) {
                throw new BusinessException("O ID do produto não pode ser nulo.");
            }
            Produto produto = produtoRepository.findById(itemDto.produtoId())
                    .orElseThrow(() -> new BusinessException("Produto com ID " + itemDto.produtoId() + " não encontrado."));

            if (deveDebitarEstoque(dto.status())) {
                int saldoAtual = obterSaldoAtual(produto.getId());

                if (saldoAtual < itemDto.quantidade()) {
                    throw new BusinessException("Saldo insuficiente em estoque para o produto '" + produto.getNome()
                            + "'. Estoque atual: " + saldoAtual + ", Solicitado: " + itemDto.quantidade());
                }
            }

            BigDecimal desconto = itemDto.desconto() != null ? itemDto.desconto() : BigDecimal.ZERO;
            BigDecimal subtotalItem = itemDto.precoUnitario()
                    .subtract(desconto)
                    .multiply(BigDecimal.valueOf(itemDto.quantidade()));

            valorTotalCalculado = valorTotalCalculado.add(subtotalItem);

            ItemVenda itemVenda = ItemVenda.builder()
                    .produto(produto)
                    .quantidade(itemDto.quantidade())
                    .precoUnitario(itemDto.precoUnitario())
                    .desconto(desconto)
                    .build();

            venda.adicionarItem(itemVenda);
        }

        venda.setValorTotal(valorTotalCalculado);
        Venda vendaSalva = vendaRepository.save(venda);

        if (deveDebitarEstoque(vendaSalva.getStatus())) {
            registrarSaidaPorVenda(vendaSalva);
        }

        return vendaSalva;
    }

    @Transactional(readOnly = true)
    public Page<Venda> listar(Pageable pageable, StatusVenda status, Long clienteId,
                              LocalDateTime dataInicio, LocalDateTime dataFim) {
        if (pageable == null) {
            throw new BusinessException("Os parâmetros de paginação não podem ser nulos.");
        }
        if (dataInicio != null && dataFim != null && dataInicio.isAfter(dataFim)) {
            throw new BusinessException("A data inicial não pode ser posterior à data final.");
        }
        return vendaRepository.findByFiltros(status, clienteId, dataInicio, dataFim, pageable);
    }

    @Transactional(readOnly = true)
    public Venda buscarPorId(Long id) {
        if (id == null) {
            throw new BusinessException("O ID fornecido não pode ser nulo.");
        }
        return vendaRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Venda com ID " + id + " não encontrada."));
    }

    @Transactional
    public Venda cancelar(Long id) {
        Venda venda = buscarPorId(id);

        if (venda.getStatus() == StatusVenda.CANCELADA) {
            throw new BusinessException("A venda #" + id + " já se encontra cancelada.");
        }

        if (deveDebitarEstoque(venda.getStatus())) {
            registrarEntradaPorEstorno(venda);
        }

        venda.setStatus(StatusVenda.CANCELADA);
        return vendaRepository.save(venda);
    }

    private boolean deveDebitarEstoque(StatusVenda status) {
        return status == StatusVenda.PAGA || status == StatusVenda.CONCLUIDA;
    }

    private int obterSaldoAtual(Long produtoId) {
        Integer saldoConsultado = movimentacaoEstoqueRepository.getSaldoEstoquePorProdutoId(produtoId);
        return saldoConsultado != null ? saldoConsultado : 0;
    }

    private void registrarSaidaPorVenda(Venda venda) {
        for (ItemVenda item : venda.getItens()) {
            movimentacaoEstoqueRepository.save(MovimentacaoEstoque.builder()
                    .produto(item.getProduto())
                    .tipo(TipoMovimentacaoEstoque.SAIDA)
                    .quantidade(item.getQuantidade())
                    .dataHora(LocalDateTime.now())
                    .justificativa("Saída por venda automatizada. Pedido #" + venda.getId())
                    .vendaId(venda.getId())
                    .build());
        }
    }

    private void registrarEntradaPorEstorno(Venda venda) {
        for (ItemVenda item : venda.getItens()) {
            movimentacaoEstoqueRepository.save(MovimentacaoEstoque.builder()
                    .produto(item.getProduto())
                    .tipo(TipoMovimentacaoEstoque.ENTRADA)
                    .quantidade(item.getQuantidade())
                    .dataHora(LocalDateTime.now())
                    .justificativa("Estorno por cancelamento da venda #" + venda.getId())
                    .vendaId(venda.getId())
                    .build());
        }
    }
}

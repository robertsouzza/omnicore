package com.omnicore.cerebro_backend.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.omnicore.cerebro_backend.enums.StatusReservaEstoque;
import com.omnicore.cerebro_backend.enums.TipoProduto;
import com.omnicore.cerebro_backend.exception.BusinessException;
import com.omnicore.cerebro_backend.model.ComposicaoPacote;
import com.omnicore.cerebro_backend.model.ItemVenda;
import com.omnicore.cerebro_backend.model.Produto;
import com.omnicore.cerebro_backend.model.ReservaEstoque;
import com.omnicore.cerebro_backend.model.Venda;
import com.omnicore.cerebro_backend.repository.ComposicaoPacoteRepository;
import com.omnicore.cerebro_backend.repository.ReservaEstoqueRepository;

@Service
@SuppressWarnings("null")
public class ReservaEstoqueService {

    private final ReservaEstoqueRepository reservaEstoqueRepository;
    private final ComposicaoPacoteRepository composicaoPacoteRepository;

    public ReservaEstoqueService(ReservaEstoqueRepository reservaEstoqueRepository,
                                   ComposicaoPacoteRepository composicaoPacoteRepository) {
        this.reservaEstoqueRepository = reservaEstoqueRepository;
        this.composicaoPacoteRepository = composicaoPacoteRepository;
    }

    @Transactional(readOnly = true)
    public int obterQuantidadeReservadaAtiva(Long produtoId) {
        Integer reservado = reservaEstoqueRepository.somarQuantidadeReservadaAtiva(produtoId);
        return reservado != null ? reservado : 0;
    }

    public int calcularSaldoDisponivel(int saldoFisico, Long produtoId) {
        return saldoFisico - obterQuantidadeReservadaAtiva(produtoId);
    }

    @Transactional
    public void reservarItensVenda(Venda venda) {
        if (venda.getId() == null) {
            throw new BusinessException("A venda precisa estar persistida para reservar estoque.");
        }

        List<ReservaEstoque> reservas = new ArrayList<>();
        for (ItemVenda item : venda.getItens()) {
            reservas.addAll(montarReservasPorItem(venda.getId(), item));
        }
        reservaEstoqueRepository.saveAll(reservas);
    }

    @Transactional
    public void liberarReservasVenda(Long vendaId) {
        atualizarStatusReservas(vendaId, StatusReservaEstoque.ATIVA, StatusReservaEstoque.LIBERADA);
    }

    @Transactional
    public void consumirReservasVenda(Long vendaId) {
        List<ReservaEstoque> reservas = reservaEstoqueRepository.findByVendaIdAndStatus(
                vendaId, StatusReservaEstoque.ATIVA);

        if (reservas.isEmpty()) {
            throw new BusinessException(
                    "Não há reserva de estoque ativa para a venda #" + vendaId + ".");
        }

        for (ReservaEstoque reserva : reservas) {
            reserva.setStatus(StatusReservaEstoque.CONSUMIDA);
        }
        reservaEstoqueRepository.saveAll(reservas);
    }

    private void atualizarStatusReservas(Long vendaId, StatusReservaEstoque de, StatusReservaEstoque para) {
        List<ReservaEstoque> reservas = reservaEstoqueRepository.findByVendaIdAndStatus(vendaId, de);
        for (ReservaEstoque reserva : reservas) {
            reserva.setStatus(para);
        }
        reservaEstoqueRepository.saveAll(reservas);
    }

    private List<ReservaEstoque> montarReservasPorItem(Long vendaId, ItemVenda item) {
        Produto produto = item.getProduto();

        if (produto.getTipoProduto() == TipoProduto.PACOTE) {
            return montarReservasPacote(vendaId, produto, item.getQuantidade());
        }

        return List.of(novaReserva(vendaId, produto, item.getQuantidade()));
    }

    private List<ReservaEstoque> montarReservasPacote(Long vendaId, Produto pacote, int quantidadeVendida) {
        List<ComposicaoPacote> componentes = composicaoPacoteRepository.findByPacote_Id(pacote.getId());

        if (componentes.isEmpty()) {
            throw new BusinessException("O pacote '" + pacote.getNome() + "' não possui composição cadastrada.");
        }

        List<ReservaEstoque> reservas = new ArrayList<>();
        for (ComposicaoPacote componente : componentes) {
            int quantidade = calcularQuantidadeComponente(componente.getQuantidade(), quantidadeVendida);
            reservas.add(novaReserva(vendaId, componente.getProdutoFilho(), quantidade));
        }
        return reservas;
    }

    private ReservaEstoque novaReserva(Long vendaId, Produto produto, int quantidade) {
        return ReservaEstoque.builder()
                .vendaId(vendaId)
                .produto(produto)
                .quantidade(quantidade)
                .status(StatusReservaEstoque.ATIVA)
                .dataHora(LocalDateTime.now())
                .build();
    }

    private int calcularQuantidadeComponente(java.math.BigDecimal quantidadePorUnidade, int quantidadeVendida) {
        java.math.BigDecimal total = quantidadePorUnidade.multiply(java.math.BigDecimal.valueOf(quantidadeVendida));

        if (total.remainder(java.math.BigDecimal.ONE).compareTo(java.math.BigDecimal.ZERO) != 0) {
            throw new BusinessException(
                    "A quantidade calculada para o componente do pacote deve ser um número inteiro. Valor obtido: "
                            + total);
        }

        return total.intValueExact();
    }

}

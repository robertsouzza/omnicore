package com.omnicore.cerebro_backend.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.omnicore.cerebro_backend.dto.CancelarVendaRequestDTO;
import com.omnicore.cerebro_backend.dto.ItemVendaRequestDTO;
import com.omnicore.cerebro_backend.dto.VendaRequestDTO;
import com.omnicore.cerebro_backend.enums.StatusVenda;
import com.omnicore.cerebro_backend.enums.TipoMovimentacaoEstoque;
import com.omnicore.cerebro_backend.enums.TipoProduto;
import com.omnicore.cerebro_backend.exception.BusinessException;
import com.omnicore.cerebro_backend.model.Colaborador;
import com.omnicore.cerebro_backend.model.ComposicaoPacote;
import com.omnicore.cerebro_backend.model.ItemVenda;
import com.omnicore.cerebro_backend.model.MovimentacaoEstoque;
import com.omnicore.cerebro_backend.model.Produto;
import com.omnicore.cerebro_backend.model.Venda;
import com.omnicore.cerebro_backend.repository.ComposicaoPacoteRepository;
import com.omnicore.cerebro_backend.repository.MovimentacaoEstoqueRepository;
import com.omnicore.cerebro_backend.repository.ProdutoRepository;
import com.omnicore.cerebro_backend.repository.VendaRepository;
import com.omnicore.cerebro_backend.security.AuthenticatedColaborador;

import jakarta.persistence.criteria.Predicate;

@SuppressWarnings("null")
@Service
public class VendaService {

    private final VendaRepository vendaRepository;
    private final ProdutoRepository produtoRepository;
    private final MovimentacaoEstoqueRepository movimentacaoEstoqueRepository;
    private final ComposicaoPacoteRepository composicaoPacoteRepository;
    private final ClienteService clienteService;
    private final ColaboradorService colaboradorService;
    private final AuthService authService;

    public VendaService(VendaRepository vendaRepository,
                        ProdutoRepository produtoRepository,
                        MovimentacaoEstoqueRepository movimentacaoEstoqueRepository,
                        ComposicaoPacoteRepository composicaoPacoteRepository,
                        ClienteService clienteService,
                        ColaboradorService colaboradorService,
                        AuthService authService) {
        this.vendaRepository = vendaRepository;
        this.produtoRepository = produtoRepository;
        this.movimentacaoEstoqueRepository = movimentacaoEstoqueRepository;
        this.composicaoPacoteRepository = composicaoPacoteRepository;
        this.clienteService = clienteService;
        this.colaboradorService = colaboradorService;
        this.authService = authService;
    }

    @Transactional
    public Venda criarVenda(VendaRequestDTO dto) {
        colaboradorService.validarColaboradorAtivoParaVenda(dto.vendedorId());
        clienteService.validarClienteAtivoParaVenda(dto.clienteId());

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
                    .orElseThrow(() -> new BusinessException(
                            "Produto com ID " + itemDto.produtoId() + " não encontrado."));

            validarProdutoAtivo(produto);

            if (deveDebitarEstoque(dto.status())) {
                validarEstoqueDisponivel(produto, itemDto.quantidade());
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
        return vendaRepository.findAll(montarFiltros(status, clienteId, dataInicio, dataFim), pageable);
    }

    private Specification<Venda> montarFiltros(StatusVenda status, Long clienteId,
                                               LocalDateTime dataInicio, LocalDateTime dataFim) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (status != null) {
                predicates.add(criteriaBuilder.equal(root.get("status"), status));
            }
            if (clienteId != null) {
                predicates.add(criteriaBuilder.equal(root.get("clienteId"), clienteId));
            }
            if (dataInicio != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("dataHora"), dataInicio));
            }
            if (dataFim != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("dataHora"), dataFim));
            }

            return criteriaBuilder.and(predicates.toArray(Predicate[]::new));
        };
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
    public Venda cancelar(Long id, CancelarVendaRequestDTO dto, AuthenticatedColaborador solicitante) {
        if (solicitante == null) {
            throw new BusinessException("Colaborador autenticado não identificado.");
        }

        Venda venda = buscarPorId(id);

        if (venda.getStatus() == StatusVenda.CANCELADA) {
            throw new BusinessException("A venda #" + id + " já se encontra cancelada.");
        }

        validarAutorizacaoCancelamento(venda, dto, solicitante);

        venda.setCanceladoPorColaboradorId(solicitante.id());

        if (deveDebitarEstoque(venda.getStatus())) {
            estornarMovimentacoesDaVenda(venda);
        }

        venda.setStatus(StatusVenda.CANCELADA);
        return vendaRepository.save(venda);
    }

    private void validarAutorizacaoCancelamento(Venda venda, CancelarVendaRequestDTO dto,
                                                AuthenticatedColaborador solicitante) {
        if (!exigeAutorizacaoGerente(venda.getStatus())) {
            return;
        }

        CancelarVendaRequestDTO request = dto != null ? dto : new CancelarVendaRequestDTO(null, null, null);
        String motivo = request.motivo() != null ? request.motivo().trim() : "";

        if (motivo.length() < 3) {
            throw new BusinessException("Informe o motivo do cancelamento (mínimo 3 caracteres).");
        }

        Long autorizadoPorId;

        if (solicitante.perfil().podeAutorizarCancelamentoVendaPaga()) {
            autorizadoPorId = solicitante.id();
        } else {
            Colaborador gerente = authService.validarCredenciaisGerente(
                    request.autorizadorEmail(), request.autorizadorSenha());
            autorizadoPorId = gerente.getId();
        }

        venda.setMotivoCancelamento(motivo);
        venda.setAutorizadoPorColaboradorId(autorizadoPorId);
    }

    private boolean exigeAutorizacaoGerente(StatusVenda status) {
        return status == StatusVenda.PAGA || status == StatusVenda.CONCLUIDA;
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
            registrarMovimentacoesPorItem(
                    item,
                    TipoMovimentacaoEstoque.SAIDA,
                    "Saída por venda automatizada. Pedido #" + venda.getId(),
                    venda.getId());
        }
    }

    private void estornarMovimentacoesDaVenda(Venda venda) {
        List<MovimentacaoEstoque> saidas = movimentacaoEstoqueRepository.findByVendaIdAndTipo(
                venda.getId(), TipoMovimentacaoEstoque.SAIDA);

        for (MovimentacaoEstoque saida : saidas) {
            salvarMovimentacao(
                    saida.getProduto(),
                    TipoMovimentacaoEstoque.ENTRADA,
                    saida.getQuantidade(),
                    "Estorno por cancelamento da venda #" + venda.getId(),
                    venda.getId());
        }
    }

    private void validarEstoqueDisponivel(Produto produto, int quantidadeVendida) {
        if (produto.getTipoProduto() == TipoProduto.PACOTE) {
            validarEstoqueDoPacote(produto, quantidadeVendida);
            return;
        }

        validarSaldoProduto(produto, quantidadeVendida);
    }

    private void validarProdutoAtivo(Produto produto) {
        if (Boolean.FALSE.equals(produto.getAtivo())) {
            throw new BusinessException(
                    "O produto '" + produto.getNome() + "' está inativo e não pode ser vendido.");
        }
    }

    private void validarSaldoProduto(Produto produto, int quantidadeNecessaria) {
        validarProdutoAtivo(produto);
        int saldoAtual = obterSaldoAtual(produto.getId());
        if (saldoAtual < quantidadeNecessaria) {
            throw new BusinessException(
                    "Saldo insuficiente em estoque para o produto '" + produto.getNome()
                            + "'. Estoque atual: " + saldoAtual + ", Solicitado: " + quantidadeNecessaria);
        }
    }

    private void validarEstoqueDoPacote(Produto pacote, int quantidadeVendida) {
        List<ComposicaoPacote> componentes = listarComponentesDoPacote(pacote);

        for (ComposicaoPacote componente : componentes) {
            int quantidadeNecessaria = calcularQuantidadeComponente(componente.getQuantidade(), quantidadeVendida);
            validarSaldoProduto(componente.getProdutoFilho(), quantidadeNecessaria);
        }
    }

    private void registrarMovimentacoesPorItem(ItemVenda item, TipoMovimentacaoEstoque tipo,
                                               String justificativaBase, Long vendaId) {
        Produto produto = item.getProduto();

        if (produto.getTipoProduto() == TipoProduto.PACOTE) {
            List<ComposicaoPacote> componentes = listarComponentesDoPacote(produto);

            for (ComposicaoPacote componente : componentes) {
                int quantidade = calcularQuantidadeComponente(componente.getQuantidade(), item.getQuantidade());
                String justificativa = justificativaBase + " — componente '" + componente.getProdutoFilho().getNome()
                        + "' do pacote '" + produto.getNome() + "'";
                salvarMovimentacao(componente.getProdutoFilho(), tipo, quantidade, justificativa, vendaId);
            }
            return;
        }

        salvarMovimentacao(produto, tipo, item.getQuantidade(), justificativaBase, vendaId);
    }

    private List<ComposicaoPacote> listarComponentesDoPacote(Produto pacote) {
        List<ComposicaoPacote> componentes = composicaoPacoteRepository.findByPacote_Id(pacote.getId());

        if (componentes.isEmpty()) {
            throw new BusinessException("O pacote '" + pacote.getNome() + "' não possui composição cadastrada.");
        }

        return componentes;
    }

    private int calcularQuantidadeComponente(BigDecimal quantidadePorUnidade, int quantidadeVendida) {
        BigDecimal total = quantidadePorUnidade.multiply(BigDecimal.valueOf(quantidadeVendida));

        if (total.remainder(BigDecimal.ONE).compareTo(BigDecimal.ZERO) != 0) {
            throw new BusinessException(
                    "A quantidade calculada para o componente do pacote deve ser um número inteiro. Valor obtido: "
                            + total);
        }

        return total.intValueExact();
    }

    private void salvarMovimentacao(Produto produto, TipoMovimentacaoEstoque tipo, Integer quantidade,
                                    String justificativa, Long vendaId) {
        MovimentacaoEstoque movimentacao = Objects.requireNonNull(
                MovimentacaoEstoque.builder()
                        .produto(produto)
                        .tipo(tipo)
                        .quantidade(quantidade)
                        .dataHora(LocalDateTime.now())
                        .justificativa(justificativa)
                        .vendaId(vendaId)
                        .build(),
                "Falha ao montar movimentação de estoque.");

        movimentacaoEstoqueRepository.save(movimentacao);
    }
}

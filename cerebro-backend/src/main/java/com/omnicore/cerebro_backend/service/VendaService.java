package com.omnicore.cerebro_backend.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.springframework.stereotype.Service;

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

import jakarta.transaction.Transactional;

@Service
public class VendaService {

    private final VendaRepository vendaRepository;
    private final ProdutoRepository produtoRepository;
    private final MovimentacaoEstoqueRepository movimentacaoEstoqueRepository;
   
    // Construtor manual para Injeção de Dependência via Spring
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
        // 1. Inicializa a entidade Venda com os dados básicos
        Venda venda = Venda.builder()
                .dataHora(LocalDateTime.now())
                .status(dto.status())
                .vendedorId(dto.vendedorId())
                .clienteId(dto.clienteId())
                .nomeClienteOcasional(dto.nomeClienteOcasional())
                .valorTotal(BigDecimal.ZERO)
                .build();

        BigDecimal valorTotalCalculado = BigDecimal.ZERO;

        // 2. Processa cada item enviado na requisição
        for (ItemVendaRequestDTO itemDto : dto.itens()) {
            if (itemDto.produtoId() == null) {
                throw new BusinessException("O ID do produto não pode ser nulo.");
            }
            Produto produto = produtoRepository.findById(itemDto.produtoId())
                    .orElseThrow(() -> new BusinessException("Produto com ID " + itemDto.produtoId() + " não encontrado."));

            // REGRA DE NEGÓCIO: Se a venda for debitar o estoque imediatamente, valida o saldo
            if (dto.status() == StatusVenda.PAGA || dto.status() == StatusVenda.CONCLUIDA) {
                Integer saldoAtual = movimentacaoEstoqueRepository.getSaldoEstoquePorProdutoId(produto.getId());
                if (saldoAtual < itemDto.quantidade()) {
                    throw new BusinessException("Saldo insuficiente em estoque para o produto '" + produto.getNome() 
                            + "'. Estoque atual: " + saldoAtual + ", Solicitado: " + itemDto.quantidade());
                }
            }

            // Calcula o subtotal do item considerando o desconto se houver
            BigDecimal desconto = itemDto.desconto() != null ? itemDto.desconto() : BigDecimal.ZERO;
            BigDecimal subtotalItem = itemDto.precoUnitario()
                    .subtract(desconto)
                    .multiply(BigDecimal.valueOf(itemDto.quantidade()));
            
            valorTotalCalculado = valorTotalCalculado.add(subtotalItem);

            // Monta o ItemVenda e vincula bidirecionalmente à Venda
            ItemVenda itemVenda = ItemVenda.builder()
                    .produto(produto)
                    .quantidade(itemDto.quantidade())
                    .precoUnitario(itemDto.precoUnitario())
                    .desconto(desconto)
                    .build();
            
            venda.adicionarItem(itemVenda);
        }

        venda.setValorTotal(valorTotalCalculado);
        
        // 3. Salva a venda e seus itens (CascadeType.ALL garante o salvamento dos itens juntos)
        Venda vendaSalva = vendaRepository.save(venda);

        // 4. Se a venda já foi paga ou concluída, gera os registros de SAÍDA no estoque
        if (vendaSalva.getStatus() == StatusVenda.PAGA || vendaSalva.getStatus() == StatusVenda.CONCLUIDA) {
            for (ItemVenda item : vendaSalva.getItens()) {
                MovimentacaoEstoque movimentacao = MovimentacaoEstoque.builder()
                        .produto(item.getProduto())
                        .tipo(TipoMovimentacaoEstoque.SAIDA)
                        .quantidade(item.getQuantidade())
                        .dataHora(LocalDateTime.now())
                        .justificativa("Saída por venda automatizada. Pedido #" + vendaSalva.getId())
                        .vendaId(vendaSalva.getId())
                        .build();
                
                if (movimentacao != null) {
                    movimentacaoEstoqueRepository.save(movimentacao);
                }
            }
        }

        return vendaSalva;
    }

}

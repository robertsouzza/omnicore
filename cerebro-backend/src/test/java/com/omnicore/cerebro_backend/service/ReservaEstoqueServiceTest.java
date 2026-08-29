package com.omnicore.cerebro_backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

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

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class ReservaEstoqueServiceTest {

    @Mock
    private ReservaEstoqueRepository reservaEstoqueRepository;

    @Mock
    private ComposicaoPacoteRepository composicaoPacoteRepository;

    private ReservaEstoqueService reservaEstoqueService;

    @BeforeEach
    void setUp() {
        reservaEstoqueService = new ReservaEstoqueService(reservaEstoqueRepository, composicaoPacoteRepository);
    }

    @Test
    @DisplayName("Deve calcular saldo disponível descontando reservas ativas")
    void deveCalcularSaldoDisponivel() {
        when(reservaEstoqueRepository.somarQuantidadeReservadaAtiva(1L)).thenReturn(7);

        assertEquals(3, reservaEstoqueService.calcularSaldoDisponivel(10, 1L));
    }

    @Test
    @DisplayName("Deve reservar estoque dos filhos ao vender pacote pendente")
    void deveReservarComponentesDoPacote() {
        Produto pacote = new Produto();
        pacote.setId(2L);
        pacote.setNome("Kit");
        pacote.setTipoProduto(TipoProduto.PACOTE);

        Produto filho = new Produto();
        filho.setId(10L);
        filho.setNome("Filho");
        filho.setTipoProduto(TipoProduto.UNITARIO);

        ItemVenda item = ItemVenda.builder().produto(pacote).quantidade(2).build();
        Venda venda = Venda.builder().id(1L).build();
        venda.adicionarItem(item);

        when(composicaoPacoteRepository.findByPacote_Id(2L)).thenReturn(List.of(
                ComposicaoPacote.builder().produtoFilho(filho).quantidade(new BigDecimal("1")).build()));

        reservaEstoqueService.reservarItensVenda(venda);

        ArgumentCaptor<List<ReservaEstoque>> captor = ArgumentCaptor.forClass(List.class);
        verify(reservaEstoqueRepository).saveAll(captor.capture());
        ReservaEstoque reserva = captor.getValue().get(0);
        assertEquals(10L, reserva.getProduto().getId());
        assertEquals(2, reserva.getQuantidade());
        assertEquals(StatusReservaEstoque.ATIVA, reserva.getStatus());
    }

    @Test
    @DisplayName("Deve rejeitar consumo sem reserva ativa")
    void deveRejeitarConsumoSemReserva() {
        when(reservaEstoqueRepository.findByVendaIdAndStatus(9L, StatusReservaEstoque.ATIVA))
                .thenReturn(List.of());

        BusinessException ex = assertThrows(BusinessException.class,
                () -> reservaEstoqueService.consumirReservasVenda(9L));

        assertTrue(ex.getMessage().contains("Não há reserva"));
    }
}

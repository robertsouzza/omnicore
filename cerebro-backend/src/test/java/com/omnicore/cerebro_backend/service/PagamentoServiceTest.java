package com.omnicore.cerebro_backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.omnicore.cerebro_backend.config.PagamentoExperienceProperties;
import com.omnicore.cerebro_backend.dto.PagarVendaRequestDTO;
import com.omnicore.cerebro_backend.enums.FormaPagamento;
import com.omnicore.cerebro_backend.enums.ProviderPagamento;
import com.omnicore.cerebro_backend.enums.StatusPagamento;
import com.omnicore.cerebro_backend.exception.BusinessException;
import com.omnicore.cerebro_backend.model.PagamentoVenda;
import com.omnicore.cerebro_backend.model.Venda;
import com.omnicore.cerebro_backend.pagamento.ExperienciaPagamentoResultado;
import com.omnicore.cerebro_backend.pagamento.PaymentExperiencePort;
import com.omnicore.cerebro_backend.repository.PagamentoVendaRepository;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class PagamentoServiceTest {

    @Mock
    private PagamentoVendaRepository pagamentoVendaRepository;

    @Mock
    private PaymentExperiencePort paymentExperiencePort;

    private PagamentoService pagamentoService;

    private Venda venda;

    @BeforeEach
    void setUp() {
        pagamentoService = new PagamentoService(
                pagamentoVendaRepository,
                paymentExperiencePort,
                new PagamentoExperienceProperties(true, "http://localhost:9090", 5000, 30000));

        venda = Venda.builder()
                .id(10L)
                .valorTotal(new BigDecimal("25.00"))
                .dataHora(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("Deve registrar pagamento em dinheiro com troco")
    void deveRegistrarPagamentoDinheiro() {
        when(pagamentoVendaRepository.existsByVendaIdAndStatus(10L, StatusPagamento.APROVADO)).thenReturn(false);
        when(pagamentoVendaRepository.save(any(PagamentoVenda.class))).thenAnswer(inv -> {
            PagamentoVenda p = inv.getArgument(0);
            p.setId(1L);
            return p;
        });

        PagarVendaRequestDTO dto = new PagarVendaRequestDTO(
                FormaPagamento.DINHEIRO,
                new BigDecimal("25.00"),
                new BigDecimal("30.00"),
                null);

        PagamentoService.PagamentoProcessamentoResult result = pagamentoService.processar(venda, dto);

        assertEquals(StatusPagamento.APROVADO, result.pagamento().getStatus());
        assertEquals(new BigDecimal("5.00"), result.pagamento().getTroco());
        assertEquals(ProviderPagamento.INTERNO, result.pagamento().getProvider());
        assertEquals(true, result.prontoParaLiquidar());
    }

    @Test
    @DisplayName("Deve iniciar pagamento Pix via experiência externa")
    void deveIniciarPagamentoPix() {
        when(pagamentoVendaRepository.existsByVendaIdAndStatus(10L, StatusPagamento.APROVADO)).thenReturn(false);
        when(paymentExperiencePort.iniciar(any())).thenReturn(
                new ExperienciaPagamentoResultado(
                        "exp-123",
                        StatusPagamento.PENDENTE,
                        "http://localhost:9090/pix/exp-123",
                        null,
                        null,
                        null,
                        null));
        when(pagamentoVendaRepository.save(any(PagamentoVenda.class))).thenAnswer(inv -> inv.getArgument(0));

        PagarVendaRequestDTO dto = new PagarVendaRequestDTO(
                FormaPagamento.PIX,
                new BigDecimal("25.00"),
                null,
                null);

        PagamentoService.PagamentoProcessamentoResult result = pagamentoService.processar(venda, dto);

        assertEquals(StatusPagamento.PENDENTE, result.pagamento().getStatus());
        assertEquals("exp-123", result.pagamento().getExperienciaPagamentoId());
        assertEquals(false, result.prontoParaLiquidar());
        assertEquals("http://localhost:9090/pix/exp-123", result.urlExperiencia());
    }

    @Test
    @DisplayName("Deve rejeitar dinheiro sem valor recebido")
    void deveRejeitarDinheiroSemValorRecebido() {
        when(pagamentoVendaRepository.existsByVendaIdAndStatus(10L, StatusPagamento.APROVADO)).thenReturn(false);

        PagarVendaRequestDTO dto = new PagarVendaRequestDTO(
                FormaPagamento.DINHEIRO,
                new BigDecimal("25.00"),
                null,
                null);

        assertThrows(BusinessException.class, () -> pagamentoService.processar(venda, dto));
    }
}

package com.omnicore.cerebro_backend.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.omnicore.cerebro_backend.config.PagamentoExperienceProperties;
import com.omnicore.cerebro_backend.dto.PagarVendaRequestDTO;
import com.omnicore.cerebro_backend.dto.PagamentoVendaResponseDTO;
import com.omnicore.cerebro_backend.dto.PagamentoWebhookRequestDTO;
import com.omnicore.cerebro_backend.enums.FormaPagamento;
import com.omnicore.cerebro_backend.enums.ProviderPagamento;
import com.omnicore.cerebro_backend.enums.StatusPagamento;
import com.omnicore.cerebro_backend.exception.BusinessException;
import com.omnicore.cerebro_backend.model.PagamentoVenda;
import com.omnicore.cerebro_backend.model.Venda;
import com.omnicore.cerebro_backend.pagamento.ExperienciaPagamentoResultado;
import com.omnicore.cerebro_backend.pagamento.IniciarExperienciaRequest;
import com.omnicore.cerebro_backend.pagamento.PagamentoExperienciaUrls;
import com.omnicore.cerebro_backend.pagamento.PaymentExperiencePort;
import com.omnicore.cerebro_backend.repository.PagamentoVendaRepository;

@SuppressWarnings("null")
@Service
public class PagamentoService {

    private final PagamentoVendaRepository pagamentoVendaRepository;
    private final PaymentExperiencePort paymentExperiencePort;
    private final PagamentoExperienceProperties experienceProperties;

    public PagamentoService(
            PagamentoVendaRepository pagamentoVendaRepository,
            PaymentExperiencePort paymentExperiencePort,
            PagamentoExperienceProperties experienceProperties) {
        this.pagamentoVendaRepository = pagamentoVendaRepository;
        this.paymentExperiencePort = paymentExperiencePort;
        this.experienceProperties = experienceProperties;
    }

    public List<PagamentoVenda> listarPorVenda(Long vendaId) {
        return pagamentoVendaRepository.findByVendaIdOrderByDataHoraAsc(vendaId);
    }

    public PagamentoVendaResponseDTO toResponseDTO(PagamentoVenda pagamento) {
        String urlExperiencia = PagamentoExperienciaUrls.buildUrl(experienceProperties.baseUrl(), pagamento);
        return PagamentoVendaResponseDTO.from(pagamento, urlExperiencia);
    }

    public List<PagamentoVendaResponseDTO> listarPorVendaComDetalhes(Long vendaId) {
        return listarPorVenda(vendaId).stream().map(this::toResponseDTO).toList();
    }

    public PagamentoVenda buscarPorId(Long id) {
        return pagamentoVendaRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Pagamento #" + id + " não encontrado."));
    }

    @Transactional
    public PagamentoProcessamentoResult processar(Venda venda, PagarVendaRequestDTO dto) {
        validarValorPagamento(venda, dto.valor());

        if (pagamentoVendaRepository.existsByVendaIdAndStatus(venda.getId(), StatusPagamento.APROVADO)) {
            throw new BusinessException("Esta venda já possui pagamento aprovado.");
        }

        return switch (dto.forma()) {
            case DINHEIRO -> processarDinheiro(venda, dto);
            case PIX, CREDITO, DEBITO_BANCARIO -> processarExperienciaExterna(venda, dto);
        };
    }

    @Transactional
    public PagamentoVenda aplicarWebhook(PagamentoWebhookRequestDTO dto) {
        PagamentoVenda pagamento = pagamentoVendaRepository
                .findByExperienciaPagamentoId(dto.experienciaPagamentoId())
                .orElseThrow(() -> new BusinessException(
                        "Pagamento da experiência " + dto.experienciaPagamentoId() + " não encontrado."));

        if (pagamento.getStatus() == StatusPagamento.APROVADO) {
            return pagamento;
        }

        pagamento.setStatus(dto.status());
        if (dto.nsu() != null) {
            pagamento.setNsu(dto.nsu());
        }
        if (dto.referenciaExterna() != null) {
            pagamento.setReferenciaExterna(dto.referenciaExterna());
        }

        return pagamentoVendaRepository.save(pagamento);
    }

    public boolean pagamentoAprovadoSuficiente(Venda venda) {
        BigDecimal totalAprovado = pagamentoVendaRepository.findByVendaIdOrderByDataHoraAsc(venda.getId()).stream()
                .filter(p -> p.getStatus() == StatusPagamento.APROVADO)
                .map(PagamentoVenda::getValor)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return totalAprovado.compareTo(venda.getValorTotal()) >= 0;
    }

    private PagamentoProcessamentoResult processarDinheiro(Venda venda, PagarVendaRequestDTO dto) {
        BigDecimal valorRecebido = dto.valorRecebido();
        if (valorRecebido == null) {
            throw new BusinessException("Informe o valor recebido em pagamento em dinheiro.");
        }
        if (valorRecebido.compareTo(dto.valor()) < 0) {
            throw new BusinessException("Valor recebido insuficiente para o pagamento em dinheiro.");
        }

        BigDecimal troco = valorRecebido.subtract(dto.valor());

        PagamentoVenda pagamento = PagamentoVenda.builder()
                .vendaId(venda.getId())
                .forma(FormaPagamento.DINHEIRO)
                .valor(dto.valor())
                .valorRecebido(valorRecebido)
                .troco(troco)
                .status(StatusPagamento.APROVADO)
                .provider(ProviderPagamento.INTERNO)
                .dataHora(LocalDateTime.now())
                .build();

        pagamento = pagamentoVendaRepository.save(pagamento);
        return new PagamentoProcessamentoResult(pagamento, null, true);
    }

    private PagamentoProcessamentoResult processarExperienciaExterna(Venda venda, PagarVendaRequestDTO dto) {
        if (!experienceProperties.enabled()) {
            throw new BusinessException(
                    "Pagamento "
                            + dto.forma()
                            + " requer o sistema de experiência externo (omnicore.pagamento.experience.enabled).");
        }

        Integer parcelas = dto.parcelas() != null && dto.parcelas() > 0 ? dto.parcelas() : 1;

        ExperienciaPagamentoResultado experiencia = paymentExperiencePort.iniciar(
                new IniciarExperienciaRequest(
                        "pagamento-venda-" + venda.getId(),
                        venda.getId(),
                        dto.forma(),
                        dto.valor(),
                        parcelas));

        PagamentoVenda pagamento = PagamentoVenda.builder()
                .vendaId(venda.getId())
                .forma(dto.forma())
                .valor(dto.valor())
                .status(experiencia.status())
                .provider(ProviderPagamento.EXPERIENCIA)
                .experienciaPagamentoId(experiencia.experienciaPagamentoId())
                .nsu(experiencia.nsu())
                .referenciaExterna(experiencia.referenciaExterna())
                .pixCopiaECola(experiencia.pixCopiaECola())
                .qrCodeBase64(experiencia.qrCodeBase64())
                .dataHora(LocalDateTime.now())
                .build();

        pagamento = pagamentoVendaRepository.save(pagamento);

        boolean prontoParaLiquidar = experiencia.status() == StatusPagamento.APROVADO;
        String urlExperiencia = PagamentoExperienciaUrls.buildUrl(
                experienceProperties.baseUrl(),
                dto.forma(),
                experiencia.experienciaPagamentoId(),
                parcelas);
        return new PagamentoProcessamentoResult(pagamento, urlExperiencia, prontoParaLiquidar);
    }

    private void validarValorPagamento(Venda venda, BigDecimal valor) {
        if (valor == null || valor.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("Valor de pagamento inválido.");
        }
        if (valor.compareTo(venda.getValorTotal()) != 0) {
            throw new BusinessException(
                    "No MVP o pagamento deve ser pelo valor total da venda ("
                            + venda.getValorTotal()
                            + ").");
        }
    }

    public record PagamentoProcessamentoResult(
            PagamentoVenda pagamento,
            String urlExperiencia,
            boolean prontoParaLiquidar
    ) {
    }
}

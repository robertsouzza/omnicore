package com.omnicore.cerebro_backend.service;


import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import com.omnicore.cerebro_backend.exception.BusinessException;
import com.omnicore.cerebro_backend.model.Produto;
import com.omnicore.cerebro_backend.security.ColaboradorAutorizacao;
import com.omnicore.cerebro_backend.repository.ProdutoRepository;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProdutoService {

    private final ProdutoRepository produtoRepository;
    private final PrecificacaoService precificacaoService;

    public ProdutoService(ProdutoRepository produtoRepository, PrecificacaoService precificacaoService) {
        this.produtoRepository = produtoRepository;
        this.precificacaoService = precificacaoService;
    }

    @Transactional
    public Produto salvar(Produto produto) {
        ColaboradorAutorizacao.exigirEditarCatalogo(null);
        // Regra de Negócio: Não permitir a duplicação de códigos de barras no ecossistema
        produtoRepository.findByCodigoBarras(produto.getCodigoBarras())
                .ifPresent(p -> {
                    throw new BusinessException("Já existe um produto cadastrado com o código de barras: " + produto.getCodigoBarras());
                });

        Produto salvo = produtoRepository.save(produto);
        return enriquecer(salvo);
    }

    @Transactional
    public Produto atualizar(Long id, Produto dadosAtualizados){
        ColaboradorAutorizacao.exigirEditarCatalogo(null);
        Produto produtoExistente = buscarPorId(id);

        produtoRepository.findByCodigoBarras(dadosAtualizados.getCodigoBarras()).ifPresent(outro -> {
            if (!outro.getId().equals(id)) {
                throw new BusinessException(
                        "Já existe um produto cadastrado com o código de barras: "
                                + dadosAtualizados.getCodigoBarras());
            }
        });

        // Atualiza os campos permitidos (mantendo o ID original e a data de criação)
        produtoExistente.setCodigoBarras(dadosAtualizados.getCodigoBarras());
        produtoExistente.setNome(dadosAtualizados.getNome());
        produtoExistente.setDescricao(dadosAtualizados.getDescricao());
        produtoExistente.setPrecoVenda(dadosAtualizados.getPrecoVenda());
        produtoExistente.setPrecoCusto(dadosAtualizados.getPrecoCusto());
        produtoExistente.setMargemMinimaPercent(dadosAtualizados.getMargemMinimaPercent());
        produtoExistente.setCategoria(dadosAtualizados.getCategoria());
        produtoExistente.setUrlImagem(dadosAtualizados.getUrlImagem());
        aplicarImagemSeInformada(dadosAtualizados.getImagemCodigoBarras(), produtoExistente::setImagemCodigoBarras);
        aplicarImagemSeInformada(dadosAtualizados.getImagemQrCode(), produtoExistente::setImagemQrCode);
        produtoExistente.setTipoProduto(dadosAtualizados.getTipoProduto());
        produtoExistente.setIndicadorTamanho(dadosAtualizados.getIndicadorTamanho());

        // O Hibernate fará o update automaticamente ao fechar a transação devido ao estado Managed do objeto
        Produto salvo = produtoRepository.save(produtoExistente);
        return enriquecer(salvo);
    }

    @Transactional
    public void inativar(Long id) {
        ColaboradorAutorizacao.exigirEditarCatalogo(null);
        Produto produto = buscarPorId(id);
        // Blindagem: Se já estiver inativo, avisa o usuário de forma clara
        if (!produto.getAtivo()) {
            throw new BusinessException("O produto '" + produto.getNome() + "' já se encontra inativo no sistema.");
        }
        produto.setAtivo(false); // Aqui acontece a mágica da Inativação Lógica!
        produtoRepository.save(produto);
    }

    @Transactional(readOnly = true)
    public Page<Produto> listarTodos(Pageable pageable, boolean incluirInativos, String nome, String codigoBarras) {
        if (pageable == null) {
            throw new BusinessException("Os parâmetros de paginação não podem ser nulos.");
        }

        String termoNome = normalizarTermoBusca(nome);
        String termoCodigo = normalizarCodigoBarrasBusca(codigoBarras);
        boolean apenasAtivos = !incluirInativos;

        Page<Produto> pagina;
        if (termoNome == null && termoCodigo == null) {
            if (apenasAtivos) {
                pagina = produtoRepository.findByAtivo(true, pageable);
            } else {
                pagina = produtoRepository.findAll(pageable);
            }
        } else {
            pagina = listarComFiltros(pageable, termoNome, termoCodigo, apenasAtivos);
        }
        pagina.getContent().forEach(precificacaoService::enriquecerIndicadoresPrecificacao);
        return pagina;
    }

    private Page<Produto> listarComFiltros(
            Pageable pageable, String termoNome, String termoCodigo, boolean apenasAtivos) {
        if (termoNome == null && termoCodigo == null) {
            return apenasAtivos ? produtoRepository.findByAtivo(true, pageable) : produtoRepository.findAll(pageable);
        }

        if (termoNome != null && termoCodigo != null) {
            if (apenasAtivos) {
                return produtoRepository.findByAtivoAndNomeContainingIgnoreCaseAndCodigoBarrasContaining(
                        true, termoNome, termoCodigo, pageable);
            }
            return produtoRepository.findByNomeContainingIgnoreCaseAndCodigoBarrasContaining(
                    termoNome, termoCodigo, pageable);
        }

        if (termoCodigo != null) {
            if (apenasAtivos) {
                return produtoRepository.findByAtivoAndCodigoBarrasContaining(true, termoCodigo, pageable);
            }
            return produtoRepository.findByCodigoBarrasContaining(termoCodigo, pageable);
        }

        if (apenasAtivos) {
            return produtoRepository.findByAtivoAndNomeContainingIgnoreCase(true, termoNome, pageable);
        }
        return produtoRepository.findByNomeContainingIgnoreCase(termoNome, pageable);
    }

    private Produto enriquecer(Produto produto) {
        precificacaoService.enriquecerIndicadoresPrecificacao(produto);
        return produto;
    }

    private String normalizarTermoBusca(String value) {
        String trimmed = trimToNull(value);
        if (trimmed == null || trimmed.length() < 3) {
            return null;
        }
        return trimmed;
    }

    private String normalizarCodigoBarrasBusca(String codigoBarras) {
        if (codigoBarras == null || codigoBarras.isBlank()) {
            return null;
        }
        String digits = codigoBarras.replaceAll("\\D", "");
        if (digits.length() < 3) {
            return null;
        }
        return digits;
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    /** Evita apagar PNG persistido quando o front envia null (ex.: QR gerado mas limpo no form). */
    private void aplicarImagemSeInformada(String dataUrl, java.util.function.Consumer<String> setter) {
        if (dataUrl != null && !dataUrl.isBlank()) {
            setter.accept(dataUrl);
        }
    }

    @Transactional(readOnly = true)
    public Produto buscarPorId(Long id) {
        if (id == null) {
            throw new BusinessException("O ID fornecido não pode ser nulo.");
        }
        Produto produto = produtoRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Produto com ID " + id + " não encontrado."));
        return enriquecer(produto);
    }

}

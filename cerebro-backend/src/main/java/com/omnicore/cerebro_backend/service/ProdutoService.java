package com.omnicore.cerebro_backend.service;


import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import com.omnicore.cerebro_backend.exception.BusinessException;
import com.omnicore.cerebro_backend.model.Produto;
import com.omnicore.cerebro_backend.repository.ProdutoRepository;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProdutoService {

    private final ProdutoRepository produtoRepository;
    
    public ProdutoService(ProdutoRepository produtoRepository) {
        this.produtoRepository = produtoRepository;
    }

    @Transactional
    public Produto salvar(Produto produto) {
        // Regra de Negócio: Não permitir a duplicação de códigos de barras no ecossistema
        produtoRepository.findByCodigoBarras(produto.getCodigoBarras())
                .ifPresent(p -> {
                    throw new BusinessException("Já existe um produto cadastrado com o código de barras: " + produto.getCodigoBarras());
                });

        return produtoRepository.save(produto);
    }

    @Transactional
    public Produto atualizar(Long id, Produto dadosAtualizados){
        
        Produto produtoExistente = buscarPorId(id);

        // Atualiza os campos permitidos (mantendo o ID original e a data de criação)
        produtoExistente.setCodigoBarras(dadosAtualizados.getCodigoBarras());
        produtoExistente.setNome(dadosAtualizados.getNome());
        produtoExistente.setDescricao(dadosAtualizados.getDescricao());
        produtoExistente.setPrecoVenda(dadosAtualizados.getPrecoVenda());
        produtoExistente.setCategoria(dadosAtualizados.getCategoria());
        produtoExistente.setUrlImagem(dadosAtualizados.getUrlImagem());
        produtoExistente.setTipoProduto(dadosAtualizados.getTipoProduto());
        produtoExistente.setIndicadorTamanho(dadosAtualizados.getIndicadorTamanho());

        // O Hibernate fará o update automaticamente ao fechar a transação devido ao estado Managed do objeto
        return produtoRepository.save(produtoExistente);

    }

    @Transactional
    public void inativar(Long id) {
        Produto produto = buscarPorId(id);
        // Blindagem: Se já estiver inativo, avisa o usuário de forma clara
        if (!produto.getAtivo()) {
            throw new BusinessException("O produto '" + produto.getNome() + "' já se encontra inativo no sistema.");
        }
        produto.setAtivo(false); // Aqui acontece a mágica da Inativação Lógica!
        produtoRepository.save(produto);
    }

    @Transactional(readOnly = true)
    public Page<Produto> listarTodos(Pageable pageable, boolean incluirInativos) {
        if (pageable == null) {
            throw new BusinessException("Os parâmetros de paginação não podem ser nulos.");
        }
        if (incluirInativos) {
            return produtoRepository.findAll(pageable); // Traz tudo (Ativos e Inativos)
        }
        return produtoRepository.findByAtivo(true, pageable); // Traw apenas os Ativos (Padrão)
    }

    @Transactional(readOnly = true)
    public Produto buscarPorId(Long id) {
        if (id == null) {
            throw new BusinessException("O ID fornecido não pode ser nulo.");
        }
        return produtoRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Produto com ID " + id + " não encontrado."));
    }

}

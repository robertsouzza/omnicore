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

    @Transactional(readOnly = true)
    public Page<Produto> listarTodos(Pageable pageable) {
        if (pageable == null) {
            throw new BusinessException("Os parâmetros de paginação não podem ser nulos.");
        }
            return produtoRepository.findAll(pageable);
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

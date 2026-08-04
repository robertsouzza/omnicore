package com.omnicore.cerebro_backend.service;

import java.util.Objects;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.omnicore.cerebro_backend.dto.ClienteRequestDTO;
import com.omnicore.cerebro_backend.exception.BusinessException;
import com.omnicore.cerebro_backend.model.Cliente;
import com.omnicore.cerebro_backend.repository.ClienteRepository;

@SuppressWarnings("null")
@Service
public class ClienteService {

    private final ClienteRepository clienteRepository;

    public ClienteService(ClienteRepository clienteRepository) {
        this.clienteRepository = clienteRepository;
    }

    @Transactional
    public Cliente cadastrar(ClienteRequestDTO dto) {
        String cpfNormalizado = normalizarCpf(dto.cpf());

        clienteRepository.findByCpf(cpfNormalizado).ifPresent(c -> {
            throw new BusinessException("Já existe um cliente cadastrado com o CPF: " + cpfNormalizado);
        });

        Cliente cliente = Cliente.builder()
                .nomeCompleto(dto.nomeCompleto())
                .cpf(cpfNormalizado)
                .email(dto.email())
                .celular(dto.celular())
                .enderecoEntregaPadrao(dto.enderecoEntregaPadrao())
                .build();

        return Objects.requireNonNull(
                clienteRepository.save(cliente),
                "Falha ao persistir cliente.");
    }

    @Transactional
    public Cliente atualizar(Long id, ClienteRequestDTO dto) {
        Cliente cliente = buscarPorId(id);
        String cpfNormalizado = normalizarCpf(dto.cpf());

        clienteRepository.findByCpf(cpfNormalizado).ifPresent(outro -> {
            if (!outro.getId().equals(id)) {
                throw new BusinessException("Já existe outro cliente cadastrado com o CPF: " + cpfNormalizado);
            }
        });

        cliente.setNomeCompleto(dto.nomeCompleto());
        cliente.setCpf(cpfNormalizado);
        cliente.setEmail(dto.email());
        cliente.setCelular(dto.celular());
        cliente.setEnderecoEntregaPadrao(dto.enderecoEntregaPadrao());

        return Objects.requireNonNull(
                clienteRepository.save(cliente),
                "Falha ao persistir cliente.");
    }

    @Transactional(readOnly = true)
    public Cliente buscarPorId(Long id) {
        if (id == null) {
            throw new BusinessException("O ID do cliente não pode ser nulo.");
        }
        return clienteRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Cliente com ID " + id + " não encontrado."));
    }

    @Transactional(readOnly = true)
    public Cliente buscarPorCpf(String cpf) {
        if (cpf == null || cpf.isBlank()) {
            throw new BusinessException("O CPF não pode ser vazio.");
        }
        String cpfNormalizado = normalizarCpf(cpf);
        return clienteRepository.findByCpf(cpfNormalizado)
                .orElseThrow(() -> new BusinessException("Cliente com CPF " + cpfNormalizado + " não encontrado."));
    }

    @Transactional(readOnly = true)
    public Page<Cliente> listar(Pageable pageable, boolean incluirInativos) {
        if (pageable == null) {
            throw new BusinessException("Os parâmetros de paginação não podem ser nulos.");
        }
        if (incluirInativos) {
            return clienteRepository.findAll(pageable);
        }
        return clienteRepository.findByAtivo(true, pageable);
    }

    @Transactional
    public void inativar(Long id) {
        Cliente cliente = buscarPorId(id);
        if (Boolean.FALSE.equals(cliente.getAtivo())) {
            throw new BusinessException("O cliente '" + cliente.getNomeCompleto() + "' já se encontra inativo.");
        }
        cliente.setAtivo(false);
        clienteRepository.save(cliente);
    }

    @Transactional(readOnly = true)
    public void validarClienteAtivoParaVenda(Long clienteId) {
        if (clienteId == null) {
            return;
        }
        Cliente cliente = buscarPorId(clienteId);
        if (Boolean.FALSE.equals(cliente.getAtivo())) {
            throw new BusinessException("O cliente '" + cliente.getNomeCompleto() + "' está inativo e não pode ser vinculado a novas vendas.");
        }
    }

    private String normalizarCpf(String cpf) {
        return cpf.replaceAll("\\D", "");
    }
}

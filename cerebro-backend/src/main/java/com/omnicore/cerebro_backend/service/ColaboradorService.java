package com.omnicore.cerebro_backend.service;

import java.util.Objects;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.omnicore.cerebro_backend.dto.ColaboradorRequestDTO;
import com.omnicore.cerebro_backend.exception.BusinessException;
import com.omnicore.cerebro_backend.model.Colaborador;
import com.omnicore.cerebro_backend.repository.ColaboradorRepository;

@SuppressWarnings("null")
@Service
public class ColaboradorService {

    private final ColaboradorRepository colaboradorRepository;
    private final PasswordEncoder passwordEncoder;

    public ColaboradorService(ColaboradorRepository colaboradorRepository, PasswordEncoder passwordEncoder) {
        this.colaboradorRepository = colaboradorRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public Colaborador cadastrar(ColaboradorRequestDTO dto) {
        if (dto.senha() == null || dto.senha().isBlank()) {
            throw new BusinessException("A senha é obrigatória no cadastro do colaborador.");
        }

        String cpfNormalizado = normalizarCpf(dto.cpf());

        if (colaboradorRepository.existsByCpf(cpfNormalizado)) {
            throw new BusinessException("Já existe um colaborador cadastrado com o CPF: " + cpfNormalizado);
        }
        if (colaboradorRepository.existsByEmail(dto.email())) {
            throw new BusinessException("Já existe um colaborador cadastrado com o e-mail: " + dto.email());
        }

        Colaborador colaborador = Colaborador.builder()
                .nome(dto.nome())
                .cpf(cpfNormalizado)
                .email(dto.email())
                .senhaHash(passwordEncoder.encode(dto.senha()))
                .perfil(dto.perfil())
                .limiteDescontoAutonomo(dto.limiteDescontoAutonomo())
                .build();

        return Objects.requireNonNull(
                colaboradorRepository.save(colaborador),
                "Falha ao persistir colaborador.");
    }

    @Transactional
    public Colaborador atualizar(Long id, ColaboradorRequestDTO dto) {
        Colaborador colaborador = buscarPorId(id);
        String cpfNormalizado = normalizarCpf(dto.cpf());

        colaboradorRepository.findByCpf(cpfNormalizado).ifPresent(outro -> {
            if (!outro.getId().equals(id)) {
                throw new BusinessException("Já existe outro colaborador cadastrado com o CPF: " + cpfNormalizado);
            }
        });
        colaboradorRepository.findByEmail(dto.email()).ifPresent(outro -> {
            if (!outro.getId().equals(id)) {
                throw new BusinessException("Já existe outro colaborador cadastrado com o e-mail: " + dto.email());
            }
        });

        colaborador.setNome(dto.nome());
        colaborador.setCpf(cpfNormalizado);
        colaborador.setEmail(dto.email());
        colaborador.setPerfil(dto.perfil());
        colaborador.setLimiteDescontoAutonomo(dto.limiteDescontoAutonomo());

        if (dto.senha() != null && !dto.senha().isBlank()) {
            colaborador.setSenhaHash(passwordEncoder.encode(dto.senha()));
        }

        return Objects.requireNonNull(
                colaboradorRepository.save(colaborador),
                "Falha ao persistir colaborador.");
    }

    @Transactional(readOnly = true)
    public Colaborador buscarPorId(Long id) {
        if (id == null) {
            throw new BusinessException("O ID do colaborador não pode ser nulo.");
        }
        return colaboradorRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Colaborador com ID " + id + " não encontrado."));
    }

    @Transactional(readOnly = true)
    public Page<Colaborador> listar(Pageable pageable, boolean incluirInativos) {
        if (pageable == null) {
            throw new BusinessException("Os parâmetros de paginação não podem ser nulos.");
        }
        if (incluirInativos) {
            return colaboradorRepository.findAll(pageable);
        }
        return colaboradorRepository.findByAtivo(true, pageable);
    }

    @Transactional
    public void inativar(Long id) {
        Colaborador colaborador = buscarPorId(id);
        if (Boolean.FALSE.equals(colaborador.getAtivo())) {
            throw new BusinessException("O colaborador '" + colaborador.getNome() + "' já se encontra inativo.");
        }
        colaborador.setAtivo(false);
        colaboradorRepository.save(colaborador);
    }

    @Transactional(readOnly = true)
    public void validarColaboradorAtivoParaVenda(Long vendedorId) {
        if (vendedorId == null) {
            return;
        }
        Colaborador colaborador = buscarPorId(vendedorId);
        if (Boolean.FALSE.equals(colaborador.getAtivo())) {
            throw new BusinessException("O colaborador '" + colaborador.getNome() + "' está inativo e não pode registrar vendas.");
        }
    }

    private String normalizarCpf(String cpf) {
        return cpf.replaceAll("\\D", "");
    }
}

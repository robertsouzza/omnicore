package com.omnicore.cerebro_backend.service;

import java.util.Objects;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.google.i18n.phonenumbers.NumberParseException;
import com.google.i18n.phonenumbers.PhoneNumberUtil;
import com.google.i18n.phonenumbers.Phonenumber.PhoneNumber;
import com.omnicore.cerebro_backend.dto.ClienteRequestDTO;
import com.omnicore.cerebro_backend.exception.BusinessException;
import com.omnicore.cerebro_backend.model.Cliente;
import com.omnicore.cerebro_backend.model.TipoDocumento;
import com.omnicore.cerebro_backend.repository.ClienteRepository;
import com.omnicore.cerebro_backend.util.CpfValidator;

@SuppressWarnings("null")
@Service
public class ClienteService {

    private static final String PAIS_PADRAO = "BR";

    private final ClienteRepository clienteRepository;
    private final PhoneNumberUtil phoneNumberUtil = PhoneNumberUtil.getInstance();

    public ClienteService(ClienteRepository clienteRepository) {
        this.clienteRepository = clienteRepository;
    }

    @Transactional
    public Cliente cadastrar(ClienteRequestDTO dto) {
        TipoDocumento tipoDocumento = dto.tipoDocumento();
        String numeroDocumento = normalizarNumeroDocumento(tipoDocumento, dto.numeroDocumento());
        validarDocumentoUnico(null, tipoDocumento, numeroDocumento);

        Cliente cliente = Cliente.builder().build();
        aplicarDto(cliente, dto, tipoDocumento, numeroDocumento);

        return Objects.requireNonNull(
                clienteRepository.save(cliente),
                "Falha ao persistir cliente.");
    }

    @Transactional
    public Cliente atualizar(Long id, ClienteRequestDTO dto) {
        Cliente cliente = buscarPorId(id);
        TipoDocumento tipoDocumento = dto.tipoDocumento();
        String numeroDocumento = normalizarNumeroDocumento(tipoDocumento, dto.numeroDocumento());
        validarDocumentoUnico(id, tipoDocumento, numeroDocumento);

        aplicarDto(cliente, dto, tipoDocumento, numeroDocumento);

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
    public Cliente buscarPorDocumento(TipoDocumento tipoDocumento, String numeroDocumento) {
        if (tipoDocumento == null) {
            throw new BusinessException("O tipo de documento não pode ser nulo.");
        }
        if (numeroDocumento == null || numeroDocumento.isBlank()) {
            throw new BusinessException("O número do documento não pode ser vazio.");
        }

        String numeroNormalizado = normalizarNumeroDocumento(tipoDocumento, numeroDocumento);
        return clienteRepository.findByTipoDocumentoAndNumeroDocumento(tipoDocumento, numeroNormalizado)
                .orElseThrow(() -> new BusinessException(
                        "Cliente com documento " + tipoDocumento + " " + numeroNormalizado + " não encontrado."));
    }

    @Transactional(readOnly = true)
    public Cliente buscarPorCpf(String cpf) {
        return buscarPorDocumento(TipoDocumento.CPF, cpf);
    }

    @Transactional(readOnly = true)
    public Page<Cliente> listar(Pageable pageable, boolean incluirInativos, String nome) {
        if (pageable == null) {
            throw new BusinessException("Os parâmetros de paginação não podem ser nulos.");
        }

        String termoNome = trimToNull(nome);
        if (termoNome != null && termoNome.length() < 3) {
            termoNome = null;
        }
        if (termoNome == null) {
            if (incluirInativos) {
                return clienteRepository.findAll(pageable);
            }
            return clienteRepository.findByAtivo(true, pageable);
        }

        if (incluirInativos) {
            return clienteRepository.findByNomeCompletoContainingIgnoreCase(termoNome, pageable);
        }
        return clienteRepository.findByAtivoAndNomeCompletoContainingIgnoreCase(true, termoNome, pageable);
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

    private void aplicarDto(Cliente cliente, ClienteRequestDTO dto, TipoDocumento tipoDocumento, String numeroDocumento) {
        String codigoPais = normalizarCodigoPais(dto.codigoPais());
        String celular = normalizarCelular(codigoPais, dto.celular());
        validarCelular(codigoPais, celular);
        validarEnderecoEntregaBrasil(tipoDocumento, dto);

        cliente.setNomeCompleto(dto.nomeCompleto().trim());
        cliente.setTipoDocumento(tipoDocumento);
        cliente.setNumeroDocumento(numeroDocumento);
        cliente.setEmail(dto.email().trim());
        cliente.setCodigoPais(codigoPais);
        cliente.setCelular(celular);
        cliente.setCep(normalizarCep(dto.cep()));
        cliente.setLogradouro(trimToNull(dto.logradouro()));
        cliente.setNumero(trimToNull(dto.numero()));
        cliente.setComplemento(trimToNull(dto.complemento()));
        cliente.setBairro(trimToNull(dto.bairro()));
        cliente.setCidade(trimToNull(dto.cidade()));
        cliente.setEstado(normalizarEstado(dto.estado()));
    }

    private void validarDocumentoUnico(Long idAtual, TipoDocumento tipoDocumento, String numeroDocumento) {
        clienteRepository.findByTipoDocumentoAndNumeroDocumento(tipoDocumento, numeroDocumento).ifPresent(outro -> {
            if (idAtual == null || !outro.getId().equals(idAtual)) {
                throw new BusinessException("Já existe um cliente cadastrado com este documento.");
            }
        });
    }

    private void validarEnderecoEntregaBrasil(TipoDocumento tipoDocumento, ClienteRequestDTO dto) {
        if (tipoDocumento == TipoDocumento.CPF) {
            return;
        }

        if (dto.cep() == null || dto.cep().isBlank()) {
            throw new BusinessException("Clientes estrangeiros devem informar CEP de entrega no Brasil.");
        }
        if (dto.logradouro() == null || dto.logradouro().isBlank()) {
            throw new BusinessException("Clientes estrangeiros devem informar o endereço de entrega no Brasil.");
        }
        if (dto.numero() == null || dto.numero().isBlank()) {
            throw new BusinessException("Clientes estrangeiros devem informar o número do endereço de entrega no Brasil.");
        }
    }

    private String normalizarNumeroDocumento(TipoDocumento tipoDocumento, String numeroDocumento) {
        if (numeroDocumento == null || numeroDocumento.isBlank()) {
            throw new BusinessException("O número do documento é obrigatório.");
        }

        if (tipoDocumento == TipoDocumento.CPF) {
            String cpf = numeroDocumento.replaceAll("\\D", "");
            if (cpf.length() != 11) {
                throw new BusinessException("Informe um CPF válido com 11 dígitos.");
            }
            if (!CpfValidator.isValido(cpf)) {
                throw new BusinessException("Informe um CPF válido.");
            }
            return cpf;
        }

        String normalizado = numeroDocumento.replaceAll("\\s+", "").toUpperCase();
        if (normalizado.length() < 3 || normalizado.length() > 30) {
            throw new BusinessException("Informe um documento válido (3 a 30 caracteres).");
        }
        if (!normalizado.matches("[A-Z0-9\\-]+")) {
            throw new BusinessException("Use apenas letras, números e hífen no documento.");
        }
        return normalizado;
    }

    private void validarCelular(String codigoPais, String celular) {
        try {
            PhoneNumber numero = phoneNumberUtil.parse(celular, codigoPais);
            if (!phoneNumberUtil.isValidNumber(numero)) {
                throw new BusinessException("Informe um celular válido para o país selecionado.");
            }
        } catch (NumberParseException ex) {
            throw new BusinessException("Informe um celular válido para o país selecionado.");
        }
    }

    private String normalizarCodigoPais(String codigoPais) {
        if (codigoPais == null || codigoPais.isBlank()) {
            return PAIS_PADRAO;
        }

        String valor = codigoPais.trim().toUpperCase();
        if ("55".equals(valor)) {
            return PAIS_PADRAO;
        }
        if (valor.length() == 2 && phoneNumberUtil.getCountryCodeForRegion(valor) != 0) {
            return valor;
        }

        throw new BusinessException("Informe um país válido para o celular.");
    }

    private String normalizarCelular(String codigoPais, String celular) {
        try {
            PhoneNumber numero = phoneNumberUtil.parse(celular, codigoPais);
            return String.valueOf(numero.getNationalNumber());
        } catch (NumberParseException ex) {
            return celular.replaceAll("\\D", "");
        }
    }

    private String normalizarCep(String cep) {
        if (cep == null || cep.isBlank()) {
            return null;
        }
        String digits = cep.replaceAll("\\D", "");
        if (digits.isBlank()) {
            return null;
        }
        if (digits.length() != 8) {
            throw new BusinessException("Informe um CEP válido com 8 dígitos.");
        }
        return digits;
    }

    private String normalizarEstado(String estado) {
        if (estado == null || estado.isBlank()) {
            return null;
        }
        return estado.trim().toUpperCase();
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
